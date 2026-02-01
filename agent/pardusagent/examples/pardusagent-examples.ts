/**
 * PardusAgent Usage Examples
 * 
 * This demonstrates how to use the PardusAgent with various configurations
 * and how to integrate it into your applications.
 */

import { createPardusAgent, PardusAgent } from '../agent/index';
import { ToolFactory } from '../tool/index';
import type { PardusAgentConfig, PardusAgentOptions } from '../agent/index';

// Example 1: Basic Usage
async function basicExample() {
  console.log('🤖 PardusAgent Basic Example\n');

  const config: PardusAgentConfig = {
    spawnPath: process.cwd(),
    prompt: 'List the files in the current directory and tell me what this project is about.',
    modelConfig: {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY || 'your-api-key',
      model: 'gpt-4',
      temperature: 0.1,
    },
  };

  const agent = createPardusAgent(config);

  try {
    const result = await agent.execute(config);
    console.log('✅ Success:', result.output);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Example 2: Advanced Usage with Custom Options
async function advancedExample() {
  console.log('\n🚀 PardusAgent Advanced Example\n');

  const config: PardusAgentConfig = {
    spawnPath: process.cwd(),
    prompt: 'Create a simple TypeScript file that demonstrates the tool system and then run it to see the output.',
    modelConfig: {
      provider: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY || 'your-api-key',
      model: 'claude-3-sonnet-20240229',
      temperature: 0.3,
      maxTokens: 4000,
    },
    systemPrompt: `You are an expert TypeScript developer with access to powerful tools.
    When asked to create code, always:
    1. Create the file with proper TypeScript syntax
    2. Use the tools to write the file
    3. Run the code if requested
    4. Show the output and explain what happened`,
    maxIterations: 15,
    toolChoice: 'auto',
  };

  const options: PardusAgentOptions = {
    enableTools: true,
    verbose: true,
    onToolCall: (toolName: string, args: any) => {
      console.log(`🔧 Tool called: ${toolName} with args:`, args);
    },
    onModelResponse: (response) => {
      console.log(`📝 Model response received with ${response.toolCalls?.length || 0} tool calls`);
    },
  };

  const agent = createPardusAgent(config, options);

  try {
    const result = await agent.execute(config);
    console.log('✅ Final Result:', result.output);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Example 3: Multi-step Conversation
async function conversationExample() {
  console.log('\n💬 PardusAgent Conversation Example\n');

  const config: PardusAgentConfig = {
    spawnPath: process.cwd(),
    prompt: 'Help me understand this codebase. First, show me the project structure, then search for files containing "agent", and finally summarize what you found.',
    modelConfig: {
      provider: 'openrouter',
      apiKey: process.env.OPENROUTER_API_KEY || 'your-api-key',
      model: 'anthropic/claude-3.5-sonnet',
      temperature: 0.1,
    },
  };

  const agent = createPardusAgent(config, {
    verbose: true,
  });

  try {
    const result = await agent.execute(config);
    console.log('✅ Analysis complete:', result.output);
    
    // Show conversation history
    console.log('\n📚 Conversation History:');
    const messages = agent.getMessages();
    messages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.role}] ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Example 4: Different Model Providers
async function modelProviderExample() {
  console.log('\n🌐 PardusAgent Model Provider Example\n');

  const providers = [
    {
      name: 'OpenAI',
      config: {
        provider: 'openai' as const,
        apiKey: process.env.OPENAI_API_KEY || 'test-key',
        model: 'gpt-4',
      },
    },
    {
      name: 'Anthropic',
      config: {
        provider: 'anthropic' as const,
        apiKey: process.env.ANTHROPIC_API_KEY || 'test-key',
        model: 'claude-3-sonnet-20240229',
      },
    },
    {
      name: 'Ollama',
      config: {
        provider: 'ollama' as const,
        model: 'llama3.1:8b',
        baseURL: 'http://localhost:11434',
      },
    },
  ];

  for (const provider of providers) {
    console.log(`\n🔍 Testing ${provider.name}...`);
    
    const config: PardusAgentConfig = {
      spawnPath: process.cwd(),
      prompt: 'What tools do you have available?',
      modelConfig: provider.config,
    };

    const agent = createPardusAgent(config, {
      enableTools: true,
    });

    try {
      const result = await agent.execute(config);
      console.log(`${provider.name} response: ${result.output?.substring(0, 200)}...`);
    } catch (error) {
      console.log(`${provider.name} error:`, error instanceof Error ? error.message : String(error));
    }
  }
}

// Example 5: Custom Tool Integration
async function customToolExample() {
  console.log('\n🛠️ PardusAgent Custom Tool Example\n');

  // Add a custom tool to the registry
  const registry = ToolFactory.getRegistry();
  
  const weatherTool = {
    name: 'get_weather',
    description: 'Get current weather for a city',
    parameters: {
      type: 'object' as const,
      properties: {
        city: {
          type: 'string' as const,
          description: 'The city name',
          required: true,
        },
      },
      required: ['city'],
    },
    execute: async (params: { city: string }) => {
      // Mock weather data
      return {
        success: true,
        data: {
          city: params.city,
          temperature: '72°F',
          condition: 'sunny',
          humidity: '45%',
        },
      };
    },
  };

  registry.register(weatherTool);

  const config: PardusAgentConfig = {
    spawnPath: process.cwd(),
    prompt: 'What is the weather like in San Francisco and Tokyo?',
    modelConfig: {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY || 'test-key',
      model: 'gpt-4',
    },
  };

  const agent = createPardusAgent(config, {
    verbose: true,
  });

  try {
    const result = await agent.execute(config);
    console.log('✅ Weather result:', result.output);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Example 6: Web Automation Task
async function webAutomationExample() {
  console.log('\n🌍 PardusAgent Web Automation Example\n');

  const config: PardusAgentConfig = {
    spawnPath: process.cwd(),
    prompt: 'Go to example.com, take a screenshot, and tell me what the main heading says.',
    modelConfig: {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY || 'test-key',
      model: 'gpt-4',
    },
    systemPrompt: `You are a web automation assistant. You can:
    - Navigate to websites using the browser tool
    - Take screenshots to capture visual information
    - Extract text and data from web pages
    - Click elements and fill forms if needed
    
    Always explain what you're doing and show the results.`,
  };

  const agent = createPardusAgent(config, {
    verbose: true,
    onToolCall: (toolName, args) => {
      if (toolName === 'browser') {
        console.log(`🌐 Browser action: ${args.action}`);
      }
    },
  });

  try {
    const result = await agent.execute(config);
    console.log('✅ Web automation complete:', result.output);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Example 7: Code Generation and Execution
async function codeGenExample() {
  console.log('\n💻 PardusAgent Code Generation Example\n');

  const config: PardusAgentConfig = {
    spawnPath: process.cwd(),
    prompt: 'Create a TypeScript file that calculates fibonacci numbers and test it with a few examples.',
    modelConfig: {
      provider: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY || 'test-key',
      model: 'claude-3-sonnet-20240229',
      temperature: 0.1,
    },
    maxIterations: 20,
  };

  const agent = createPardusAgent(config, {
    verbose: true,
  });

  try {
    const result = await agent.execute(config);
    console.log('✅ Code generation complete:', result.output);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run all examples
async function runAllExamples() {
  console.log('🎯 PardusAgent Usage Examples\n');
  console.log('='.repeat(50));

  try {
    await basicExample();
    await advancedExample();
    await conversationExample();
    await modelProviderExample();
    await customToolExample();
    await webAutomationExample();
    await codeGenExample();
  } catch (error) {
    console.error('💥 Example failed:', error);
  }

  console.log('\n✨ All examples completed!');
}

// Export for individual testing
export {
  basicExample,
  advancedExample,
  conversationExample,
  modelProviderExample,
  customToolExample,
  webAutomationExample,
  codeGenExample,
  runAllExamples,
};

// Run examples if this file is executed directly
if (import.meta.main) {
  runAllExamples().catch(console.error);
}