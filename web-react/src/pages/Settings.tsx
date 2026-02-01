import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Cpu, Key, Timer } from 'lucide-react';
import type { PardusConfig } from '@/types/config';

export default function Settings() {
  const queryClient = useQueryClient();
  const [heartbeat, setHeartbeat] = useState(60);
  const [agentTimeout, setAgentTimeout] = useState(15);
  const [pardusConfig, setPardusConfig] = useState<PardusConfig>({
    modelProvider: 'openai',
    model: 'gpt-4',
    apiKey: '',
    baseURL: '',
    temperature: 0.7,
    maxTokens: 4096,
  });

  const { data: config, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: () => api.getConfig(),
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data (formerly cacheTime)
  });

  const { data: pardusData } = useQuery({
    queryKey: ['pardus-config'],
    queryFn: () => api.getPardusConfig(),
  });

  // Load Pardus config when data changes
  useEffect(() => {
    if (pardusData && Object.keys(pardusData).length > 0) {
      setPardusConfig(pardusData as PardusConfig);
    }
  }, [pardusData]);

  const heartbeatMutation = useMutation({
    mutationFn: (duration: number) => api.setHeartbeat(duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'server-status'] });
    },
  });

  const agentMutation = useMutation({
    mutationFn: (agentType: 'claude-code' | 'opencode' | 'cursor' | 'pardus') =>
      api.setAgentType(agentType),
    onSuccess: async () => {
      // Invalidate and refetch config queries
      await queryClient.invalidateQueries({ queryKey: ['config'] });
      await queryClient.refetchQueries({ queryKey: ['config'] });
      await queryClient.invalidateQueries({ queryKey: ['server-status'] });
      await queryClient.refetchQueries({ queryKey: ['server-status'] });
    },
  });

  const agentTimeoutMutation = useMutation({
    mutationFn: (duration: number) => api.setAgentTimeout(duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
    },
  });

  const pardusConfigMutation = useMutation({
    mutationFn: (config: PardusConfig) => api.updatePardusConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pardus-config'] });
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure system settings and preferences</p>
      </div>

      {/* Heartbeat Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Heartbeat Duration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Current: {config?.heartbeat ? `${config.heartbeat / 1000}s` : 'N/A'}
            </p>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min="10"
                max="3600"
                step="10"
                value={config?.heartbeat ? config.heartbeat / 1000 : 60}
                onChange={(e) => setHeartbeat(parseInt(e.target.value) || 60)}
                className="w-32"
              />
              <span>seconds</span>
              <Button
                onClick={() => heartbeatMutation.mutate(heartbeat * 1000)}
                disabled={heartbeatMutation.isPending}
              >
                {heartbeatMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            The heartbeat interval determines how often the task processor checks for new tasks.
            Lower values = more responsive, higher values = less CPU usage.
          </p>
        </CardContent>
      </Card>

      {/* Agent Timeout Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Agent Timeout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Current: {config?.agentTimeout ? `${config.agentTimeout / 60000} minutes` : 'N/A'}
            </p>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min="1"
                max="60"
                step="1"
                value={config?.agentTimeout ? config.agentTimeout / 60000 : 15}
                onChange={(e) => setAgentTimeout(parseInt(e.target.value) || 15)}
                className="w-32"
              />
              <span>minutes</span>
              <Button
                onClick={() => agentTimeoutMutation.mutate(agentTimeout * 60000)}
                disabled={agentTimeoutMutation.isPending}
              >
                {agentTimeoutMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            The agent timeout determines how long to wait for an agent to complete a task before
            cancelling it. If your tasks take a long time to complete, increase this value.
            Range: 1-60 minutes.
          </p>
        </CardContent>
      </Card>

      {/* Agent Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Agent Type
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Current: {config?.agentType || 'claude-code'}
            </p>
            <div className="flex gap-2 flex-wrap">
              {(['claude-code', 'opencode', 'cursor', 'pardus'] as const).map((agentType) => (
                <Button
                  key={agentType}
                  variant={config?.agentType === agentType ? 'default' : 'outline'}
                  onClick={() => agentMutation.mutate(agentType)}
                  disabled={agentMutation.isPending}
                >
                  {agentType}
                </Button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Select which AI agent to use for task execution. Each agent has different capabilities
            and requirements.
          </p>
        </CardContent>
      </Card>

      {/* Pardus Agent Configuration */}
      {config?.agentType === 'pardus' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Pardus Agent Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Model Provider */}
              <div>
                <label className="text-sm font-medium mb-2 block">Model Provider</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={pardusConfig.modelProvider}
                  onChange={(e) => setPardusConfig({ ...pardusConfig, modelProvider: e.target.value as PardusConfig['modelProvider'] })}
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="ollama">Ollama</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="text-sm font-medium mb-2 block">Model</label>
                <Input
                  placeholder="gpt-4, claude-3-opus, etc."
                  value={pardusConfig.model}
                  onChange={(e) => setPardusConfig({ ...pardusConfig, model: e.target.value })}
                />
              </div>

              {/* API Key */}
              <div>
                <label className="text-sm font-medium mb-2 block">API Key</label>
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={pardusConfig.apiKey || ''}
                  onChange={(e) => setPardusConfig({ ...pardusConfig, apiKey: e.target.value })}
                />
              </div>

              {/* Base URL */}
              <div>
                <label className="text-sm font-medium mb-2 block">Base URL (optional)</label>
                <Input
                  placeholder="https://api.openai.com/v1"
                  value={pardusConfig.baseURL || ''}
                  onChange={(e) => setPardusConfig({ ...pardusConfig, baseURL: e.target.value })}
                />
              </div>

              {/* Temperature */}
              <div>
                <label className="text-sm font-medium mb-2 block">Temperature: {pardusConfig.temperature}</label>
                <Input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={pardusConfig.temperature || 0.7}
                  onChange={(e) => setPardusConfig({ ...pardusConfig, temperature: parseFloat(e.target.value) })}
                />
              </div>

              {/* Max Tokens */}
              <div>
                <label className="text-sm font-medium mb-2 block">Max Tokens</label>
                <Input
                  type="number"
                  min="1"
                  max="128000"
                  step="1"
                  value={pardusConfig.maxTokens || 4096}
                  onChange={(e) => setPardusConfig({ ...pardusConfig, maxTokens: parseInt(e.target.value) || 4096 })}
                />
              </div>

              {/* System Prompt */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">System Prompt (optional)</label>
                <Textarea
                  placeholder="You are a helpful AI assistant..."
                  value={pardusConfig.systemPrompt || ''}
                  onChange={(e) => setPardusConfig({ ...pardusConfig, systemPrompt: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <Button
              onClick={() => pardusConfigMutation.mutate(pardusConfig)}
              disabled={pardusConfigMutation.isPending}
              className="mt-4"
            >
              {pardusConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </Button>

            <p className="text-xs text-muted-foreground mt-4">
              Configure the Pardus agent with your model provider credentials and settings.
              The API key is stored locally and only sent to your configured base URL.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
