import { spawn } from 'child_process';
import { createServer as createTaskServer } from './ui/server';
import { getDefaultHeartbeat } from './config/heartbeat';

// Start the Enhanced API server on port 13337
console.log('Starting Enhanced API server...');
const apiServer = spawn('bun', ['run', 'api-enhanced.ts'], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

// Give API server time to start
setTimeout(() => {
  // Create and start the task processor
  const taskServer = createTaskServer({
    heartbeat: getDefaultHeartbeat(),
    onTaskStart: (task) => console.log(`[TASK START] ${task.title} (ID: ${task.id}, UUID: ${task.uuid})`),
    onTaskComplete: (task) => console.log(`[TASK DONE] ${task.title} (ID: ${task.id})`),
    onTaskFailed: (task, error) => console.error(`[TASK FAIL] ${task.title} (ID: ${task.id}): ${error}`),
    onQueueEmpty: () => console.log('[QUEUE] Empty - waiting for tasks...'),
  });

  // Start the task processor
  taskServer.start();

  console.log('Task processor started');
}, 1000);

// Start the React web server in a separate process
console.log('Starting React web server...');
const webServer = spawn('bun', ['run', 'web-react-server.ts'], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

webServer.stdout?.on('data', (data) => console.log(`[WEB] ${data.toString().trim()}`));
webServer.stderr?.on('data', (data) => console.error(`[WEB ERROR] ${data.toString().trim()}`));

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n\n🦅 Shutting down PardusCrawler...');
  taskServer.stop();
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

console.log('🦅 PardusCrawler is running!');
console.log('');
console.log('📋 Enhanced API: http://localhost:13337 (API with SSE & Task Control)');
console.log('🌐 React Web UI: http://localhost:13338');
console.log('');
console.log('Press Ctrl+C to stop');
