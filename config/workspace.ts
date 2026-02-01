import { mkdirSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import type { TaskUuid } from '../db/schema';

const DATA_DIR = './pardus_data';
const MEMORY_DIR = join(DATA_DIR, 'memory');
const WORKSPACES_DIR = join(DATA_DIR, 'workspaces');

// Ensure data directory structure exists
export const ensureDataDirs = (): void => {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(MEMORY_DIR)) {
    mkdirSync(MEMORY_DIR, { recursive: true });
  }
  if (!existsSync(WORKSPACES_DIR)) {
    mkdirSync(WORKSPACES_DIR, { recursive: true });
  }
};

// Get workspace path for a task UUID
export const getWorkspacePath = (uuid: TaskUuid): string => {
  return join(WORKSPACES_DIR, uuid);
};

// Create workspace directory for a task
export const createWorkspace = (uuid: TaskUuid): string => {
  ensureDataDirs();
  const workspacePath = getWorkspacePath(uuid);

  if (!existsSync(workspacePath)) {
    mkdirSync(workspacePath, { recursive: true });
  }

  return workspacePath;
};

// Check if workspace exists
export const workspaceExists = (uuid: TaskUuid): boolean => {
  return existsSync(getWorkspacePath(uuid));
};

// List all workspace UUIDs
export const listWorkspaces = (): TaskUuid[] => {
  ensureDataDirs();
  const { readdirSync } = require('fs');

  try {
    return readdirSync(WORKSPACES_DIR);
  } catch {
    return [];
  }
};

// Delete workspace by UUID
export const deleteWorkspace = (uuid: TaskUuid): boolean => {
  const workspacePath = getWorkspacePath(uuid);

  if (!existsSync(workspacePath)) {
    return false;
  }

  try {
    rmSync(workspacePath, { recursive: true, force: true });
    return true;
  } catch (error) {
    console.error(`Failed to delete workspace ${uuid}:`, error);
    return false;
  }
};

// Export directory paths for use in other modules
export const getDataDir = (): string => DATA_DIR;
export const getMemoryDir = (): string => MEMORY_DIR;
export const getWorkspacesDir = (): string => WORKSPACES_DIR;
