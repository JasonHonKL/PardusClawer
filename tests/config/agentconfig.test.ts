import { describe, test, expect } from 'bun:test';
import {
  getAgentExecutor,
  createOpenCodeConfig,
  createCursorConfig,
  createClaudeCodeConfig,
  type AgentConfig,
  type AgentType,
} from '../../config/agentconfig';

describe('config/agentconfig', () => {
  test('createOpenCodeConfig should create opencode config', () => {
    const config = createOpenCodeConfig();
    expect(config.type).toBe('opencode');
  });

  test('createCursorConfig should create cursor config', () => {
    const config = createCursorConfig();
    expect(config.type).toBe('cursor');
  });

  test('createClaudeCodeConfig should create claude-code config', () => {
    const config = createClaudeCodeConfig();
    expect(config.type).toBe('claude-code');
  });

  test('getAgentExecutor should return opencode executor', () => {
    const config: AgentConfig = { type: 'opencode' };
    const executor = getAgentExecutor(config);
    expect(executor).toBeInstanceOf(Function);
  });

  test('getAgentExecutor should return cursor executor', () => {
    const config: AgentConfig = { type: 'cursor' };
    const executor = getAgentExecutor(config);
    expect(executor).toBeInstanceOf(Function);
  });

  test('getAgentExecutor should return claude-code executor', () => {
    const config: AgentConfig = { type: 'claude-code' };
    const executor = getAgentExecutor(config);
    expect(executor).toBeInstanceOf(Function);
  });

  test('AgentType should be valid union type', () => {
    const types: AgentType[] = ['opencode', 'cursor', 'claude-code'];
    expect(types).toHaveLength(3);
    expect(types).toContain('opencode');
    expect(types).toContain('cursor');
    expect(types).toContain('claude-code');
  });
});
