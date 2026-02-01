import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import type { Tool, ToolResult, ToolConfig } from './types';

export class SearchTool implements Tool {
  name = 'search';
  description = 'Search for text patterns in files';
  parameters = {
    pattern: {
      type: 'string' as const,
      description: 'Search pattern (supports regex)',
      required: true,
    },
    path: {
      type: 'string' as const,
      description: 'Directory to search in',
      required: false,
    },
    extensions: {
      type: 'array' as const,
      description: 'File extensions to include',
      required: false,
      items: {
        type: 'string' as const,
        description: 'File extension (e.g., .ts, .js, .md)',
      },
    },
    caseSensitive: {
      type: 'boolean' as const,
      description: 'Case sensitive search',
      required: false,
    },
    maxResults: {
      type: 'number' as const,
      description: 'Maximum number of results',
      required: false,
    },
  };

  async execute(params: {
    pattern: string;
    path?: string;
    extensions?: string[];
    caseSensitive?: boolean;
    maxResults?: number;
  }, config?: ToolConfig): Promise<ToolResult> {
    const {
      pattern,
      path = process.cwd(),
      extensions = ['.ts', '.js', '.tsx', '.jsx', '.json', '.md', '.txt'],
      caseSensitive = false,
      maxResults = 100,
    } = params;

    try {
      const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
      const results: Array<{
        file: string;
        matches: Array<{ line: number; content: string; index: number }>;
      }> = [];

      const searchInDirectory = (dir: string): void => {
        if (results.length >= maxResults) return;

        try {
          const items = readdirSync(dir);
          
          for (const item of items) {
            if (results.length >= maxResults) break;
            
            const fullPath = join(dir, item);
            const stat = statSync(fullPath);

            if (stat.isDirectory()) {
              searchInDirectory(fullPath);
            } else if (stat.isFile()) {
              const ext = extname(fullPath);
              if (extensions.includes(ext)) {
                const content = readFileSync(fullPath, 'utf-8');
                const lines = content.split('\n');
                const matches: Array<{ line: number; content: string; index: number }> = [];

                lines.forEach((line, index) => {
                  const match = regex.exec(line);
                  if (match) {
                    matches.push({
                      line: index + 1,
                      content: line.trim(),
                      index: match.index,
                    });
                    regex.lastIndex = 0; // Reset for next line
                  }
                });

                if (matches.length > 0) {
                  results.push({
                    file: fullPath,
                    matches,
                  });
                }
              }
            }
          }
        } catch (error) {
          // Skip directories we can't read
        }
      };

      searchInDirectory(path);

      return {
        success: true,
        data: {
          pattern,
          path,
          results: results.slice(0, maxResults),
          totalFiles: results.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}