/**
 * PardusAgent Tool System Usage Examples
 * 
 * This file demonstrates how to use the comprehensive tool system
 * that provides your agent with powerful capabilities.
 */

import { ToolFactory, cleanupTools } from '../index';

async function demonstrateTools() {
  console.log('🔧 PardusAgent Tool System Demo\n');

  const registry = ToolFactory.getRegistry();

  // 1. Bash Tool Examples
  console.log('1️⃣ Bash Tool:');
  const bashResult = await registry.execute('bash', {
    command: 'pwd && ls -la',
  });
  console.log('Current directory and files:', bashResult.data.stdout);

  // 2. File Tool Examples
  console.log('\n2️⃣ File Tool:');
  await registry.execute('file', {
    action: 'write',
    path: '/tmp/pardus-agent-demo.txt',
    content: 'Hello from PardusAgent Tool System!',
  });
  
  const fileResult = await registry.execute('file', {
    action: 'read',
    path: '/tmp/pardus-agent-demo.txt',
  });
  console.log('File content:', fileResult.data.content);

  // 3. Search Tool Examples
  console.log('\n3️⃣ Search Tool:');
  const searchResult = await registry.execute('search', {
    pattern: 'Tool',
    path: './tool',
    extensions: ['.ts'],
    maxResults: 5,
  });
  console.log(`Found ${searchResult.data.totalFiles} files containing "Tool"`);

  // 4. Network Tool Examples
  console.log('\n4️⃣ Network Tool:');
  const pingResult = await registry.execute('network', {
    action: 'ping',
    url: 'https://google.com',
  });
  console.log('Google ping result:', pingResult.success ? '✅ Success' : '❌ Failed');

  // 5. Git Tool Examples (if in a git repo)
  console.log('\n5️⃣ Git Tool:');
  const gitResult = await registry.execute('git', {
    command: 'status',
  });
  if (gitResult.success) {
    console.log('Git status:', gitResult.data.stdout);
  } else {
    console.log('Not in a git repository or git command failed');
  }

  // 6. Browser Tool Examples
  console.log('\n6️⃣ Browser Tool:');
  try {
    // Navigate to a website
    const navResult = await registry.execute('browser', {
      action: 'navigate',
      url: 'https://example.com',
      headless: true,
    });
    
    if (navResult.success) {
      console.log(`Navigated to: ${navResult.data.title}`);
      
      // Take screenshot
      const screenshotResult = await registry.execute('browser', {
        action: 'screenshot',
        headless: true,
      });
      
      if (screenshotResult.success) {
        console.log('📸 Screenshot captured successfully');
      }
      
      // Extract page information
      const extractResult = await registry.execute('browser', {
        action: 'extract',
        selector: 'h1',
        headless: true,
      });
      
      if (extractResult.success) {
        console.log('Page title element:', extractResult.data.elements);
      }
    }
  } catch (error) {
    console.log('Browser tool skipped (might not be available in this environment)');
  }

  // List all available tools
  console.log('\n📋 Available Tools:');
  const tools = registry.list();
  tools.forEach(toolName => {
    const tool = registry.get(toolName);
    console.log(`  - ${toolName}: ${tool?.description}`);
  });

  // Cleanup
  await cleanupTools();
  console.log('\n✨ Tool system demo completed!');
}

// Advanced Usage Example: Creating a Custom Tool
import { Tool, ToolResult, ToolConfig } from '../types';

class CustomTool implements Tool {
  name = 'custom-calculator';
  description = 'Perform basic math calculations';
  parameters = {
    operation: {
      type: 'string',
      description: 'Operation: add, subtract, multiply, divide',
      required: true,
    },
    a: { type: 'number', required: true },
    b: { type: 'number', required: true },
  };

  async execute(params: { operation: string; a: number; b: number }): Promise<ToolResult> {
    const { operation, a, b } = params;
    
    let result: number;
    switch (operation) {
      case 'add':
        result = a + b;
        break;
      case 'subtract':
        result = a - b;
        break;
      case 'multiply':
        result = a * b;
        break;
      case 'divide':
        if (b === 0) {
          return { success: false, error: 'Division by zero' };
        }
        result = a / b;
        break;
      default:
        return { success: false, error: `Unknown operation: ${operation}` };
    }
    
    return {
      success: true,
      data: { operation, a, b, result },
    };
  }
}

async function demonstrateCustomTool() {
  console.log('\n🎯 Custom Tool Example:');
  
  const registry = ToolFactory.getRegistry();
  
  // Register custom tool
  registry.register(new CustomTool());
  
  // Use custom tool
  const calcResult = await registry.execute('custom-calculator', {
    operation: 'multiply',
    a: 7,
    b: 8,
  });
  
  console.log('Calculation result:', calcResult.data);
}

// Run demonstrations
if (import.meta.main) {
  demonstrateTools()
    .then(() => demonstrateCustomTool())
    .catch(console.error);
}

export { demonstrateTools, demonstrateCustomTool, CustomTool };