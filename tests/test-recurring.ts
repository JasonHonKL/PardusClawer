/**
 * Test script for recurring tasks
 *
 * This script tests:
 * 1. Creating a task with 10-second recurrence
 * 2. Setting heartbeat to 5 seconds
 * 3. Verifying the task executes multiple times
 * 4. Checking that rescheduled tasks appear in the queue
 */

import { appendQueue } from '../db/queue';
import { setHeartbeat } from '../config/heartbeat';
import { setAgentType } from '../config/agentconfig';
import { createServer } from '../ui/server';

async function testRecurringTasks() {
  console.log('=== Testing Recurring Tasks ===\n');

  // Step 1: Set heartbeat to 5 seconds for faster testing
  console.log('1. Setting heartbeat to 5 seconds...');
  setHeartbeat(5000);
  console.log('✓ Heartbeat set to 5000ms (5 seconds)\n');

  // Step 2: Set agent to test agent
  console.log('2. Setting agent to test agent...');
  setAgentType('test');
  console.log('✓ Agent set to test\n');

  // Step 3: Create a recurring task
  console.log('3. Creating recurring task (10-second interval)...');
  const task = appendQueue({
    title: 'Test Recurring Task',
    description: 'This is a test task that should execute every 10 seconds',
    due_time: Date.now(), // Execute immediately
    recurrence_type: 'seconds',
    recurrence_interval: 10, // Every 10 seconds
    recurrence_end_time: null, // No end time
  });
  console.log(`✓ Task created with ID: ${task.id}, UUID: ${task.uuid}\n`);

  // Step 4: Start the task processor
  console.log('4. Starting task processor...');
  const server = createServer({
    heartbeat: 5000,
    onTaskStart: (task) => {
      console.log(`\n� TASK STARTED: ${task.title} (ID: ${task.id})`);
      console.log(`  Time: ${new Date().toISOString()}`);
    },
    onTaskComplete: (task) => {
      console.log(`\n✅ TASK COMPLETED: ${task.title} (ID: ${task.id})`);
      console.log(`  Time: ${new Date().toISOString()}`);
    },
    onQueueEmpty: () => {
      console.log('\n📭 Queue empty, waiting for tasks...');
    },
  });
  server.start();
  console.log('✓ Task processor started\n');

  // Step 5: Monitor for 40 seconds to see multiple executions
  console.log('5. Monitoring for 40 seconds...');
  console.log('   (Should see ~4 executions: 0s, 10s, 20s, 30s)\n');

  let executionCount = 0;
  const checkInterval = setInterval(() => {
    const status = server.getStatus();
    const tasks = status.tasks;

    // Count completed tasks with our test title
    const completedTasks = tasks.filter(
      (t) => t.title === 'Test Recurring Task' && t.status === 'completed'
    );
    executionCount = completedTasks.length;

    console.log(`   [${new Date().toISOString()}] Completed executions: ${executionCount}`);
  }, 2000);

  // Stop after 40 seconds
  setTimeout(() => {
    clearInterval(checkInterval);
    server.stop();

    console.log('\n=== Test Results ===');
    console.log(`Total executions in 40 seconds: ${executionCount}`);
    console.log(`Expected: ~4 executions`);
    console.log(`Result: ${executionCount >= 3 ? '✅ PASS' : '❌ FAIL'}\n`);

    // Check the workspace for output files
    const { readdirSync } = require('fs');
    const { join } = require('path');
    const workspaceDir = join(process.cwd(), 'pardus_data/workspaces');

    try {
      const workspaces = readdirSync(workspaceDir);
      console.log(`Workspaces created: ${workspaces.length}`);

      workspaces.forEach((uuid: string) => {
        const workspacePath = join(workspaceDir, uuid);
        const files = readdirSync(workspacePath);
        console.log(`  - ${uuid}: ${files.join(', ')}`);
      });
    } catch (error) {
      console.log('Error checking workspaces:', error);
    }

    console.log('\n=== Test Complete ===');
    process.exit(0);
  }, 40000);
}

// Run the test
testRecurringTasks().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
