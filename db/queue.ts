import { getDb, generateUuid } from './db';
import type { Task, CreateTaskInput, TaskId, TaskStatus, TaskUuid } from './schema';

// Append task to queue
export const appendQueue = (input: CreateTaskInput): Task => {
  const db = getDb();
  const now = Date.now();
  const uuid = generateUuid();

  const query = db.query(`
    INSERT INTO tasks (uuid, title, description, due_time, created_at, updated_at, status, recurrence_type, recurrence_interval, recurrence_end_time)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
  `);

  query.run(
    uuid,
    input.title,
    input.description,
    input.due_time,
    now,
    now,
    input.recurrence_type || 'none',
    input.recurrence_interval || 1,
    input.recurrence_end_time || null
  );

  const lastId = db.query('SELECT last_insert_rowid() as id').get() as { id: number };
  const task = db.query('SELECT * FROM tasks WHERE id = ?').get(lastId.id) as Task;

  db.close();
  return task;
};

// Pop next task (earliest due_time that is pending AND due)
export const popQueue = (): Task | null => {
  const db = getDb();
  const now = Date.now();

  // Find and update the next pending task that is due
  const task = db.query(`
    SELECT * FROM tasks
    WHERE status = 'pending' AND due_time <= ?
    ORDER BY due_time ASC
    LIMIT 1
  `).get(now) as Task | undefined;

  if (!task) {
    db.close();
    return null;
  }

  // Mark as processing
  db.query('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?').run('processing', Date.now(), task.id);

  // Return updated task
  const updatedTask = db.query('SELECT * FROM tasks WHERE id = ?').get(task.id) as Task;

  db.close();
  return updatedTask;
};

// Search tasks by filters
export interface SearchFilters {
  status?: TaskStatus;
  title_contains?: string;
  due_before?: number;
  due_after?: number;
}

export const searchTasks = (filters: SearchFilters = {}): Task[] => {
  const db = getDb();

  let query = 'SELECT * FROM tasks WHERE 1=1';
  const params: (string | number)[] = [];

  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters.title_contains) {
    query += ' AND title LIKE ?';
    params.push(`%${filters.title_contains}%`);
  }

  if (filters.due_before) {
    query += ' AND due_time < ?';
    params.push(filters.due_before);
  }

  if (filters.due_after) {
    query += ' AND due_time > ?';
    params.push(filters.due_after);
  }

  query += ' ORDER BY due_time ASC';

  const tasks = db.query(query).all(...params) as Task[];

  db.close();
  return tasks;
};

// Get task by ID
export const getTask = (id: TaskId): Task | null => {
  const db = getDb();
  const task = db.query('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
  db.close();
  return task ?? null;
};

// Alias for consistency
export const getTaskById = getTask;

// Update task status
export const updateTaskStatus = (id: TaskId, status: TaskStatus): Task | null => {
  const db = getDb();

  db.query('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?').run(status, Date.now(), id);

  const task = db.query('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;

  db.close();
  return task ?? null;
};

// Delete task
export const deleteTask = (id: TaskId): boolean => {
  const db = getDb();

  const result = db.query('DELETE FROM tasks WHERE id = ?').run(id);

  db.close();
  return result.changes > 0;
};

// Get all pending tasks count
export const getPendingCount = (): number => {
  const db = getDb();

  const result = db.query('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get('pending') as { count: number };

  db.close();
  return result.count;
};

// Update task due time without changing UUID
export const updateTaskDueTime = (id: TaskId, newDueTime: number): Task | null => {
  const db = getDb();

  db.query('UPDATE tasks SET due_time = ?, updated_at = ? WHERE id = ?').run(newDueTime, Date.now(), id);

  const task = db.query('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;

  db.close();
  return task ?? null;
};

// Get task by UUID
export const getTaskByUuid = (uuid: TaskUuid): Task | null => {
  const db = getDb();
  const task = db.query('SELECT * FROM tasks WHERE uuid = ?').get(uuid) as Task | undefined;
  db.close();
  return task ?? null;
};

// Search tasks by UUID pattern
export const searchByUuid = (pattern: string): Task[] => {
  const db = getDb();

  const tasks = db.query('SELECT * FROM tasks WHERE uuid LIKE ?').all(`%${pattern}%`) as Task[];

  db.close();
  return tasks;
};

// Get task by UUID (alias for consistency)
export const getTaskUuid = (id: TaskId): TaskUuid | null => {
  const db = getDb();
  const result = db.query('SELECT uuid FROM tasks WHERE id = ?').get(id) as { uuid: TaskUuid } | undefined;
  db.close();
  return result?.uuid ?? null;
};

// Get all tasks (for UI display)
export const getAllTasks = (): Task[] => {
  const db = getDb();
  const tasks = db.query('SELECT * FROM tasks ORDER BY created_at DESC').all() as Task[];
  db.close();
  return tasks;
};

// Get UUID to title map (for user reference)
export const getUuidToTitleMap = (): Map<TaskUuid, string> => {
  const db = getDb();
  const tasks = db.query('SELECT uuid, title FROM tasks').all() as { uuid: TaskUuid; title: string }[];
  db.close();

  const map = new Map<TaskUuid, string>();
  for (const task of tasks) {
    map.set(task.uuid, task.title);
  }
  return map;
};

// Update task description
export const updateTaskDescription = (id: TaskId, newDescription: string): Task | null => {
  const db = getDb();

  db.query('UPDATE tasks SET description = ?, updated_at = ? WHERE id = ?').run(newDescription, Date.now(), id);

  const task = db.query('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;

  db.close();
  return task ?? null;
};

// Update task title
export const updateTaskTitle = (id: TaskId, newTitle: string): Task | null => {
  const db = getDb();

  db.query('UPDATE tasks SET title = ?, updated_at = ? WHERE id = ?').run(newTitle, Date.now(), id);

  const task = db.query('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;

  db.close();
  return task ?? null;
};

// Reschedule a recurring task (reuses same task UUID to preserve workspace)
export const rescheduleTask = (task: Task): Task | null => {
  // Only reschedule if task has recurrence
  if (task.recurrence_type === 'none') {
    return null;
  }

  // Check if recurrence has ended
  if (task.recurrence_end_time && Date.now() >= task.recurrence_end_time) {
    return null;
  }

  const db = getDb();

  // Calculate next due time
  const interval = task.recurrence_interval || 1;
  let nextDueTime = task.due_time;

  switch (task.recurrence_type) {
    case 'seconds':
      nextDueTime = task.due_time + (interval * 1000);
      break;
    case 'minutes':
      nextDueTime = task.due_time + (interval * 60 * 1000);
      break;
    case 'hours':
      nextDueTime = task.due_time + (interval * 60 * 60 * 1000);
      break;
    case 'days':
      nextDueTime = task.due_time + (interval * 24 * 60 * 60 * 1000);
      break;
    case 'weeks':
      nextDueTime = task.due_time + (interval * 7 * 24 * 60 * 60 * 1000);
      break;
    case 'months':
      // Approximate as 30 days
      nextDueTime = task.due_time + (interval * 30 * 24 * 60 * 60 * 1000);
      break;
  }

  // Check if next due time is past recurrence end time
  if (task.recurrence_end_time && nextDueTime >= task.recurrence_end_time) {
    db.close();
    return null;
  }

  // Update the existing task instead of creating a new one
  // This preserves the UUID and workspace
  db.query(`
    UPDATE tasks
    SET due_time = ?, status = 'pending', updated_at = ?
    WHERE id = ?
  `).run(nextDueTime, Date.now(), task.id);

  const updatedTask = db.query('SELECT * FROM tasks WHERE id = ?').get(task.id) as Task;

  db.close();
  return updatedTask;
};
