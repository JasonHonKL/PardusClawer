import { describe, test, expect, beforeEach, afterEach, beforeAll } from 'bun:test';
import { createPardusAgent, PardusAgent } from '../../../agent/pardusagent/agent';
import { ToolFactory } from '../../../agent/pardusagent/tool/index';
import type { PardusAgentConfig } from '../../../agent/pardusagent/agent';

describe('PardusAgent Tool Integration', () => {
  let agent: PardusAgent;

  beforeAll(() => {
    process.env.OPENAI_API_KEY = 'test-key';
  });

  beforeEach(() => {
    agent = createPardusAgent({
      spawnPath: process.cwd(),
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    });
  });

  afterEach(() => {
    if (agent) {
      agent.clearConversation();
    }
  });

  test('should integrate all built-in tools', () => {
    const tools = agent.getAvailableTools();
    expect(tools).toHaveLength(6);
    
    const toolNames = tools.map((t: any) => t.name);
    expect(toolNames).toContain('bash');
    expect(toolNames).toContain('file');
    expect(toolNames).toContain('search');
    expect(toolNames).toContain('browser');
    expect(toolNames).toContain('git');
    expect(toolNames).toContain('network');
  });

  test('should handle bash tool calls', async () => {
    const config: PardusAgentConfig = {
      spawnPath: process.cwd(),
      prompt: 'Execute "echo hello world" using bash tool',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        temperature: 0,
      },
      toolChoice: 'required',
    };

    const testAgent = createPardusAgent(config, {
      verbose: true,
    });

    const result = await testAgent.execute(config);
    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
  });

  test('should handle file tool calls', async () => {
    const config: PardusAgentConfig = {
      spawnPath: process.cwd(),
      prompt: 'Create a file called test.txt with content "hello world"',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        temperature: 0,
      },
    };

    const testAgent = createPardusAgent(config, {
      verbose: true,
    });

    const result = await testAgent.execute(config);
    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
  });

  test('should handle search tool calls', async () => {
    const config: PardusAgentConfig = {
      spawnPath: process.cwd(),
      prompt: 'Search for files containing "PardusAgent" in the codebase',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        temperature: 0,
      },
    };

    const testAgent = createPardusAgent(config, {
      verbose: true,
    });

    const result = await testAgent.execute(config);
    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
  });

  test('should handle git tool calls', async () => {
    const config: PardusAgentConfig = {
      spawnPath: process.cwd(),
      prompt: 'Check git status',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        temperature: 0,
      },
    };

    const testAgent = createPardusAgent(config, {
      verbose: true,
    });

    const result = await testAgent.execute(config);
    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
  });

  test('should handle network tool calls', async () => {
    const config: PardusAgentConfig = {
      spawnPath: process.cwd(),
      prompt: 'Ping https://httpbin.org/status/200 to check connectivity',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        temperature: 0,
      },
    };

    const testAgent = createPardusAgent(config, {
      verbose: true,
    });

    const result = await testAgent.execute(config);
    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
  });

  test('should handle multiple tool calls in sequence', async () => {
    const config: PardusAgentConfig = {
      spawnPath: process.cwd(),
      prompt: 'Create a file with TypeScript code, then compile it using bash, then check git status',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        temperature: 0.1,
      },
      maxIterations: 10,
    };

    const testAgent = createPardusAgent(config, {
      verbose: true,
    });

    const result = await testAgent.execute(config);
    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
  });

  test('should handle tool call failures gracefully', async () => {
    const config: PardusAgentConfig = {
      spawnPath: '/tmp', // Use temp directory
      prompt: 'Execute command "rm -rf /nonexistent" using bash tool',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        temperature: 0,
      },
    };

    const testAgent = createPardusAgent(config, {
      verbose: true,
    });

    const result = await testAgent.execute(config);
    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
    // Should handle the tool failure gracefully
  });

  test('should handle tool choice modes', async () => {
    const toolChoices = ['auto', 'required', 'none'] as const;

    for (const toolChoice of toolChoices) {
      const config: PardusAgentConfig = {
        spawnPath: process.cwd(),
        prompt: 'Simple test message',
        modelConfig: {
          provider: 'openai',
          apiKey: 'test-key',
          model: 'gpt-4',
        },
        toolChoice,
      };

      const testAgent = createPardusAgent(config, {
        verbose: false,
      });

      const result = await testAgent.execute(config);
      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
    }
  });

  test('should handle tools disabled mode', async () => {
    const config: PardusAgentConfig = {
      spawnPath: process.cwd(),
      prompt: 'Just have a conversation without tools',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    };

    const testAgent = createPardusAgent(config, {
      enableTools: false,
      verbose: false,
    });

    const result = await testAgent.execute(config);
    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
  });

  test('should handle custom tools', async () => {
    // Add a custom tool to registry
    const registry = ToolFactory.getRegistry();
    
    const customTool = {
      name: 'custom_calculator',
      description: 'Perform simple calculations',
      parameters: {
        type: 'object' as const,
        properties: {
          a: { type: 'number' as const, description: 'First number' },
          b: { type: 'number' as const, description: 'Second number' },
        },
        required: ['a', 'b'],
      },
      execute: async (params: { a: number; b: number }) => ({
        success: true,
        data: { sum: params.a + params.b },
      }),
    };

    registry.register(customTool);

    const config: PardusAgentConfig = {
      spawnPath: process.cwd(),
      prompt: 'Use the custom calculator to add 15 and 27',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    };

    const testAgent = createPardusAgent(config, {
      verbose: true,
    });

    const result = await testAgent.execute(config);
    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
  });
});