import { spawn } from 'child_process';
import type { Tool, ToolResult, ToolConfig } from './types';

export class BashTool implements Tool {
  name = 'bash';
  description = 'Execute bash commands in the terminal';
  parameters = {
    command: {
      type: 'string' as const,
      description: 'The bash command to execute',
      required: true,
    },
    cwd: {
      type: 'string' as const,
      description: 'Working directory for the command',
      required: false,
    },
    timeout: {
      type: 'number' as const,
      description: 'Timeout in milliseconds',
      required: false,
    },
  };

  async execute(params: { command: string; cwd?: string; timeout?: number }, config?: ToolConfig): Promise<ToolResult> {
    const { command, cwd = process.cwd(), timeout = config?.timeout || 30000 } = params;

    return new Promise((resolve) => {
      const child = spawn(command, [], { 
        shell: true, 
        cwd,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        resolve({
          success: false,
          error: `Command timed out after ${timeout}ms`,
        });
      }, timeout);

      child.on('close', (code) => {
        clearTimeout(timer);
        resolve({
          success: code === 0,
          data: {
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode: code,
          },
          error: code !== 0 ? stderr.trim() : undefined,
        });
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        resolve({
          success: false,
          error: error.message,
        });
      });
    });
  }
}