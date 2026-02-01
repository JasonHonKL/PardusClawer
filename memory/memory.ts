import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdirSync } from 'fs';
import { join } from 'path';
import type { TaskUuid } from '../db/schema';
import { getMemoryDir, ensureDataDirs } from '../config/workspace';

// Get memory directory (ensures it exists)
const getMemoryDirPath = (): string => {
  ensureDataDirs();
  return getMemoryDir();
};

// Get memory file path for a task UUID
const getMemoryPath = (uuid: TaskUuid): string => {
  return join(getMemoryDirPath(), `${uuid}.md`);
};

// Save memory for a task
export const saveMemory = (uuid: TaskUuid, content: string): void => {
  const memoryDir = getMemoryDirPath();
  const path = join(memoryDir, `${uuid}.md`);
  writeFileSync(path, content, 'utf-8');
};

// Load memory for a task
export const loadMemory = (uuid: TaskUuid): string | null => {
  const path = getMemoryPath(uuid);

  if (!existsSync(path)) {
    return null;
  }

  return readFileSync(path, 'utf-8');
};

// Check if memory exists for a task
export const memoryExists = (uuid: TaskUuid): boolean => {
  const path = getMemoryPath(uuid);
  return existsSync(path);
};

// Delete memory for a task
export const deleteMemory = (uuid: TaskUuid): boolean => {
  const path = getMemoryPath(uuid);

  if (!existsSync(path)) {
    return false;
  }

  try {
    unlinkSync(path);
    return true;
  } catch {
    return false;
  }
};

// List all task UUIDs that have memory
export const listMemoryUuids = (): TaskUuid[] => {
  const memoryDir = getMemoryDirPath();

  try {
    const files = readdirSync(memoryDir);
    return files
      .filter((file: string) => file.endsWith('.md'))
      .map((file: string) => file.replace('.md', ''));
  } catch {
    return [];
  }
};
