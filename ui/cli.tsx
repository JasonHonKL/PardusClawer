import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import type { Server } from './server';
import type { Task } from '../db/schema';
import {
  getAllTasks,
  getUuidToTitleMap,
  appendQueue,
  updateTaskDescription,
  updateTaskTitle,
  deleteTask,
} from '../db/queue';
import { minutesToHeartbeat } from '../config/heartbeat';

interface CliProps {
  server: Server;
}

type MenuOption = 'dashboard' | 'add-task' | 'view-tasks' | 'edit-task' | 'server-control' | 'exit';

const Dashboard: React.FC<{ server: Server; onNavigate: (option: MenuOption) => void }> = ({ server, onNavigate }) => {
  const { isRunning, getStatus } = server;
  const [status, setStatus] = useState(getStatus());

  useEffect(() => {
    const interval = setInterval(() => setStatus(getStatus()), 1000);
    return () => clearInterval(interval);
  }, [getStatus]);

  const tasksByStatus = status.tasks.reduce(
    (acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <Box flexDirection="column" gap={1}>
      <Box borderStyle="double" borderColor="green" padding={1}>
        <Text bold color="green">
          🦅 PardusCrawler Dashboard
        </Text>
      </Box>

      <Box flexDirection="column" gap={1}>
        <Text>Server Status: {isRunning() ? <Text color="green">Running</Text> : <Text color="red">Stopped</Text>}</Text>
        <Text>Total Tasks: {status.tasks.length}</Text>
        <Text>Pending: {tasksByStatus.pending || 0}</Text>
        <Text>Processing: {tasksByStatus.processing || 0}</Text>
        <Text>Completed: {tasksByStatus.completed || 0}</Text>
        <Text>Failed: {tasksByStatus.failed || 0}</Text>
      </Box>

      <Box>
        <Text dimmed>Press number to navigate:</Text>
      </Box>
      <Box flexDirection="column">
        <Text>1. Add Task</Text>
        <Text>2. View Tasks</Text>
        <Text>3. Edit Task</Text>
        <Text>4. Server Control</Text>
        <Text>0. Exit</Text>
      </Box>
    </Box>
  );
};

const AddTask: React.FC<{ onNavigate: (option: MenuOption) => void }> = ({ onNavigate }) => {
  const [step, setStep] = useState<'title' | 'description' | 'due' | 'confirm'>('title');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueMinutes, setDueMinutes] = useState('60');

  const handleSubmit = () => {
    const dueTime = Date.now() + minutesToHeartbeat(parseInt(dueMinutes) || 60);

    appendQueue({
      title,
      description,
      due_time: dueTime,
    });

    setStep('title');
    setTitle('');
    setDescription('');
    setDueMinutes('60');
    onNavigate('dashboard');
  };

  if (step === 'title') {
    return (
      <Box flexDirection="column">
        <Text bold>Enter task title:</Text>
        <TextInput value={title} onChange={setTitle} onSubmit={() => setStep('description')} />
        <Text dimmed>Press Enter to continue</Text>
      </Box>
    );
  }

  if (step === 'description') {
    return (
      <Box flexDirection="column">
        <Text bold>Enter task description:</Text>
        <Text dimmed>Tip: Add "every X days" to make it recurring</Text>
        <TextInput value={description} onChange={setDescription} onSubmit={() => setStep('due')} />
        <Text dimmed>Press Enter to continue</Text>
      </Box>
    );
  }

  if (step === 'due') {
    return (
      <Box flexDirection="column">
        <Text bold>Enter due time (in minutes):</Text>
        <TextInput
          value={dueMinutes}
          onChange={setDueMinutes}
          onSubmit={() => setStep('confirm')}
        />
        <Text dimmed>Press Enter to continue</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Box borderStyle="single" padding={1}>
        <Text bold>Confirm Task:</Text>
      </Box>
      <Text>Title: {title}</Text>
      <Text>Description: {description}</Text>
      <Text>Due in: {dueMinutes} minutes</Text>
      <Box marginTop={1}>
        <Text dimmed>Press Enter to confirm, Esc to cancel</Text>
      </Box>
    </Box>
  );
};

const TaskList: React.FC<{ tasks: Task[]; selectedId: number | null }> = ({ tasks, selectedId }) => {
  return (
    <Box flexDirection="column">
      <Box borderStyle="single" borderColor="blue" padding={1}>
        <Text bold color="blue">Tasks</Text>
      </Box>
      {tasks.length === 0 ? (
        <Text dimmed>No tasks found</Text>
      ) : (
        tasks.map((task) => (
          <Box key={task.id}>
            <Text color={task.id === selectedId ? 'green' : 'white'}>
              {task.id === selectedId ? '> ' : '  '}
              [{task.id}] {task.title} ({task.status})
            </Text>
            <Text dimmer>    UUID: {task.uuid}</Text>
          </Box>
        ))
      )}
    </Box>
  );
};

const ViewTasks: React.FC<{ onNavigate: (option: MenuOption) => void }> = ({ onNavigate }) => {
  const [tasks] = useState(getAllTasks());
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(tasks.length - 1, prev + 1));
    } else if (key.escape) {
      onNavigate('dashboard');
    }
  });

  const selectedTask = tasks[selectedIndex];

  return (
    <Box flexDirection="column">
      <Box borderStyle="single" borderColor="blue" padding={1} marginBottom={1}>
        <Text bold color="blue">View Tasks (Esc to go back)</Text>
      </Box>
      <Box flexGrow={1}>
        <TaskList tasks={tasks} selectedId={selectedTask?.id ?? null} />
      </Box>
      {selectedTask && (
        <Box borderStyle="single" padding={1} marginTop={1}>
          <Text bold>Task Details:</Text>
          <Text>ID: {selectedTask.id}</Text>
          <Text>UUID: {selectedTask.uuid}</Text>
          <Text>Title: {selectedTask.title}</Text>
          <Text>Description: {selectedTask.description}</Text>
          <Text>Status: {selectedTask.status}</Text>
          <Text>Due: {new Date(selectedTask.due_time).toLocaleString()}</Text>
        </Box>
      )}
    </Box>
  );
};

const EditTask: React.FC<{ onNavigate: (option: MenuOption) => void }> = ({ onNavigate }) => {
  const [tasks] = useState(getAllTasks());
  const [step, setStep] = useState<'select' | 'action' | 'edit-title' | 'edit-desc' | 'delete'>('select');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [newValue, setNewValue] = useState('');

  const selectedTask = tasks[selectedIndex];

  const handleEdit = () => {
    if (step === 'edit-title' && selectedTask) {
      updateTaskTitle(selectedTask.id, newValue);
    } else if (step === 'edit-desc' && selectedTask) {
      updateTaskDescription(selectedTask.id, newValue);
    } else if (step === 'delete' && selectedTask) {
      deleteTask(selectedTask.id);
    }

    // Refresh tasks
    setStep('select');
    setSelectedIndex(0);
    setNewValue('');
  };

  useInput((input, key) => {
    if (step === 'select') {
      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(tasks.length - 1, prev + 1));
      } else if (key.return && selectedTask) {
        setStep('action');
      } else if (key.escape) {
        onNavigate('dashboard');
      }
    } else if (step === 'action') {
      if (key.escape) {
        setStep('select');
      }
    } else if (step === 'delete' || key.escape) {
      if (key.escape) {
        setStep('select');
      } else if ((key.return || input === 'y') && step === 'delete') {
        handleEdit();
        onNavigate('dashboard');
      }
    }
  });

  if (step === 'select') {
    return (
      <Box flexDirection="column">
        <Box borderStyle="single" borderColor="yellow" padding={1} marginBottom={1}>
          <Text bold color="yellow">Edit Task (Esc to go back, Enter to select)</Text>
        </Box>
        <TaskList tasks={tasks} selectedId={selectedTask?.id ?? null} />
      </Box>
    );
  }

  if (step === 'action') {
    return (
      <Box flexDirection="column" gap={1}>
        <Box borderStyle="single" padding={1}>
          <Text bold>Edit: {selectedTask?.title}</Text>
        </Box>
        <Text>1. Edit Title</Text>
        <Text>2. Edit Description</Text>
        <Text>3. Delete Task</Text>
        <Text dimmed>Press number to choose, Esc to go back</Text>
      </Box>
    );
  }

  if (step === 'edit-title') {
    return (
      <Box flexDirection="column">
        <Text bold>Enter new title:</Text>
        <TextInput
          value={newValue}
          onChange={setNewValue}
          onSubmit={() => {
            handleEdit();
            onNavigate('dashboard');
          }}
        />
      </Box>
    );
  }

  if (step === 'edit-desc') {
    return (
      <Box flexDirection="column">
        <Text bold>Enter new description:</Text>
        <TextInput
          value={newValue}
          onChange={setNewValue}
          onSubmit={() => {
            handleEdit();
            onNavigate('dashboard');
          }}
        />
      </Box>
    );
  }

  if (step === 'delete') {
    return (
      <Box flexDirection="column">
        <Text bold color="red">Delete task: {selectedTask?.title}?</Text>
        <Text dimmed>Press Y to confirm, any other key to cancel</Text>
      </Box>
    );
  }

  return null;
};

const ServerControl: React.FC<{ server: Server; onNavigate: (option: MenuOption) => void }> = ({ server, onNavigate }) => {
  const handleToggle = () => {
    if (server.isRunning()) {
      server.stop();
    } else {
      server.start();
    }
  };

  return (
    <Box flexDirection="column" gap={1}>
      <Box borderStyle="single" borderColor="cyan" padding={1}>
        <Text bold color="cyan">Server Control</Text>
      </Box>
      <Text>Status: {server.isRunning() ? <Text color="green">Running</Text> : <Text color="red">Stopped</Text>}</Text>
      <Box marginTop={1}>
        <Text>Press Enter to {server.isRunning() ? 'Stop' : 'Start'} server, Esc to go back</Text>
      </Box>
    </Box>
  );
};

export const Cli: React.FC<CliProps> = ({ server }) => {
  const [currentView, setCurrentView] = useState<MenuOption>('dashboard');
  const { exit } = useApp();

  useInput((input, key) => {
    if (currentView === 'dashboard') {
      if (input === '0') {
        exit();
      } else if (input === '1') {
        setCurrentView('add-task');
      } else if (input === '2') {
        setCurrentView('view-tasks');
      } else if (input === '3') {
        setCurrentView('edit-task');
      } else if (input === '4') {
        setCurrentView('server-control');
      }
    }
  });

  return (
    <Box flexDirection="column">
      {currentView === 'dashboard' && <Dashboard server={server} onNavigate={setCurrentView} />}
      {currentView === 'add-task' && <AddTask onNavigate={setCurrentView} />}
      {currentView === 'view-tasks' && <ViewTasks onNavigate={setCurrentView} />}
      {currentView === 'edit-task' && <EditTask onNavigate={setCurrentView} />}
      {currentView === 'server-control' && <ServerControl server={server} onNavigate={setCurrentView} />}
    </Box>
  );
};
