import { describe, test, expect } from 'bun:test';
import { buildPrompt, createPromptInput, type PromptInput } from '../../prompt/prompt';

describe('prompt/prompt', () => {
  test('buildPrompt should include user request', () => {
    const input: PromptInput = {
      memory: '',
      userRequest: 'Find sales data for 2026',
    };
    const prompt = buildPrompt(input);

    expect(prompt).toContain('Find sales data for 2026');
    expect(prompt).toContain('# User Request');
  });

  test('buildPrompt should include memory when provided', () => {
    const input: PromptInput = {
      memory: 'Previous search found data from Q1 2026',
      userRequest: 'Get Q2 data',
    };
    const prompt = buildPrompt(input);

    expect(prompt).toContain('Previous search found data from Q1 2026');
    expect(prompt).toContain('# Context from Memory');
  });

  test('buildPrompt should handle empty memory', () => {
    const input: PromptInput = {
      memory: '',
      userRequest: 'Search for tech stocks',
    };
    const prompt = buildPrompt(input);

    expect(prompt).toContain('No previous memory available');
  });

  test('buildPrompt should include CSV instructions', () => {
    const input: PromptInput = {
      memory: '',
      userRequest: 'Get stock prices',
    };
    const prompt = buildPrompt(input);

    expect(prompt).toContain('CSV');
    expect(prompt).toContain('meaningful filename');
    expect(prompt).toContain('Do NOT use emojis');
  });

  test('buildPrompt should include task description', () => {
    const input: PromptInput = {
      memory: '',
      userRequest: 'Search data',
    };
    const prompt = buildPrompt(input);

    expect(prompt).toContain('# Task');
    expect(prompt).toContain('Search online');
    expect(prompt).toContain('export it to CSV');
  });

  test('createPromptInput should create valid input object', () => {
    const input = createPromptInput('some memory', 'some request');

    expect(input.memory).toBe('some memory');
    expect(input.userRequest).toBe('some request');
  });

  test('buildPrompt should not contain emojis', () => {
    const input: PromptInput = {
      memory: '',
      userRequest: 'Get data',
    };
    const prompt = buildPrompt(input);

    // Check for common emoji ranges
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(prompt)).toBe(false);
  });

  test('buildPrompt should include memory update instructions', () => {
    const input: PromptInput = {
      memory: '',
      userRequest: 'Get data',
    };
    const prompt = buildPrompt(input);

    expect(prompt).toContain('update the memory file');
    expect(prompt).toContain('summary of what you accomplished');
  });

  test('buildPrompt should include memory compression instructions', () => {
    const input: PromptInput = {
      memory: '',
      userRequest: 'Get data',
    };
    const prompt = buildPrompt(input);

    expect(prompt).toContain('20,000 tokens');
    expect(prompt).toContain('5,000 words');
    expect(prompt).toContain('compress it');
    expect(prompt).toContain('1 word ≈ 4 tokens');
  });

  test('buildPrompt should include memory compression guidelines', () => {
    const input: PromptInput = {
      memory: '',
      userRequest: 'Get data',
    };
    const prompt = buildPrompt(input);

    expect(prompt).toContain('Keeping only the most recent');
    expect(prompt).toContain('Summarizing older entries');
    expect(prompt).toContain('Preserving key findings');
  });
});
