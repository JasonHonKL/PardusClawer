import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { ModelFactory } from '../../../agent/pardusagent/model/index';
import type { ModelConfig } from '../../../agent/pardusagent/model/types';

describe('PardusAgent Model Provider Edge Cases', () => {
  test('should handle OpenAI with various model names', () => {
    const models = [
      'gpt-4',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
    ];

    models.forEach(model => {
      const config: ModelConfig = {
        provider: 'openai',
        apiKey: 'test-key',
        model,
      };

      expect(() => {
        ModelFactory.create(config);
      }).not.toThrow();
    });
  });

  test('should handle Anthropic with various model names', () => {
    const models = [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ];

    models.forEach(model => {
      const config: ModelConfig = {
        provider: 'anthropic',
        apiKey: 'test-key',
        model,
      };

      expect(() => {
        ModelFactory.create(config);
      }).not.toThrow();
    });
  });

  test('should handle OpenRouter with various models', () => {
    const models = [
      'anthropic/claude-3-opus',
      'openai/gpt-4-turbo',
      'google/gemini-pro',
      'meta-llama/llama-3-70b-instruct',
    ];

    models.forEach(model => {
      const config: ModelConfig = {
        provider: 'openrouter',
        apiKey: 'test-key',
        model,
      };

      expect(() => {
        ModelFactory.create(config);
      }).not.toThrow();
    });
  });

  test('should handle Ollama with various models', () => {
    const models = [
      'llama3.1:8b',
      'llama3.1:70b',
      'qwen2.5:7b',
      'mistral:7b',
      'codellama:7b',
    ];

    models.forEach(model => {
      const config: ModelConfig = {
        provider: 'ollama',
        model,
      };

      expect(() => {
        ModelFactory.create(config);
      }).not.toThrow();
    });
  });

  test('should handle custom API with various configs', () => {
    const configs = [
      {
        provider: 'custom' as const,
        apiKey: 'key1',
        baseURL: 'https://api.example.com/v1',
        model: 'custom-model-1',
      },
      {
        provider: 'custom' as const,
        apiKey: 'key2',
        baseURL: 'https://api.other.com/v1',
        model: 'custom-model-2',
      },
    ];

    configs.forEach(config => {
      expect(() => {
        ModelFactory.create(config);
      }).not.toThrow();
    });
  });

  test('should handle extreme temperature values', () => {
    const temperatures = [-2, -1, -0.5, 0, 0.5, 1, 1.5, 2];

    temperatures.forEach(temperature => {
      const config: ModelConfig = {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        temperature,
      };

      expect(() => {
        ModelFactory.create(config);
      }).not.toThrow();
    });
  });

  test('should handle extreme token limits', () => {
    const tokenLimits = [1, 10, 100, 1000, 4000, 8000, 128000];

    tokenLimits.forEach(maxTokens => {
      const config: ModelConfig = {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        maxTokens,
      };

      expect(() => {
        ModelFactory.create(config);
      }).not.toThrow();
    });
  });

  test('should handle invalid base URLs gracefully', () => {
    const invalidURLs = [
      'not-a-url',
      'ftp://invalid-protocol.com',
      'https://',
      '',
      null,
      undefined,
    ];

    invalidURLs.forEach(baseURL => {
      const config: ModelConfig = {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        baseURL: baseURL as any,
      };

      expect(() => {
        ModelFactory.create(config);
      }).not.toThrow();
    });
  });

  test('should handle tool configurations with all providers', () => {
    const providers = ['openai', 'anthropic', 'openrouter', 'ollama', 'custom'] as const;
    const tools = [
      {
        name: 'test_tool',
        description: 'Test tool',
        parameters: {
          type: 'object' as const,
          properties: {
            input: { type: 'string' as const, description: 'Test input' },
          },
          required: ['input'],
        },
      },
    ];

    providers.forEach(provider => {
      const config: ModelConfig = {
        provider,
        apiKey: 'test-key',
        model: 'test-model',
        tools,
        toolChoice: 'auto' as const,
      };

      expect(() => {
        ModelFactory.createWithTools(config, tools, 'auto');
      }).not.toThrow();
    });
  });

  test('should handle all tool choice modes', () => {
    const toolChoices = ['auto', 'required', 'none'] as const;

    toolChoices.forEach(toolChoice => {
      const config: ModelConfig = {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        toolChoice,
      };

      expect(() => {
        ModelFactory.create(config);
      }).not.toThrow();
    });
  });

  test('should handle missing required API keys', () => {
    const providers = [
      { provider: 'openai' as const, requiresKey: true },
      { provider: 'anthropic' as const, requiresKey: true },
      { provider: 'openrouter' as const, requiresKey: true },
      { provider: 'ollama' as const, requiresKey: false },
      { provider: 'custom' as const, requiresKey: true },
    ];

    providers.forEach(({ provider, requiresKey }) => {
      const config: ModelConfig = {
        provider,
        model: 'test-model',
      };

      if (requiresKey) {
        expect(() => {
          ModelFactory.create(config);
        }).toThrow();
      } else {
        expect(() => {
          ModelFactory.create(config);
        }).not.toThrow();
      }
    });
  });

  test('should handle concurrent model creation', async () => {
    const config: ModelConfig = {
      provider: 'openai',
      apiKey: 'test-key',
      model: 'gpt-4',
    };

    // Create multiple models concurrently
    const promises = Array(10).fill(null).map(() => 
      Promise.resolve(ModelFactory.create(config))
    );

    const models = await Promise.all(promises);
    expect(models).toHaveLength(10);
    models.forEach(model => {
      expect(model).toBeDefined();
      expect(model.chat).toBeInstanceOf(Function);
    });
  });
});