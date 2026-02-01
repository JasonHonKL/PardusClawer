import { chromium, type Browser, type Page, type BrowserContext } from 'playwright';
import type { Tool, ToolResult, ToolConfig } from './types';

export class BrowserTool implements Tool {
  name = 'browser';
  description = 'Automate web browser using Playwright';
  parameters = {
    action: {
      type: 'string' as const,
      description: 'Action to perform: navigate, screenshot, click, type, wait, extract, close',
      required: true,
      enum: ['navigate', 'screenshot', 'click', 'type', 'wait', 'extract', 'close'],
    },
    url: {
      type: 'string' as const,
      description: 'URL to navigate to',
      required: false,
    },
    selector: {
      type: 'string' as const,
      description: 'CSS selector for element interaction',
      required: false,
    },
    text: {
      type: 'string' as const,
      description: 'Text to type or search for',
      required: false,
    },
    waitFor: {
      type: 'string' as const,
      description: 'What to wait for: selector, load, networkidle',
      required: false,
      enum: ['selector', 'load', 'networkidle'],
    },
    timeout: {
      type: 'number' as const,
      description: 'Timeout in milliseconds',
      required: false,
    },
    screenshotPath: {
      type: 'string' as const,
      description: 'Path to save screenshot',
      required: false,
    },
    headless: {
      type: 'boolean' as const,
      description: 'Run browser in headless mode',
      required: false,
    },
  };

  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  private async getBrowser(headless: boolean = true): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browser;
  }

  private async getContext(headless: boolean = true): Promise<BrowserContext> {
    if (!this.context) {
      const browser = await this.getBrowser(headless);
      this.context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      });
    }
    return this.context;
  }

  private async getPage(headless: boolean = true): Promise<Page> {
    if (!this.page) {
      const context = await this.getContext(headless);
      this.page = await context.newPage();
    }
    return this.page;
  }

  async execute(params: {
    action: string;
    url?: string;
    selector?: string;
    text?: string;
    waitFor?: string;
    timeout?: number;
    screenshotPath?: string;
    headless?: boolean;
  }, config?: ToolConfig): Promise<ToolResult> {
    const { action, headless = true, timeout = 30000 } = params;

    try {
      switch (action) {
        case 'navigate':
          if (!params.url) {
            return { success: false, error: 'URL is required for navigate action' };
          }
          const page = await this.getPage(headless);
          await page.goto(params.url, { waitUntil: 'networkidle', timeout });
          return {
            success: true,
            data: { url: params.url, title: await page.title() },
          };

        case 'screenshot':
          const screenshotPage = await this.getPage(headless);
          const screenshot = await screenshotPage.screenshot({
            type: 'png',
            fullPage: true,
          });
          const buffer = screenshot.toString('base64');
          
          if (params.screenshotPath) {
            await this.getPage(headless).screenshot({
              path: params.screenshotPath,
              fullPage: true,
            });
          }
          
          return {
            success: true,
            data: {
              screenshot: buffer,
              path: params.screenshotPath,
            },
          };

        case 'click':
          if (!params.selector) {
            return { success: false, error: 'Selector is required for click action' };
          }
          const clickPage = await this.getPage(headless);
          await clickPage.click(params.selector, { timeout });
          return { success: true, data: { selector: params.selector } };

        case 'type':
          if (!params.selector || params.text === undefined) {
            return { success: false, error: 'Selector and text are required for type action' };
          }
          const typePage = await this.getPage(headless);
          await typePage.fill(params.selector, params.text, { timeout });
          return { success: true, data: { selector: params.selector, text: params.text } };

        case 'wait':
          const waitPage = await this.getPage(headless);
          if (params.waitFor === 'selector' && params.selector) {
            await waitPage.waitForSelector(params.selector, { timeout });
          } else if (params.waitFor === 'load') {
            await waitPage.waitForLoadState('networkidle', { timeout });
          } else if (params.waitFor === 'networkidle') {
            await waitPage.waitForLoadState('networkidle', { timeout });
          }
          return { success: true, data: { waitFor: params.waitFor } };

        case 'extract':
          const extractPage = await this.getPage(headless);
          if (params.selector) {
            const elements = await extractPage.$$(params.selector);
            const texts = await Promise.all(elements.map(el => el.textContent()));
            return {
              success: true,
              data: {
                selector: params.selector,
                elements: texts.filter(text => text !== null),
              },
            };
          } else {
            const content = await extractPage.content();
            const title = await extractPage.title();
            const url = extractPage.url();
            return {
              success: true,
              data: { title, url, content: content.substring(0, 10000) }, // Limit content size
            };
          }

        case 'close':
          if (this.page) {
            await this.page.close();
            this.page = null;
          }
          if (this.context) {
            await this.context.close();
            this.context = null;
          }
          if (this.browser) {
            await this.browser.close();
            this.browser = null;
          }
          return { success: true, data: { message: 'Browser closed' } };

        default:
          return { success: false, error: `Unknown action: ${action}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}