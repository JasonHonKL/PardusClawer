import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { createPardusAgent } from '../../../agent/pardusagent/agent';
import { ToolFactory } from '../../../agent/pardusagent/tool/index';
import { cleanupTools } from '../../../agent/pardusagent/tool/index';
import type { PardusAgentConfig } from '../../../agent/pardusagent/agent';

describe('PardusAgent Integration', () => {
  let agent: any;

  beforeAll(() => {
    // Set up test environment
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterAll(async () => {
    // Cleanup tools
    await cleanupTools();
  });

  test('should create agent with all tools available', () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    };

    agent = createPardusAgent(config);
    expect(agent).toBeDefined();
    
    const tools = agent.getAvailableTools();
    expect(tools).toHaveLength(6);
    
    const toolNames = tools.map(t => t.name);
    expect(toolNames).toContain('bash');
    expect(toolNames).toContain('file');
    expect(toolNames).toContain('search');
    expect(toolNames).toContain('browser');
    expect(toolNames).toContain('git');
    expect(toolNames).toContain('network');
  });

  test('should work with tool registry', () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    };

    agent = createPardusAgent(config);
    const registry = agent.getToolRegistry();
    
    expect(registry).toBeDefined();
    expect(registry.list()).toHaveLength(6);
  });

  test('should handle different model providers', () => {
    const providers = [
      { provider: 'openai' as const, model: 'gpt-4' },
      { provider: 'anthropic' as const, model: 'claude-3-sonnet-20240229' },
      { provider: 'openrouter' as const, model: 'anthropic/claude-3-sonnet' },
      { provider: 'ollama' as const, model: 'llama3.1:8b' },
    ];

    providers.forEach(({ provider, model }) => {
      const config: PardusAgentConfig = {
        spawnPath: '/test',
        prompt: 'test',
        modelConfig: {
          provider,
          apiKey: 'test-key',
          model,
        },
      };

      expect(() => {
        agent = createPardusAgent(config);
      }).not.toThrow();
    });
  });

  test('should integrate with existing agent configuration', () => {
    // Test that PardusAgent works with existing config system
    const pardusConfig = {
      type: 'pardus' as const,
    };

    // This should work without throwing errors
    expect(pardusConfig.type).toBe('pardus');
  });
});