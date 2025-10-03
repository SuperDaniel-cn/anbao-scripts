import { BrowserContext, Page } from 'playwright';

export interface AnbaoContext {
  common: Record<string, any>;
  platform: { name: string; base_url: string };
  profile: { name: string };
  paths: {
    downloads: string;
    data: string;
  };
  log: (message: string, level?: 'info' | 'warn' | 'error' | 'success') => void;
  forceExit: (errorMessage?: string) => void;
}

export interface RunOptions {
  browser: BrowserContext;
  page: Page;
  context: AnbaoContext;
}

export async function run({ page, context }: RunOptions) {
  context.log('开始网页内容抓取任务', 'info');
  
  try {
    // 从用户输入中获取目标URL
    const targetUrl = context.common.target_url;
    if (!targetUrl) {
      context.forceExit('请提供目标URL');
      return;
    }

    context.log(`正在访问: ${targetUrl}`, 'info');
    
    // 导航到目标网页
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    
    // 等待页面加载完成
    await page.waitForLoadState('domcontentloaded');
    
    // 提取页面标题
    const title = await page.title();
    context.log(`页面标题: ${title}`, 'info');
    
    // 提取页面主要内容
    const content = await page.evaluate(() => {
      // 尝试获取主要内容区域
      const mainContent = document.querySelector('main, article, .content, #content') ||
                        document.querySelector('div[role="main"]') ||
                        document.body;
      
      // 提取文本内容，去除多余的空白字符
      return mainContent?.textContent?.trim().replace(/\s+/g, ' ') || '';
    });
    
    context.log(`内容长度: ${content.length} 字符`, 'info');
    
    // 将结果保存到文件
    const fs = require('fs').promises;
    const path = require('path');
    
    const result = {
      url: targetUrl,
      title: title,
      content: content.substring(0, 1000) + (content.length > 1000 ? '...' : ''),
      extracted_at: new Date().toISOString()
    };
    
    const resultFile = path.join(context.paths.data, 'scraped-content.json');
    await fs.writeFile(resultFile, JSON.stringify(result, null, 2), 'utf-8');
    
    context.log(`结果已保存到: ${resultFile}`, 'success');
    
    return {
      success: true,
      message: '网页内容抓取成功',
      result: result
    };
    
  } catch (error: any) {
    console.error('抓取过程中发生错误:', error);
    context.log(`抓取失败: ${error.message}`, 'error');
    context.forceExit(`抓取失败: ${error.message}`);
  }
}