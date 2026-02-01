import type { ModelConfig, ModelResponse, ChatMessage, ModelExecutor, ToolCall } from './types';

export class AnthropicModel implements ModelExecutor {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL = 'https://api.anthropic.com') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async chat(messages: ChatMessage[], config: ModelConfig): Promise<ModelResponse> {
    // Convert messages to Anthropic format
    const systemMessage = messages.find(msg => msg.role === 'system');
    let conversationMessages = messages.filter(msg => msg.role !== 'system');

    const requestBody: any = {
      model: config.model,
      messages: conversationMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      })),
      system: systemMessage?.content,
      max_tokens: config.maxTokens || 1024,
      temperature: config.temperature,
      top_p: config.topP,
      stream: false,
    };

    // Add tools if provided
    if (config.tools && config.tools.length > 0) {
      requestBody.tools = config.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters,
      }));
      
      if (config.toolChoice === 'required') {
        requestBody.tool_choice = { type: 'any' };
      } else if (config.toolChoice === 'none') {
        requestBody.tool_choice = { type: 'auto' }; // Anthropic doesn't have 'none', use 'auto'
      } else {
        requestBody.tool_choice = { type: 'auto' };
      }
    }

    const response = await fetch(`${this.baseURL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle tool calls and content
    let content = '';
    const toolCalls: ToolCall[] = [];
    
    if (data.content && Array.isArray(data.content)) {
      for (const contentBlock of data.content) {
        if (contentBlock.type === 'text') {
          content += contentBlock.text;
        } else if (contentBlock.type === 'tool_use') {
          toolCalls.push({
            id: contentBlock.id,
            name: contentBlock.name,
            arguments: contentBlock.input,
          });
        }
      }
    }
    
    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      } : undefined,
      model: data.model,
    };
  }
}