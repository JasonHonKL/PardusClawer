# 🦅 PardusCrawler

An intelligent task automation system with recurring job scheduling, real-time log streaming, and multi-agent support. PardusCrawler enables you to schedule web scraping, data extraction, and automated research tasks with flexible recurrence patterns.

## ✨ Features

- **🔄 Recurring Tasks** - Schedule tasks to run every X seconds/minutes/hours/days/weeks/months
- **📊 Multiple Output Formats** - Export data to CSV, PDF, or other formats
- **🧠 Memory Management** - Automatically compresses task memory when > 20k tokens
- **📡 Real-time Log Streaming** - Watch agent output live via Server-Sent Events (SSE)
- **🤖 Multi-Agent Support** - Compatible with Claude Code, OpenCode, Cursor, Pardus agents
- **💾 Persistent Storage** - SQLite-based task queue with workspace management
- **🎯 Modern Web UI** - React + shadcn/ui interface at `http://localhost:13338`
- **⚙️ Configurable** - Adjust heartbeat, agent type, and system settings via API

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd PardusClawer

# Install dependencies (using Bun)
bun install
```

### Start the Server

```bash
# Start all services (API + Web UI + Task Processor)
bun run server
```

This starts:
- **Enhanced API Server** on `http://localhost:13337`
- **React Web UI** on `http://localhost:13338`
- **Task Processor** with default 60-second heartbeat

### Create Your First Task

Via **Web UI** (Recommended):
1. Open `http://localhost:13338`
2. Click "New Task"
3. Enter title and description
4. Set due time and recurrence (optional)
5. Save and wait for execution

Via **API**:
```bash
curl -X POST http://localhost:13337/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Extract YC W24 Companies",
    "description": "Find all Y Combinator W24 batch companies and export to CSV",
    "due_time": '$(date +%s)000',
    "recurrence_type": "none"
  }'
```

## 📖 Usage

### Task Scheduling

Create one-time or recurring tasks:

```typescript
// One-time task
POST /api/tasks
{
  "title": "Daily Stock Prices",
  "description": "Extract AAPL, GOOGL, MSFT stock prices",
  "due_time": 1704067200000,
  "recurrence_type": "none"
}

// Recurring task (every day at 9am)
{
  "title": "Daily Stock Prices",
  "description": "Extract AAPL, GOOGL, MSFT stock prices",
  "due_time": 1704067200000,
  "recurrence_type": "days",
  "recurrence_interval": 1
}

// Recurring task (every 10 seconds)
{
  "title": "High-Frequency Monitor",
  "description": "Monitor website changes",
  "due_time": 1704067200000,
  "recurrence_type": "seconds",
  "recurrence_interval": 10
}
```

### Available Recurrence Types

- `seconds` - For testing or high-frequency tasks
- `minutes` - For frequent short tasks
- `hours` - For hourly jobs
- `days` - For daily tasks
- `weeks` - For weekly tasks
- `months` - For monthly tasks

### Real-time Log Streaming

Watch agent output in real-time:

```typescript
// Via browser EventSource
const eventSource = new EventSource('http://localhost:13337/api/logs/{uuid}/stream');

eventSource.addEventListener('log', (event) => {
  const data = JSON.parse(event.data);
  console.log(data.message); // Log line appears instantly
});
```

Or view in the Web UI by clicking on a task and opening the "Agent Logs" section.

### Workspace Files

View and download generated files:

```bash
# List all workspaces
GET /api/workspaces

# List files in a workspace
GET /api/workspaces/{uuid}/files

# Download a file
GET /api/workspaces/{uuid}/download/{filename}

# Delete a workspace
DELETE /api/workspaces/{uuid}
```

Supported file types: `.csv`, `.pdf`, `.txt`, `.md`, `.json`, `.log`

### Agent Configuration

Switch between different AI agents:

```bash
# Check current agent
GET /api/config

# Switch to different agent
POST /api/config/agent
{
  "agentType": "claude-code" | "opencode" | "cursor" | "pardus"
}
```

### Heartbeat Configuration

Adjust how often the task processor checks for due tasks:

```bash
# Update heartbeat (in milliseconds)
POST /api/config/heartbeat
{
  "heartbeat": 5000  // Check every 5 seconds
}
```

Lower heartbeat = more responsive but higher CPU usage.

## 🧪 Testing

PardusCrawler includes comprehensive test suites:

```bash
# Test memory management
bun run test:memory

# Test log streaming (requires server running)
bun run server  # Terminal 1
bun run test:logs  # Terminal 2

# Test recurring tasks (takes 40 seconds)
bun run test:recurring

# Run all tests
bun run test:all
```

See [tests/README.md](tests/README.md) for detailed test documentation.

## 📁 Project Structure

```
PardusClawer/
├── agent/              # Agent implementations
│   ├── claude-code.ts  # Claude Code CLI agent
│   ├── opencode.ts     # OpenCode agent
│   ├── cursor.ts       # Cursor agent
│   ├── pardus.ts       # Pardus agent
│   └── test-agent.ts   # Demo test agent
├── api-enhanced.ts     # Enhanced API server
├── config/             # Configuration management
│   ├── agentconfig.ts  # Agent type configuration
│   ├── event-emitter.ts # Event bus for SSE
│   ├── heartbeat.ts    # Heartbeat settings
│   └── workspace.ts    # Workspace directory management
├── db/                 # Database layer
│   ├── db.ts          # SQLite connection
│   ├── queue.ts       # Task queue operations
│   └── schema.ts      # Type definitions
├── memory/             # Memory management
│   └── memory.ts      # Memory CRUD operations
├── prompt/             # Agent prompts
│   └── prompt.ts      # Main task prompt template
├── server.ts           # Main entry point
├── ui/                 # Task processor
│   └── server.ts      # Queue processing logic
├── web-react/          # React web UI
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── pages/      # Route pages
│   │   └── lib/        # API client
│   └── dist/          # Production build
├── tests/              # Test suites
│   ├── test-recurring.ts
│   ├── test-log-streaming.ts
│   └── test-memory.ts
└── pardus_data/        # Runtime data (gitignored)
    ├── memory/         # Task memories
    ├── workspaces/     # Agent workspaces
    └── logs/           # Task logs
```

## 🔧 Configuration

### Environment Variables

No environment variables required! PardusCrawler uses:
- SQLite for data storage (`pardus_data/pardus.db`)
- File-based memory system
- In-process task queue

### Agent Setup

**Claude Code (Default):**
```bash
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code
```

**Other Agents:**
Configure via Web UI or API:
- `opencode` - OpenCode agent
- `cursor` - Cursor agent
- `pardus` - PardusAgent (needs API key)

## 📊 API Endpoints

### Task Management
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/force` - Force immediate execution
- `POST /api/tasks/:id/restart` - Restart failed/completed task
- `DELETE /api/tasks/:id/cancel` - Cancel processing task

### Workspace & Files
- `GET /api/workspaces` - List all workspaces
- `GET /api/workspaces/:uuid/files` - List workspace files
- `GET /api/workspaces/:uuid/download/:filename` - Download file
- `DELETE /api/workspaces/:uuid/files/:filename` - Delete file
- `DELETE /api/workspaces/:uuid` - Delete entire workspace

### Logs & Streaming
- `GET /api/logs/:uuid` - Get task logs
- `GET /api/logs/:uuid/stream` - SSE log streaming endpoint

### Configuration
- `GET /api/config` - Get current config
- `POST /api/config/heartbeat` - Update heartbeat
- `POST /api/config/agent` - Switch agent type

### Server Control
- `GET /api/server/status` - Server status & statistics

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Bun** - Fast JavaScript runtime
- **React + shadcn/ui** - Modern UI framework
- **SQLite** - Embedded database
- **Claude Code** - AI agent execution

---

**Made with ❤️ by the PardusCrawler team**
