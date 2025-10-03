import type { Page, BrowserContext } from 'playwright';

// --- Type Definitions (from SCRIPT_DEVELOPMENT_GUIDE.md) ---
// These types are provided by the Anbao Agent runtime environment.
// They are defined here to provide type safety during development.

/**
 * The context object provided to the script, containing platform APIs and execution details.
 */
export interface AnbaoContext {
  common: Record<string, any>;
  platform: { name: string; base_url: string };
  profile: { name: string };
  paths: {
    downloads: string;
    data: string;
  };
  log: (message: string, level?: 'info' | 'warn' | 'error' | 'success') => void;
  notify: (payload: { title: string; content: string; category?: 'ScriptMessage' | 'TaskResult' }) => void;
  forceExit: (errorMessage?: string) => void;
  requestHumanIntervention: (options: { message: string; timeout?: number; theme?: 'light' | 'dark' }) => Promise<void>;
}

/**
 * The options object passed to the main 'run' function of the script.
 */
export interface RunOptions {
  browser: BrowserContext;
  page: Page;
  context: AnbaoContext;
}

// --- Main Script Logic ---

/**
 * An internal script to launch a browser and wait for human interaction.
 * This is used for features like "Login with Profile".
 */
export async function run({ page, context }: RunOptions) {
  context.log('交互式登录会话已启动。', 'info');

  // The browser is already launched with the correct profile.
  // We just need to navigate to the base URL of the platform if available.
  if (context.platform?.base_url) {
    context.log(`正在导航到: ${context.platform.base_url}`, 'info');
    await page.goto(context.platform.base_url, { waitUntil: 'domcontentloaded' });
  } else {
    context.log('未找到平台基础 URL，将打开一个空白页面。', 'warn');
  }

  // Immediately request human intervention, pausing the script.
  await context.requestHumanIntervention({
    message: '请在新打开的浏览器窗口中手动完成登录操作，然后在此处点击“继续”来结束任务。',
  });

  context.log('用户已完成手动操作。', 'success');

  // Return a success object.
  return { success: true, message: '用户已完成手动操作。' };
}