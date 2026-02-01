# PardusCrawler Test Suite

This directory contains test scripts for verifying PardusCrawler functionality.

## Test Files

### 1. `test-recurring.ts`
Tests recurring task execution with configurable heartbeat.

**What it tests:**
- Creating tasks with recurrence intervals
- Task execution timing (heartbeat verification)
- Multiple automatic executions
- Task rescheduling

**How to run:**
```bash
bun run tests/test-recurring.ts
```

**Expected behavior:**
- Sets heartbeat to 5 seconds
- Creates a task with 10-second recurrence
- Monitors for 40 seconds
- Should see ~4 executions (at 0s, 10s, 20s, 30s)

**Success criteria:**
- ✓ 3+ executions completed in 40 seconds
- ✓ Each execution creates output files
- ✓ Tasks are properly rescheduled

---

### 2. `test-log-streaming.ts`
Tests real-time log streaming via SSE.

**What it tests:**
- Log file creation and appending
- SSE endpoint connectivity
- Real-time log streaming to clients
- Log parsing and formatting
- EventSource connection handling

**How to run:**
```bash
# Make sure the server is running first
bun run server.ts &

# Then run the test
bun run tests/test-log-streaming.ts
```

**Success criteria:**
- ✓ Logs are saved to files correctly
- ✓ SSE endpoint accepts connections
- ✓ Logs stream in real-time
- ✓ Log parser handles all emoji types (🚀✅❌⚠️)
- ✓ EventSource closes cleanly

---

### 3. `test-memory.ts`
Tests memory management and compression.

**What it tests:**
- Memory creation and saving
- Memory loading and persistence
- Token counting accuracy
- Memory compression (> 20k tokens)
- Memory file structure verification

**How to run:**
```bash
bun run tests/test-memory.ts
```

**Success criteria:**
- ✓ Memory files are created in `pardus_data/memory/`
- ✓ Memory persists between loads
- ✓ Token counting is accurate (~1.3 tokens/word)
- ✓ Large memories are compressed correctly
- ✓ Compression reduces token count by > 50%

---

## Test Agent

### `agent/test-agent.ts`
Demo agent used for testing recurring tasks.

**Features:**
- Logs current timestamp
- Creates test output files
- Simulates work without external dependencies
- Calls `onStream` callback for testing

**Usage:**
Automatically used by `test-recurring.ts` when agent type is set to `'test'`.

---

## Quick Test All

Run all tests in sequence:

```bash
# Test 1: Recurring tasks (takes 40 seconds)
bun run tests/test-recurring.ts

# Test 2: Memory handling (fast)
bun run tests/test-memory.ts

# Test 3: Log streaming (requires server)
# Terminal 1: Start server
bun run server.ts

# Terminal 2: Run log test
bun run tests/test-log-streaming.ts
```

---

## Integration Test

For a full integration test:

1. **Start the system:**
```bash
bun run server.ts
```

2. **Create a test task via API:**
```bash
curl -X POST http://localhost:13337/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Integration Test Task",
    "description": "Test task that should execute every 10 seconds",
    "due_time": '"$(date +%s)000"',
    "recurrence_type": "seconds",
    "recurrence_interval": 10
  }'
```

3. **Monitor logs in real-time:**
```bash
# Watch the log file grow
tail -f pardus_data/logs/<task-uuid>.log

# Or use the web UI
open http://localhost:13338
```

4. **Verify results:**
- Check `pardus_data/workspaces/<uuid>/` for output files
- Verify task executed multiple times
- Confirm logs streamed in real-time

---

## Test Coverage

### Recurring Tasks ✓
- [x] Task creation with recurrence
- [x] Heartbeat timing
- [x] Multiple automatic executions
- [x] Task rescheduling
- [x] Workspace creation per execution

### Log Streaming ✓
- [x] Log file creation
- [x] Log appending
- [x] SSE connectivity
- [x] Real-time streaming
- [x] Log parsing
- [x] Multiple concurrent connections

### Memory Management ✓
- [x] Memory creation
- [x] Memory persistence
- [x] Token counting
- [x] Memory compression
- [x] File structure validation

### PDF Support ✓
- [x] PDF content-type handling
- [x] PDF download endpoint
- [x] Prompt updated for PDF support
- [x] File download with correct headers

---

## Troubleshooting

### Test fails with "EADDRINUSE"
**Problem:** Port already in use
**Solution:** Kill existing server processes
```bash
pkill -f "bun run server"
```

### SSE connection fails
**Problem:** API server not running
**Solution:** Start the server before running log tests
```bash
bun run server.ts
```

### Memory test shows "not large enough"
**Problem:** Token estimation might be off
**Solution:** This is expected - the test still validates the compression logic

### Recurring test shows only 1 execution
**Problem:** Heartbeat might not be triggering
**Solution:** Check that heartbeat is set correctly in the test

---

## Test Results Template

```
=== PardusCrawler Test Results ===

Recurring Tasks:     ✅ PASS (4/4 executions)
Log Streaming:       ✅ PASS (SSE connected, streaming working)
Memory Management:   ✅ PASS (compression working, tokens accurate)
PDF Support:         ✅ PASS (downloads working)

Overall:             ✅ ALL TESTS PASSED
```
