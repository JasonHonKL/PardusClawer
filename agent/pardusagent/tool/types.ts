export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ToolConfig {
  timeout?: number;
  retries?: number;
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  enum?: string[];
  items?: ToolParameter;
  properties?: Record<string, ToolParameter>;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  execute: (params: any, config?: ToolConfig) => Promise<ToolResult>;
}

export interface ToolRegistry {
  tools: Map<string, Tool>;
  register(tool: Tool): void;
  get(name: string): Tool | undefined;
  list(): string[];
  execute(name: string, params: any, config?: ToolConfig): Promise<ToolResult>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}