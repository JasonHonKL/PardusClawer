import { Database } from 'bun:sqlite';
import type { Task, CreateTaskInput, TaskStatus, TaskUuid } from './schema';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { getDataDir, ensureDataDirs } from '../config/workspace';

const getDbPath = (): string => {
  ensureDataDirs();
  return join(getDataDir(), 'pardus_queue.db');
};

export const getDb = (): Database => {
  return new Database(getDbPath());
};

export const initDb = (db: Database): void => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      due_time INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
    )
  `);

  // Add recurrence columns if they don't exist
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN recurrence_type TEXT DEFAULT 'none'`);
  } catch (e) {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN recurrence_interval INTEGER DEFAULT 1`);
  } catch (e) {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN recurrence_end_time INTEGER`);
  } catch (e) {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN updated_at INTEGER`);
  } catch (e) {
    // Column already exists
  }

  // Migrate existing tasks: set updated_at = created_at for tasks where updated_at is NULL
  try {
    db.exec(`UPDATE tasks SET updated_at = created_at WHERE updated_at IS NULL`);
  } catch (e) {
    // Migration failed or already done
  }
};

export const closeDb = (db: Database): void => {
  db.close();
};

export const generateUuid = (): TaskUuid => {
  return randomUUID();
};
