import type { ModelConfig, ModelResponse, ChatMessage, ModelExecutor, ToolCall } from './types';

export class OpenAIModel implements ModelExecutor {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const message = data.choices[0]?.message;
    
    // Handle tool calls
    const toolCalls: ToolCall[] = [];
    if (message?.tool_calls) {
      for (const toolCall of message.tool_calls) {
        toolCalls.push({
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments),
        });
      }
    }
    
    return {
      content: message?.content || '',
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
      model: data.model,
    };
  }
}