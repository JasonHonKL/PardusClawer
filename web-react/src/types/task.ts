export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type RecurrenceType = 'none' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months';

export interface Task {
  id: number;
  uuid: string;
  title: string;
  description: string;
  due_time: number;
  created_at: number;
  updated_at: number;
  status: TaskStatus;
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  recurrence_end_time: number | null;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  due_time?: number;
  recurrence_type?: RecurrenceType;
  recurrence_interval?: number;
  recurrence_end_time?: number | null;
}
