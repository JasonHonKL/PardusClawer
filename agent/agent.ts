import { type AgentConfig, type AgentResult, type AgentExecutor } from './types';

export const createAgent = (executor: AgentExecutor): AgentExecutor => {
  return (config: AgentConfig) => executor(config);
};

export const executeAgent = async (executor: AgentExecutor, config: AgentConfig): Promise<AgentResult> => {
  return executor(config);
};

export const isSuccess = (result: AgentResult): boolean => result.success;

export const getOutput = (result: AgentResult): string | null => result.output ?? null;

export const getError = (result: AgentResult): string | null => result.error ?? null;
