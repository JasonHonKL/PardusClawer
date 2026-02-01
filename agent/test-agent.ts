import { type AgentConfig, type AgentResult, type AgentExecutor } from './types';

/**
 * Demo agent for testing recurring tasks
 * This agent simply logs the current time and simulates work
 */
export const testAgent: AgentExecutor = async (config: AgentConfig): Promise<AgentResult> => {
  try {
    const startTime = new Date().toISOString();
    console.log(`[TEST AGENT] Starting task execution at ${startTime}`);

    // Simulate some work
    let workOutput = `[TEST AGENT] Execution at ${startTime}\n`;
    workOutput += `[TEST AGENT] Workspace: ${config.spawnPath}\n`;
    workOutput += `[TEST AGENT] Task: ${config.prompt.slice(0, 50)}...\n`;

    // Call onStream callback if provided
    if (config.onStream) {
      config.onStream(`[TEST] Starting execution at ${startTime}`);
      config.onStream(`[TEST] Processing task...`);
      config.onStream(`[TEST] Task completed successfully at ${new Date().toISOString()}`);
    }

    // Create a simple output file
    const { writeFileSync } = require('fs');
    const { join } = require('path');
    const outputFile = join(config.spawnPath, 'test_output.txt');
    writeFileSync(outputFile, `Test execution completed at ${startTime}\n`);

    console.log(`[TEST AGENT] Completed task execution at ${new Date().toISOString()}`);

    return {
      success: true,
      output: workOutput,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[TEST AGENT] Error: ${errorMsg}`);
    return {
      success: false,
      error: errorMsg,
    };
  }
};
