import { serve } from 'bun';
import type { Task, CreateTaskInput, TaskStatus, TaskUuid } from './db/schema';
import {
  getAllTasks,
  getUuidToTitleMap,
  appendQueue,
  updateTaskDescription,
  updateTaskTitle,
  deleteTask,
} from './db/queue';
import { getDb, initDb } from './db/db';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getDataDir, ensureDataDirs } from './config/workspace';

const API_PORT = 13337;

// Initialize database
initDb(getDb());

// Trigger file path for immediate task processing
const TRIGGER_FILE = join(getDataDir(), '.task-trigger');

const triggerTaskProcessor = (): void => {
  ensureDataDirs();
  writeFileSync(TRIGGER_FILE, Date.now().toString());
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

serve({
  port: API_PORT,
  fetch: async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(req.url);

    // API Routes
    if (url.pathname === '/api/tasks' && req.method === 'GET') {
      const tasks = getAllTasks();
      return Response.json(tasks, { headers: corsHeaders });
    }

    if (url.pathname === '/api/tasks' && req.method === 'POST') {
      const body = await req.json();
      const now = Date.now();

      const task = appendQueue({
        title: body.title,
        description: body.description,
        due_time: now + 60 * 60 * 1000, // Default: 1 hour from now
      });

      // Trigger immediate task processing
      triggerTaskProcessor();

      return Response.json(task, { headers: corsHeaders });
    }

    if (url.pathname.startsWith('/api/tasks/') && req.method === 'PATCH') {
      const id = parseInt(url.pathname.split('/').pop()!);
      const body = await req.json();

      let updatedTask: Task | null = null;

      if (body.title) {
        updatedTask = updateTaskTitle(id, body.title);
      }
      if (body.description) {
        updatedTask = updateTaskDescription(id, body.description);
      }

      return Response.json(updatedTask, { headers: corsHeaders });
    }

    if (url.pathname.startsWith('/api/tasks/') && req.method === 'DELETE') {
      const id = parseInt(url.pathname.split('/').pop()!);
      const deleted = deleteTask(id);

      return Response.json({ success: deleted }, { headers: corsHeaders });
    }

    if (url.pathname === '/api/tasks/uuid-map' && req.method === 'GET') {
      const map = getUuidToTitleMap();
      return Response.json(Object.fromEntries(map), { headers: corsHeaders });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
});

console.log(`📋 Task API Server running at http://localhost:${API_PORT}`);
