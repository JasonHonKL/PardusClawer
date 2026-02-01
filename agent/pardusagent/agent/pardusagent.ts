import type { AgentConfig, AgentResult, AgentExecutor } from '../../../agent/types';
import type { ModelConfig, ChatMessage, ModelResponse, ToolCall } from '../model/types';
import type { ToolRegistry, ToolDefinition } from '../tool/types';
import { ModelFactory } from '../model/index';
import { ToolFactory } from '../tool/index';

export interface PardusAgentConfig extends AgentConfig {
  modelConfig: ModelConfig;
  systemPrompt?: string;
  maxIterations?: number;
  toolChoice?: 'auto' | 'required' | 'none';
}

export interface PardusAgentOptions {
  enableTools?: boolean;
  verbose?: boolean;
  onToolCall?: (toolName: string, arguments: any) => void;
  onModelResponse?: (response: ModelResponse) => void;
}

export class PardusAgent {
  private modelConfig: ModelConfig;
  private toolRegistry: ToolRegistry;
  private systemPrompt: string;
  private maxIterations: number;
  private toolChoice: 'auto' | 'required' | 'none';
  private options: PardusAgentOptions;

  constructor(config: PardusAgentConfig, options: PardusAgentOptions = {}) {
    this.modelConfig = config.modelConfig;
    this.systemPrompt = config.systemPrompt || this.getDefaultSystemPrompt();
    this.maxIterations = config.maxIterations || 10;
    this.toolChoice = config.toolChoice || 'auto';
    this.options = {
      enableTools: options.enableTools ?? true,
      verbose: options.verbose ?? false,
      onToolCall: options.onToolCall,
      onModelResponse: options.onModelResponse,
    };
    
    // Initialize tool registry
    this.toolRegistry = ToolFactory.getRegistry();
    
    // Create model with tools
    if (this.options.enableTools) {
      const tools = this.toolRegistry.getToolDefinitions();
      this.model = ModelFactory.createWithTools(this.modelConfig, tools, this.toolChoice);
    } else {
      this.model = ModelFactory.create(this.modelConfig);
    }

    // Initialize messages with system prompt
    this.messages = [
      {
        role: 'system',
        content: this.systemPrompt,
      },
    ];
  }

  private model: any;
  private messages: ChatMessage[] = [];

  private getDefaultSystemPrompt(): string {
    return `You are PardusAgent, an intelligent AI assistant with access to various tools to help with software development, file management, web automation, and system operations.

You have access to the following tools:
- bash: Execute terminal commands
- file: Read, write, and manage files
- search: Search for text patterns in code
- browser: Automate web browser actions
- git: Execute git version control commands
- network: Make HTTP requests and check connectivity

Guidelines:
1. Use tools when they can help complete tasks more effectively
2. Explain what you're doing and show relevant results
3. Be helpful, accurate, and thorough in your responses
4. When executing bash commands, show both the command and output
5. For file operations, show file paths and relevant content
6. If a tool fails, explain the error and suggest alternatives

Autonomous Problem Solving (CRITICAL!):
- NEVER ask questions that the user cannot reasonably answer
- Make reasonable assumptions and proceed with tasks independently
- Use common sense to interpret ambiguous requests
- Choose sensible defaults when multiple options exist
- Be proactive and solve problems without asking for clarification
- Only ask for help if the task is genuinely impossible without additional information
- Trust your judgment and make decisions rather than stalling
- If unsure about a detail, pick the most logical option and continue
- The goal is to complete tasks autonomously, not to engage in back-and-forth

Always aim to be helpful and efficient in solving the user's tasks.`;
  }

  async execute(config: AgentConfig): Promise<AgentResult> {
    try {
      // Reset conversation and add user message
      this.messages = [
        {
          role: 'system',
          content: this.systemPrompt,
        },
        {
          role: 'user',
          content: config.prompt,
        },
      ];

      if (this.options.verbose) {
        console.log(`🤖 PardusAgent starting with prompt: "${config.prompt}"`);
        console.log(`🔧 Tools enabled: ${this.options.enableTools}`);
        console.log(`🎯 Tool choice: ${this.toolChoice}`);
      }

      const response = await this.executeWithTools();
      
      return {
        success: true,
        output: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeWithTools(): Promise<string> {
    let iterations = 0;
    let finalResponse = '';

    while (iterations < this.maxIterations) {
      iterations++;

      if (this.options.verbose) {
        console.log(`\n📝 Iteration ${iterations}/${this.maxIterations}`);
      }

      // Get model response
      const response = await this.model.chat(this.messages, this.modelConfig);
      
      if (this.options.onModelResponse) {
        this.options.onModelResponse(response);
      }

      // Add assistant response to conversation
      this.messages.push({
        role: 'assistant',
        content: response.content,
        toolCalls: response.toolCalls,
      });

      // Check if model wants to use tools
      if (response.toolCalls && response.toolCalls.length > 0) {
        if (this.options.verbose) {
          console.log(`🔧 Model requested ${response.toolCalls.length} tool calls`);
        }

        // Execute each tool call
        for (const toolCall of response.toolCalls) {
          await this.executeToolCall(toolCall);
        }
      } else {
        // No more tool calls, this is the final response
        finalResponse = response.content;
        if (this.options.verbose) {
          console.log(`✅ Final response received`);
        }
        break;
      }
    }

    if (iterations >= this.maxIterations) {
      finalResponse = `I reached the maximum number of iterations (${this.maxIterations}). Here's my current assessment: ${finalResponse}`;
    }

    return finalResponse;
  }

  private async executeToolCall(toolCall: ToolCall): Promise<void> {
    try {
      if (this.options.verbose) {
        console.log(`  🔨 Executing ${toolCall.name}: ${JSON.stringify(toolCall.arguments)}`);
      }

      if (this.options.onToolCall) {
        this.options.onToolCall(toolCall.name, toolCall.arguments);
      }

      // Execute the tool
      const result = await this.toolRegistry.execute(toolCall.name, toolCall.arguments);
      
      // Add tool result to conversation
      this.messages.push({
        role: 'tool',
        content: JSON.stringify(result),
        toolCallId: toolCall.id,
      });

      if (this.options.verbose) {
        if (result.success) {
          console.log(`  ✅ ${toolCall.name} succeeded`);
          if (result.data) {
            console.log(`  📊 Result:`, result.data);
          }
        } else {
          console.log(`  ❌ ${toolCall.name} failed: ${result.error}`);
        }
      }
    } catch (error) {
      // Add error result to conversation
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
      
      this.messages.push({
        role: 'tool',
        content: JSON.stringify(errorResult),
        toolCallId: toolCall.id,
      });

      if (this.options.verbose) {
        console.log(`  ❌ ${toolCall.name} error: ${errorResult.error}`);
      }
    }
  }

  // Public methods for external control
  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  clearConversation(): void {
    this.messages = [];
  }

  addMessage(message: ChatMessage): void {
    this.messages.push(message);
  }

  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  getAvailableTools(): ToolDefinition[] {
    return this.toolRegistry.getToolDefinitions();
  }
}

export const createPardusAgent = (config: PardusAgentConfig, options?: PardusAgentOptions): PardusAgent => {
  return new PardusAgent(config, options);
};

export const pardusAgentExecutor: AgentExecutor = async (config: AgentConfig): Promise<AgentResult> => {
  // Default configuration for pardus agent
  const defaultModelConfig = {
    provider: 'openai' as const,
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4',
    temperature: 0.1,
  };

  const pardusConfig: PardusAgentConfig = {
    ...config,
    modelConfig: defaultModelConfig,
    maxIterations: 10,
    toolChoice: 'auto',
  };

  const agent = new PardusAgent(pardusConfig);
  return agent.execute(config);
};