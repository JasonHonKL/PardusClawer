import type { AgentConfig, AgentResult, AgentExecutor } from '../types';
import type { ModelConfig } from './model/types';
import { ModelFactory } from './model/index';
import { ToolFactory } from './tool/index';
import type { PardusAgentConfig } from './pardusagent/agent';

export interface PardusAgentExternalConfig extends AgentConfig {
  modelProvider: 'openai' | 'anthropic' | 'openrouter' | 'ollama' | 'custom';
  model: string;
  apiKey?: string;
  baseURL?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  systemPrompt?: string;
  maxIterations?: number;
  toolChoice?: 'auto' | 'required' | 'none';
  enableTools?: boolean;
}

export const pardusAgentExecutor: AgentExecutor = async (config: PardusAgentExternalConfig): Promise<AgentResult> => {
  try {
    // Extract model configuration
    const modelConfig: ModelConfig = {
      provider: config.modelProvider,
      model: config.model,
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      topP: config.topP,
    };

    // Create PardusAgent configuration
    const pardusConfig: PardusAgentConfig = {
      spawnPath: config.spawnPath,
      prompt: config.prompt,
      modelConfig,
      systemPrompt: config.systemPrompt,
      maxIterations: config.maxIterations,
      toolChoice: config.toolChoice,
    };

    // Import PardusAgent dynamically to avoid circular dependencies
    const { createPardusAgent } = await import('./pardusagent/agent');
    const agent = createPardusAgent(pardusConfig, {
      enableTools: config.enableTools ?? true,
      verbose: false,
    });

    // Execute the agent
    const result = await agent.execute({
      spawnPath: config.spawnPath,
      prompt: config.prompt,
    });

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};