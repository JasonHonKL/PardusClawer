import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scroll, FileText, Loader } from 'lucide-react';

interface LogViewerProps {
  uuid: string;
  title: string;
  autoRefresh?: boolean;
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

const parseLogEntry = (line: string): LogEntry | null => {
  if (!line.trim()) return null;

  // Parse timestamp [2024-01-01T12:00:00.000Z]
  const timestampMatch = line.match(/^\[([^\]]+)\]/);
  const timestamp = timestampMatch ? timestampMatch[1] : '';
  const message = timestampMatch ? line.slice(timestampMatch[0].length).trim() : line;

  // Determine type based on emoji
  let type: LogEntry['type'] = 'info';
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
};

const formatTimestamp = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

const getTypeColor = (type: LogEntry['type']): string => {
  switch (type) {
    case 'success':
      return 'text-green-500';
    case 'error':
      return 'text-red-500';
    case 'warning':
      return 'text-yellow-500';
    default:
      return 'text-blue-500';
  }
};

const getTypeBg = (type: LogEntry['type']): string => {
  switch (type) {
    case 'success':
      return 'bg-green-500/10 border-green-500/20';
    case 'error':
      return 'bg-red-500/10 border-red-500/20';
    case 'warning':
      return 'bg-yellow-500/10 border-yellow-500/20';
    default:
      return 'bg-blue-500/10 border-blue-500/20';
  }
};

export function LogViewer({ uuid, title, autoRefresh = true }: LogViewerProps) {
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Set up SSE connection for streaming logs
  useEffect(() => {
    if (!autoRefresh) {
      // If auto-refresh is disabled, just fetch logs once
      api.getLogs(uuid).then((data) => {
        setLogs(data.logs);
        setIsLoading(false);
      });
      return;
    }

    setIsLoading(true);
    setLogs([]);

    // Create EventSource for SSE
    const eventSource = new EventSource(api.getLogsStreamUrl(uuid));

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setIsLoading(false);
    };

    eventSource.addEventListener('ready', (_event: MessageEvent) => {
      console.log('Log stream ready');
    });

    eventSource.addEventListener('log', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === 'log' && data.message) {
        setLogs((prev) => [...prev, data.message]);
      }
    });

    eventSource.addEventListener('error', (event: MessageEvent) => {
      console.error('Log stream error:', event);
      setIsConnected(false);
    });

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      setIsConnected(false);
      setIsLoading(false);
    };

    return () => {
      eventSource.close();
    };
  }, [uuid, autoRefresh]);

  const parsedLogs = logs
    .map(parseLogEntry)
    .filter((log): log is LogEntry => log !== null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isAutoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [parsedLogs, isAutoScroll]);

  // Handle scroll to detect if user scrolled up
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100;
      setIsAutoScroll(isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Scroll className="h-5 w-5" />
          <CardTitle>Agent Logs - {title}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? 'default' : 'outline'} className="gap-1">
            {isConnected && <Loader className="h-3 w-3 animate-spin" />}
            {isConnected ? 'Live Stream' : 'Disconnected'}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsAutoScroll(true);
              logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Scroll to Bottom
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={containerRef}
          className="bg-muted/30 rounded-lg p-4 h-[500px] overflow-y-auto font-mono text-sm space-y-1"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Loader className="h-6 w-6 animate-spin mr-2" />
              Connecting to log stream...
            </div>
          ) : parsedLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">No Logs Available</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {autoRefresh && isConnected
                    ? 'Waiting for agent output...'
                    : autoRefresh
                    ? 'Connecting to log stream...'
                    : 'This task has not been executed yet or has no logs.'}
                </p>
              </div>
              {!autoRefresh && (
                <div className="text-xs text-muted-foreground max-w-md">
                  <p className="font-medium mb-1">When will logs be available?</p>
                  <ul className="list-disc list-inside space-y-1 text-left">
                    <li>Run the task (click the Play button)</li>
                    <li>Wait for the task to start processing</li>
                    <li>Logs will stream here in real-time</li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              {parsedLogs.map((log, index) => (
                <div
                  key={index}
                  className={`flex gap-3 p-2 rounded border ${getTypeBg(log.type)} hover:bg-opacity-80 transition-colors`}
                >
                  <span className="text-muted-foreground text-xs flex-shrink-0 font-mono">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <span className={`flex-1 break-words ${getTypeColor(log.type)}`}>
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </>
          )}
        </div>
        {parsedLogs.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>{parsedLogs.length} log entries</span>
            <span>
              {isAutoScroll ? '📍 Auto-scroll enabled' : '⏸️ Auto-scroll paused (scroll to enable)'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
