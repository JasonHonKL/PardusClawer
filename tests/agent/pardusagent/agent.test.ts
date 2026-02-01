import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { PardusAgent, createPardusAgent } from '../../../agent/pardusagent/agent';
import type { PardusAgentConfig } from '../../../agent/pardusagent/agent';
import { ModelFactory } from '../../../agent/pardusagent/model/index';

describe('PardusAgent', () => {
  let agent: PardusAgent;

  beforeEach(() => {
    // Mock environment variable for testing
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    if (agent) {
      agent.clearConversation();
    }
  });

  test('should create PardusAgent with default configuration', () => {
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
    expect(agent.getAvailableTools()).toHaveLength(6); // bash, file, search, browser, git, network
  });

  test('should create PardusAgent with custom system prompt', () => {
    const customPrompt = 'You are a custom assistant';
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
      systemPrompt: customPrompt,
    };

    agent = createPardusAgent(config);
    expect(agent).toBeDefined();
    
    const messages = agent.getMessages();
    expect(messages[0].content).toBe(customPrompt);
  });

  test('should support different model providers', () => {
    const providers = ['openai', 'openrouter', 'anthropic', 'ollama'] as const;
    
    providers.forEach(provider => {
      const config: PardusAgentConfig = {
        spawnPath: '/test',
        prompt: 'test',
        modelConfig: {
          provider,
          apiKey: 'test-key',
          model: 'test-model',
        },
      };

      expect(() => {
        agent = createPardusAgent(config);
      }).not.toThrow();
    });
  });

  test('should handle tool options', () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    };

    const options = {
      enableTools: false,
      verbose: true,
      toolChoice: 'none' as const,
    };

    agent = createPardusAgent(config, options);
    expect(agent).toBeDefined();
  });

  test('should manage conversation state', () => {
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
    
    // Check initial state (only system message)
    let messages = agent.getMessages();
    expect(messages).toHaveLength(1); // system only
    expect(messages[0].role).toBe('system');
    
    // Add a message
    agent.addMessage({ role: 'assistant', content: 'Hello!' });
    messages = agent.getMessages();
    expect(messages).toHaveLength(2);
    expect(messages[1].content).toBe('Hello!');
    
    // Clear conversation
    agent.clearConversation();
    messages = agent.getMessages();
    expect(messages).toHaveLength(0);
  });

  test('should provide access to tool registry', () => {
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
    const toolRegistry = agent.getToolRegistry();
    expect(toolRegistry).toBeDefined();
    expect(toolRegistry.list()).toContain('bash');
    expect(toolRegistry.list()).toContain('file');
  });

  test('should work with tool choice options', () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
      toolChoice: 'required',
    };

    agent = createPardusAgent(config);
    expect(agent).toBeDefined();
  });
});