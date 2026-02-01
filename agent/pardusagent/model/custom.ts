import type { ModelConfig, ModelResponse, ChatMessage, ModelExecutor, ToolCall } from './types';

export class CustomModel implements ModelExecutor {
  private apiKey: string;
  private baseURL: string;
  private headers: Record<string, string>;

  constructor(apiKey: string, baseURL: string, headers: Record<string, string> = {}) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...headers,
    };
  }

  async chat(messages: ChatMessage[], config: ModelConfig): Promise<ModelResponse> {
    const requestBody: any = {
      model: config.model,
      messages: messages,
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens,
      top_p: config.topP,
      stream: false,
    };

    // Add tools if provided
    if (config.tools && config.tools.length > 0) {
      requestBody.tools = config.tools;
      requestBody.tool_choice = config.toolChoice || 'auto';
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Custom API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle different response formats from custom APIs
    let content = '';
    let usage = undefined;
    let model = config.model;
    const toolCalls: ToolCall[] = [];

    if (data.choices && data.choices[0]?.message) {
      const message = data.choices[0].message;
      content = message.content || '';
      
      // Handle tool calls in OpenAI-compatible format
      if (message.tool_calls) {
        for (const toolCall of message.tool_calls) {
          toolCalls.push({
            id: toolCall.id,
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments),
          });
        }
      }
      
      usage = data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined;
      model = data.model || config.model;
    } else if (data.content) {
      content = data.content;
    } else if (data.text) {
      content = data.text;
    }
    
    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage,
      model,
    };
  }
}