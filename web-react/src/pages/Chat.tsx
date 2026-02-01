import { ChatAgent } from '@/components/ChatAgent';

export default function Chat() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chat with Agent</h1>
        <p className="text-muted-foreground">Interact with the AI agent in real-time</p>
      </div>
      <ChatAgent />
    </div>
  );
}
