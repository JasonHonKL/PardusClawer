import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Loader, User, Bot, Copy, Check, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  agent?: string;
}

interface ChatAgentProps {
  conversationId?: string;
}

export function ChatAgent({ conversationId = 'default' }: ChatAgentProps) {
  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: () => api.getConfig(),
  });

  const { data: pardusConfig } = useQuery({
    queryKey: ['pardus-config'],
    queryFn: () => api.getPardusConfig(),
    refetchInterval: false,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if chat is available
  const isChatAvailable = config?.agentType && (
    config.agentType !== 'pardus' ||
    (pardusConfig?.modelProvider && pardusConfig?.model && pardusConfig?.apiKey)
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setCurrentResponse('');

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`http://localhost:13337/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversation_id: conversationId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let agentType = '';

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'start':
                  agentType = data.agent;
                  break;
                case 'chunk':
                  setCurrentResponse((prev) => prev + data.content);
                  break;
                case 'done':
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: 'assistant',
                      content: data.content,
                      timestamp: Date.now(),
                      agent: agentType,
                    },
                  ]);
                  setCurrentResponse('');
                  break;
                case 'error':
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: 'assistant',
                      content: `Error: ${data.content}`,
                      timestamp: Date.now(),
                    },
                  ]);
                  setCurrentResponse('');
                  break;
                case 'timeout':
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: 'assistant',
                      content: 'Request timed out after 5 minutes.',
                      timestamp: Date.now(),
                    },
                  ]);
                  setCurrentResponse('');
                  break;
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Error: ${(error as Error).message}`,
            timestamp: Date.now(),
          },
        ]);
      }
      setCurrentResponse('');
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentResponse('');
  };

  return (
    <Card className="flex flex-col h-[700px]">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <CardTitle>Agent Chat</CardTitle>
          {config?.agentType && (
            <Badge variant="outline" className="text-xs">
              {config.agentType}
            </Badge>
          )}
          {isLoading && (
            <Badge variant="secondary" className="gap-1">
              <Loader className="h-3 w-3 animate-spin" />
              Streaming
            </Badge>
          )}
        </div>
        {messages.length > 0 && (
          <Button size="sm" variant="outline" onClick={clearChat}>
            Clear Chat
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Agent not configured warning */}
          {config?.agentType === 'pardus' && !isChatAvailable && (
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-destructive">Pardus agent not configured</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please configure your Pardus agent in Settings. You need to set the Model Provider, Model, and API Key.
                </p>
              </div>
            </div>
          )}

          {messages.length === 0 && !isLoading && isChatAvailable && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Bot className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Start a conversation</p>
              <p className="text-sm mt-2 max-w-md">
                Ask the {config?.agentType} agent to help you with coding tasks, data analysis, or any other questions.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {message.agent && message.role === 'assistant' && (
                      <Badge variant="outline" className="text-xs mb-2">
                        {message.agent}
                      </Badge>
                    )}
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {message.content}
                    </p>
                  </div>
                  {message.role === 'assistant' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 flex-shrink-0"
                      onClick={() => copyToClipboard(message.content, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-xs opacity-60 mt-2">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* Current streaming response */}
          {currentResponse && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="max-w-[80%] rounded-lg p-3 bg-muted border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Loader className="h-3 w-3 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Agent is thinking...</span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm">{currentResponse}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              disabled={isLoading || !isChatAvailable}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !isChatAvailable}
              className="flex-shrink-0 px-4"
            >
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {config?.agentType === 'pardus'
              ? isChatAvailable
                ? 'Responses are streamed in real-time from the Pardus agent'
                : 'Configure the Pardus agent in Settings to use chat'
              : `Responses are streamed in real-time from the ${config?.agentType || 'selected'} agent`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
