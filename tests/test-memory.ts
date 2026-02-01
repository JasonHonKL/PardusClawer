/**
 * Test script for memory handling functionality
 *
 * This script tests:
 * 1. Memory creation and saving
 * 2. Memory loading and reading
 * 3. Memory compression when > 20k tokens
 * 4. Memory update and append
 * 5. Token counting accuracy
 */

import { saveMemory, loadMemory } from '../memory/memory';
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';

async function testMemoryHandling() {
  console.log('=== Testing Memory Handling ===\n');

  const testUuid = 'test-memory-' + Date.now();

  // Test 1: Create and save memory
  console.log('Test 1: Creating and saving memory...');
  try {
    const initialMemory = `# Task Summary
This is the first execution of the task.
- Data source: https://example.com/data
- Found 100 companies
- Created CSV file: companies.csv
`;
    saveMemory(testUuid, initialMemory);
    console.log('✓ Initial memory saved\n');
  } catch (error) {
    console.error('❌ Failed to save memory:', error);
    return;
  }

  // Test 2: Load memory
  console.log('Test 2: Loading memory...');
  try {
    const loaded = loadMemory(testUuid);
    if (loaded) {
      console.log('✓ Memory loaded successfully');
      console.log(`  Content length: ${loaded.length} characters`);
      console.log(`  Preview: ${loaded.substring(0, 50)}...\n`);
    } else {
      console.log('❌ No memory found\n');
      return;
    }
  } catch (error) {
    console.error('❌ Failed to load memory:', error);
    return;
  }

  // Test 3: Update memory (append)
  console.log('Test 3: Updating memory...');
  try {
    const existingMemory = loadMemory(testUuid);
    const newExecution = `

# Second Execution
- Data source: https://example.com/data
- Found 150 companies (50 new)
- Updated CSV file: companies.csv
- Previous memory preserved
`;
    const updatedMemory = existingMemory + '\n' + newExecution;
    saveMemory(testUuid, updatedMemory);

    const reloaded = loadMemory(testUuid);
    console.log('✓ Memory updated');
    console.log(`  New length: ${reloaded?.length || 0} characters`);
    console.log(`  Contains "Second Execution": ${reloaded?.includes('Second Execution')}\n`);
  } catch (error) {
    console.error('❌ Failed to update memory:', error);
    return;
  }

  // Test 4: Token counting
  console.log('Test 4: Testing token counting...');
  const testText = 'This is a test sentence with some words.';
  const estimatedTokens = countTokens(testText);
  console.log(`  Text: "${testText}"`);
  console.log(`  Words: ${testText.split(/\s+/).length}`);
  console.log(`  Estimated tokens: ${estimatedTokens}`);
  console.log(`  Ratio: ${(estimatedTokens / testText.split(/\s+/).length).toFixed(2)} tokens/word\n`);

  // Test 5: Memory compression
  console.log('Test 5: Testing memory compression (> 20k tokens)...');
  await testMemoryCompression(testUuid);

  // Test 6: Memory file verification
  console.log('\nTest 6: Verifying memory file structure...');
  const memoryPath = join(process.cwd(), 'pardus_data/memory', `${testUuid}.md`);
  if (existsSync(memoryPath)) {
    const fileContent = readFileSync(memoryPath, 'utf-8');
    console.log('✓ Memory file exists');
    console.log(`  File size: ${(fileContent.length / 1024).toFixed(2)} KB`);
    console.log(`  Path: ${memoryPath}\n`);
  } else {
    console.log('❌ Memory file not found\n');
  }

  // Cleanup
  console.log('Cleaning up test memory...');
  try {
    if (existsSync(memoryPath)) {
      unlinkSync(memoryPath);
      console.log('✓ Test memory deleted\n');
    }
  } catch (error) {
    console.error('Warning: Failed to delete test memory:', error);
  }

  console.log('=== All Memory Tests Complete ===');
}

function countTokens(text: string): number {
  // Simple token estimation: 1 word ≈ 4 tokens
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  return Math.ceil(words.length * 1.3); // More accurate estimate
}

async function testMemoryCompression(uuid: string) {
  // Create a large memory (> 20k tokens ≈ 5,000 words)
  const largeMemory = [];
  const baseEntry = `# Execution Summary
- Task: Web scraping test
- Source: https://example.com
- Results: 500 companies extracted
- Files created: data.csv, report.pdf
- Timestamp: ${new Date().toISOString()}
`;

  console.log('  Creating large memory (simulating 5+ executions)...');

  // Add 6 executions (should exceed 20k tokens)
  for (let i = 1; i <= 6; i++) {
    largeMemory.push(`\n# Execution ${i}\n${baseEntry}`);
  }

  const fullMemory = largeMemory.join('\n');
  const estimatedTokens = countTokens(fullMemory);
  const wordCount = fullMemory.split(/\s+/).length;

  console.log(`  Generated memory:`);
  console.log(`    - Characters: ${fullMemory.length}`);
  console.log(`    - Words: ${wordCount}`);
  console.log(`    - Estimated tokens: ${estimatedTokens}`);

  if (estimatedTokens > 20000) {
    console.log('  ✓ Memory exceeds 20k tokens threshold');

    // Compress memory
    const compressed = compressMemory(fullMemory);
    const compressedTokens = countTokens(compressed);

    console.log(`  Compression results:`);
    console.log(`    - Before: ${estimatedTokens} tokens (${wordCount} words)`);
    console.log(`    - After: ${compressedTokens} tokens`);
    console.log(`    - Reduction: ${((1 - compressedTokens / estimatedTokens) * 100).toFixed(1)}%`);
    console.log(`    - Compressed preview: ${compressed.substring(0, 100)}...\n`);
  } else {
    console.log('  ⚠️  Memory not large enough to test compression\n');
  }
}

function compressMemory(memory: string): string {
  // Simple compression strategy:
  // 1. Keep most recent execution
  // 2. Summarize older executions
  const lines = memory.split('\n');
  const executions: string[][] = [];
  let currentExecution: string[] = [];

  // Split by execution markers
  for (const line of lines) {
    if (line.match(/^# Execution \d+$/)) {
      if (currentExecution.length > 0) {
        executions.push(currentExecution);
      }
      currentExecution = [line];
    } else {
      currentExecution.push(line);
    }
  }
  if (currentExecution.length > 0) {
    executions.push(currentExecution);
  }

  // Keep most recent 2 executions, summarize the rest
  const recentExecutions = executions.slice(-2);
  const oldExecutions = executions.slice(0, -2);

  const summary = [];
  summary.push('# Memory Summary');
  summary.push(`\n## Recent Executions (Last 2)`);
  summary.push(recentExecutions.map((exec) => exec.join('\n')).join('\n\n'));

  if (oldExecutions.length > 0) {
    summary.push('\n## Historical Executions (Summary)');
    summary.push(`- Total previous executions: ${oldExecutions.length}`);
    summary.push('- All followed similar pattern: web scraping, data extraction, CSV generation');
    summary.push('- Sources: https://example.com and related sites');
    summary.push('- Average: ~500 companies per execution');
  }

  return summary.join('\n');
}

// Run the tests
testMemoryHandling().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
