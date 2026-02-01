import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from 'bun:test';
import { createPardusAgent } from '../../../agent/pardusagent/agent';
import { pardusAgentExecutor } from '../../../agent/pardus';
import type { PardusAgentConfig } from '../../../agent/pardusagent/agent';
import type { PardusAgentExternalConfig } from '../../../agent/pardus';

describe('PardusAgent Performance Tests', () => {
  let startTime: number;

  beforeAll(() => {
    process.env.OPENAI_API_KEY = 'test-key';
  });

  beforeEach(() => {
    startTime = Date.now();
  });

  test('should initialize quickly', () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    };

    const initTime = Date.now();
    const agent = createPardusAgent(config);
    const initDuration = Date.now() - initTime;

    expect(agent).toBeDefined();
    expect(initDuration).toBeLessThan(100); // Should initialize in <100ms
  });

  test('should handle large conversations efficiently', async () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    };

    const agent = createPardusAgent(config);

    // Add many messages to conversation
    const messageCount = 1000;
    for (let i = 0; i < messageCount; i++) {
      agent.addMessage({
        role: 'assistant',
        content: `Message ${i} with some reasonable length content that simulates a real conversation. This message contains multiple sentences and should represent a typical assistant response in a conversation about programming, development, or general topics. The content is designed to test the performance of the message handling system when dealing with large conversation histories.`
      });
    }

    const messages = agent.getMessages();
    expect(messages.length).toBeGreaterThan(messageCount);

    const operationTime = Date.now() - startTime;
    expect(operationTime).toBeLessThan(1000); // Should handle 1000 messages in <1s
  });

  test('should clear conversation efficiently', async () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    };

    const agent = createPardusAgent(config);

    // Fill with messages
    for (let i = 0; i < 100; i++) {
      agent.addMessage({ role: 'assistant', content: `Message ${i}` });
    }

    expect(agent.getMessages().length).toBe(101); // 1 system + 100 added

    // Test clear performance
    const clearStart = Date.now();
    agent.clearConversation();
    const clearDuration = Date.now() - clearStart;

    expect(clearDuration).toBeLessThan(50); // Should clear in <50ms
    expect(agent.getMessages().length).toBe(0);
  });

  test('should handle multiple executions efficiently', async () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    };

    const agent = createPardusAgent(config);

    // Execute multiple times
    const executionCount = 50;
    const promises: Promise<any>[] = [];

    for (let i = 0; i < executionCount; i++) {
      promises.push(agent.execute({
        ...config,
        prompt: `Test prompt ${i}`,
      }));
    }

    const executionStart = Date.now();
    await Promise.all(promises);
    const executionDuration = Date.now() - executionStart;

    expect(promises).toHaveLength(executionCount);
    // Should handle 50 concurrent executions reasonably (allowing for mock delays)
    expect(executionDuration).toBeLessThan(10000); // <10s for 50 executions
  });

  test('should handle tool registry lookups efficiently', async () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    };

    const agent = createPardusAgent(config);
    const registry = agent.getToolRegistry();

    // Perform many lookups
    const lookupCount = 1000;
    const lookupStart = Date.now();

    for (let i = 0; i < lookupCount; i++) {
      const tools = registry.list();
      const definitions = registry.getToolDefinitions();
      expect(tools).toBeDefined();
      expect(definitions).toBeDefined();
    }

    const lookupDuration = Date.now() - lookupStart;
    expect(lookupDuration).toBeLessThan(500); // Should handle 1000 lookups in <500ms
  });

  test('should handle external interface efficiently', async () => {
    const config: PardusAgentExternalConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelProvider: 'openai',
      model: 'gpt-4',
      apiKey: 'test-key',
    };

    // Test external executor performance
    const executionCount = 20;
    const promises: Promise<any>[] = [];

    for (let i = 0; i < executionCount; i++) {
      promises.push(pardusAgentExecutor({
        ...config,
        prompt: `Test ${i}`,
      }));
    }

    const externalStart = Date.now();
    const results = await Promise.all(promises);
    const externalDuration = Date.now() - externalStart;

    expect(results).toHaveLength(executionCount);
    results.forEach(result => {
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
    expect(externalDuration).toBeLessThan(5000); // Should handle 20 executions in <5s
  });

  test('should handle memory efficiently', async () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    };

    const agent = createPardusAgent(config);

    // Test memory usage with large data
    const largeData = 'x'.repeat(10000); // 10KB string
    
    for (let i = 0; i < 100; i++) {
      agent.addMessage({
        role: 'assistant',
        content: `${largeData} ${i}`,
      });
    }

    const messages = agent.getMessages();
    expect(messages.length).toBe(101);

    // Clear and test memory
    agent.clearConversation();
    expect(agent.getMessages().length).toBe(0);

    // Should handle large data operations efficiently
    const memoryTestDuration = Date.now() - startTime;
    expect(memoryTestDuration).toBeLessThan(2000); // Should handle in <2s
  });
});

describe('PardusAgent Load Tests', () => {
  test('should handle rapid successive creation and destruction', async () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    };

    const iterations = 50;
    const agents: any[] = [];

    // Create many agents rapidly
    for (let i = 0; i < iterations; i++) {
      const agent = createPardusAgent({
        ...config,
        prompt: `Test ${i}`,
      });
      agents.push(agent);
    }

    expect(agents).toHaveLength(iterations);

    // All should be properly initialized
    agents.forEach(agent => {
      expect(agent).toBeDefined();
      expect(agent.getAvailableTools).toBeDefined();
      expect(agent.getToolRegistry).toBeDefined();
    });

    // Cleanup
    agents.forEach(agent => {
      agent.clearConversation();
    });
  });

  test('should handle high concurrency load', async () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    };

    const concurrency = 20;
    const operationsPerAgent = 5;
    const promises: Promise<any>[] = [];

    // Create multiple agents and run operations concurrently
    for (let i = 0; i < concurrency; i++) {
      const agent = createPardusAgent(config);
      
      for (let j = 0; j < operationsPerAgent; j++) {
        promises.push(agent.execute({
          ...config,
          prompt: `Agent ${i} Operation ${j}`,
        }));
      }
    }

    const totalOperations = concurrency * operationsPerAgent;
    const loadStart = Date.now();
    const results = await Promise.all(promises);
    const loadDuration = Date.now() - loadStart;

    expect(results).toHaveLength(totalOperations);
    results.forEach(result => {
      expect(result).toBeDefined();
    });
    expect(loadDuration).toBeLessThan(15000); // Should handle 100 operations in <15s
  });
});