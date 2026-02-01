import { spawn } from 'child_process';
import { type AgentConfig, type AgentResult, type AgentExecutor } from './types';

const executeCommand = (command: string, args: string[], cwd: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { cwd });
    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(errorOutput || `Process exited with code ${code}`));
      }
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
};

export const cursorAgent: AgentExecutor = async (config: AgentConfig): Promise<AgentResult> => {
  try {
    // Cursor CLI in YOLO mode
    const output = await executeCommand('cursor', ['--yolo', 'ai', '--prompt', config.prompt], config.spawnPath);
    return {
      success: true,
      output,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
