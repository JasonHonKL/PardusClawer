/**
 * PardusAgent External Interface Demonstration
 * 
 * This shows how to use the pardus.ts external interface
 * which follows the same pattern as opencode, cursor, and claude-code agents.
 */

import { createPardusExternalConfig, getAgentExecutor } from '../config/agentconfig';
import type { PardusAgentExternalConfig } from '../agent/pardus';

async function demonstrateExternalInterface() {
  console.log('🎯 PardusAgent External Interface Demo\n');

  // Create configuration using the external interface (same pattern as other agents)
  const agentConfig = createPardusExternalConfig();
  const executor = getAgentExecutor(agentConfig);

  // External configuration that includes model settings
  const externalConfig: PardusAgentExternalConfig = {
    spawnPath: process.cwd(),
    prompt: 'Analyze this codebase structure and explain what PardusCrawler does.',
    modelProvider: 'openai',
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY || 'your-api-key',
    temperature: 0.1,
    enableTools: true,
    systemPrompt: `You are PardusAgent, an intelligent coding assistant with access to powerful tools.
    Analyze the codebase structure and explain the project's purpose and architecture.`,
  };

  console.log('🔧 Agent Configuration:');
  console.log(`  Type: ${agentConfig.type}`);
  console.log(`  Model Provider: ${externalConfig.modelProvider}`);
  console.log(`  Model: ${externalConfig.model}`);
  console.log(`  Tools Enabled: ${externalConfig.enableTools}`);

  try {
    console.log('\n🤖 Executing PardusAgent...');
    const result = await executor(externalConfig);
    
    if (result.success) {
      console.log('\n✅ Success:');
      console.log(result.output);
    } else {
      console.log('\n❌ Error:');
      console.log(result.error);
    }
  } catch (error) {
    console.error('\n💥 Unexpected error:', error);
  }
}

async function demonstrateMultipleProviders() {
  console.log('\n🌐 Multiple Provider Demo\n');

  const providers = [
    {
      name: 'OpenAI',
      config: {
        modelProvider: 'openai' as const,
        model: 'gpt-4',
        apiKey: process.env.OPENAI_API_KEY || 'demo-key',
      },
    },
    {
      name: 'Anthropic',
      config: {
        modelProvider: 'anthropic' as const,
        model: 'claude-3-sonnet-20240229',
        apiKey: process.env.ANTHROPIC_API_KEY || 'demo-key',
      },
    },
    {
      name: 'Ollama',
      config: {
        modelProvider: 'ollama' as const,
        model: 'llama3.1:8b',
        baseURL: 'http://localhost:11434',
      },
    },
  ];

  for (const provider of providers) {
    console.log(`\n--- Testing ${provider.name} ---`);
    
    const config: PardusAgentExternalConfig = {
      spawnPath: process.cwd(),
      prompt: 'List the tools you have available.',
      ...provider.config,
      enableTools: true,
    };

    try {
      const result = await pardusAgentExecutor(config);
      console.log(`${provider.name}: ${result.success ? '✅ Success' : '❌ Failed'}`);
      if (result.success && result.output) {
        console.log(`Response: ${result.output.substring(0, 150)}...`);
      } else if (!result.success) {
        console.log(`Error: ${result.error}`);
      }
    } catch (error) {
      console.log(`${provider.name}: ❌ Exception - ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

async function demonstrateAdvancedConfiguration() {
  console.log('\n⚙️ Advanced Configuration Demo\n');

  const config: PardusAgentExternalConfig = {
    spawnPath: process.cwd(),
    prompt: 'Create a simple TypeScript file and then run it with TypeScript compiler.',
    modelProvider: 'openrouter',
    model: 'anthropic/claude-3.5-sonnet',
    apiKey: process.env.OPENROUTER_API_KEY || 'demo-key',
    baseURL: 'https://openrouter.ai/api/v1',
    temperature: 0.2,
    maxTokens: 3000,
    topP: 0.8,
    systemPrompt: `You are an expert TypeScript developer with access to comprehensive tools.
    When asked to create code:
    1. Create the TypeScript file using the file tool
    2. Show the file content
    3. Compile and run it using the bash tool
    4. Display and explain the results`,
    maxIterations: 20,
    toolChoice: 'auto',
    enableTools: true,
  };

  console.log('🔧 Advanced Settings:');
  console.log(`  Provider: ${config.modelProvider}`);
  console.log(`  Model: ${config.model}`);
  console.log(`  Temperature: ${config.temperature}`);
  console.log(`  Max Tokens: ${config.maxTokens}`);
  console.log(`  Max Iterations: ${config.maxIterations}`);
  console.log(`  Tool Choice: ${config.toolChoice}`);

  try {
    const result = await pardusAgentExecutor(config);
    
    if (result.success) {
      console.log('\n✅ Advanced execution successful:');
      console.log(result.output);
    } else {
      console.log('\n❌ Advanced execution failed:');
      console.log(result.error);
    }
  } catch (error) {
    console.error('\n💥 Advanced execution exception:', error);
  }
}

async function runAllDemos() {
  console.log('🎯 PardusAgent External Interface Demonstrations\n');
  console.log('='.repeat(50));

  try {
    await demonstrateExternalInterface();
    await demonstrateMultipleProviders();
    await demonstrateAdvancedConfiguration();
    
    console.log('\n✨ All external interface demos completed!');
  } catch (error) {
    console.error('💥 Demo failed:', error);
  }
}

export {
  demonstrateExternalInterface,
  demonstrateMultipleProviders,
  demonstrateAdvancedConfiguration,
  runAllDemos,
};

// Run demonstrations if this file is executed directly
if (import.meta.main) {
  runAllDemos().catch(console.error);
}