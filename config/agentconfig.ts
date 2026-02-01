import type { AgentExecutor } from '../agent/types';
import { openCodeAgent } from '../agent/opencode';
import { cursorAgent } from '../agent/cursor';
import { claudeCodeAgent } from '../agent/claude-code';
import { pardusAgentExecutor } from '../agent/pardus';
import { testAgent } from '../agent/test-agent';

export type AgentType = 'opencode' | 'cursor' | 'claude-code' | 'pardus' | 'test';

let currentAgentType: AgentType = 'claude-code';

export interface AgentConfig {
  type: AgentType;
  spawnPath: string;
  prompt: string;
  // Allow additional properties for specific agent types
  [key: string]: any;
}

export const getAgentExecutor = (config: AgentConfig): AgentExecutor => {
  switch (config.type) {
    case 'opencode':
      return openCodeAgent;
    case 'cursor':
      return cursorAgent;
    case 'claude-code':
      return claudeCodeAgent;
    case 'pardus':
      return pardusAgentExecutor;
    case 'test':
      return testAgent;
    default:
      const exhaustiveCheck: never = config;
      throw new Error(`Unknown agent type: ${exhaustiveCheck}`);
  }
};

export const getAgentType = (): AgentType => {
  return currentAgentType;
};

export const setAgentType = (type: AgentType): void => {
  currentAgentType = type;
};

export const createOpenCodeConfig = (): AgentConfig => ({
  type: 'opencode',
});

export const createCursorConfig = (): AgentConfig => ({
  type: 'cursor',
});

export const createClaudeCodeConfig = (): AgentConfig => ({
  type: 'claude-code',
});

export const createPardusConfig = (): AgentConfig => ({
  type: 'pardus',
  spawnPath: '',
  prompt: '',
});

export const createTestConfig = (): AgentConfig => ({
  type: 'test',
  spawnPath: '',
  prompt: '',
});
