import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { writeFileSync, unlinkSync } from 'fs';
import { readMemory, createMemory, isEmptyMemory, combineMemory } from '../../config/memory';

describe('config/memory', () => {
  const testFilePath = '/tmp/test-memory.txt';

  afterEach(() => {
    try {
      unlinkSync(testFilePath);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  test('readMemory should read file content', () => {
    const content = 'test memory content';
    writeFileSync(testFilePath, content, 'utf-8');

    const memory = readMemory(testFilePath);
    expect(memory).toBe(content);
  });

  test('readMemory should throw error for non-existent file', () => {
    expect(() => readMemory('/non/existent/file.txt')).toThrow('Failed to read memory file');
  });

  test('createMemory should return the content as-is', () => {
    const content = 'some memory content';
    const memory = createMemory(content);
    expect(memory).toBe(content);
  });

  test('isEmptyMemory should return true for empty string', () => {
    expect(isEmptyMemory('')).toBe(true);
  });

  test('isEmptyMemory should return true for whitespace only', () => {
    expect(isEmptyMemory('   \n\t  ')).toBe(true);
  });

  test('isEmptyMemory should return false for non-empty content', () => {
    expect(isEmptyMemory('some content')).toBe(false);
  });

  test('combineMemory should join multiple memories with newlines', () => {
    const memories = ['memory 1', 'memory 2', 'memory 3'];
    const combined = combineMemory(memories);
    expect(combined).toBe('memory 1\n\nmemory 2\n\nmemory 3');
  });

  test('combineMemory should handle empty array', () => {
    const combined = combineMemory([]);
    expect(combined).toBe('');
  });

  test('combineMemory should handle single memory', () => {
    const combined = combineMemory(['single memory']);
    expect(combined).toBe('single memory');
  });
});
