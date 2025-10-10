import type { Page, BrowserContext } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';

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
  context.log('交互式登录脚本已启动。', 'info');

  if (context.platform?.base_url) {
    context.log(`正在导航到目标页面: ${context.platform.base_url}`, 'info');
    await page.goto(context.platform.base_url, { waitUntil: 'domcontentloaded' });
  } else {
    context.log('未提供平台 URL，将打开一个空白页面用于手动操作。', 'warn');
  }

  await context.requestHumanIntervention({
    message: '请在浏览器中手动完成所需操作（如登录），然后点击“继续”结束任务。',
  });

  context.log('用户已确认完成手动操作。', 'success');

  return { success: true, message: '交互式会话已由用户手动结束。' };
}