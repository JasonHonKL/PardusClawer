import { BashTool } from './bash';
import { FileTool } from './file';
import { SearchTool } from './search';
import { BrowserTool } from './browser';
import { GitTool } from './git';
import { NetworkTool } from './network';
import { DefaultToolRegistry, type ToolRegistry, type ToolDefinition } from './registry';

export class ToolFactory {
  private static registry: ToolRegistry | null = null;

  static getRegistry(): ToolRegistry {
    if (!ToolFactory.registry) {
      ToolFactory.registry = new DefaultToolRegistry();
      ToolFactory.registerDefaultTools();
    }
    return ToolFactory.registry;
  }

  private static registerDefaultTools(): void {
    const registry = ToolFactory.registry!;
    
    // Register all default tools
    registry.register(new BashTool());
    registry.register(new FileTool());
    registry.register(new SearchTool());
    registry.register(new BrowserTool());
    registry.register(new GitTool());
    registry.register(new NetworkTool());
  }

  static getToolDefinitions(): ToolDefinition[] {
    return ToolFactory.getRegistry().getToolDefinitions();
  }

  static createBashTool(): BashTool {
    return new BashTool();
  }

  static createFileTool(): FileTool {
    return new FileTool();
  }

  static createSearchTool(): SearchTool {
    return new SearchTool();
  }

  static createBrowserTool(): BrowserTool {
    return new BrowserTool();
  }

  static createGitTool(): GitTool {
    return new GitTool();
  }

  static createNetworkTool(): NetworkTool {
    return new NetworkTool();
  }
}

// Cleanup function for browser tool
export async function cleanupTools(): Promise<void> {
  const registry = ToolFactory.getRegistry();
  const browserTool = registry.get('browser') as BrowserTool;
  if (browserTool && browserTool.cleanup) {
    await browserTool.cleanup();
  }
}

// Export everything
export * from './types';
export * from './registry';
export * from './bash';
export * from './file';
export * from './search';
export * from './browser';
export * from './git';
export * from './network';