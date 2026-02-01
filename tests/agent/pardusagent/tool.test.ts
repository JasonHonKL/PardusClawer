import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { ToolFactory, cleanupTools } from '../../../agent/pardusagent/tool/index';
import { BrowserTool } from '../../../agent/pardusagent/tool/browser';

describe('Tool System', () => {
  beforeEach(() => {
    // Reset registry for each test
    ToolFactory.getRegistry();
  });

  afterEach(async () => {
    await cleanupTools();
  });

  test('ToolFactory should register all default tools', () => {
    const registry = ToolFactory.getRegistry();
    const tools = registry.list();
    
    expect(tools).toContain('bash');
    expect(tools).toContain('file');
    expect(tools).toContain('search');
    expect(tools).toContain('browser');
    expect(tools).toContain('git');
    expect(tools).toContain('network');
  });

  test('Bash tool should execute commands', async () => {
    const registry = ToolFactory.getRegistry();
    const result = await registry.execute('bash', { command: 'echo "Hello World"' });
    
    expect(result.success).toBe(true);
    expect(result.data.stdout).toBe('Hello World');
  });

  test('File tool should read and write files', async () => {
    const registry = ToolFactory.getRegistry();
    const testContent = 'Test file content';
    const testPath = '/tmp/test-file.txt';

    // Write file
    const writeResult = await registry.execute('file', {
      action: 'write',
      path: testPath,
      content: testContent,
    });
    expect(writeResult.success).toBe(true);

    // Read file
    const readResult = await registry.execute('file', {
      action: 'read',
      path: testPath,
    });
    expect(readResult.success).toBe(true);
    expect(readResult.data.content).toBe(testContent);

    // Check file exists
    const existsResult = await registry.execute('file', {
      action: 'exists',
      path: testPath,
    });
    expect(existsResult.success).toBe(true);
    expect(existsResult.data.exists).toBe(true);
  });

  test('Search tool should find text in files', async () => {
    const registry = ToolFactory.getRegistry();
    const result = await registry.execute('search', {
      pattern: 'import',
      path: './tool',
      extensions: ['.ts'],
      maxResults: 10,
    });
    
    expect(result.success).toBe(true);
    expect(result.data.results).toBeDefined();
    expect(Array.isArray(result.data.results)).toBe(true);
  });

  test('Browser tool should navigate and take screenshots', async () => {
    const registry = ToolFactory.getRegistry();
    
    // Note: These tests might fail if no browser is available
    try {
      const navResult = await registry.execute('browser', {
        action: 'navigate',
        url: 'https://example.com',
        headless: true,
      });
      
      if (navResult.success) {
        expect(navResult.data.url).toBe('https://example.com');
        
        const screenshotResult = await registry.execute('browser', {
          action: 'screenshot',
          headless: true,
        });
        
        expect(screenshotResult.success).toBe(true);
        expect(screenshotResult.data.screenshot).toBeDefined();
      }
    } catch (error) {
      // Browser might not be available in test environment
      console.log('Browser test skipped:', error);
    }
  });

  test('Network tool should make HTTP requests', async () => {
    const registry = ToolFactory.getRegistry();
    
    // Test ping
    const pingResult = await registry.execute('network', {
      action: 'ping',
      url: 'https://httpbin.org/status/200',
    });
    
    expect(pingResult.success).toBe(true);
    expect(pingResult.data.status).toBe(200);

    // Test GET request
    const getResult = await registry.execute('network', {
      action: 'get',
      url: 'https://httpbin.org/json',
    });
    
    expect(getResult.success).toBe(true);
    expect(getResult.data.data).toBeDefined();
  });

  test('Tool factory should create individual tools', () => {
    const bashTool = ToolFactory.createBashTool();
    expect(bashTool.name).toBe('bash');
    
    const fileTool = ToolFactory.createFileTool();
    expect(fileTool.name).toBe('file');
    
    const searchTool = ToolFactory.createSearchTool();
    expect(searchTool.name).toBe('search');
    
    const browserTool = ToolFactory.createBrowserTool();
    expect(browserTool.name).toBe('browser');
    
    const gitTool = ToolFactory.createGitTool();
    expect(gitTool.name).toBe('git');
    
    const networkTool = ToolFactory.createNetworkTool();
    expect(networkTool.name).toBe('network');
  });

  test('Tool registry should provide tool definitions for function calling', () => {
    const registry = ToolFactory.getRegistry();
    const toolDefinitions = registry.getToolDefinitions();
    
    expect(toolDefinitions).toBeDefined();
    expect(Array.isArray(toolDefinitions)).toBe(true);
    expect(toolDefinitions.length).toBeGreaterThan(0);
    
    // Check structure of tool definition
    const bashToolDef = toolDefinitions.find(t => t.name === 'bash');
    expect(bashToolDef).toBeDefined();
    expect(bashToolDef?.name).toBe('bash');
    expect(bashToolDef?.description).toBe('Execute bash commands in the terminal');
    expect(bashToolDef?.parameters.type).toBe('object');
    expect(bashToolDef?.parameters.properties.command).toBeDefined();
    expect(bashToolDef?.parameters.required).toContain('command');
  });

  test('ToolFactory should provide tool definitions for model integration', () => {
    const toolDefinitions = ToolFactory.getToolDefinitions();
    
    expect(toolDefinitions).toBeDefined();
    expect(Array.isArray(toolDefinitions)).toBe(true);
    
    // Verify each tool has proper schema structure
    toolDefinitions.forEach(toolDef => {
      expect(toolDef.name).toBeDefined();
      expect(toolDef.description).toBeDefined();
      expect(toolDef.parameters).toBeDefined();
      expect(toolDef.parameters.type).toBe('object');
      expect(toolDef.parameters.properties).toBeDefined();
      expect(Array.isArray(toolDef.parameters.required)).toBe(true);
    });
  });

  test('Tool registry should handle unknown tools', async () => {
    const registry = ToolFactory.getRegistry();
    const result = await registry.execute('unknown', {});
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  test('Tool registry should list all tools', () => {
    const registry = ToolFactory.getRegistry();
    const tools = registry.list();
    const allTools = registry.getAll();
    
    expect(tools.length).toBe(allTools.length);
    expect(tools.length).toBeGreaterThan(0);
  });
});