import { spawn } from 'child_process';
import { createServer as createTaskServer } from './ui/server';
import { getDefaultHeartbeat } from './config/heartbeat';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get the directory where this script is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use the script's directory as working directory (important for npm installations)
const serverDir = __dirname;

// Start the Enhanced API server on port 13337
console.log('Starting Enhanced API server...');
const apiServer = spawn('bun', ['run', join(serverDir, 'api-enhanced.ts')], {
  stdio: 'inherit',
  cwd: serverDir,
});

// Create the task processor (will be started after API server is ready)
let taskServer: ReturnType<typeof createTaskServer> | null = null;

// Give API server time to start
setTimeout(() => {
  // Create and start the task processor
  taskServer = createTaskServer({
    heartbeat: getDefaultHeartbeat(),
    onTaskStart: (task) => console.log(`[TASK START] ${task.title} (ID: ${task.id}, UUID: ${task.uuid})`),
    onTaskComplete: (task) => console.log(`[TASK DONE] ${task.title} (ID: ${task.id})`),
    onTaskFailed: (task) => console.error(`[TASK FAIL] ${task.title} (ID: ${task.id}): ${task.error}`),
    onQueueEmpty: () => console.log('[QUEUE] Empty - waiting for tasks...'),
  });

  // Start the task processor
  taskServer.start();

  console.log('Task processor started');
}, 1000);

// Start the React web server in a separate process
console.log('Starting React web server...');
const webServer = spawn('bun', ['run', join(serverDir, 'web-react-server.ts')], {
  stdio: 'inherit',
  cwd: serverDir,
});

webServer.stdout?.on('data', (data) => console.log(`[WEB] ${data.toString().trim()}`));
webServer.stderr?.on('data', (data) => console.error(`[WEB ERROR] ${data.toString().trim()}`));

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n\n🦅 Shutting down PardusBot...');
  taskServer?.stop();
  apiServer.kill('SIGTERM');
  webServer.kill('SIGTERM');
  process.exit(0);
});

// Handle child process exits
apiServer.on('exit', (code) => {
  console.log(`\n[API] Enhanced API server exited with code ${code}`);
  process.exit(code);
});

webServer.on('exit', (code) => {
  console.log(`\n[WEB] React web server exited with code ${code}`);
  process.exit(code);
});

console.log('🦅 PardusBot is running!');
console.log('');
console.log('📋 Enhanced API: http://localhost:13337 (API with SSE & Task Control)');
console.log('🌐 React Web UI: http://localhost:13338');
console.log('');
console.log('Press Ctrl+C to stop');
