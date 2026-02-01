export interface AgentConfig {
  spawnPath: string;
  prompt: string;
  onStream?: (data: string) => void; // Optional callback for streaming output
}

export interface AgentResult {
  success: boolean;
  output?: string;
  error?: string;
}

export type AgentExecutor = (config: AgentConfig) => Promise<AgentResult>;
