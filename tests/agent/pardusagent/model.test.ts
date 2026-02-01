import { describe, test, expect } from 'bun:test';
import { ModelFactory, type ModelConfig, type ChatMessage } from '../../../agent/pardusagent/model/index';

describe('Model System', () => {
  test('ModelFactory should create Ollama model', () => {
    const config: ModelConfig = {
      provider: 'ollama',
      model: 'llama2',
      baseURL: 'http://localhost:11434',
    };
    
    const model = ModelFactory.create(config);
    expect(model).toBeDefined();
    expect(model.chat).toBeInstanceOf(Function);
  });

  test('ModelFactory should create OpenAI model', () => {
    const config: ModelConfig = {
      provider: 'openai',
      apiKey: 'test-key',
      model: 'gpt-4',
    };
    
    const model = ModelFactory.create(config);
    expect(model).toBeDefined();
    expect(model.chat).toBeInstanceOf(Function);
  });

  test('ModelFactory should create OpenRouter model', () => {
    const config: ModelConfig = {
      provider: 'openrouter',
      apiKey: 'test-key',
      model: 'anthropic/claude-3-sonnet',
    };
    
    const model = ModelFactory.create(config);
    expect(model).toBeDefined();
    expect(model.chat).toBeInstanceOf(Function);
  });

  test('ModelFactory should create Anthropic model', () => {
    const config: ModelConfig = {
      provider: 'anthropic',
      apiKey: 'test-key',
      model: 'claude-3-sonnet-20240229',
    };
    
    const model = ModelFactory.create(config);
    expect(model).toBeDefined();
    expect(model.chat).toBeInstanceOf(Function);
  });

  test('ModelFactory should create Custom model', () => {
    const config: ModelConfig = {
      provider: 'custom',
      apiKey: 'test-key',
      baseURL: 'https://api.example.com',
      model: 'custom-model',
    };
    
    const model = ModelFactory.create(config);
    expect(model).toBeDefined();
    expect(model.chat).toBeInstanceOf(Function);
  });

  test('ModelFactory should throw error for missing OpenAI key', () => {
    const config: ModelConfig = {
      provider: 'openai',
      model: 'gpt-4',
    };
    
    expect(() => ModelFactory.create(config)).toThrow('OpenAI API key is required');
  });

  test('ModelFactory should throw error for missing custom API settings', () => {
    const config: ModelConfig = {
      provider: 'custom',
      model: 'custom-model',
    };
    
    expect(() => ModelFactory.create(config)).toThrow('Custom API requires both apiKey and baseURL');
  });

  test('Factory methods should create proper configs', () => {
    const ollamaConfig = ModelFactory.createOllamaConfig('llama2');
    expect(ollamaConfig.provider).toBe('ollama');
    expect(ollamaConfig.model).toBe('llama2');

    const openaiConfig = ModelFactory.createOpenAIConfig('key', 'gpt-4');
    expect(openaiConfig.provider).toBe('openai');
    expect(openaiConfig.apiKey).toBe('key');
    expect(openaiConfig.model).toBe('gpt-4');

    const customConfig = ModelFactory.createCustomConfig('key', 'https://api.com', 'model');
    expect(customConfig.provider).toBe('custom');
    expect(customConfig.apiKey).toBe('key');
    expect(customConfig.baseURL).toBe('https://api.com');
    expect(customConfig.model).toBe('model');
  });
});