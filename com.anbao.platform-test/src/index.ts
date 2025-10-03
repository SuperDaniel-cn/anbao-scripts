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
}

export interface RunOptions {
  browser: BrowserContext;
  page: Page;
  context: AnbaoContext;
}

export async function run({ page, context }: RunOptions) {
  const commonMessage = context.common.common_message || 'hello anbao';
  const outputDirectory = context.common.output_directory || context.paths.data;

  context.log('开始平台功能测试任务', 'info');
  context.notify({
    title: '任务开始',
    content: `通用通知: ${commonMessage}`,
    category: 'ScriptMessage'
  });

  // 确保输出目录存在
  const fs = require('fs').promises;
  const path = require('path');
  await fs.mkdir(outputDirectory, { recursive: true });

  // 判断当前平台是百度还是搜狗
  const isBaidu = context.platform.base_url.includes('baidu.com');
  const isSogou = context.platform.base_url.includes('sogou.com');

  if (isBaidu) {
    context.log('当前平台为百度', 'info');
    const searchTerm = context.common.baidu_search_term;
    if (!searchTerm) {
      context.forceExit('百度平台需要提供搜索词');
      return;
    }

    context.log(`正在百度搜索: ${searchTerm}`, 'info');
    await page.goto(`https://www.baidu.com/s?wd=${encodeURIComponent(searchTerm)}`, { waitUntil: 'networkidle' });
    context.log('百度搜索完成', 'success');

    // 截图
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(outputDirectory, `baidu-search-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    context.log(`百度搜索截图已保存到: ${screenshotPath}`, 'success');

    context.notify({
      title: '百度搜索完成',
      content: `hello anbao - 百度搜索 "${searchTerm}" 完成，已截图。通用通知: ${commonMessage}`,
      category: 'TaskResult'
    });

  } else if (isSogou) {
    context.log('当前平台为搜狗', 'info');
    const takeScreenshot = context.common.sogou_take_screenshot;

    context.log('正在访问搜狗首页...', 'info');
    await page.goto('https://www.sogou.com', { waitUntil: 'networkidle' });
    context.log('搜狗首页访问完成', 'success');

    if (takeScreenshot) {
      context.log('准备搜狗截图...', 'info');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = path.join(outputDirectory, `sogou-homepage-${timestamp}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      context.log(`搜狗首页截图已保存到: ${screenshotPath}`, 'success');
    } else {
      context.log('未选择搜狗截图', 'info');
    }

    context.notify({
      title: '搜狗平台操作完成',
      content: `hello anbao - 搜狗平台操作完成${takeScreenshot ? '，已截图' : ''}。通用通知: ${commonMessage}`,
      category: 'TaskResult'
    });

  } else {
    context.log('未知平台，不执行特定操作', 'warn');
    context.notify({
      title: '未知平台',
      content: `未知平台，未执行特定操作。通用通知: ${commonMessage}`,
      category: 'TaskResult'
    });
  }

  return { success: true, message: '平台功能测试任务完成' };
}