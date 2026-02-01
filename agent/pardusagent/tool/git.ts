import type { Tool, ToolResult, ToolConfig } from './types';

export class GitTool implements Tool {
  name = 'git';
  description = 'Execute git commands';
  parameters = {
    command: {
      type: 'string' as const,
      description: 'Git command to execute (status, log, diff, add, commit, push, pull, checkout, branch)',
      required: true,
      enum: ['status', 'log', 'diff', 'add', 'commit', 'push', 'pull', 'checkout', 'branch'],
    },
    args: {
      type: 'array' as const,
      description: 'Additional arguments for the git command',
      required: false,
      items: {
        type: 'string' as const,
        description: 'Git command argument',
      },
    },
    cwd: {
      type: 'string' as const,
      description: 'Working directory',
      required: false,
    },
  };

  private async executeGitCommand(command: string, args: string[] = [], cwd?: string): Promise<ToolResult> {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve) => {
      const gitProcess = spawn('git', [command, ...args], {
        cwd: cwd || process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      gitProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      gitProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      gitProcess.on('close', (code) => {
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

      gitProcess.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
        });
      });
    });
  }

  async execute(params: {
    command: string;
    args?: string[];
    cwd?: string;
  }, config?: ToolConfig): Promise<ToolResult> {
    const { command, args = [], cwd } = params;

    try {
      switch (command) {
        case 'status':
        case 'log':
        case 'diff':
        case 'add':
        case 'commit':
        case 'push':
        case 'pull':
        case 'checkout':
        case 'branch':
          return await this.executeGitCommand(command, args, cwd);

        default:
          return {
            success: false,
            error: `Unsupported git command: ${command}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}