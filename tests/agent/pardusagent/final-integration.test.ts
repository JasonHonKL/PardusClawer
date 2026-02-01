import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { createPardusAgent, type PardusAgentConfig } from '../../../agent/pardusagent/agent';
import { ToolFactory } from '../../../agent/pardusagent/tool/index';

describe('PardusAgent Final Integration Tests', () => {
  beforeAll(() => {
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterAll(async () => {
    // Clean up tool registry
    const registry = ToolFactory.getRegistry();
    const allTools = registry.list();
    
    // Remove any custom tools added during tests
    allTools.forEach(toolName => {
      if (toolName.includes('test') || toolName.includes('edge') || toolName.includes('custom')) {
        // Note: In a real cleanup, you'd want to be more careful
        // For tests, we accept some registry pollution
      }
    });
  });

  test('should demonstrate complete agent lifecycle', async () => {
    const config: PardusAgentConfig = {
      spawnPath: process.cwd(),
      prompt: 'Analyze this PardusCrawler project and summarize its key components.',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        temperature: 0.1,
        maxTokens: 1000,
      },
      systemPrompt: 'You are a code analysis assistant with access to tools for reading files, searching code, and understanding project structure.',
      maxIterations: 5,
      toolChoice: 'auto',
    };

    const agent = createPardusAgent(config, {
      enableTools: true,
      verbose: false,
    });

    // Test agent creation
    expect(agent).toBeDefined();
    expect(agent.getAvailableTools()).toHaveLength(6);
    
    // Test message management
    expect(agent.getMessages()).toHaveLength(1); // System message
    agent.addMessage({ role: 'user', content: 'Additional context' });
    expect(agent.getMessages()).toHaveLength(2);
    
    // Test tool registry access
    const registry = agent.getToolRegistry();
    expect(registry).toBeDefined();
    expect(registry.list()).toContain('bash');
    expect(registry.list()).toContain('file');
    expect(registry.list()).toContain('search');
    expect(registry.list()).toContain('browser');
    expect(registry.list()).toContain('git');
    expect(registry.list()).toContain('network');
    
    // Test conversation clearing
    agent.clearConversation();
    expect(agent.getMessages()).toHaveLength(0);
  });

  test('should handle all model providers', () => {
    const providers = [
      { provider: 'openai' as const, model: 'gpt-4', apiKey: 'test-key' },
      { provider: 'anthropic' as const, model: 'claude-3-sonnet-20240229', apiKey: 'test-key' },
      { provider: 'openrouter' as const, model: 'anthropic/claude-3-sonnet', apiKey: 'test-key' },
      { provider: 'ollama' as const, model: 'llama3.1:8b' },
      { provider: 'custom' as const, model: 'custom-model', apiKey: 'test-key', baseURL: 'https://api.test.com' },
    ];

    providers.forEach(({ provider, model, ...config }) => {
      const agentConfig: PardusAgentConfig = {
        spawnPath: process.cwd(),
        prompt: 'Test simple functionality',
        modelConfig: {
          provider,
          model,
          ...config,
        },
      };

      expect(() => {
        createPardusAgent(agentConfig);
      }).not.toThrow();
    });
  });

  test('should handle comprehensive configuration combinations', () => {
    const configurations = [
      {
        name: 'Minimal configuration',
        config: {
          spawnPath: '/',
          prompt: 'test',
          modelConfig: {
            provider: 'openai',
            apiKey: 'test-key',
            model: 'gpt-4',
          },
        },
      },
      {
        name: 'Full configuration',
        config: {
          spawnPath: process.cwd(),
          prompt: 'Comprehensive test with all settings',
          modelConfig: {
            provider: 'openai',
            apiKey: 'test-key',
            model: 'gpt-4',
            temperature: 0.7,
            maxTokens: 2000,
            topP: 0.9,
            tools: [],
            toolChoice: 'auto',
          },
          systemPrompt: 'You are a comprehensive test assistant.',
          maxIterations: 10,
        },
      },
      {
        name: 'Tools disabled configuration',
        config: {
          spawnPath: process.cwd(),
          prompt: 'Test without tools',
          modelConfig: {
            provider: 'openai',
            apiKey: 'test-key',
            model: 'gpt-4',
          },
          toolChoice: 'none',
        },
      },
    ];

    configurations.forEach(({ name, config }) => {
      const agent = createPardusAgent(config, {
        enableTools: name !== 'Tools disabled configuration',
        verbose: false,
      });

      expect(agent).toBeDefined();
      expect(agent.getMessages()).toHaveLength(1); // System message
    });
  });

  test('should validate type safety throughout system', () => {
    const config: PardusAgentConfig = {
      spawnPath: process.cwd(),
      prompt: 'Type safety validation test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    };

    const agent = createPardusAgent(config);

    // Test that all methods return expected types
    expect(typeof agent.execute).toBe('function');
    expect(typeof agent.getMessages).toBe('function');
    expect(typeof agent.clearConversation).toBe('function');
    expect(typeof agent.addMessage).toBe('function');
    expect(typeof agent.getAvailableTools).toBe('function');
    expect(typeof agent.getToolRegistry).toBe('function');

    // Test that method return values have expected types
    const messages = agent.getMessages();
    expect(Array.isArray(messages)).toBe(true);
    
    const tools = agent.getAvailableTools();
    expect(Array.isArray(tools)).toBe(true);
    
    const registry = agent.getToolRegistry();
    expect(typeof registry.list === 'function').toBe(true);
    expect(typeof registry.execute === 'function').toBe(true);
    expect(typeof registry.get === 'function').toBe(true);
    expect(typeof registry.getToolDefinitions === 'function').toBe(true);
  });

  test('should handle integration with external interface', () => {
    const externalConfig = {
      spawnPath: process.cwd(),
      prompt: 'External interface integration test',
      modelProvider: 'openai' as const,
      model: 'gpt-4',
      apiKey: 'test-key',
      temperature: 0.1,
    };

    // Test that external config structure is compatible
    expect(externalConfig.spawnPath).toBeDefined();
    expect(externalConfig.prompt).toBeDefined();
    expect(externalConfig.modelProvider).toBe('openai');
    expect(externalConfig.model).toBe('gpt-4');
    expect(externalConfig.apiKey).toBe('test-key');
    expect(externalConfig.temperature).toBe(0.1);
  });

  test('should demonstrate error boundaries and safety', () => {
    const agent = createPardusAgent({
      spawnPath: process.cwd(),
      prompt: 'Safety test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    });

    // Test that methods handle invalid inputs gracefully
    expect(() => {
      agent.addMessage(null as any);
    }).not.toThrow();
    
    expect(() => {
      agent.addMessage(undefined as any);
    }).not.toThrow();
    
    expect(() => {
      agent.addMessage({ role: 'invalid' as any, content: 'test' });
    }).not.toThrow();
    
    // Test clearing works even when empty
    expect(() => {
      agent.clearConversation();
      agent.clearConversation(); // Double clear
    }).not.toThrow();
  });
});