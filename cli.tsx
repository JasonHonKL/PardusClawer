import { render } from 'ink';
import { createServer } from './ui/server';
import { Cli } from './ui/cli';
import { getDefaultHeartbeat } from './config/heartbeat';

const main = () => {
  // Create server with default heartbeat (1 minute)
  const server = createServer({
    heartbeat: getDefaultHeartbeat(),
    onTaskStart: (task) => {
      console.log(`\n[SERVER] Task started: ${task.title} (ID: ${task.id}, UUID: ${task.uuid})`);
    },
    onTaskComplete: (task) => {
      console.log(`[SERVER] Task completed: ${task.title} (ID: ${task.id})`);
    },
    onTaskFailed: (task, error) => {
      console.error(`[SERVER] Task failed: ${task.title} (ID: ${task.id}) - Error: ${error}`);
    },
    onQueueEmpty: () => {
      console.log('[SERVER] Queue is empty, waiting for tasks...');
    },
  });

  // Auto-start server
  server.start();

  // Render CLI UI
  const { waitUntilExit } = render(<Cli server={server} />);

  // Stop server when CLI exits
  waitUntilExit().then(() => {
    server.stop();
    console.log('\n🦅 PardusCrawler shutdown complete');
  });
};

main();
