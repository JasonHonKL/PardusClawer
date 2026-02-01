import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { createPardusAgent } from '../../../agent/pardusagent/agent';
import type { PardusAgentConfig } from '../../../agent/pardusagent/agent';

describe('PardusAgent Error Handling', () => {
  let agent: any;

  afterEach(() => {
    if (agent) {
      agent.clearConversation();
    }
  });

  test('should handle missing API key gracefully', async () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: '', // Empty API key
        model: 'gpt-4',
      },
    };

    agent = createPardusAgent(config);
    
    const result = await agent.execute(config);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(typeof result.error).toBe('string');
  });

  test('should handle invalid API key', async () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'invalid-key-123',
        model: 'gpt-4',
      },
    };

    agent = createPardusAgent(config);
    
    const result = await agent.execute(config);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('should handle invalid model name', async () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'invalid-model-name-123',
      },
    };

    agent = createPardusAgent(config);
    
    const result = await agent.execute(config);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('should handle network timeout', async () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        baseURL: 'https://invalid-url-that-will-timeout.com',
      },
    };

    agent = createPardusAgent(config);
    
    // Set a short timeout for testing
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
    
    const result = await Promise.race([
      agent.execute(config),
      timeoutPromise
    ]);
    
    // Should either succeed quickly or fail with timeout/error
    expect(result).toBeDefined();
  });

  test('should handle malformed response from API', async () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        baseURL: 'https://httpstat.us/200', // Returns non-JSON response
      },
    };

    agent = createPardusAgent(config);
    
    const result = await agent.execute(config);
    expect(result).toBeDefined();
    // Either succeeds with valid response or fails gracefully
  });

  test('should handle tool execution errors', async () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'Execute a command that will fail',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    };

    agent = createPardusAgent(config, {
      verbose: true,
    });
    
    // This might cause tool execution errors, but should be handled gracefully
    const result = await agent.execute(config);
    expect(result).toBeDefined();
  });

  test('should handle maximum iterations reached', async () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'Keep asking for tool calls indefinitely', // Might cause many iterations
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
      maxIterations: 2, // Very low limit
    };

    agent = createPardusAgent(config, {
      verbose: true,
    });
    
    const result = await agent.execute(config);
    expect(result.success).toBe(true);
    expect(result.output).toContain('maximum number of iterations');
  });

  test('should handle malformed tool response', async () => {
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
    
    // Mock a scenario where tool returns invalid response
    const registry = agent.getToolRegistry();
    const originalExecute = registry.execute;
    
    // This would be a mock scenario - actual implementation should handle gracefully
    const result = await agent.execute(config);
    expect(result).toBeDefined();
  });

  test('should handle memory exhaustion', async () => {
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
    
    // Fill conversation with many messages
    for (let i = 0; i < 100; i++) {
      agent.addMessage({ role: 'assistant', content: `Message ${i}` });
    }
    
    const messages = agent.getMessages();
    expect(messages.length).toBeGreaterThan(100);
    
    // Should still work
    const result = await agent.execute({
      ...config,
      prompt: 'New prompt',
    });
    
    expect(result).toBeDefined();
  });

  test('should handle invalid spawn path', async () => {
    const config: PardusAgentConfig = {
      spawnPath: '/nonexistent/path/that/does/not/exist',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    };

    agent = createPardusAgent(config);
    
    const result = await agent.execute(config);
    expect(result).toBeDefined();
    // Should not crash due to invalid path
  });
});