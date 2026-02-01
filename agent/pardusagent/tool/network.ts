import type { Tool, ToolResult, ToolConfig } from './types';

export class NetworkTool implements Tool {
  name = 'network';
  description = 'Make HTTP requests and check network connectivity';
  parameters = {
    action: {
      type: 'string' as const,
      description: 'Action to perform: get, post, put, delete, ping',
      required: true,
      enum: ['get', 'post', 'put', 'delete', 'ping'],
    },
    url: {
      type: 'string' as const,
      description: 'URL to request',
      required: true,
    },
    data: {
      type: 'object' as const,
      description: 'Request body data',
      required: false,
    },
    headers: {
      type: 'object' as const,
      description: 'Request headers',
      required: false,
      properties: {},
    },
    timeout: {
      type: 'number' as const,
      description: 'Request timeout in milliseconds',
      required: false,
    },
  };

  async execute(params: {
    action: string;
    url: string;
    data?: any;
    headers?: Record<string, string>;
    timeout?: number;
  }, config?: ToolConfig): Promise<ToolResult> {
    const { action, url, data, headers = {}, timeout = 30000 } = params;

    try {
      switch (action) {
        case 'ping':
          const startTime = Date.now();
          try {
            const response = await fetch(url, {
              method: 'HEAD',
              signal: AbortSignal.timeout(timeout),
            });
            const endTime = Date.now();
            return {
              success: true,
              data: {
                status: response.status,
                statusText: response.statusText,
                responseTime: endTime - startTime,
                headers: Object.fromEntries(response.headers.entries()),
              },
            };
          } catch (error) {
            const endTime = Date.now();
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error),
              data: { responseTime: endTime - startTime },
            };
          }

        case 'get':
        case 'post':
        case 'put':
        case 'delete':
          const requestInit: RequestInit = {
            method: action.toUpperCase(),
            headers: {
              'Content-Type': 'application/json',
              ...headers,
            },
            signal: AbortSignal.timeout(timeout),
          };

          if (data && (action === 'post' || action === 'put')) {
            requestInit.body = JSON.stringify(data);
          }

          const response = await fetch(url, requestInit);
          const responseText = await response.text();

          let responseData: any = responseText;
          try {
            responseData = JSON.parse(responseText);
          } catch {
            // Keep as text if not JSON
          }

          return {
            success: response.ok,
            data: {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              data: responseData,
            },
            error: !response.ok ? response.statusText : undefined,
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