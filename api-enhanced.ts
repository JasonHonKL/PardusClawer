import { serve } from 'bun';
import type { Task, CreateTaskInput, TaskStatus, TaskUuid } from './db/schema';
import {
  getAllTasks,
  getUuidToTitleMap,
  appendQueue,
  updateTaskDescription,
  updateTaskTitle,
  updateTaskStatus,
  updateTaskDueTime,
  searchTasks,
  deleteTask,
  getTaskById,
} from './db/queue';
import { getDb, initDb } from './db/db';
import { writeFileSync, unlinkSync, mkdirSync, statSync, openSync, readSync, closeSync } from 'fs';
import { join } from 'path';
import { getDataDir, ensureDataDirs, getWorkspacePath, listWorkspaces, workspaceExists, deleteWorkspace } from './config/workspace';
import { loadMemory, saveMemory } from './memory/memory';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { eventEmitter } from './config/event-emitter';
import { getDefaultHeartbeat, setHeartbeat } from './config/heartbeat';
import { getAgentExecutor, getAgentType, setAgentType, AgentType } from './config/agentconfig';

const PARDUS_CONFIG_FILE = join(getDataDir(), 'pardus-config.json');

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
  idleTimeout: 255, // Maximum timeout for SSE (4+ minutes)
  fetch: async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(req.url);

    // ========== TASK CONTROL ENDPOINTS ==========

    // Force immediate task execution
    if (url.pathname.match(/^\/api\/tasks\/\d+\/force$/) && req.method === 'POST') {
      const id = parseInt(url.pathname.split('/').slice(-2)[0]);
      const task = getTaskById(id);

      if (!task) {
        return Response.json({ error: 'Task not found' }, { status: 404, headers: corsHeaders });
      }

      // Update due_time to now so it will be picked up immediately
      updateTaskDueTime(id, Date.now());
      // Set status to pending so it will be picked up
      updateTaskStatus(id, 'pending');
      triggerTaskProcessor();

      return Response.json({ success: true, message: 'Task forced for execution' }, { headers: corsHeaders });
    }

    // Restart failed or completed task
    if (url.pathname.match(/^\/api\/tasks\/\d+\/restart$/) && req.method === 'POST') {
      const id = parseInt(url.pathname.split('/').slice(-2)[0]);
      const task = getTaskById(id);

      if (!task) {
        return Response.json({ error: 'Task not found' }, { status: 404, headers: corsHeaders });
      }

      // Update due_time to now and reset to pending
      updateTaskDueTime(id, Date.now());
      updateTaskStatus(id, 'pending');
      triggerTaskProcessor();

      return Response.json({ success: true, message: 'Task restarted' }, { headers: corsHeaders });
    }

    // Cancel processing task
    if (url.pathname.match(/^\/api\/tasks\/\d+\/cancel$/) && req.method === 'POST') {
      const id = parseInt(url.pathname.split('/').slice(-2)[0]);
      const task = getTaskById(id);

      if (!task) {
        return Response.json({ error: 'Task not found' }, { status: 404, headers: corsHeaders });
      }

      if (task.status !== 'processing') {
        return Response.json({ error: 'Task is not processing' }, { status: 400, headers: corsHeaders });
      }

      updateTaskStatus(id, 'pending');

      return Response.json({ success: true, message: 'Task cancelled' }, { headers: corsHeaders });
    }

    // Update task due time
    if (url.pathname.match(/^\/api\/tasks\/\d+\/due-time$/) && req.method === 'PATCH') {
      const id = parseInt(url.pathname.split('/').slice(-2)[0]);
      const body = await req.json();

      if (typeof body.due_time !== 'number') {
        return Response.json({ error: 'due_time must be a number' }, { status: 400, headers: corsHeaders });
      }

      const task = updateTaskDueTime(id, body.due_time);

      return Response.json(task, { headers: corsHeaders });
    }

    // ========== WORKSPACE ENDPOINTS ==========

    // List all workspaces
    if (url.pathname === '/api/workspaces' && req.method === 'GET') {
      const workspaceUuids = listWorkspaces();
      const uuidToTitle = getUuidToTitleMap();

      const workspaces = workspaceUuids.map(uuid => ({
        uuid,
        title: uuidToTitle.get(uuid) || 'Unknown Task',
        path: getWorkspacePath(uuid),
      }));

      return Response.json(workspaces, { headers: corsHeaders });
    }

    // List files in workspace
    if (url.pathname.match(/^\/api\/workspaces\/[^/]+\/files$/) && req.method === 'GET') {
      const uuid = url.pathname.split('/').slice(-2)[0] as TaskUuid;
      const workspacePath = getWorkspacePath(uuid);

      if (!existsSync(workspacePath)) {
        return Response.json({ error: 'Workspace not found' }, { status: 404, headers: corsHeaders });
      }

      const files = readdirSync(workspacePath).filter(f => !f.startsWith('.'));

      return Response.json({ uuid, files }, { headers: corsHeaders });
    }

    // Download file from workspace
    if (url.pathname.match(/^\/api\/workspaces\/[^/]+\/download\/[^/]+$/) && req.method === 'GET') {
      const parts = url.pathname.split('/');
      const uuid = parts[3] as TaskUuid;
      const filename = parts[5];
      const workspacePath = getWorkspacePath(uuid);
      const filePath = join(workspacePath, filename);

      if (!existsSync(filePath)) {
        return Response.json({ error: 'File not found' }, { status: 404, headers: corsHeaders });
      }

      const file = readFileSync(filePath);

      // Determine content type
      let contentType = 'application/octet-stream';
      if (filename.endsWith('.csv')) contentType = 'text/csv';
      else if (filename.endsWith('.json')) contentType = 'application/json';
      else if (filename.endsWith('.md')) contentType = 'text/markdown';
      else if (filename.endsWith('.txt')) contentType = 'text/plain';
      else if (filename.endsWith('.pdf')) contentType = 'application/pdf';

      return new Response(file, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          ...corsHeaders,
        },
      });
    }

    // Delete workspace file
    if (url.pathname.match(/^\/api\/workspaces\/[^/]+\/files\/[^/]+$/) && req.method === 'DELETE') {
      const parts = url.pathname.split('/');
      const uuid = parts[3] as TaskUuid;
      const filename = parts[5];
      const workspacePath = getWorkspacePath(uuid);
      const filePath = join(workspacePath, filename);

      if (!existsSync(filePath)) {
        return Response.json({ error: 'File not found' }, { status: 404, headers: corsHeaders });
      }

      try {
        unlinkSync(filePath);
        return Response.json({ success: true, message: 'File deleted' }, { headers: corsHeaders });
      } catch (error) {
        return Response.json(
          { error: 'Failed to delete file', details: error instanceof Error ? error.message : String(error) },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // Preview workspace file (read content)
    if (url.pathname.match(/^\/api\/workspaces\/[^/]+\/files\/[^/]+$/) && req.method === 'GET') {
      const parts = url.pathname.split('/');
      const uuid = parts[3] as TaskUuid;
      const filename = parts[5];
      const workspacePath = getWorkspacePath(uuid);
      const filePath = join(workspacePath, filename);

      if (!existsSync(filePath)) {
        return Response.json({ error: 'File not found' }, { status: 404, headers: corsHeaders });
      }

      try {
        const content = readFileSync(filePath, 'utf-8');

        // Determine content type
        let contentType = 'text/plain';
        if (filename.endsWith('.csv')) {
          contentType = 'text/csv';
        } else if (filename.endsWith('.json')) {
          contentType = 'application/json';
        } else if (filename.endsWith('.md')) {
          contentType = 'text/markdown';
        }

        return new Response(content, {
          headers: {
            'Content-Type': contentType,
            ...corsHeaders,
          },
        });
      } catch (error) {
        return Response.json(
          { error: 'Failed to read file', details: error instanceof Error ? error.message : String(error) },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // Delete workspace
    if (url.pathname.match(/^\/api\/workspaces\/[^/]+$/) && req.method === 'DELETE') {
      const uuid = url.pathname.split('/').slice(-1)[0] as TaskUuid;

      // Check if workspace exists
      if (!workspaceExists(uuid)) {
        return Response.json({ error: 'Workspace not found' }, { status: 404, headers: corsHeaders });
      }

      // Delete the workspace
      const success = deleteWorkspace(uuid);

      if (success) {
        // Also delete the associated memory file
        try {
          const { unlinkSync } = require('fs');
          const memoryFile = join(getDataDir(), 'memory', `${uuid}.json`);
          if (existsSync(memoryFile)) {
            unlinkSync(memoryFile);
          }
        } catch (error) {
          // Ignore memory deletion errors
          console.error('Failed to delete memory file:', error);
        }

        return Response.json({ success: true, message: 'Workspace deleted successfully' }, { headers: corsHeaders });
      } else {
        return Response.json({ error: 'Failed to delete workspace' }, { status: 500, headers: corsHeaders });
      }
    }

    // ========== MEMORY ENDPOINTS ==========

    // Get task memory
    if (url.pathname.match(/^\/api\/memory\/[^/]+$/) && req.method === 'GET') {
      const uuid = url.pathname.split('/').slice(-1)[0] as TaskUuid;
      const memory = loadMemory(uuid);

      if (!memory) {
        return Response.json({ error: 'Memory not found' }, { status: 404, headers: corsHeaders });
      }

      return Response.json({ uuid, memory }, { headers: corsHeaders });
    }

    // Update task memory
    if (url.pathname.match(/^\/api\/memory\/[^/]+$/) && req.method === 'PATCH') {
      const uuid = url.pathname.split('/').slice(-1)[0] as TaskUuid;
      const body = await req.json();

      if (typeof body.memory !== 'string') {
        return Response.json({ error: 'memory must be a string' }, { status: 400, headers: corsHeaders });
      }

      saveMemory(uuid, body.memory);

      return Response.json({ success: true, message: 'Memory updated' }, { headers: corsHeaders });
    }

    // ========== CONFIGURATION ENDPOINTS ==========

    // Get current config
    if (url.pathname === '/api/config' && req.method === 'GET') {
      const config = {
        heartbeat: getDefaultHeartbeat(),
        agentType: getAgentType(),
      };

      return Response.json(config, { headers: corsHeaders });
    }

    // Update config
    if (url.pathname === '/api/config' && req.method === 'PATCH') {
      const body = await req.json();

      if (body.heartbeat !== undefined) {
        setHeartbeat(body.heartbeat);
      }

      if (body.agentType !== undefined) {
        setAgentType(body.agentType);
      }

      const config = {
        heartbeat: getDefaultHeartbeat(),
        agentType: getAgentType(),
      };

      return Response.json(config, { headers: corsHeaders });
    }

    // Update heartbeat
    if (url.pathname === '/api/config/heartbeat' && req.method === 'POST') {
      const body = await req.json();

      if (typeof body.duration !== 'number') {
        return Response.json({ error: 'duration must be a number' }, { status: 400, headers: corsHeaders });
      }

      setHeartbeat(body.duration);

      return Response.json({ success: true, heartbeat: getDefaultHeartbeat() }, { headers: corsHeaders });
    }

    // Update agent type
    if (url.pathname === '/api/config/agent' && req.method === 'POST') {
      const body = await req.json();

      if (!['claude-code', 'opencode', 'cursor', 'pardus'].includes(body.agentType)) {
        return Response.json({ error: 'Invalid agent type' }, { status: 400, headers: corsHeaders });
      }

      setAgentType(body.agentType);

      return Response.json({ success: true, agentType: getAgentType() }, { headers: corsHeaders });
    }

    // Get Pardus configuration
    if (url.pathname === '/api/config/pardus' && req.method === 'GET') {
      try {
        if (existsSync(PARDUS_CONFIG_FILE)) {
          const content = readFileSync(PARDUS_CONFIG_FILE, 'utf-8');
          const pardusConfig = JSON.parse(content);
          return Response.json(pardusConfig, { headers: corsHeaders });
        }
        return Response.json({}, { headers: corsHeaders });
      } catch (error) {
        return Response.json(
          { error: 'Failed to read Pardus config', details: error instanceof Error ? error.message : String(error) },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // Update Pardus configuration
    if (url.pathname === '/api/config/pardus' && req.method === 'POST') {
      try {
        const body = await req.json();
        ensureDataDirs();
        writeFileSync(PARDUS_CONFIG_FILE, JSON.stringify(body, null, 2));
        return Response.json({ success: true, pardusConfig: body }, { headers: corsHeaders });
      } catch (error) {
        return Response.json(
          { error: 'Failed to save Pardus config', details: error instanceof Error ? error.message : String(error) },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // ========== SERVER CONTROL ENDPOINTS ==========

    // Get server status
    if (url.pathname === '/api/server/status' && req.method === 'GET') {
      const tasks = getAllTasks();
      const stats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        processing: tasks.filter(t => t.status === 'processing').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        failed: tasks.filter(t => t.status === 'failed').length,
      };

      // Load Pardus config if applicable
      let pardusConfig = {};
      const agentType = getAgentType();
      if (agentType === 'pardus') {
        if (existsSync(PARDUS_CONFIG_FILE)) {
          try {
            const content = readFileSync(PARDUS_CONFIG_FILE, 'utf-8');
            pardusConfig = JSON.parse(content);
          } catch {
            pardusConfig = {};
          }
        }
      }

      const status = {
        running: true,
        config: {
          heartbeat: getDefaultHeartbeat(),
          agentType: getAgentType(),
          pardusConfig: Object.keys(pardusConfig).length > 0 ? pardusConfig : undefined,
        },
        stats,
      };

      return Response.json(status, { headers: corsHeaders });
    }

    // ========== LOG ENDPOINTS ==========

    // Get task logs
    if (url.pathname.match(/^\/api\/logs\/[^/]+$/) && req.method === 'GET') {
      const uuid = url.pathname.split('/')[3] as TaskUuid;
      const logFile = join(getDataDir(), 'logs', `${uuid}.log`);

      if (!existsSync(logFile)) {
        return Response.json({ logs: [] }, { headers: corsHeaders });
      }

      try {
        const content = readFileSync(logFile, 'utf-8');
        const logs = content.split('\n').filter((line) => line.trim());
        return Response.json({ logs }, { headers: corsHeaders });
      } catch (error) {
        return Response.json(
          { error: 'Failed to read logs', details: error instanceof Error ? error.message : String(error) },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // ========== LOG ENDPOINTS ==========

    // Get task logs
    if (url.pathname.match(/^\/api\/logs\/[^/]+$/) && req.method === 'GET') {
      const uuid = url.pathname.split('/')[3] as TaskUuid;
      const logFile = join(getDataDir(), 'logs', `${uuid}.log`);

      if (!existsSync(logFile)) {
        return Response.json({ logs: [] }, { headers: corsHeaders });
      }

      try {
        const content = readFileSync(logFile, 'utf-8');
        const logs = content.split('\n').filter((line) => line.trim());
        return Response.json({ logs }, { headers: corsHeaders });
      } catch (error) {
        return Response.json(
          { error: 'Failed to read logs', details: error instanceof Error ? error.message : String(error) },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // Stream task logs (SSE for real-time log streaming)
    if (url.pathname.match(/^\/api\/logs\/[^/]+\/stream$/) && req.method === 'GET') {
      const uuid = url.pathname.split('/')[3] as TaskUuid;

      // Create a ReadableStream for SSE
      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();

          const sendEvent = (data: any) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          };

          const logFile = join(getDataDir(), 'logs', `${uuid}.log`);
          let lastFileSize = 0;

          // Send existing logs first
          if (existsSync(logFile)) {
            try {
              const content = readFileSync(logFile, 'utf-8');
              const logs = content.split('\n').filter((line) => line.trim());
              // Send each log line as a separate event
              for (const log of logs) {
                sendEvent({ type: 'log', message: log });
              }
              // Track file size after reading existing logs
              lastFileSize = statSync(logFile).size;
            } catch (error) {
              sendEvent({ type: 'error', message: 'Failed to read existing logs' });
            }
          }

          sendEvent({ type: 'ready', message: 'Connected to log stream' });

          // Poll the log file for new content (works across processes)
          const pollInterval = setInterval(() => {
            try {
              // If file doesn't exist yet, skip this poll
              if (!existsSync(logFile)) {
                return;
              }

              const currentFileSize = statSync(logFile).size;

              // If file grew, read new content
              if (currentFileSize > lastFileSize) {
                const fd = openSync(logFile, 'r');
                const buffer = Buffer.alloc(currentFileSize - lastFileSize);

                try {
                  readSync(fd, buffer, 0, buffer.length, lastFileSize);
                  const newContent = buffer.toString('utf-8');
                  const newLogs = newContent.split('\n').filter((line) => line.trim());

                  for (const log of newLogs) {
                    sendEvent({ type: 'log', message: log });
                  }

                  lastFileSize = currentFileSize;
                } finally {
                  closeSync(fd);
                }
              }
            } catch (error) {
              // Silently ignore polling errors to avoid spamming
              console.error('Error polling log file:', error);
            }
          }, 100); // Poll every 100ms

          // Cleanup on connection close
          req.signal.addEventListener('abort', () => {
            clearInterval(pollInterval);
            controller.close();
          });
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          ...corsHeaders,
        },
      });
    }

    // ========== CHAT ENDPOINTS ==========

    // Streaming chat endpoint
    if (url.pathname === '/api/chat' && req.method === 'POST') {
      const body = await req.json();
      const { message, conversation_id = 'default' } = body;

      if (!message) {
        return Response.json({ error: 'Message is required' }, { status: 400, headers: corsHeaders });
      }

      // Create a ReadableStream for SSE
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          let fullResponse = '';

          const sendEvent = (data: string) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          };

          try {
            // Get current agent
            const agentType = getAgentType();

            // Prepare agent config
            let agentConfig: any = {
              type: agentType,
              spawnPath: join(getDataDir(), 'chat-workspace', conversation_id),
              prompt: message,
            };

            // Load Pardus config if needed
            if (agentType === 'pardus') {
              if (existsSync(PARDUS_CONFIG_FILE)) {
                try {
                  const content = readFileSync(PARDUS_CONFIG_FILE, 'utf-8');
                  const pardusConfig = JSON.parse(content);

                  // Check if Pardus config is set up
                  if (!pardusConfig.modelProvider || !pardusConfig.model || !pardusConfig.apiKey) {
                    sendEvent({
                      type: 'error',
                      content: `Pardus agent is not configured. Please go to Settings and configure your Pardus agent (Model Provider, Model, and API Key are required).`
                    });
                    await new Promise(resolve => setTimeout(resolve, 100));
                    controller.close();
                    return;
                  }

                  // Merge Pardus config into agent config
                  agentConfig = { ...agentConfig, ...pardusConfig };
                } catch (e) {
                  sendEvent({
                    type: 'error',
                    content: `Failed to read Pardus configuration: ${e instanceof Error ? e.message : String(e)}`
                  });
                  await new Promise(resolve => setTimeout(resolve, 100));
                  controller.close();
                  return;
                }
              } else {
                sendEvent({
                  type: 'error',
                  content: `Pardus agent is not configured. Please go to Settings and configure your Pardus agent (Model Provider, Model, and API Key are required).`
                });
                await new Promise(resolve => setTimeout(resolve, 100));
                controller.close();
                return;
              }
            }

            // Create workspace directory
            if (!existsSync(agentConfig.spawnPath)) {
              mkdirSync(agentConfig.spawnPath, { recursive: true });
            }

            sendEvent({ type: 'start', agent: agentType });

            // Get the agent executor
            const agent = getAgentExecutor(agentConfig);

            // Execute agent
            const result = await agent(agentConfig);

            if (result.success) {
              const output = result.output || '';
              // Simulate streaming by sending chunks
              const chunkSize = 50; // characters per chunk
              for (let i = 0; i < output.length; i += chunkSize) {
                const chunk = output.slice(i, i + chunkSize);
                sendEvent({ type: 'chunk', content: chunk });
                // Small delay to allow proper flushing
                await new Promise(resolve => setTimeout(resolve, 10));
              }
              sendEvent({ type: 'done', content: output, code: 0 });
            } else {
              sendEvent({ type: 'error', content: result.error || 'Execution failed' });
            }
            // Add a small delay before closing to ensure all data is flushed
            await new Promise(resolve => setTimeout(resolve, 100));
            controller.close();

          } catch (error) {
            sendEvent({
              type: 'error',
              content: error instanceof Error ? error.message : String(error)
            });
            // Add delay before closing to ensure data is flushed
            await new Promise(resolve => setTimeout(resolve, 100));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          ...corsHeaders,
        },
      });
    }

    // ========== ORIGINAL ENDPOINTS (Backward compatibility) ==========

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
        due_time: body.due_time || now + 60 * 60 * 1000, // Default: 1 hour from now
        recurrence_type: body.recurrence_type || 'none',
        recurrence_interval: body.recurrence_interval || 1,
        recurrence_end_time: body.recurrence_end_time || null,
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

    // ========== SSE ENDPOINT (Real-time updates) ==========

    if (url.pathname === '/api/events' && req.method === 'GET') {
      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();

          const sendEvent = (data: unknown) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          };

          // Send initial connection message
          sendEvent({ type: 'connected', timestamp: Date.now() });

          // Subscribe to task changes
          const onTaskUpdate = (task: Task) => {
            sendEvent({ type: 'task-update', data: task, timestamp: Date.now() });
          };

          eventEmitter.on('task:update', onTaskUpdate);

          // Cleanup on disconnect
          req.signal.addEventListener('abort', () => {
            eventEmitter.off('task:update', onTaskUpdate);
            controller.close();
          });
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
});

console.log(`📋 Enhanced Task API Server running at http://localhost:${API_PORT}`);
