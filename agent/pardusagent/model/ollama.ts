import type { ModelConfig, ModelResponse, ChatMessage, ModelExecutor, ToolCall } from './types';

export class OllamaModel implements ModelExecutor {
  private baseURL: string;

  constructor(baseURL = 'http://localhost:11434') {
    this.baseURL = baseURL;
  }

  async chat(messages: ChatMessage[], config: ModelConfig): Promise<ModelResponse> {
    const requestBody: any = {
      model: config.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      options: {
        temperature: config.temperature || 0.7,
        top_p: config.topP,
      },
      stream: false,
    };

    // Add tools if provided (Ollama supports tools)
    if (config.tools && config.tools.length > 0) {
      requestBody.tools = config.tools;
    }

    const response = await fetch(`${this.baseURL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle tool calls
    const toolCalls: ToolCall[] = [];
    if (data.message?.tool_calls) {
      for (const toolCall of data.message.tool_calls) {
        toolCalls.push({
          id: toolCall.id,
          name: toolCall.function?.name || toolCall.name,
          arguments: typeof toolCall.function?.arguments === 'string' 
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.arguments,
        });
      }
    }
    
    return {
      content: data.message?.content || '',
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      model: config.model,
    };
  }

  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseURL}/api/tags`);
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.models?.map((model: any) => model.name) || [];
  }
}