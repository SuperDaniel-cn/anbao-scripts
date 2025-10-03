import type { Page, BrowserContext } from 'playwright';

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
  invokeAgent: (prompt: string, options: { apiKey: string; baseUrl?: string; modelName?: string }) => Promise<any>;
}

export interface RunOptions {
  browser: BrowserContext;
  page: Page;
  context: AnbaoContext;
}

export async function run({ page, context }: RunOptions) {
  context.log('开始 AI 百度搜索任务', 'info');

  // 从上下文中获取用户填写的 API 参数
  const apiKey = context.common.api_key;
  const baseUrl = context.common.base_url;
  const modelName = context.common.model_name; // 获取 model_name

  if (!apiKey) {
    context.forceExit("错误：未提供 API Key。请在任务设置中填写。");
    return;
  }

  context.log('正在访问百度首页...', 'info');
  await page.goto('https://www.baidu.com', { waitUntil: 'networkidle' });

  try {
    context.log("正在调用 AI 代理搜索 '杭州的天气如何'...");

    const agentResult = await context.invokeAgent(
      "在当前页面上找到搜索框，输入'杭州的天气如何'并点击搜索按钮。然后等待搜索结果加载完成，并提取天气信息。",
      { apiKey, baseUrl, modelName } // 传递 modelName
    );

    context.log(`AI 代理执行完成，结果: ${JSON.stringify(agentResult)}`, 'success');

    // 发送完成通知
    context.notify({
      title: 'AI 搜索完成',
      content: `hello anbao - AI 代理已搜索到杭州天气信息。结果: ${JSON.stringify(agentResult)}`,
      category: 'TaskResult'
    });

    return { success: true, message: 'AI 百度搜索任务完成', result: agentResult };

  } catch (error: any) {
    console.error('调用 AI 代理时发生错误:', error);
    context.log(`AI 代理搜索失败: ${error.message}`, 'error');

    // 发送错误通知
    context.notify({
      title: 'AI 搜索失败',
      content: `hello anbao - AI 代理搜索失败: ${error.message}`,
      category: 'TaskResult'
    });

    context.forceExit(`AI 代理搜索失败: ${error.message}`);
  }
}