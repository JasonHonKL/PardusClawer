import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { ToolFactory } from '../../../agent/pardusagent/tool/index';
import type { ToolDefinition } from '../../../agent/pardusagent/tool/types';

describe('PardusAgent Tool Registry Edge Cases', () => {
  test('should handle tool registration with special characters', () => {
    const registry = ToolFactory.getRegistry();
    
    const tools = [
      {
        name: 'tool_with_underscore',
        description: 'Tool with underscore in name',
        parameters: {
          type: 'object' as const,
          properties: {
            input: { type: 'string' as const, description: 'Input parameter' },
          },
          required: ['input'],
        },
        execute: async () => ({ success: true, data: {} }),
      },
      {
        name: 'tool-with-dash',
        description: 'Tool with dash in name',
        parameters: {
          type: 'object' as const,
          properties: {
            'param-with-dash': { type: 'string' as const, description: 'Parameter with dash' },
          },
          required: ['param-with-dash'],
        },
        execute: async () => ({ success: true, data: {} }),
      },
      {
        name: 'tool_特殊字符_🚀',
        description: 'Tool with unicode characters',
        parameters: {
          type: 'object' as const,
          properties: {
            '参数': { type: 'string' as const, description: 'Chinese parameter name' },
          },
          required: ['参数'],
        },
        execute: async () => ({ success: true, data: {} }),
      },
    ];

    tools.forEach(tool => {
      expect(() => {
        registry.register(tool);
      }).not.toThrow();
    });

    const toolNames = registry.list();
    expect(toolNames).toContain('tool_with_underscore');
    expect(toolNames).toContain('tool-with-dash');
    expect(toolNames).toContain('tool_特殊字符_🚀');
  });

  test('should handle complex parameter schemas', () => {
    const registry = ToolFactory.getRegistry();
    
    const complexTool = {
      name: 'complex_tool',
      description: 'Tool with complex parameter schema',
      parameters: {
        type: 'object' as const,
        properties: {
          stringParam: {
            type: 'string' as const,
            description: 'String parameter',
            enum: ['option1', 'option2', 'option3'],
          },
          numberParam: {
            type: 'number' as const,
            description: 'Number parameter',
            minimum: 0,
            maximum: 100,
          },
          booleanParam: {
            type: 'boolean' as const,
            description: 'Boolean parameter',
          },
          arrayParam: {
            type: 'array' as const,
            description: 'Array parameter',
            items: {
              type: 'string' as const,
              description: 'Array items',
            },
          },
          objectParam: {
            type: 'object' as const,
            description: 'Object parameter',
            properties: {
              nested: {
                type: 'string' as const,
                description: 'Nested object property',
              },
            },
            required: ['nested'],
          },
        },
        required: ['stringParam', 'objectParam'],
      },
      execute: async () => ({ success: true, data: {} }),
    };

    expect(() => {
      registry.register(complexTool);
    }).not.toThrow();

    const definition = registry.toolToDefinition(complexTool);
    expect(definition).toBeDefined();
    expect(definition.properties.stringParam.enum).toEqual(['option1', 'option2', 'option3']);
    expect(definition.properties.numberParam.minimum).toBe(0);
    expect(definition.properties.numberParam.maximum).toBe(100);
    expect(definition.properties.booleanParam.type).toBe('boolean');
    expect(definition.properties.arrayParam.items.type).toBe('string');
    expect(definition.properties.objectParam.type).toBe('object');
  });

  test('should handle tool registration conflicts', () => {
    const registry = ToolFactory.getRegistry();
    
    const tool = {
      name: 'test_tool',
      description: 'Test tool',
      parameters: {
        type: 'object' as const,
        properties: {
          input: { type: 'string' as const, description: 'Input' },
        },
        required: ['input'],
      },
      execute: async () => ({ success: true, data: {} }),
    };

    // Register same tool twice
    registry.register(tool);
    registry.register(tool);

    // Should still work (overwrites)
    const tools = registry.list();
    const testToolCount = tools.filter(name => name === 'test_tool').length;
    expect(testToolCount).toBe(1);
  });

  test('should handle tool execution with invalid parameters', async () => {
    const registry = ToolFactory.getRegistry();
    
    const tool = {
      name: 'validation_test_tool',
      description: 'Tool for testing parameter validation',
      parameters: {
        type: 'object' as const,
        properties: {
          required_string: { type: 'string' as const, description: 'Required string' },
          optional_number: { type: 'number' as const, description: 'Optional number' },
        },
        required: ['required_string'],
      },
      execute: async (params: any) => {
        if (typeof params.required_string !== 'string') {
          return { success: false, error: 'Invalid required_string type' };
        }
        if (params.optional_number && typeof params.optional_number !== 'number') {
          return { success: false, error: 'Invalid optional_number type' };
        }
        return { success: true, data: params };
      },
    };

    registry.register(tool);

    // Test with valid parameters
    const validResult = await registry.execute('validation_test_tool', {
      required_string: 'test',
      optional_number: 42,
    });
    expect(validResult.success).toBe(true);

    // Test with invalid parameters
    const invalidResult1 = await registry.execute('validation_test_tool', {
      required_string: 123, // Invalid type
      optional_number: 42,
    });
    expect(invalidResult1.success).toBe(false);
    expect(invalidResult1.error).toContain('Invalid required_string type');

    // Test missing required parameter
    const invalidResult2 = await registry.execute('validation_test_tool', {
      optional_number: 42, // Missing required_string
    });
    expect(invalidResult2.success).toBe(false);
  });

  test('should handle tool execution errors', async () => {
    const registry = ToolFactory.getRegistry();
    
    const errorTool = {
      name: 'error_test_tool',
      description: 'Tool that throws errors',
      parameters: {
        type: 'object' as const,
        properties: {
          should_error: { type: 'boolean' as const, description: 'Whether to throw error' },
        },
        required: ['should_error'],
      },
      execute: async (params: { should_error: boolean }) => {
        if (params.should_error) {
          throw new Error('Intentional test error');
        }
        return { success: true, data: {} };
      },
    };

    registry.register(errorTool);

    // Test normal execution
    const normalResult = await registry.execute('error_test_tool', {
      should_error: false,
    });
    expect(normalResult.success).toBe(true);

    // Test error execution
    const errorResult = await registry.execute('error_test_tool', {
      should_error: true,
    });
    expect(errorResult.success).toBe(false);
    expect(errorResult.error).toBe('Intentional test error');
  });

  test('should handle tool execution with large data', async () => {
    const registry = ToolFactory.getRegistry();
    
    const largeDataTool = {
      name: 'large_data_tool',
      description: 'Tool that handles large data',
      parameters: {
        type: 'object' as const,
        properties: {
          data: { type: 'string' as const, description: 'Large data input' },
        },
        required: ['data'],
      },
      execute: async (params: { data: string }) => {
        const dataLength = params.data.length;
        return {
          success: true,
          data: {
            input_length: dataLength,
            processed: true,
            timestamp: new Date().toISOString(),
          },
        };
      },
    };

    registry.register(largeDataTool);

    const largeString = 'x'.repeat(100000); // 100KB
    const result = await registry.execute('large_data_tool', {
      data: largeString,
    });
    
    expect(result.success).toBe(true);
    expect(result.data.input_length).toBe(100000);
    expect(result.data.processed).toBe(true);
  });

  test('should handle tool registration with circular references', () => {
    const registry = ToolFactory.getRegistry();
    
    // Create tools with circular references
    const tool1 = {
      name: 'circular_tool_1',
      description: 'First tool in circular reference',
      parameters: {
        type: 'object' as const,
        properties: {},
        required: [],
      },
      execute: async () => ({ success: true, data: {} }),
    };

    const tool2 = {
      name: 'circular_tool_2',
      description: 'Second tool in circular reference',
      parameters: {
        type: 'object' as const,
        properties: {},
        required: [],
      },
      execute: async () => ({ success: true, data: {} }),
    };

    // Create circular reference
    (tool1 as any).ref = tool2;
    (tool2 as any).ref = tool1;

    // Should still register without issues
    expect(() => {
      registry.register(tool1);
      registry.register(tool2);
    }).not.toThrow();

    // Tools should be accessible
    const tool1FromRegistry = registry.get('circular_tool_1');
    const tool2FromRegistry = registry.get('circular_tool_2');
    expect(tool1FromRegistry).toBeDefined();
    expect(tool2FromRegistry).toBeDefined();
  });

  test('should generate tool definitions for all edge case tools', () => {
    const registry = ToolFactory.getRegistry();
    
    const edgeCaseTool = {
      name: 'edge_case_tool_特殊字符_🚀',
      description: 'Tool with edge case name and unicode characters that tests the limits of the system for handling special characters in tool names and descriptions. This tool includes emojis (🚀), chinese characters (特殊字符), and other unicode characters to ensure robust handling.',
      parameters: {
        type: 'object' as const,
        properties: {
          '参数-with-特殊字符': {
            type: 'string' as const,
            description: 'Parameter name with unicode characters - 测试中文参数名',
            enum: ['选项1', '选项2', '选项3'],
          },
          'number_with_limits': {
            type: 'number' as const,
            description: 'Number parameter with validation limits',
            minimum: Number.MIN_SAFE_INTEGER,
            maximum: Number.MAX_SAFE_INTEGER,
          },
          'array_of_objects': {
            type: 'array' as const,
            description: 'Array parameter with complex object items',
            items: {
              type: 'object' as const,
              description: 'Complex array item',
              properties: {
                'nested-prop': {
                  type: 'string' as const,
                  description: 'Nested object property with special characters - 嵌套属性',
                },
              },
              required: ['nested-prop'],
            },
          },
        },
        required: ['参数-with-特殊字符', 'array_of_objects'],
      },
      execute: async () => ({ success: true, data: {} }),
    };

    expect(() => {
      registry.register(edgeCaseTool);
    }).not.toThrow();

    const definitions = registry.getToolDefinitions();
    const edgeToolDef = definitions.find(d => d.name === 'edge_case_tool_特殊字符_🚀');
    expect(edgeToolDef).toBeDefined();
    expect(edgeToolDef.name).toBe('edge_case_tool_特殊字符_🚀');
    expect(edgeToolDef.description).toContain('🚀');
    expect(edgeToolDef.description).toContain('特殊字符');
    expect(edgeToolDef.parameters.properties['参数-with-特殊字符']).toBeDefined();
    expect(edgeToolDef.parameters.properties['number_with_limits'].minimum).toBe(Number.MIN_SAFE_INTEGER);
    expect(edgeToolDef.parameters.properties['number_with_limits'].maximum).toBe(Number.MAX_SAFE_INTEGER);
    expect(edgeToolDef.parameters.properties['array_of_objects'].items.properties['nested-prop'].description).toContain('嵌套属性');
  });
});