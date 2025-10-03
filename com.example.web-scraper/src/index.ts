import { BrowserContext, Page } from 'patchright';

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
    // 从用户输入中获取参数
    const targetUrl = context.common.target_url;
    const maxContentLength = context.common.max_content_length || 1000;
    const outputFormat = context.common.output_format || 'json';
    const outputDirectory = context.common.output_directory || context.paths.data;
    const takeScreenshot = context.common.take_screenshot !== false; // 默认为true
    const screenshotFormat = context.common.screenshot_format || 'png';
    
    if (!targetUrl) {
      context.forceExit('请提供目标URL');
      return;
    }

    context.log(`正在访问: ${targetUrl}`, 'info');
    context.log(`使用输出目录: ${outputDirectory}`, 'info');
    
    // 导航到目标网页
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    
    // 等待页面加载完成
    await page.waitForLoadState('domcontentloaded');
    
    // 提取页面标题
    const title = await page.title();
    context.log(`页面标题: ${title}`, 'info');
    
    // 截图功能
    let screenshotPath = '';
    if (takeScreenshot) {
      try {
        const fs = require('fs').promises;
        const path = require('path');
        
        // 确保输出目录存在
        await fs.mkdir(outputDirectory, { recursive: true });
        
        // 生成截图文件名
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        screenshotPath = path.join(outputDirectory, `screenshot-${timestamp}.${screenshotFormat}`);
        
        // 截取全屏
        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
          type: screenshotFormat as 'png' | 'jpeg'
        });
        
        context.log(`截图已保存到: ${screenshotPath}`, 'success');
      } catch (screenshotError: any) {
        context.log(`截图失败: ${screenshotError.message}`, 'warn');
      }
    }
    
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
    
    // 确保输出目录存在
    await fs.mkdir(outputDirectory, { recursive: true });
    
    // 生成结果文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultFileName = `scraped-content-${timestamp}.${outputFormat}`;
    const resultFile = path.join(outputDirectory, resultFileName);
    
    const result = {
      url: targetUrl,
      title: title,
      content: content.substring(0, maxContentLength) + (content.length > maxContentLength ? '...' : ''),
      full_content_length: content.length,
      extracted_at: new Date().toISOString(),
      screenshot_path: screenshotPath || undefined
    };
    
    if (outputFormat === 'json') {
      await fs.writeFile(resultFile, JSON.stringify(result, null, 2), 'utf-8');
    } else {
      // 文本格式
      const textContent = `URL: ${targetUrl}\n标题: ${title}\n提取时间: ${result.extracted_at}\n\n内容:\n${result.content}`;
      await fs.writeFile(resultFile, textContent, 'utf-8');
    }
    
    context.log(`结果已保存到: ${resultFile}`, 'success');
    
    return {
      success: true,
      message: '网页内容抓取成功',
      result: result,
      output_file: resultFile,
      screenshot_file: screenshotPath || null
    };
    
  } catch (error: any) {
    console.error('抓取过程中发生错误:', error);
    context.log(`抓取失败: ${error.message}`, 'error');
    context.forceExit(`抓取失败: ${error.message}`);
  }
}