import { describe, test, expect } from 'bun:test';
import { createAgent, executeAgent, isSuccess, getOutput, getError } from '../../agent/agent';
import type { AgentConfig, AgentResult, AgentExecutor } from '../../agent/types';

describe('agent/agent', () => {
  const mockConfig: AgentConfig = {
    spawnPath: '/test/path',
    prompt: 'test prompt',
  };

  const mockSuccessResult: AgentResult = {
    success: true,
    output: 'test output',
  };

  const mockFailureResult: AgentResult = {
    success: false,
    error: 'test error',
  };

  test('createAgent should create an agent executor', async () => {
    const mockExecutor: AgentExecutor = async () => mockSuccessResult;
    const agent = createAgent(mockExecutor);

    const result = await agent(mockConfig);
    expect(result).toEqual(mockSuccessResult);
  });

  test('executeAgent should execute the agent', async () => {
    const mockExecutor: AgentExecutor = async () => mockSuccessResult;
    const result = await executeAgent(mockExecutor, mockConfig);

    expect(result).toEqual(mockSuccessResult);
  });

  test('isSuccess should return true for successful result', () => {
    expect(isSuccess(mockSuccessResult)).toBe(true);
  });

  test('isSuccess should return false for failed result', () => {
    expect(isSuccess(mockFailureResult)).toBe(false);
  });

  test('getOutput should return output for successful result', () => {
    expect(getOutput(mockSuccessResult)).toBe('test output');
  });

  test('getOutput should return null for failed result', () => {
    expect(getOutput(mockFailureResult)).toBeNull();
  });

  test('getOutput should return null when output is undefined', () => {
    const result: AgentResult = { success: true };
    expect(getOutput(result)).toBeNull();
  });

  test('getError should return error for failed result', () => {
    expect(getError(mockFailureResult)).toBe('test error');
  });

  test('getError should return null for successful result', () => {
    expect(getError(mockSuccessResult)).toBeNull();
  });

  test('getError should return null when error is undefined', () => {
    const result: AgentResult = { success: false };
    expect(getError(result)).toBeNull();
  });
});
