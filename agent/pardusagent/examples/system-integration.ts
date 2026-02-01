/**
 * PardusAgent Full System Integration
 * 
 * This demonstrates how to use PardusAgent as part of the
 * existing PardusCrawler agent system.
 */

import { createPardusAgent, type PardusAgentConfig } from '../agent/pardusagent/agent';
import { getAgentExecutor, createPardusConfig, type AgentConfig } from '../config/agentconfig';

async function demonstratePardusAgentIntegration() {
  console.log('🎯 PardusAgent System Integration Demo\n');

  // Method 1: Using the existing agent configuration system
  console.log('1️⃣ Using existing agent configuration system:');
  
  const agentConfig: AgentConfig = createPardusConfig();
  const executor = getAgentExecutor(agentConfig);
  
  console.log(`Agent type: ${agentConfig.type}`);
  console.log(`Executor available: ${typeof executor === 'function'}`);

  // Method 2: Using PardusAgent directly
  console.log('\n2️⃣ Using PardusAgent directly:');
  
  const pardusConfig: PardusAgentConfig = {
    spawnPath: process.cwd(),
    prompt: 'Analyze this codebase structure and tell me what PardusCrawler does.',
    modelConfig: {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY || 'your-api-key',
      model: 'gpt-4',
      temperature: 0.1,
    },
    systemPrompt: `You are PardusAgent, integrated into the PardusCrawler system.
      
You have access to the same tools as other agents in the system:
- File operations for reading and writing code
- Search capabilities for finding information in codebase
- Bash execution for running commands
- Browser automation for web tasks
- Git operations for version control
- Network requests for API calls

Use these tools to help users understand and work with the PardusCrawler project.`,
    maxIterations: 15,
    toolChoice: 'auto',
  };

  const agent = createPardusAgent(pardusConfig, {
    enableTools: true,
    verbose: true,
    onToolCall: (toolName, args) => {
      console.log(`🔧 Tool called: ${toolName} with ${JSON.stringify(args)}`);
    },
    onModelResponse: (response) => {
      console.log(`📝 Model response: ${response.content.substring(0, 100)}${response.content.length > 100 ? '...' : ''}`);
    },
  });

  try {
    const result = await agent.execute(pardusConfig);
    console.log('\n✅ PardusAgent Result:');
    console.log(result.output);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
  }
}

async function demonstrateMultipleAgents() {
  console.log('\n🔄 Multiple Agent Comparison Demo\n');

  const prompt = 'List the files in the current directory and explain what this project is about.';
  
  // Test all available agent types
  const agentTypes = ['opencode', 'cursor', 'claude-code', 'pardus'] as const;
  
  for (const agentType of agentTypes) {
    console.log(`\n--- Testing ${agentType} agent ---`);
    
    if (agentType === 'pardus') {
      // Use PardusAgent
      const pardusConfig: PardusAgentConfig = {
        spawnPath: process.cwd(),
        prompt,
        modelConfig: {
          provider: 'openai',
          apiKey: process.env.OPENAI_API_KEY || 'demo-key',
          model: 'gpt-4',
        },
      };
      
      const agent = createPardusAgent(pardusConfig, {
        verbose: false, // Reduce noise for demo
      });
      
      try {
        const result = await agent.execute(pardusConfig);
        console.log(`📋 ${agentType}: ${result.output?.substring(0, 200)}...`);
      } catch (error) {
        console.log(`❌ ${agentType}: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      // Use existing agent system (would need actual API keys)
      console.log(`📋 ${agentType}: Would use external ${agentType} service (requires API keys)`);
    }
  }
}

async function demonstrateToolCapabilities() {
  console.log('\n🛠️ PardusAgent Tool Capabilities Demo\n');

  const config: PardusAgentConfig = {
    spawnPath: process.cwd(),
    prompt: 'Show me what tools you have available by using each tool to demonstrate its capabilities. Start with file operations, then bash, then search.',
    modelConfig: {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY || 'demo-key',
      model: 'gpt-4',
    },
  };

  const agent = createPardusAgent(config, {
    verbose: true,
    maxIterations: 20, // Allow more tool calls for demo
  });

  try {
    const result = await agent.execute(config);
    console.log('\n✅ Tool demonstration complete:');
    console.log(result.output);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
  }
}

async function demonstrateCustomIntegration() {
  console.log('\n🔌 Custom Integration Demo\n');

  // Show how to integrate PardusAgent into your own system
  class MyPardusCrawler {
    private agent: any;

    constructor() {
      this.agent = createPardusAgent({
        spawnPath: process.cwd(),
        prompt: '', // Will be set per request
        modelConfig: {
          provider: 'anthropic',
          apiKey: process.env.ANTHROPIC_API_KEY || 'demo-key',
          model: 'claude-3-sonnet-20240229',
        },
        systemPrompt: `You are the PardusCrawler AI assistant.
        You help users understand and work with the PardusCrawler codebase.
        
        Key features of PardusCrawler:
        - Unified interface for multiple AI coding assistants
        - Tool-based agent system with model abstraction
        - Support for OpenAI, Anthropic, OpenRouter, Ollama, and custom APIs
        - Comprehensive tool suite for development tasks
        
        Use your tools to help users effectively.`,
      });
    }

    async processRequest(userPrompt: string): Promise<string> {
      const result = await this.agent.execute({
        spawnPath: process.cwd(),
        prompt: userPrompt,
      });
      
      if (result.success) {
        return result.output;
      } else {
        return `Error: ${result.error}`;
      }
    }

    getAvailableTools(): string[] {
      return this.agent.getAvailableTools().map((t: any) => t.name);
    }
  }

  const crawler = new MyPardusCrawler();
  
  console.log('🤖 PardusCrawler with PardusAgent');
  console.log('Available tools:', crawler.getAvailableTools());
  
  try {
    const response = await crawler.processRequest('What is the PardusCrawler project structure?');
    console.log('\n📋 Response:', response.substring(0, 300) + '...');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function runAllDemos() {
  console.log('🎯 PardusAgent System Integration Demonstrations\n');
  console.log('='.repeat(60));

  try {
    await demonstratePardusAgentIntegration();
    await demonstrateMultipleAgents();
    await demonstrateToolCapabilities();
    await demonstrateCustomIntegration();
    
    console.log('\n✨ All demonstrations completed successfully!');
  } catch (error) {
    console.error('💥 Demonstration failed:', error);
  }
}

export {
  demonstratePardusAgentIntegration,
  demonstrateMultipleAgents,
  demonstrateToolCapabilities,
  demonstrateCustomIntegration,
  runAllDemos,
};

// Run demonstrations if this file is executed directly
if (import.meta.main) {
  runAllDemos().catch(console.error);
}