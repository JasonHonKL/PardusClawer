export type TaskUuid = string;

export type RecurrenceType = 'none' | 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months';

export interface Task {
  id: number;
  uuid: TaskUuid;
  title: string;
  description: string;
  due_time: number; // Unix timestamp in milliseconds
  created_at: number;
  updated_at: number; // Unix timestamp in milliseconds
  status: 'pending' | 'processing' | 'completed' | 'failed';
  // Recurrence fields
  recurrence_type: RecurrenceType;
  recurrence_interval: number; // e.g., every 5 days = 5
  recurrence_end_time: number | null; // Unix timestamp, or null for infinite
}

export type TaskStatus = Task['status'];

export interface CreateTaskInput {
  title: string;
  description: string;
  due_time: number;
  recurrence_type?: RecurrenceType;
  recurrence_interval?: number;
  recurrence_end_time?: number | null;
}

export type TaskId = number;
