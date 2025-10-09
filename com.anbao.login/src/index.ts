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
  context.log('Schema 能力测试脚本已启动。', 'info');

  // 获取所有用户输入
  const userInput = context.common;
  context.log(`接收到的用户输入: ${JSON.stringify(userInput, null, 2)}`, 'info');

  // 假设用户会在 schema 中提供一个输出目录的字段，例如 "output_directory"
  // 如果没有提供，则默认保存到脚本的数据目录
  const outputDir = userInput.output_directory || context.paths.data;
  const outputFileName = 'schema_test_output.json';
  const outputPath = path.join(outputDir, outputFileName);

  try {
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(userInput, null, 2), 'utf-8');
    context.log(`用户输入已成功保存到: ${outputPath}`, 'success');
  } catch (error: any) {
    context.log(`保存用户输入失败: ${(error as Error).message}`, 'error');
    context.forceExit(`保存用户输入失败: ${(error as Error).message}`);
  }

  // 原始的交互式登录逻辑可以移除或注释掉，因为这个脚本的目的是测试 schema
  // if (context.platform?.base_url) {
  //   context.log(`正在导航到: ${context.platform.base_url}`, 'info');
  //   await page.goto(context.platform.base_url, { waitUntil: 'domcontentloaded' });
  // } else {
  //   context.log('未找到平台基础 URL，将打开一个空白页面。', 'warn');
  // }

  // await context.requestHumanIntervention({
  //   message: '请在新打开的浏览器窗口中手动完成登录操作，然后在此处点击“继续”来结束任务。',
  // });

  // context.log('用户已完成手动操作。', 'success');

  // Return a success object.
  return { success: true, message: 'Schema 能力测试完成，用户输入已保存。' };
}