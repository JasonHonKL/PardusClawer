import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from 'bun:test';
import { createPardusAgent } from '../../../agent/pardusagent/agent';
import { ToolFactory } from '../../../agent/pardusagent/tool/index';
import { ModelFactory } from '../../../agent/pardusagent/model/index';
import type { PardusAgentConfig } from '../../../agent/pardusagent/agent';
import type { ToolDefinition } from '../../../agent/pardusagent/tool/types';

describe('PardusAgent Edge Cases', () => {
  let agent: any;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    if (agent) {
      agent.clearConversation();
    }
  });

  test('should handle empty prompt', async () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: '',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    };

    agent = createPardusAgent(config);
    
    const result = await agent.execute(config);
    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
  });

  test('should handle very long prompt', async () => {
    const longPrompt = 'a'.repeat(10000);
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: longPrompt,
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        maxTokens: 100,
      },
    };

    agent = createPardusAgent(config);
    
    const result = await agent.execute(config);
    expect(result.success).toBe(true);
  });

  test('should handle special characters in prompt', async () => {
    const specialPrompt = 'Test with émojis 🚀 and 特殊字符 and © symbols and "quotes" and \\n\\t escapes';
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: specialPrompt,
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    };

    agent = createPardusAgent(config);
    
    const result = await agent.execute(config);
    expect(result.success).toBe(true);
  });

  test('should handle unicode characters', async () => {
    const unicodePrompt = '测试中文 🧪 العربية русский 日本語 한국어';
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: unicodePrompt,
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    };

    agent = createPardusAgent(config);
    
    const result = await agent.execute(config);
    expect(result.success).toBe(true);
  });

  test('should handle concurrent execution requests', async () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'Simple test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    };

    agent = createPardusAgent(config);
    
    // Execute multiple requests concurrently
    const promises = Array(5).fill(null).map(() => agent.execute(config));
    const results = await Promise.all(promises);
    
    results.forEach(result => {
      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
    });
  });

  test('should handle invalid temperature values', async () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        temperature: -0.5, // Invalid but should be handled gracefully
      },
    };

    agent = createPardusAgent(config);
    
    expect(() => {
      agent.execute(config);
    }).not.toThrow();
  });

  test('should handle zero maxTokens', async () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        maxTokens: 0, // Edge case
      },
    };

    agent = createPardusAgent(config);
    
    const result = await agent.execute(config);
    expect(result.success).toBe(true);
  });

  test('should handle null/undefined optional parameters', async () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        temperature: undefined,
        maxTokens: undefined,
        topP: undefined,
      },
    };

    agent = createPardusAgent(config);
    
    expect(() => {
      agent.execute(config);
    }).not.toThrow();
  });

  test('should handle very long system prompt', async () => {
    const longSystemPrompt = 'You are a helpful assistant. '.repeat(1000);
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
      systemPrompt: longSystemPrompt,
    };

    agent = createPardusAgent(config);
    
    const messages = agent.getMessages();
    expect(messages[0].content).toBe(longSystemPrompt);
    
    const result = await agent.execute(config);
    expect(result.success).toBe(true);
  });
});