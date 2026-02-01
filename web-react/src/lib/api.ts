import type { Task } from '../types/task';
import type { Workspace } from '../types/workspace';
import type { Config, ServerStatus, AgentType } from '../types/config';

const API_BASE = 'http://localhost:13337/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || 'Request failed');
  }
  return response.json();
}

export const api = {
  // Task endpoints
  async getTasks(): Promise<Task[]> {
    const response = await fetch(`${API_BASE}/tasks`);
    return handleResponse<Task[]>(response);
  },

  async createTask(data: {
    title: string;
    description: string;
    due_time?: number;
    recurrence_type?: import('../types/task').RecurrenceType;
    recurrence_interval?: number;
    recurrence_end_time?: number | null;
  }): Promise<Task> {
    const response = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Task>(response);
  },

  async updateTask(id: number, data: { title?: string; description?: string }): Promise<Task | null> {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Task | null>(response);
  },

  async deleteTask(id: number): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean }>(response);
  },

  // Task control endpoints
  async forceTask(id: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/tasks/${id}/force`, {
      method: 'POST',
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  async restartTask(id: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/tasks/${id}/restart`, {
      method: 'POST',
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  async cancelTask(id: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/tasks/${id}/cancel`, {
      method: 'POST',
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  async updateTaskDueTime(id: number, dueTime: number): Promise<Task> {
    const response = await fetch(`${API_BASE}/tasks/${id}/due-time`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ due_time: dueTime }),
    });
    return handleResponse<Task>(response);
  },

  // Workspace endpoints
  async getWorkspaces(): Promise<Workspace[]> {
    const response = await fetch(`${API_BASE}/workspaces`);
    return handleResponse<Workspace[]>(response);
  },

  async getWorkspaceFiles(uuid: string): Promise<{ uuid: string; files: string[] }> {
    const response = await fetch(`${API_BASE}/workspaces/${uuid}/files`);
    return handleResponse<{ uuid: string; files: string[] }>(response);
  },

  downloadWorkspaceFile(uuid: string, filename: string): string {
    return `${API_BASE}/workspaces/${uuid}/download/${filename}`;
  },

  async deleteWorkspaceFile(uuid: string, filename: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/workspaces/${uuid}/files/${filename}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  async previewWorkspaceFile(uuid: string, filename: string): Promise<string> {
    const response = await fetch(`${API_BASE}/workspaces/${uuid}/files/${filename}`);
    return handleResponse<string>(response);
  },

  async deleteWorkspace(uuid: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/workspaces/${uuid}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  // Log endpoints
  async getLogs(uuid: string): Promise<{ logs: string[] }> {
    const response = await fetch(`${API_BASE}/logs/${uuid}`);
    return handleResponse<{ logs: string[] }>(response);
  },

  // Stream logs endpoint URL (for SSE)
  getLogsStreamUrl(uuid: string): string {
    return `${API_BASE}/logs/${uuid}/stream`;
  },

  // Memory endpoints
  async getMemory(uuid: string): Promise<{ uuid: string; memory: string }> {
    const response = await fetch(`${API_BASE}/memory/${uuid}`);
    return handleResponse<{ uuid: string; memory: string }>(response);
  },

  async updateMemory(uuid: string, memory: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/memory/${uuid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memory }),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  // Config endpoints
  async getConfig(): Promise<Config> {
    const response = await fetch(`${API_BASE}/config`);
    return handleResponse<Config>(response);
  },

  async updateConfig(data: { heartbeat?: number; agentType?: AgentType }): Promise<Config> {
    const response = await fetch(`${API_BASE}/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Config>(response);
  },

  async setHeartbeat(duration: number): Promise<{ success: boolean; heartbeat: number }> {
    const response = await fetch(`${API_BASE}/config/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration }),
    });
    return handleResponse<{ success: boolean; heartbeat: number }>(response);
  },

  async setAgentType(agentType: AgentType): Promise<{ success: boolean; agentType: AgentType }> {
    const response = await fetch(`${API_BASE}/config/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentType }),
    });
    return handleResponse<{ success: boolean; agentType: AgentType }>(response);
  },

  async getPardusConfig(): Promise<Record<string, any>> {
    const response = await fetch(`${API_BASE}/config/pardus`);
    return handleResponse<Record<string, any>>(response);
  },

  async updatePardusConfig(config: Record<string, any>): Promise<{ success: boolean; pardusConfig: Record<string, any> }> {
    const response = await fetch(`${API_BASE}/config/pardus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return handleResponse<{ success: boolean; pardusConfig: Record<string, any> }>(response);
  },

  // Server endpoints
  async getServerStatus(): Promise<ServerStatus> {
    const response = await fetch(`${API_BASE}/server/status`);
    return handleResponse<ServerStatus>(response);
  },
};
