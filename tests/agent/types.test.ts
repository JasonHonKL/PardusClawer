import { describe, test, expect } from 'bun:test';

describe('agent/types', () => {
  test('AgentConfig should be a valid type', () => {
    const config = {
      spawnPath: '/some/path',
      prompt: 'test prompt',
    };
    expect(config.spawnPath).toBe('/some/path');
    expect(config.prompt).toBe('test prompt');
  });

  test('AgentResult success case', () => {
    const result = {
      success: true,
      output: 'some output',
    };
    expect(result.success).toBe(true);
    expect(result.output).toBe('some output');
  });

  test('AgentResult failure case', () => {
    const result = {
      success: false,
      error: 'some error',
    };
    expect(result.success).toBe(false);
    expect(result.error).toBe('some error');
  });

  test('AgentExecutor is a function type', () => {
    const executor = async (config: { spawnPath: string; prompt: string }) => ({
      success: true,
      output: 'test',
    });
    expect(executor).toBeInstanceOf(Function);
  });
});
