import type { ModelConfig, ModelProvider, ModelExecutor, ToolDefinition } from './types';
import { OllamaModel } from './ollama';
import { OpenAIModel } from './openai';
import { OpenRouterModel } from './openrouter';
import { AnthropicModel } from './anthropic';
import { CustomModel } from './custom';

export class ModelFactory {
  static create(config: ModelConfig): ModelExecutor {
    switch (config.provider) {
      case 'ollama':
        return new OllamaModel(config.baseURL);
      
      case 'openai':
        if (!config.apiKey) {
          throw new Error('OpenAI API key is required');
        }
        return new OpenAIModel(config.apiKey, config.baseURL);
      
      case 'openrouter':
        if (!config.apiKey) {
          throw new Error('OpenRouter API key is required');
        }
        return new OpenRouterModel(config.apiKey, config.baseURL);
      
      case 'anthropic':
        if (!config.apiKey) {
          throw new Error('Anthropic API key is required');
        }
        return new AnthropicModel(config.apiKey, config.baseURL);
      
      case 'custom':
        if (!config.apiKey || !config.baseURL) {
          throw new Error('Custom API requires both apiKey and baseURL');
        }
        return new CustomModel(config.apiKey, config.baseURL);
      
      default:
        throw new Error(`Unsupported model provider: ${config.provider}`);
    }
  }

  static createWithTools(
    config: ModelConfig, 
    tools: any[], 
    toolChoice: 'auto' | 'required' | 'none' = 'auto'
  ): ModelExecutor {
    const configWithTools = {
      ...config,
      tools,
      toolChoice,
    };
    return this.create(configWithTools);
  }

  static createOllamaConfig(model: string, baseURL?: string): ModelConfig {
    return {
      provider: 'ollama',
      model,
      baseURL,
    };
  }

  static createOpenAIConfig(apiKey: string, model: string, baseURL?: string): ModelConfig {
    return {
      provider: 'openai',
      apiKey,
      model,
      baseURL,
    };
  }

  static createOpenRouterConfig(apiKey: string, model: string, baseURL?: string): ModelConfig {
    return {
      provider: 'openrouter',
      apiKey,
      model,
      baseURL,
    };
  }

  static createAnthropicConfig(apiKey: string, model: string, baseURL?: string): ModelConfig {
    return {
      provider: 'anthropic',
      apiKey,
      model,
      baseURL,
    };
  }

  static createCustomConfig(apiKey: string, baseURL: string, model: string): ModelConfig {
    return {
      provider: 'custom',
      apiKey,
      baseURL,
      model,
    };
  }
}

export * from './types';
export { OllamaModel, OpenAIModel, OpenRouterModel, AnthropicModel, CustomModel };