import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { getDb, initDb } from '../../db/db';
import {
  appendQueue,
  popQueue,
  searchTasks,
  getTask,
  updateTaskStatus,
  deleteTask,
  getPendingCount,
  type CreateTaskInput,
  type SearchFilters,
} from '../../db/queue';
import { unlinkSync, existsSync, rmSync } from 'fs';

const DATA_DIR = './pardus_data';

describe('db/queue', () => {
  beforeEach(() => {
    // Clean up any existing pardus_data directory
    if (existsSync(DATA_DIR)) {
      rmSync(DATA_DIR, { recursive: true, force: true });
    }

    // Initialize fresh database
    const db = getDb();
    initDb(db);
    db.close();
  });

  afterEach(() => {
    // Clean up pardus_data directory after tests
    if (existsSync(DATA_DIR)) {
      rmSync(DATA_DIR, { recursive: true, force: true });
    }
  });

  test('appendQueue should add a new task', () => {
    const input: CreateTaskInput = {
      title: 'Test Task',
      description: 'Test description',
      due_time: Date.now() + 3600000, // 1 hour from now
    };

    const task = appendQueue(input);

    expect(task.id).toBeGreaterThan(0);
    expect(task.title).toBe('Test Task');
    expect(task.description).toBe('Test description');
    expect(task.status).toBe('pending');
  });

  test('appendQueue should set created_at timestamp', () => {
    const beforeTime = Date.now();

    const input: CreateTaskInput = {
      title: 'Task',
      description: 'Desc',
      due_time: Date.now() + 3600000,
    };

    const task = appendQueue(input);
    const afterTime = Date.now();

    expect(task.created_at).toBeGreaterThanOrEqual(beforeTime);
    expect(task.created_at).toBeLessThanOrEqual(afterTime);
  });

  test('popQueue should return null when queue is empty', () => {
    const task = popQueue();
    expect(task).toBeNull();
  });

  test('popQueue should return the earliest due task', () => {
    const now = Date.now();

    // Add tasks with different due times
    appendQueue({
      title: 'Task 2',
      description: 'Due later',
      due_time: now + 7200000, // 2 hours
    });

    appendQueue({
      title: 'Task 1',
      description: 'Due sooner',
      due_time: now + 3600000, // 1 hour
    });

    const task = popQueue();

    expect(task).not.toBeNull();
    expect(task?.title).toBe('Task 1'); // Should pop the one due sooner
    expect(task?.status).toBe('processing');
  });

  test('popQueue should mark task as processing', () => {
    const input: CreateTaskInput = {
      title: 'Test Task',
      description: 'Test',
      due_time: Date.now() + 3600000,
    };

    appendQueue(input);
    const task = popQueue();

    expect(task?.status).toBe('processing');
  });

  test('popQueue should not return already processing tasks', () => {
    const input: CreateTaskInput = {
      title: 'Test Task',
      description: 'Test',
      due_time: Date.now() + 3600000,
    };

    appendQueue(input);

    const firstPop = popQueue();
    expect(firstPop).not.toBeNull();

    const secondPop = popQueue();
    expect(secondPop).toBeNull();
  });

  test('searchTasks should return all tasks when no filters', () => {
    appendQueue({
      title: 'Task 1',
      description: 'Desc 1',
      due_time: Date.now() + 3600000,
    });

    appendQueue({
      title: 'Task 2',
      description: 'Desc 2',
      due_time: Date.now() + 7200000,
    });

    const tasks = searchTasks();
    expect(tasks).toHaveLength(2);
  });

  test('searchTasks should filter by status', () => {
    const now = Date.now();

    appendQueue({ title: 'Task 1', description: 'Desc', due_time: now + 3600000 });
    const task = appendQueue({ title: 'Task 2', description: 'Desc', due_time: now + 3600000 });

    updateTaskStatus(task.id, 'completed');

    const pendingTasks = searchTasks({ status: 'pending' });
    expect(pendingTasks).toHaveLength(1);
    expect(pendingTasks[0].title).toBe('Task 1');
  });

  test('searchTasks should filter by title_contains', () => {
    appendQueue({ title: 'Buy groceries', description: 'Desc', due_time: Date.now() + 3600000 });
    appendQueue({ title: 'Buy electronics', description: 'Desc', due_time: Date.now() + 3600000 });
    appendQueue({ title: 'Walk dog', description: 'Desc', due_time: Date.now() + 3600000 });

    const buyTasks = searchTasks({ title_contains: 'Buy' });
    expect(buyTasks).toHaveLength(2);
  });

  test('searchTasks should filter by due_before', () => {
    const now = Date.now();

    appendQueue({ title: 'Task 1', description: 'Desc', due_time: now + 3600000 });
    appendQueue({ title: 'Task 2', description: 'Desc', due_time: now + 7200000 });

    const tasks = searchTasks({ due_before: now + 5000000 });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Task 1');
  });

  test('searchTasks should filter by due_after', () => {
    const now = Date.now();

    appendQueue({ title: 'Task 1', description: 'Desc', due_time: now + 3600000 });
    appendQueue({ title: 'Task 2', description: 'Desc', due_time: now + 7200000 });

    const tasks = searchTasks({ due_after: now + 5000000 });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Task 2');
  });

  test('searchTasks should combine multiple filters', () => {
    const now = Date.now();

    appendQueue({ title: 'Buy groceries', description: 'Desc', due_time: now + 3600000 });
    appendQueue({ title: 'Buy electronics', description: 'Desc', due_time: now + 7200000 });
    appendQueue({ title: 'Sell car', description: 'Desc', due_time: now + 3600000 });

    const tasks = searchTasks({
      title_contains: 'Buy',
      due_before: now + 5000000,
    });

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Buy groceries');
  });

  test('getTask should return task by ID', () => {
    const created = appendQueue({
      title: 'Test Task',
      description: 'Test',
      due_time: Date.now() + 3600000,
    });

    const task = getTask(created.id);

    expect(task).not.toBeNull();
    expect(task?.title).toBe('Test Task');
  });

  test('getTask should return null for non-existent task', () => {
    const task = getTask(99999);
    expect(task).toBeNull();
  });

  test('updateTaskStatus should update task status', () => {
    const created = appendQueue({
      title: 'Test Task',
      description: 'Test',
      due_time: Date.now() + 3600000,
    });

    const updated = updateTaskStatus(created.id, 'completed');

    expect(updated).not.toBeNull();
    expect(updated?.status).toBe('completed');
  });

  test('updateTaskStatus should return null for non-existent task', () => {
    const result = updateTaskStatus(99999, 'completed');
    expect(result).toBeNull();
  });

  test('deleteTask should delete task', () => {
    const created = appendQueue({
      title: 'Test Task',
      description: 'Test',
      due_time: Date.now() + 3600000,
    });

    const deleted = deleteTask(created.id);
    expect(deleted).toBe(true);

    const task = getTask(created.id);
    expect(task).toBeNull();
  });

  test('deleteTask should return false for non-existent task', () => {
    const deleted = deleteTask(99999);
    expect(deleted).toBe(false);
  });

  test('getPendingCount should return count of pending tasks', () => {
    appendQueue({ title: 'Task 1', description: 'Desc', due_time: Date.now() + 3600000 });
    appendQueue({ title: 'Task 2', description: 'Desc', due_time: Date.now() + 3600000 });

    const task = appendQueue({ title: 'Task 3', description: 'Desc', due_time: Date.now() + 3600000 });
    updateTaskStatus(task.id, 'processing');

    const count = getPendingCount();
    expect(count).toBe(2);
  });

  test('getPendingCount should return 0 when no pending tasks', () => {
    const count = getPendingCount();
    expect(count).toBe(0);
  });
});
