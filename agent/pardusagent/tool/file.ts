import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import type { Tool, ToolResult, ToolConfig } from './types';

export class FileTool implements Tool {
  name = 'file';
  description = 'Read, write, and manipulate files';
  parameters = {
    action: {
      type: 'string' as const,
      description: 'Action to perform: read, write, exists, mkdir, stat',
      required: true,
      enum: ['read', 'write', 'exists', 'mkdir', 'stat'],
    },
    path: {
      type: 'string' as const,
      description: 'File path',
      required: true,
    },
    content: {
      type: 'string' as const,
      description: 'Content to write (for write action)',
      required: false,
    },
    encoding: {
      type: 'string' as const,
      description: 'File encoding',
      required: false,
    },
  };

  async execute(params: {
    action: 'read' | 'write' | 'exists' | 'mkdir' | 'stat';
    path: string;
    content?: string;
    encoding?: string;
  }, config?: ToolConfig): Promise<ToolResult> {
    const { action, path, content, encoding = 'utf-8' } = params;

    try {
      switch (action) {
        case 'read':
          if (!existsSync(path)) {
            return { success: false, error: `File not found: ${path}` };
          }
          const fileContent = readFileSync(path, encoding as BufferEncoding);
          return { success: true, data: { content: fileContent } };

        case 'write':
          const dir = dirname(path);
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          writeFileSync(path, content || '', encoding as BufferEncoding);
          return { success: true, data: { message: `File written: ${path}` } };

        case 'exists':
          const exists = existsSync(path);
          return { success: true, data: { exists } };

        case 'mkdir':
          mkdirSync(path, { recursive: true });
          return { success: true, data: { message: `Directory created: ${path}` } };

        case 'stat':
          if (!existsSync(path)) {
            return { success: false, error: `Path not found: ${path}` };
          }
          const stats = statSync(path);
          return {
            success: true,
            data: {
              isFile: stats.isFile(),
              isDirectory: stats.isDirectory(),
              size: stats.size,
              modified: stats.mtime,
              created: stats.birthtime,
            },
          };

        default:
          return { success: false, error: `Unknown action: ${action}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}