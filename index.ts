import { initDb, getDb } from './db/db';
import { appendQueue, popQueue, updateTaskStatus } from './db/queue';
import { buildPrompt } from './prompt/prompt';
import { claudeCodeAgent } from './agent/claude-code';
import { loadMemory, saveMemory } from './memory/memory';
import { minutesToHeartbeat } from './config/heartbeat';
import { createWorkspace } from './config/workspace';

// Add timeout wrapper for promises
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), timeoutMs)
    ),
  ]);
};

// Main execution flow
const main = async () => {
  let nextTask: Awaited<ReturnType<typeof popQueue>> | null = null;

  try {
    console.log('🦅 PardusCrawler - Agent Starting...');

    // 1. Initialize database
    const db = getDb();
    initDb(db);
    db.close();
    console.log('✓ Database initialized');

    // 2. Create test task - Search YC company list
    const now = Date.now();
    const dueTime = now + minutesToHeartbeat(60); // Due in 60 minutes

    const task = appendQueue({
      title: 'Search YC Company List',
      description: 'Find and compile a list of Y Combinator companies from W23 batch',
      due_time: dueTime,
    });

    console.log(`✓ Task created: ${task.title} (UUID: ${task.uuid})`);

    // 3. Pop task from queue
    nextTask = popQueue();

    if (!nextTask) {
      console.log('✗ No tasks in queue');
      return;
    }

    console.log(`✓ Processing task: ${nextTask.title} (ID: ${nextTask.id})`);

    // 4. Create workspace for this task
    const workspacePath = createWorkspace(nextTask.uuid);
    console.log(`✓ Workspace created: ${workspacePath}`);

    // 5. Load existing memory (if any)
    const memory = loadMemory(nextTask.uuid) || '';
    console.log(`✓ Memory loaded: ${memory ? 'Existing' : 'New task'}`);

    // 6. Build prompt
    const prompt = buildPrompt({
      memory,
      userRequest: nextTask.description,
    });

    console.log('✓ Prompt built');
    console.log('--- Prompt ---');
    console.log(prompt);
    console.log('--- End Prompt ---\n');

    // 7. Execute agent with timeout (5 minutes)
    // Agent runs in the task's workspace directory
    console.log(`🤖 Executing Claude Code agent in workspace... (timeout: 5 minutes)`);
    console.log(`   Workspace: ${workspacePath}\n`);

    const result = await withTimeout(
      claudeCodeAgent({
        spawnPath: workspacePath, // Run agent in the task's workspace
        prompt,
      }),
      5 * 60 * 1000, // 5 minutes
      'Agent execution timed out after 5 minutes'
    );

    console.log(`✓ Agent execution finished (success: ${result.success})`);

    if (result.success) {
      console.log('✓ Agent executed successfully');

      // Show output if there is any
      if (result.output && result.output.length > 0) {
        console.log('--- Agent Output ---');
        console.log(result.output);
        console.log('--- End Output ---\n');
      } else {
        console.log('⚠ No agent output received (check workspace for created files)');
      }

      // 8. Save memory
      // Note: Agent may have created memory file directly, so we check first
      const existingMemory = loadMemory(nextTask.uuid);
      if (existingMemory) {
        console.log('✓ Memory file already exists (created by agent)');
      } else {
        // Append output to memory if agent didn't create it
        const updatedMemory = memory + '\n\n' + (result.output || '[No output from agent]');
        saveMemory(nextTask.uuid, updatedMemory);
        console.log('✓ Memory saved');
      }

      // 9. Update task status
      updateTaskStatus(nextTask.id, 'completed');
      console.log('✓ Task marked as completed');
    } else {
      console.log(`✗ Agent failed: ${result.error}`);
      updateTaskStatus(nextTask.id, 'failed');
      console.log('✓ Task marked as failed');
    }
  } catch (error) {
    console.error(`✗ Error during execution: ${error}`);

    // Update task status to failed if we have a task
    if (nextTask) {
      try {
        updateTaskStatus(nextTask.id, 'failed');
        console.log('✓ Task marked as failed due to error');
      } catch (updateError) {
        console.error(`✗ Failed to update task status: ${updateError}`);
      }
    }

    throw error;
  } finally {
    console.log('\n🦅 PardusCrawler - Agent Finished');
  }
};

// Run main
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
