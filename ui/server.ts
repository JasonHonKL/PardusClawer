import type { HeartbeatDuration } from '../config/heartbeat';
import { popQueue, updateTaskStatus, updateTaskDueTime, getAllTasks, getTaskById, rescheduleTask } from '../db/queue';
import { getDb, initDb } from '../db/db';
import { buildPrompt } from '../prompt/prompt';
import { getAgentExecutor, getAgentType } from '../config/agentconfig';
import { loadMemory, saveMemory } from '../memory/memory';
import { createWorkspace, getDataDir } from '../config/workspace';
import { existsSync, unlinkSync, writeFileSync, appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { emitTaskUpdate, emitLogStream } from '../config/event-emitter';

const TRIGGER_FILE = join(getDataDir(), '.task-trigger');
const LOGS_DIR = join(getDataDir(), 'logs');

// Ensure logs directory exists
if (!existsSync(LOGS_DIR)) {
  mkdirSync(LOGS_DIR, { recursive: true });
}

// Log file management
export const getLogFile = (uuid: string): string => {
  return join(LOGS_DIR, `${uuid}.log`);
};

export const saveLog = (uuid: string, message: string): void => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  appendFileSync(getLogFile(uuid), logEntry);
};

export const readLogs = (uuid: string): string[] => {
  const logFile = getLogFile(uuid);
  if (!existsSync(logFile)) {
    return [];
  }
  const content = require('fs').readFileSync(logFile, 'utf-8');
  return content.split('\n').filter((line: string) => line.trim());
};

export const deleteLogs = (uuid: string): void => {
  const logFile = getLogFile(uuid);
  if (existsSync(logFile)) {
    unlinkSync(logFile);
  }
};

export interface ServerConfig {
  heartbeat: HeartbeatDuration;
  onTaskStart?: (task: { id: number; uuid: string; title: string }) => void;
  onTaskComplete?: (task: { id: number; uuid: string; title: string }) => void;
  onTaskFailed?: (task: { id: number; uuid: string; title: string; error: string }) => void;
  onQueueEmpty?: () => void;
}

export const createServer = (config: ServerConfig) => {
  let isRunning = false;
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let triggerCheckTimer: NodeJS.Timeout | null = null;
  let isProcessing = false;

  // Initialize database on server creation
  const db = getDb();
  initDb(db);
  db.close();

  // Reset stuck tasks on server creation
  const resetStuckTasks = (): void => {
    const db = getDb();
    db.query("UPDATE tasks SET status = 'pending' WHERE status = 'processing'").run();
    const count = db.query("SELECT changes() as count").get() as { count: number };
    if (count.count > 0) {
      console.log(`[RECOVERY] Reset ${count.count} stuck task(s) to pending`);
    }
    db.close();
  };
  resetStuckTasks();

  const processTask = async (): Promise<void> => {
    // Prevent concurrent processing
    if (isProcessing) {
      return;
    }

    try {
      isProcessing = true;

      // Pop next task from queue
      const task = popQueue();

      if (!task) {
        config.onQueueEmpty?.();
        return;
      }

      // Emit event for real-time updates (task is now processing)
      emitTaskUpdate(task);

      // Notify task start
      config.onTaskStart?.({
        id: task.id,
        uuid: task.uuid,
        title: task.title,
      });

      // Create workspace for this task
      const workspacePath = createWorkspace(task.uuid);

      // Log task start
      saveLog(task.uuid, `🚀 Task started: ${task.title}`);
      saveLog(task.uuid, `📁 Workspace: ${workspacePath}`);

      // Load memory
      const memory = loadMemory(task.uuid) || '';
      if (memory) {
        saveLog(task.uuid, `🧠 Loaded memory (${memory.length} characters)`);
      }

      // Build prompt
      const prompt = buildPrompt({
        memory,
        userRequest: task.description,
      });
      saveLog(task.uuid, `📝 Prompt: ${task.description}`);

      // Execute agent - get current agent type from config
      const currentAgentType = getAgentType();
      saveLog(task.uuid, `🤖 Agent: ${currentAgentType}`);

      const agent = getAgentExecutor({ type: currentAgentType });

      saveLog(task.uuid, `⏳ Starting agent execution...`);

      // Create streaming callback to emit logs in real-time
      const onStream = (data: string) => {
        // Save to log file
        saveLog(task.uuid, data.trim());
        // Emit real-time log event
        emitLogStream(task.uuid, data.trim());
      };

      const result = await agent({
        spawnPath: workspacePath,
        prompt,
        onStream,
      });

      saveLog(task.uuid, `✅ Agent execution completed`);
      saveLog(task.uuid, `📤 Output length: ${result.output?.length || 0} characters`);

      if (result.success) {
        saveLog(task.uuid, `✅ Task completed successfully`);
        saveLog(task.uuid, `📄 Agent output:\n${result.output || '[No output]'}`);

        // Save memory
        const existingMemory = loadMemory(task.uuid);
        if (!existingMemory) {
          const updatedMemory = memory + '\n\n' + (result.output || '[No output from agent]');
          saveMemory(task.uuid, updatedMemory);
        }

        // Mark as completed
        updateTaskStatus(task.id, 'completed');

        // Emit event for real-time updates
        const completedTask = getTaskById(task.id);
        if (completedTask) {
          emitTaskUpdate(completedTask);
        }

        // Reschedule if task is recurring
        if (completedTask && completedTask.recurrence_type !== 'none') {
          const nextTask = rescheduleTask(completedTask);
          if (nextTask) {
            saveLog(task.uuid, `🔄 Rescheduled for ${new Date(nextTask.due_time).toLocaleString()}`);
            console.log(`[RECURRING] Task "${completedTask.title}" rescheduled for ${new Date(nextTask.due_time).toLocaleString()}`);
            // Trigger next occurrence immediately
            const triggerFile = join(getDataDir(), '.task-trigger');
            writeFileSync(triggerFile, Date.now().toString());
          }
        }

        saveLog(task.uuid, `🏁 Task execution finished`);

        config.onTaskComplete?.({
          id: task.id,
          uuid: task.uuid,
          title: task.title,
        });
      } else {
        saveLog(task.uuid, `❌ Task failed: ${result.error || 'Unknown error'}`);

        updateTaskStatus(task.id, 'failed');

        // Emit event for real-time updates
        const failedTask = getTaskById(task.id);
        if (failedTask) {
          emitTaskUpdate(failedTask);
        }

        saveLog(task.uuid, `🏁 Task execution finished with errors`);

        config.onTaskFailed?.({
          id: task.id,
          uuid: task.uuid,
          title: task.title,
          error: result.error || 'Unknown error',
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Task processing error: ${errorMsg}`);
    } finally {
      isProcessing = false;
    }
  };

  const tickNow = (): void => {
    if (!isRunning) {
      return;
    }
    processTask();
  };

  const checkTrigger = (): void => {
    if (existsSync(TRIGGER_FILE)) {
      try {
        unlinkSync(TRIGGER_FILE);
        tickNow();
      } catch (error) {
        // Ignore errors deleting trigger file
      }
    }
  };

  const start = (): void => {
    if (isRunning) {
      return;
    }

    // Ensure database is initialized
    const db = getDb();
    initDb(db);
    db.close();

    isRunning = true;
    console.log(`Server started (heartbeat: ${config.heartbeat}ms)`);

    // Start heartbeat timer - runs independently
    heartbeatTimer = setInterval(() => {
      tickNow();
    }, config.heartbeat);

    // Check trigger file every second for immediate processing
    triggerCheckTimer = setInterval(() => {
      checkTrigger();
    }, 1000);

    // Process tasks immediately on start
    tickNow();
  };

  const stop = (): void => {
    if (!isRunning) {
      return;
    }

    isRunning = false;

    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }

    if (triggerCheckTimer) {
      clearInterval(triggerCheckTimer);
      triggerCheckTimer = null;
    }

    console.log('Server stopped');
  };

  const getStatus = (): { running: boolean; tasks: ReturnType<typeof getAllTasks> } => {
    return {
      running: isRunning,
      tasks: getAllTasks(),
    };
  };

  return {
    start,
    stop,
    tickNow,
    getStatus,
    isRunning: () => isRunning,
  };
};

export type Server = ReturnType<typeof createServer>;
