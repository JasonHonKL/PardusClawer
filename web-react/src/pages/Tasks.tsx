import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { api } from '@/lib/api';
import type { RecurrenceType, Task } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LogViewer } from '@/components/LogViewer';
import { Play, RotateCcw, Trash2, Plus, Loader, Repeat, FileText, X } from 'lucide-react';

export default function Tasks() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const taskRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTaskForLogs, setSelectedTaskForLogs] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    recurrence_type: 'none' as RecurrenceType,
    recurrence_interval: 1,
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.getTasks(),
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: typeof newTask) => api.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowAddForm(false);
      setNewTask({
        title: '',
        description: '',
        recurrence_type: 'none',
        recurrence_interval: 1,
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => api.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const forceTaskMutation = useMutation({
    mutationFn: (id: number) => api.forceTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const restartTaskMutation = useMutation({
    mutationFn: (id: number) => api.restartTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.title && newTask.description) {
      createTaskMutation.mutate(newTask);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'processing':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRecurrenceLabel = (task: Task) => {
    if (task.recurrence_type === 'none') return null;
    return `Every ${task.recurrence_interval} ${task.recurrence_type}`;
  };

  // Scroll to highlighted task when navigating from Dashboard
  useEffect(() => {
    if (tasks && location.state?.highlightTaskId) {
      const highlightedTaskId = location.state.highlightTaskId;
      const taskElement = taskRefs.current[highlightedTaskId];
      if (taskElement) {
        taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add highlight effect
        taskElement.classList.add('ring-2', 'ring-primary');
        setTimeout(() => {
          taskElement.classList.remove('ring-2', 'ring-primary');
        }, 2000);
      }
    }
  }, [tasks, location.state]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage and control your tasks</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <Input
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
              <Textarea
                placeholder="Task description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />

              {/* Recurrence Controls */}
              <div className="space-y-3 border-t border-border pt-4">
                <label className="text-sm font-medium block">Recurrence (optional)</label>
                <div className="flex gap-2 items-center">
                  <select
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newTask.recurrence_type}
                    onChange={(e) => setNewTask({ ...newTask, recurrence_type: e.target.value as RecurrenceType })}
                  >
                    <option value="none">No recurrence</option>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>

                  {newTask.recurrence_type !== 'none' && (
                    <>
                      <span className="text-sm text-muted-foreground">every</span>
                      <Input
                        type="number"
                        min={1}
                        className="w-24 [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                        value={newTask.recurrence_interval}
                        onChange={(e) => setNewTask({ ...newTask, recurrence_interval: parseInt(e.target.value) || 1 })}
                        placeholder="1"
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createTaskMutation.isPending}>
                  {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Task List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {tasks?.map((task) => (
            <div
              key={task.id}
              ref={(el) => (taskRefs.current[task.id] = el)}
              className="transition-all duration-500"
            >
              <Card>
                <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{task.title}</h3>
                      <Badge variant={getStatusBadgeVariant(task.status)}>
                        {task.status.toUpperCase()}
                      </Badge>
                      {task.recurrence_type !== 'none' && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Repeat className="h-3 w-3" />
                          {getRecurrenceLabel(task)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span title="Created: {new Date(task.created_at).toLocaleString()}">
                        Updated: {new Date(task.updated_at).toLocaleString()}
                      </span>
                      <span className={task.status === 'pending' && Date.now() >= task.due_time ? 'text-orange-500 font-medium' : ''}>
                        Due: {new Date(task.due_time).toLocaleString()}
                        {task.status === 'pending' && Date.now() >= task.due_time && ' (Overdue)'}
                      </span>
                      {task.recurrence_type !== 'none' && task.recurrence_end_time && (
                        <span>Until: {new Date(task.recurrence_end_time).toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {/* Force Run Button - for pending tasks */}
                    {(task.status === 'pending' || task.status === 'failed') && (
                      <Button
                        size="sm"
                        onClick={() => forceTaskMutation.mutate(task.id)}
                        disabled={forceTaskMutation.isPending}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Restart Button - for completed or failed tasks */}
                    {(task.status === 'completed' || task.status === 'failed') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => restartTaskMutation.mutate(task.id)}
                        disabled={restartTaskMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Delete Button */}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this task?')) {
                          deleteTaskMutation.mutate(task.id);
                        }
                      }}
                      disabled={deleteTaskMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    {/* View Logs Button */}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedTaskForLogs(task)}
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">Logs</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          ))}

          {tasks?.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No tasks yet. Add a task to get started!</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Log Viewer Modal */}
      {selectedTaskForLogs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-background rounded-lg shadow-lg max-w-6xl w-full my-8">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Task Logs</h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedTaskForLogs(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <LogViewer
                uuid={selectedTaskForLogs.uuid}
                title={selectedTaskForLogs.title}
                autoRefresh={selectedTaskForLogs.status === 'processing'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
