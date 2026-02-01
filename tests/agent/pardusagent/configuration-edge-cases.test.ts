import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { createPardusAgent } from '../../../agent/pardusagent/agent';
import type { PardusAgentConfig } from '../../../agent/pardusagent/agent';

describe('PardusAgent Configuration Edge Cases', () => {
  test('should handle minimal configuration', () => {
    const config: PardusAgentConfig = {
      spawnPath: '/',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    };

    expect(() => {
      createPardusAgent(config);
    }).not.toThrow();
  });

  test('should handle maximal configuration', () => {
    const config: PardusAgentConfig = {
      spawnPath: '/very/long/path/that/goes/deep/into/the/filesystem/and/contains/many/characters/and/testing/edge/cases/for/path/handling/in/the/filesystem',
      prompt: 'a'.repeat(100000), // 100KB prompt
      modelConfig: {
        provider: 'openai',
        apiKey: 'x'.repeat(1000), // Very long API key
        model: 'model-with-very-long-name-that-tests-edge-cases-for-model-name-handling',
        temperature: 2, // Beyond typical range
        maxTokens: 128000, // Maximum possible
        topP: 1, // Maximum
        tools: [], // Empty tools
        toolChoice: 'required',
      },
      systemPrompt: 'x'.repeat(50000), // 50KB system prompt
      maxIterations: 100, // High iteration count
    };

    expect(() => {
      createPardusAgent(config);
    }).not.toThrow();
  });

  test('should handle null and undefined values gracefully', () => {
    const configs = [
      {
        spawnPath: null as any,
        prompt: 'test',
        modelConfig: {
          provider: 'openai',
          apiKey: 'test-key',
          model: 'gpt-4',
        },
      },
      {
        spawnPath: '/test',
        prompt: undefined as any,
        modelConfig: {
          provider: 'openai',
          apiKey: 'test-key',
          model: 'gpt-4',
        },
      },
      {
        spawnPath: '/test',
        prompt: 'test',
        modelConfig: {
          provider: 'openai',
          apiKey: null as any,
          model: 'gpt-4',
        },
      },
      {
        spawnPath: '/test',
        prompt: 'test',
        modelConfig: {
          provider: 'openai',
          apiKey: 'test-key',
          model: null as any,
        },
      },
    ];

    configs.forEach((config, index) => {
      expect(() => {
        createPardusAgent(config);
      }).not.toThrow();
    });
  });

  test('should handle empty and whitespace strings', () => {
    const configs = [
      {
        spawnPath: '',
        prompt: 'test',
        modelConfig: {
          provider: 'openai',
          apiKey: 'test-key',
          model: 'gpt-4',
        },
      },
      {
        spawnPath: '/test',
        prompt: '',
        modelConfig: {
          provider: 'openai',
          apiKey: 'test-key',
          model: 'gpt-4',
        },
      },
      {
        spawnPath: '/test',
        prompt: '  \n\t  ',  // Whitespace only
        modelConfig: {
          provider: 'openai',
          apiKey: 'test-key',
          model: 'gpt-4',
        },
      },
      {
        spawnPath: '/test',
        prompt: 'test',
        modelConfig: {
          provider: 'openai',
          apiKey: 'test-key',
          model: '',
        },
      },
    ];

    configs.forEach((config, index) => {
      expect(() => {
        const agent = createPardusAgent(config);
        expect(agent).toBeDefined();
      }).not.toThrow();
    });
  });

  test('should handle extreme numeric values', () => {
    const configs = [
      {
        spawnPath: '/test',
        prompt: 'test',
        modelConfig: {
          provider: 'openai',
          apiKey: 'test-key',
          model: 'gpt-4',
          temperature: Number.MAX_SAFE_INTEGER,
        },
      },
      {
        spawnPath: '/test',
        prompt: 'test',
        modelConfig: {
          provider: 'openai',
          apiKey: 'test-key',
          model: 'gpt-4',
          temperature: Number.MIN_SAFE_INTEGER,
        },
      },
      {
        spawnPath: '/test',
        prompt: 'test',
        modelConfig: {
          provider: 'openai',
          apiKey: 'test-key',
          model: 'gpt-4',
          maxTokens: Number.MAX_SAFE_INTEGER,
        },
      },
      {
        spawnPath: '/test',
        prompt: 'test',
        modelConfig: {
          provider: 'openai',
          apiKey: 'test-key',
          model: 'gpt-4',
          maxIterations: Number.MAX_SAFE_INTEGER,
        },
      },
    ];

    configs.forEach((config, index) => {
      expect(() => {
        createPardusAgent(config);
      }).not.toThrow();
    });
  });

  test('should handle special characters in configuration', () => {
    const config: PardusAgentConfig = {
      spawnPath: '/path/with/特殊字符/and/émojis/🚀/and/symbols/©/™/®',
      prompt: 'Test with "quotes" and \'apostrophes\' and \\n\\t\\r escapes',
      modelConfig: {
        provider: 'openai',
        apiKey: 'key-with-特殊字符-🔑-and-symbols',
        model: 'model/with/特殊字符/🤖/and/symbols',
      },
      systemPrompt: 'System prompt with émojis 🧪 and 特殊字符 and © symbols',
    };

    expect(() => {
      createPardusAgent(config);
    }).not.toThrow();
  });

  test('should handle various data types', () => {
    const configs = [
      {
        spawnPath: 123 as any, // Number instead of string
        prompt: 'test',
        modelConfig: {
          provider: 'openai',
          apiKey: 'test-key',
          model: 'gpt-4',
        },
      },
      {
        spawnPath: '/test',
        prompt: 456 as any, // Number instead of string
        modelConfig: {
          provider: 'openai',
          apiKey: 'test-key',
          model: 'gpt-4',
        },
      },
      {
        spawnPath: '/test',
        prompt: 'test',
        modelConfig: {
          provider: 'openai',
          apiKey: true as any, // Boolean instead of string
          model: 'gpt-4',
        },
      },
      {
        spawnPath: '/test',
        prompt: 'test',
        modelConfig: {
          provider: 'openai',
          apiKey: 'test-key',
          model: [] as any, // Array instead of string
        },
      },
    ];

    configs.forEach((config, index) => {
      // Some may cause type errors, but should handle gracefully
      const agent = createPardusAgent(config);
      expect(agent).toBeDefined();
    });
  });

  test('should handle circular references', () => {
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

    // Try to create circular reference
    const circularRef = agent;
    (agent as any).self = circularRef;

    expect(() => {
      agent.execute(config);
    }).not.toThrow();
  });

  test('should handle prototype pollution', () => {
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: 'test',
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    };

    // Attempt prototype pollution
    (Object.prototype as any).polluted = 'polluted';
    (Array.prototype as any).polluted = 'polluted';

    expect(() => {
      createPardusAgent(config);
    }).not.toThrow();

    // Cleanup
    delete (Object.prototype as any).polluted;
    delete (Array.prototype as any).polluted;
  });

  test('should handle memory exhaustion scenarios', () => {
    const largeString = 'x'.repeat(1000000); // 1MB string
    const config: PardusAgentConfig = {
      spawnPath: '/test',
      prompt: largeString,
      modelConfig: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      },
      systemPrompt: largeString,
    };

    expect(() => {
      createPardusAgent(config);
    }).not.toThrow();
  });
});