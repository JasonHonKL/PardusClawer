export type AgentType = 'claude-code' | 'opencode' | 'cursor' | 'pardus';

export interface PardusConfig {
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

export interface Config {
  heartbeat: number;
  agentType: AgentType;
  pardusConfig?: PardusConfig;
}

export interface ServerStatus {
  running: boolean;
  config: Config;
  stats: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
}

export interface TaskEvent {
  type: string;
  data?: unknown;
  timestamp: number;
}
