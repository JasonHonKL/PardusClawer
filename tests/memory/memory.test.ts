import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { saveMemory, loadMemory, memoryExists, deleteMemory, listMemoryUuids } from '../../memory/memory';
import { existsSync, rmSync } from 'fs';

const DATA_DIR = './pardus_data';
const TEST_UUID = 'test-uuid-12345';
const TEST_UUID_2 = 'test-uuid-67890';

describe('memory/memory', () => {
  beforeEach(() => {
    // Clean up any existing pardus_data directory
    if (existsSync(DATA_DIR)) {
      rmSync(DATA_DIR, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up pardus_data directory after tests
    if (existsSync(DATA_DIR)) {
      rmSync(DATA_DIR, { recursive: true, force: true });
    }
  });

  test('saveMemory should create memory file', () => {
    const content = 'This is test memory content';
    saveMemory(TEST_UUID, content);

    const exists = memoryExists(TEST_UUID);
    expect(exists).toBe(true);
  });

  test('saveMemory should overwrite existing memory', () => {
    saveMemory(TEST_UUID, 'Original content');
    saveMemory(TEST_UUID, 'Updated content');

    const loaded = loadMemory(TEST_UUID);
    expect(loaded).toBe('Updated content');
  });

  test('loadMemory should return saved content', () => {
    const content = 'Test memory content';
    saveMemory(TEST_UUID, content);

    const loaded = loadMemory(TEST_UUID);
    expect(loaded).toBe(content);
  });

  test('loadMemory should return null for non-existent memory', () => {
    const loaded = loadMemory('non-existent-uuid');
    expect(loaded).toBeNull();
  });

  test('memoryExists should return true for existing memory', () => {
    saveMemory(TEST_UUID, 'Some content');
    expect(memoryExists(TEST_UUID)).toBe(true);
  });

  test('memoryExists should return false for non-existent memory', () => {
    expect(memoryExists('non-existent-uuid')).toBe(false);
  });

  test('deleteMemory should delete existing memory', () => {
    saveMemory(TEST_UUID, 'Some content');
    const deleted = deleteMemory(TEST_UUID);

    expect(deleted).toBe(true);
    expect(memoryExists(TEST_UUID)).toBe(false);
  });

  test('deleteMemory should return false for non-existent memory', () => {
    const deleted = deleteMemory('non-existent-uuid');
    expect(deleted).toBe(false);
  });

  test('listMemoryUuids should return empty array when no memories', () => {
    const uuids = listMemoryUuids();
    expect(uuids).toEqual([]);
  });

  test('listMemoryUuids should return all UUIDs with memory', () => {
    saveMemory(TEST_UUID, 'Content 1');
    saveMemory(TEST_UUID_2, 'Content 2');

    const uuids = listMemoryUuids();
    expect(uuids).toHaveLength(2);
    expect(uuids).toContain(TEST_UUID);
    expect(uuids).toContain(TEST_UUID_2);
  });

  test('listMemoryUuids should not include deleted memories', () => {
    saveMemory(TEST_UUID, 'Content 1');
    saveMemory(TEST_UUID_2, 'Content 2');

    deleteMemory(TEST_UUID);

    const uuids = listMemoryUuids();
    expect(uuids).toHaveLength(1);
    expect(uuids).toContain(TEST_UUID_2);
    expect(uuids).not.toContain(TEST_UUID);
  });

  test('memory should persist across multiple operations', () => {
    // Save initial memory
    saveMemory(TEST_UUID, 'Initial content');
    expect(loadMemory(TEST_UUID)).toBe('Initial content');

    // Update memory
    saveMemory(TEST_UUID, 'Updated content');
    expect(loadMemory(TEST_UUID)).toBe('Updated content');

    // Delete and check
    deleteMemory(TEST_UUID);
    expect(loadMemory(TEST_UUID)).toBeNull();
  });

  test('memory should handle multiline content', () => {
    const content = 'Line 1\nLine 2\nLine 3';
    saveMemory(TEST_UUID, content);

    const loaded = loadMemory(TEST_UUID);
    expect(loaded).toBe(content);
  });

  test('memory should handle empty content', () => {
    saveMemory(TEST_UUID, '');
    const loaded = loadMemory(TEST_UUID);
    expect(loaded).toBe('');
  });

  test('memory should handle special characters', () => {
    const content = 'Special chars: !@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
    saveMemory(TEST_UUID, content);

    const loaded = loadMemory(TEST_UUID);
    expect(loaded).toBe(content);
  });
});
