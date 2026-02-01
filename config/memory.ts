import { readFileSync } from 'fs';

export type TaskMemory = string;

export const readMemory = (filePath: string): TaskMemory => {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read memory file: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const createMemory = (content: string): TaskMemory => {
  return content;
};

export const isEmptyMemory = (memory: TaskMemory): boolean => {
  return memory.trim().length === 0;
};

export const combineMemory = (memories: TaskMemory[]): TaskMemory => {
  return memories.join('\n\n');
};
