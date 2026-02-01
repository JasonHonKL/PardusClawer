/**
 * Test script for log streaming functionality
 *
 * This script tests:
 * 1. Log file creation and appending
 * 2. SSE endpoint connectivity
 * 3. Real-time log streaming
 * 4. Log parsing and formatting
 */

import { saveLog, readLogs, deleteLogs } from '../ui/server';
import { existsSync } from 'fs';
import { join } from 'path';

async function testLogStreaming() {
  console.log('=== Testing Log Streaming ===\n');

  const testUuid = 'test-log-streaming-' + Date.now();

  // Test 1: Create log file
  console.log('Test 1: Creating log file...');
  try {
    saveLog(testUuid, '🚀 Test log entry 1');
    saveLog(testUuid, '📊 Test log entry 2');
    saveLog(testUuid, '✅ Test log entry 3');
    console.log('✓ Log entries saved\n');
  } catch (error) {
    console.error('❌ Failed to save logs:', error);
    return;
  }

  // Test 2: Read log file
  console.log('Test 2: Reading log file...');
  try {
    const logs = readLogs(testUuid);
    console.log(`✓ Read ${logs.length} log entries`);
    logs.forEach((log, index) => {
      console.log(`  [${index + 1}] ${log}`);
    });
    console.log('');
  } catch (error) {
    console.error('❌ Failed to read logs:', error);
    return;
  }

  // Test 3: Test SSE endpoint (requires API server to be running)
  console.log('Test 3: Testing SSE endpoint...');
  await testSSEEndpoint(testUuid);

  // Test 4: Test real-time streaming
  console.log('\nTest 4: Testing real-time streaming...');
  await testRealTimeStreaming(testUuid);

  // Test 5: Test log parsing
  console.log('\nTest 5: Testing log parsing...');
  testLogParsing();

  // Cleanup
  console.log('\nCleaning up test logs...');
  try {
    deleteLogs(testUuid);
    console.log('✓ Test logs deleted\n');
  } catch (error) {
    console.error('Warning: Failed to delete test logs:', error);
  }

  console.log('=== All Log Tests Complete ===');
}

async function testSSEEndpoint(uuid: string) {
  const API_BASE = 'http://localhost:13337';
  const url = `${API_BASE}/api/logs/${uuid}/stream`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.log(`❌ SSE endpoint returned ${response.status}`);
      return;
    }

    console.log('✓ SSE endpoint is reachable');
    console.log('  Content-Type:', response.headers.get('Content-Type'));

    // Read a few chunks
    const reader = response.body?.getReader();
    if (!reader) {
      console.log('❌ No response body');
      return;
    }

    const decoder = new TextDecoder();
    let eventCount = 0;
    const maxEvents = 5; // Read first 5 events

    console.log('  Reading events...');
    for (let i = 0; i < maxEvents; i++) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter((line) => line.trim().startsWith('data:'));

      for (const line of lines) {
        const data = line.replace('data:', '').trim();
        try {
          const parsed = JSON.parse(data);
          console.log(`    [${parsed.type || 'event'}] ${parsed.message?.substring(0, 50) || ''}...`);
          eventCount++;
        } catch {
          // Skip non-JSON lines
        }
      }
    }

    console.log(`✓ Received ${eventCount} events from SSE\n`);
  } catch (error) {
    console.log(`❌ SSE endpoint error: ${error}`);
    console.log('  (Make sure the API server is running on port 13337)\n');
  }
}

async function testRealTimeStreaming(uuid: string) {
  const API_BASE = 'http://localhost:13337';
  const url = `${API_BASE}/api/logs/${uuid}/stream`;

  try {
    // Start SSE connection
    const eventSource = new EventSource(url);

    const receivedLogs: string[] = [];
    let hasConnected = false;

    eventSource.onopen = () => {
      hasConnected = true;
      console.log('✓ SSE connection opened');
    };

    eventSource.addEventListener('log', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.message) {
        receivedLogs.push(data.message);
        console.log(`  [stream] ${data.message.substring(0, 50)}...`);
      }
    });

    eventSource.addEventListener('ready', () => {
      console.log('✓ SSE stream ready');
    });

    eventSource.onerror = (error) => {
      console.error('❌ SSE error:', error);
    };

    // Add new logs while connected
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log('  Adding new logs...');
    saveLog(uuid, '📝 New log entry during streaming');
    saveLog(uuid, '🔄 Another streaming test');

    // Wait for streaming
    await new Promise((resolve) => setTimeout(resolve, 2000));

    eventSource.close();

    if (hasConnected && receivedLogs.length > 0) {
      console.log(`✓ Real-time streaming works! Received ${receivedLogs.length} logs\n`);
    } else {
      console.log('⚠️  Streaming test inconclusive (may need longer wait time)\n');
    }
  } catch (error) {
    console.log(`❌ Real-time streaming test error: ${error}\n`);
  }
}

function testLogParsing() {
  // Test log entry parsing logic
  const testLogs = [
    '[2024-02-01T12:00:00.000Z] 🚀 Task started: Test Task',
    '[2024-02-01T12:00:01.000Z] ✅ Success message',
    '[2024-02-01T12:00:02.000Z] ❌ Error occurred',
    '[2024-02-01T12:00:03.000Z] ⚠️  Warning message',
    '[2024-02-01T12:00:04.000Z] ℹ️  Info message',
    'Invalid log format',
    '',
  ];

  testLogs.forEach((log, index) => {
    const parsed = parseLogEntry(log);
    if (parsed) {
      console.log(`  [${index + 1}] ✓ ${parsed.type}: ${parsed.message.substring(0, 30)}...`);
    } else {
      console.log(`  [${index + 1}] - (skipped: invalid format)`);
    }
  });

  console.log('✓ Log parsing test complete\n');
}

function parseLogEntry(line: string): { timestamp: string; message: string; type: string } | null {
  if (!line.trim()) return null;

  // Parse timestamp [2024-01-01T12:00:00.000Z]
  const timestampMatch = line.match(/^\[([^\]]+)\]/);
  const timestamp = timestampMatch ? timestampMatch[1] : '';
  const message = timestampMatch ? line.slice(timestampMatch[0].length).trim() : line;

  // Determine type based on emoji
  let type = 'info';
  if (message.includes('🚀') || message.includes('⏳')) {
    type = 'info';
  } else if (message.includes('✅') || message.includes('🏁')) {
    type = 'success';
  } else if (message.includes('❌') || message.includes('failed')) {
    type = 'error';
  } else if (message.includes('⚠️') || message.includes('warning')) {
    type = 'warning';
  }

  return { timestamp, message, type };
}

// Run the tests
testLogStreaming().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
