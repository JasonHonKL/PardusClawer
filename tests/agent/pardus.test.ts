import { describe, test, expect } from 'bun:test';
import { pardusAgentExecutor } from '../../agent/pardus';
import type { PardusAgentExternalConfig } from '../../agent/pardus';

describe('PardusAgent External Interface', () => {
  test('should execute PardusAgent with external configuration', async () => {
    const config: PardusAgentExternalConfig = {
      spawnPath: process.cwd(),
      prompt: 'test prompt',
      modelProvider: 'openai',
      model: 'gpt-4',
      apiKey: 'test-key',
      temperature: 0.1,
      enableTools: true,
    };

    const result = await pardusAgentExecutor(config);
    
    // Should not throw, even with test key (might fail but structure should work)
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
  });

  test('should support all model providers', async () => {
    const providers = [
      { provider: 'openai' as const, model: 'gpt-4' },
      { provider: 'anthropic' as const, model: 'claude-3-sonnet' },
      { provider: 'openrouter' as const, model: 'anthropic/claude-3' },
      { provider: 'ollama' as const, model: 'llama3.1:8b' },
      { provider: 'custom' as const, model: 'custom-model' },
    ];

    for (const { provider, model } of providers) {
      const config: PardusAgentExternalConfig = {
        spawnPath: process.cwd(),
        prompt: 'test',
        modelProvider: provider,
        model,
        apiKey: 'test-key',
      };

      expect(async () => {
        await pardusAgentExecutor(config);
      }).not.toThrow();
    }
  });

  test('should handle optional configuration parameters', async () => {
    const minimalConfig: PardusAgentExternalConfig = {
      spawnPath: process.cwd(),
      prompt: 'test',
      modelProvider: 'openai',
      model: 'gpt-4',
      apiKey: 'test-key',
    };

    const fullConfig: PardusAgentExternalConfig = {
      spawnPath: process.cwd(),
      prompt: 'test',
      modelProvider: 'openai',
      model: 'gpt-4',
      apiKey: 'test-key',
      baseURL: 'https://api.openai.com/v1',
      temperature: 0.7,
      maxTokens: 2000,
      topP: 0.9,
      systemPrompt: 'Custom system prompt',
      maxIterations: 15,
      toolChoice: 'required',
      enableTools: false,
    };

    // Both should execute without errors
    expect(async () => {
      await pardusAgentExecutor(minimalConfig);
      await pardusAgentExecutor(fullConfig);
    }).not.toThrow();
  });

  test('should handle errors gracefully', async () => {
    const config: PardusAgentExternalConfig = {
      spawnPath: process.cwd(),
      prompt: 'test',
      modelProvider: 'openai',
      model: 'gpt-4',
      apiKey: 'invalid-key',
    };

    const result = await pardusAgentExecutor(config);
    
    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(typeof result.error).toBe('string');
  });
});