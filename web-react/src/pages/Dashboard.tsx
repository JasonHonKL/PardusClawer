import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, Clock, XCircle, Loader, List, ArrowRight, FolderOpen } from 'lucide-react';
import type { Task } from '@/types/task';

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.getTasks(),
  });

  const { data: serverStatus } = useQuery({
    queryKey: ['server-status'],
    queryFn: () => api.getServerStatus(),
    refetchInterval: 10000,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const stats = {
    total: tasks?.length || 0,
    pending: tasks?.filter(t => t.status === 'pending').length || 0,
    processing: tasks?.filter(t => t.status === 'processing').length || 0,
    completed: tasks?.filter(t => t.status === 'completed').length || 0,
    failed: tasks?.filter(t => t.status === 'failed').length || 0,
  };

  // Queue: pending and processing tasks, sorted by due_time
  const queue = tasks
    ?.filter(t => t.status === 'pending' || t.status === 'processing')
    .sort((a, b) => a.due_time - b.due_time) || [];

  // Recent tasks: last 5 tasks, sorted by created_at descending
  const recentTasks = tasks
    ?.sort((a, b) => b.created_at - a.created_at)
    .slice(0, 5) || [];

  const handleTaskClick = (task: Task) => {
    // Navigate to Tasks page and highlight the specific task
    navigate('/tasks', { state: { highlightTaskId: task.id } });
  };

  const handleViewWorkspace = (task: Task) => {
    // Navigate to Workspaces page and select the specific workspace
    navigate('/workspaces', { state: { selectWorkspace: task.uuid } });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your tasks and system status</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Loader className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Server Status */}
      <Card>
        <CardHeader>
          <CardTitle>Server Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Heartbeat</p>
              <p className="text-lg font-semibold">
                {serverStatus?.config.heartbeat ? `${serverStatus.config.heartbeat / 1000}s` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Agent Type</p>
              <p className="text-lg font-semibold">{serverStatus?.config.agentType || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Queue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="h-5 w-5" />
            <CardTitle>Task Queue ({queue.length})</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/tasks')}>
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No tasks in queue
            </p>
          ) : (
            <div className="space-y-3">
              {queue.map((task, index) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{task.title}</p>
                        <Badge variant={getStatusBadgeVariant(task.status)}>
                          {task.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <p className="text-xs text-muted-foreground">Due</p>
                      <p className="text-sm font-medium">
                        {new Date(task.due_time).toLocaleString()}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle>Recent Tasks</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/tasks')}>
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks yet</p>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{task.title}</p>
                      <Badge variant={getStatusBadgeVariant(task.status)}>
                        {task.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate line-clamp-1">
                      {task.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {new Date(task.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.status !== 'pending' && task.status !== 'processing' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewWorkspace(task);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FolderOpen className="h-4 w-4 mr-2" />
                        Workspace
                      </Button>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
