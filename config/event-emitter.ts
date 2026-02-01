import type { Task } from '../db/schema';

type EventCallback<T = unknown> = (data: T) => void;

class EventEmitter {
  private events: Map<string, Set<EventCallback>> = new Map();

  on<T = unknown>(event: string, callback: EventCallback<T>): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback as EventCallback);
  }

  off<T = unknown>(event: string, callback: EventCallback<T>): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback as EventCallback);
    }
  }

  emit<T = unknown>(event: string, data: T): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

// Singleton instance
export const eventEmitter = new EventEmitter();

// Type-safe event names
export const EVENTS = {
  TASK_UPDATE: 'task:update',
  TASK_CREATED: 'task:created',
  TASK_COMPLETED: 'task:completed',
  TASK_FAILED: 'task:failed',
  LOG_STREAM: 'log:stream',
} as const;

export interface LogStreamData {
  uuid: string;
  message: string;
  timestamp: number;
}

// Helper function to emit task updates
export const emitTaskUpdate = (task: Task): void => {
  eventEmitter.emit(EVENTS.TASK_UPDATE, task);
};

// Helper function to emit log messages for streaming
export const emitLogStream = (uuid: string, message: string): void => {
  const data: LogStreamData = {
    uuid,
    message,
    timestamp: Date.now(),
  };
  eventEmitter.emit(EVENTS.LOG_STREAM, data);
};
