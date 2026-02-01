import { spawn } from 'child_process';
import { type AgentConfig, type AgentResult, type AgentExecutor } from './types';

const AGENT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const executeCommand = (command: string, args: string[], cwd: string, onStream?: (data: string) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, { cwd });
    let output = '';
    let errorOutput = '';

    // Set timeout to kill hanging processes
    const timeout = setTimeout(() => {
      childProcess.kill('SIGTERM');
      reject(new Error(`Agent timed out after ${AGENT_TIMEOUT_MS}ms`));
    }, AGENT_TIMEOUT_MS);

    // Close stdin to prevent blocking
    childProcess.stdin?.end();

    // Stream stdout to console in real-time
    childProcess.stdout?.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text); // Write to console immediately

      // Call streaming callback if provided
      if (onStream) {
        onStream(text);
      }
    });

    // Stream stderr to console in real-time
    childProcess.stderr?.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      process.stderr.write(text); // Write to console immediately

      // Call streaming callback if provided
      if (onStream) {
        onStream(`[STDERR] ${text}`);
      }
    });

    childProcess.on('close', (code) => {
      clearTimeout(timeout);
      console.log(`[AGENT] Process exited with code: ${code}`);
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(errorOutput || `Process exited with code ${code}`));
      }
    });

    childProcess.on('error', (err) => {
      clearTimeout(timeout);
      console.error(`[AGENT] Process error: ${err.message}`);
      reject(err);
    });
  });
};

export const claudeCodeAgent: AgentExecutor = async (config: AgentConfig): Promise<AgentResult> => {
  try {
    console.log(`[AGENT] Starting Claude Code agent in: ${config.spawnPath}`);
    console.log(`[AGENT] Prompt: ${config.prompt.slice(0, 100)}...`);

    // Claude Code CLI in YOLO mode
    const output = await executeCommand('claude', ['--dangerously-skip-permissions', '-p', config.prompt], config.spawnPath, config.onStream);
    return {
      success: true,
      output,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[AGENT] Error: ${errorMsg}`);
    return {
      success: false,
      error: errorMsg,
    };
  }
};
