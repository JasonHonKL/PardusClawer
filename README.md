# 🦅 PardusBot

**OpenClaw For data scientist**

PardusBot runs AI agents on your schedule - extract data from websites, monitor competitors, track prices, generate reports, and more. All through a simple web interface.

---

## 🎬 See It In Action

Watch PardusBot demonstrate its capabilities:

- [Demo Video 1](https://x.com/EinNewton/status/2017962542027747468/video/1)
- [Demo Video 2](https://x.com/EinNewton/status/2017962542027747468/video/2)

---

## 🌟 Also Check Out

**[Pardus AI](https://pardusai.org/)** - Your intelligent data science AI agent for advanced analytics and automation.

---

## 🚀 Get Started in 3 Steps

### 1. Install PardusBot (one command)

Open your terminal and run:

```bash
npx pardusbot
```

That's it! The system will start automatically.

### 2. Open the Web Interface

Once you see "PardusBot is running!", open your browser to:

**http://localhost:13338**

### 3. Create Your First Task

Click "New Task" and enter:
- **Title**: "What is this task?"
- **Description**: "What should the AI do?"

Click **Save** and PardusBot does the rest!

---

## 💡 What Can PardusBot Do?

Here are some examples of tasks you can create:

### 📊 Data Collection
```
Title: "Daily YC Companies"
Description: "Extract all Y Combinator W24 batch companies from ycombinator.com. Save the results to a CSV file with company name, industry, and description."
```

### 📈 Price Monitoring
```
Title: "Daily Price Tracker"
Description: "Extract current stock prices for Apple, Google, and Microsoft. Save to CSV with date and time."
Recurrence: Every day at 4:00 PM
```

### 🔄 Competitive Monitoring
```
Title: "Product Price Monitor"
Description: "Check competitor.com/product-page daily and extract the price. Alert if price changes by more than 5%."
Recurrence: Every 6 hours
```

### 📝 Research Automation
```
Title: "Weekly Industry Report"
Description: "Research latest AI trends from 3 sources. Summarize key developments and save to markdown file."
Recurrence: Every Monday at 9:00 AM
```

### 🔍 Website Monitoring
```
Title: "Site Change Detector"
Description: "Load example.com every hour and check if the main heading text has changed. If changed, save the old and new text to a log file."
Recurrence: Every hour
```

---

## 🎯 How to Use PardusBot

### Creating Tasks

1. **Open the web UI** at http://localhost:13338
2. Click **"New Task"**
3. Fill in the details:
   - **Title**: Short description
   - **Description**: What you want the AI to do
   - **Due time**: When should it run? (default: now)
   - **Recurrence**: (optional) How often should it repeat?

4. Click **Save**

That's it! PardusBot will execute your task at the scheduled time.

### Managing Tasks

In the web UI, you can:

- **View all tasks** - See pending, running, and completed tasks
- **Force run** - Click ▶️ to run any task immediately
- **Restart** - Click 🔄 to re-run completed or failed tasks
- **Delete** - Click 🗑️ to remove tasks
- **View logs** - Click 📄 to see what the AI did

### Downloading Results

When PardusBot completes a task:

1. Click the **"Files"** button in the workspace section
2. Find your task's workspace
3. **Download** any files (CSV, PDF, TXT, JSON, etc.)

---

## ⚙️ Advanced Settings (Optional)

### Change How Often PardusBot Checks for Tasks

1. Open **Settings** in the web UI
2. Find **Heartbeat** (default: 60 seconds)
3. Adjust the value:
   - **10 seconds** = Checks very frequently (higher CPU usage)
   - **60 seconds** = Default (balanced)
   - **300 seconds** (5 minutes) = Less frequent (saves resources)

### Switch AI Agent

1. Open **Settings** in the web UI
2. Find **Agent Type**
3. Choose from:
   - **Claude Code** (default) - Best for most tasks
   - **OpenCode** - Alternative AI agent
   - **Cursor** - Alternative AI agent
   - **Pardus** - Customizable (needs API key)

---

## 📋 Example Task Templates

### Simple One-Time Task
```
Title: "Extract Tech News"
Description: "Go to techcrunch.com and extract the 5 latest headlines. Save to a CSV with headline, URL, and publication date."
Due time: Now
```

### Recurring Daily Task
```
Title: "Morning News Summary"
Description: "Visit nytimes.com/technology and extract the top 10 technology articles. Save headline and summary to CSV."
Due time: 9:00 AM
Recurrence: Every 1 day
```

### Recurring Weekly Task
```
Title: "Competitor Analysis"
Description: "Check competitor.com/products page and extract all product names and prices. Compare with previous week's data."
Due time: Monday 9:00 AM
Recurrence: Every 1 week
```

### High-Frequency Monitoring
```
Title: "Stock Alert"
Description: "Check finance.yahoo.com/quote/AAPL and extract current stock price. If price is above $200, save alert to file."
Due time: Now
Recurrence: Every 5 minutes
```

---

## 🛑 Stopping PardusBot

When you're done:

1. Go to your terminal where PardusBot is running
2. Press **Ctrl+C** (Windows/Linux) or **Cmd+C** (Mac)
3. PardusBot will shut down gracefully

---

## 🔄 Running PardusBot Again

To start PardusBot again, just run:

```bash
npx pardusbot
```

All your tasks are saved automatically and will resume running.

---

## 💾 Data & Files

### Where is my data stored?

All data is stored in the `pardus_data` folder in the directory where you run PardusBot:
- **Tasks database**: `pardus_data/pardus_queue.db`
- **Task workspaces**: `pardus_data/workspaces/`
- **Task memories**: `pardus_data/memory/`
- **Task logs**: `pardus_data/logs/`

### Backup Your Data

To backup your tasks and data:

```bash
# Copy the pardus_data folder
cp -r pardus_data pardus_backup
```

---

## 🆘 Troubleshooting

### PardusBot won't start

**Check if Bun is installed:**
```bash
bun --version
```

If you see an error, install Bun:
```bash
curl -fsSL https://bun.sh/install | bash
```

### Web UI won't load

1. Make sure PardusBot is running (check your terminal)
2. Check if port 13338 is available:
   ```bash
   lsof -i :13338
   ```
3. If the port is taken, stop the process using it

### Task not executing

1. Check the **Due Time** - tasks only run when the current time is past the due time
2. Click **"Force Run"** button to execute immediately
3. Check the **Logs** to see what happened

### Want to see what's happening?

- **Task Logs**: Click the 📄 button on any task to see real-time AI output
- **Server Status**: Check the terminal where PardusBot is running

---

## 🎓 For Advanced Users

### Running from Source

If you want to modify PardusBot or run from source:

```bash
# Clone the repository
git clone <repository-url>
cd PardusClawer

# Install dependencies
bun install

# Run PardusBot
bun run server
```

### API Access

PardusBot exposes a REST API on `http://localhost:13337`:

**Create a task:**
```bash
curl -X POST http://localhost:13337/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Task",
    "description": "Do something cool",
    "due_time": 1704067200000
  }'
```

**View all tasks:**
```bash
curl http://localhost:13337/api/tasks
```

**Get task logs:**
```bash
curl http://localhost:13337/api/logs/{task-uuid}
```

**Full API documentation:** See [API Endpoints](#-api-endpoints) section below.

---

## 📊 API Endpoints

### Task Management
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create new task
- `POST /api/tasks/:id/force` - Force immediate execution
- `POST /api/tasks/:id/restart` - Restart failed/completed task
- `DELETE /api/tasks/:id/cancel` - Cancel processing task
- `DELETE /api/tasks/:id` - Delete task

### Workspace & Files
- `GET /api/workspaces` - List all workspaces
- `GET /api/workspaces/:uuid/files` - List workspace files
- `GET /api/workspaces/:uuid/download/:filename` - Download file
- `DELETE /api/workspaces/:uuid` - Delete workspace

### Logs
- `GET /api/logs/:uuid` - Get task logs
- `GET /api/logs/:uuid/stream` - Real-time log streaming

### Configuration
- `GET /api/config` - Get current config
- `POST /api/config/heartbeat` - Update heartbeat
- `POST /api/config/agent` - Switch agent type

### Server
- `GET /api/server/status` - Server status & statistics

---

## 🧪 Testing

PardusBot includes test suites for developers:

```bash
cd PardusClawer
bun run test:all
```

---

## 📁 Project Structure

```
PardusClawer/
├── agent/              # AI agent implementations
├── db/                 # Database & task queue
├── memory/             # Task memory management
├── prompt/             # AI prompts
├── web-react/          # Web UI
├── pardus_data/        # Your data (auto-created)
└── cli.ts              # Entry point
```

---

## 🔧 Configuration

### Environment Variables

No configuration required! PardusBot uses:
- SQLite for data storage
- File-based memory system
- Built-in task queue

### Agent Setup

**Claude Code (Default):**
```bash
npm install -g @anthropic-ai/claude-code
```

**Other Agents:** Configurable via web UI

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with:
- **Bun** - Fast JavaScript runtime
- **React + shadcn/ui** - Modern UI framework
- **SQLite** - Embedded database
- **Claude Code** - AI agent execution

---

## 🤝 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review test files for examples

---

**Made with ❤️ by the PardusBot team**

---

## 🎯 Quick Reference

### Common Commands

```bash
# Start PardusBot
npx pardusbot

# Stop PardusBot
# Press Ctrl+C in the terminal

# View logs in real-time
# Open http://localhost:13338 and click the 📄 button on any task

# Download generated files
# Open http://localhost:13338 → Click "Files" → Download

# Check task status
# Open http://localhost:13338 → Tasks
```

### Task Examples

- **Web scraping**: "Extract all products from example.com/products"
- **Research**: "Find recent AI articles and summarize key points"
- **Monitoring**: "Check stock price every hour and save to CSV"
- **Automation**: "Generate daily report from website data"

---

**Ready to automate your tasks?**

```bash
npx pardusbot
```
