import type { Tool, ToolRegistry, ToolResult, ToolConfig, ToolDefinition } from './types';

export class DefaultToolRegistry implements ToolRegistry {
  tools = new Map<string, Tool>();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): string[] {
    return Array.from(this.tools.keys());
  }

  async execute(name: string, params: any, config?: ToolConfig): Promise<ToolResult> {
    const tool = this.get(name);
    if (!tool) {
      return {
        success: false,
        error: `Tool '${name}' not found`,
      };
    }

    try {
      const result = await tool.execute(params, config);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  getToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(tool => this.toolToDefinition(tool));
  }

  toolToDefinition(tool: Tool): ToolDefinition {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [paramName, paramConfig] of Object.entries(tool.parameters)) {
      properties[paramName] = {
        type: paramConfig.type,
        description: paramConfig.description,
      };

      // Add enum if available
      if (paramConfig.enum) {
        properties[paramName].enum = paramConfig.enum;
      }

      // Add nested properties for objects
      if (paramConfig.type === 'object' && paramConfig.properties) {
        properties[paramName].properties = this.convertNestedProperties(paramConfig.properties);
      }

      // Add items for arrays
      if (paramConfig.type === 'array' && paramConfig.items) {
        properties[paramName].items = {
          type: paramConfig.items.type,
          description: paramConfig.items.description,
        };
      }

      if (paramConfig.required) {
        required.push(paramName);
      }
    }

    return {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties,
        required,
      },
    };
  }

  private convertNestedProperties(properties: Record<string, any>): Record<string, any> {
    const converted: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(properties)) {
      const param = value as any;
      converted[key] = {
        type: param.type,
        description: param.description,
      };

      if (param.enum) {
        converted[key].enum = param.enum;
      }

      if (param.type === 'object' && param.properties) {
        converted[key].properties = this.convertNestedProperties(param.properties);
      }

      if (param.type === 'array' && param.items) {
        converted[key].items = {
          type: param.items.type,
          description: param.items.description,
        };
      }
    }

    return converted;
  }
}