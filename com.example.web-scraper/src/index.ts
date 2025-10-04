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
  notify: (payload: { title: string; content: string; category?: 'ScriptMessage' | 'TaskResult' }) => void;
  requestHumanIntervention: (options: { message: string; timeout?: number; theme?: 'light' | 'dark' }) => Promise<void>;
  forceExit: (errorMessage?: string) => void;
}

export interface RunOptions {
  browser: BrowserContext;
  page: Page;
  context: AnbaoContext;
}

export async function run({ page, context }: RunOptions) {
  context.log('开始百度搜索 AnbaoAgent 任务', 'info');
  
  // 发送开始通知
  context.notify({
    title: '任务开始',
    content: 'hello anbao - 开始百度搜索 AnbaoAgent',
    category: 'ScriptMessage'
  });
  
  try {
    // 导航到百度首页
    context.log('正在访问百度首页...', 'info');
    await page.goto('https://www.baidu.com', { waitUntil: 'networkidle' });
    
    // 等待搜索框加载，设置5秒超时
    context.log('等待搜索框加载...', 'info');
    let searchBox;
    try {
      searchBox = await page.waitForSelector('#kw', { timeout: 5000 });
      context.log('搜索框加载成功', 'success');
    } catch (timeoutError) {
      context.log('搜索框加载超时，请求人工介入', 'warn');
      
      // 发送超时通知
      context.notify({
        title: '操作超时',
        content: 'hello anbao - 搜索框加载超时，需要人工介入',
        category: 'TaskResult'
      });
      
      // 请求人工介入
      await context.requestHumanIntervention({
        message: '搜索框加载超时，请手动检查页面状态，然后点击继续按钮。',
        timeout: 30000, // 30秒超时
        theme: 'light'
      });
      
      context.log('人工介入完成，继续执行任务', 'info');
      
      // 人工介入后再次尝试获取搜索框
      searchBox = await page.$('#kw');
      if (!searchBox) {
        context.forceExit('人工介入后仍无法找到搜索框');
        return;
      }
    }
    
    // 在搜索框中输入 AnbaoAgent
    context.log('输入搜索关键词: AnbaoAgent', 'info');
    await searchBox.fill('AnbaoAgent');
    
    // 点击搜索按钮，设置5秒超时
    context.log('点击搜索按钮...', 'info');
    try {
      await Promise.race([
        page.click('#su'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('搜索按钮点击超时')), 5000))
      ]);
      context.log('搜索按钮点击成功', 'success');
    } catch (timeoutError) {
      context.log('搜索按钮点击超时，请求人工介入', 'warn');
      
      // 发送超时通知
      context.notify({
        title: '操作超时',
        content: 'hello anbao - 搜索按钮点击超时，需要人工介入',
        category: 'TaskResult'
      });
      
      // 请求人工介入
      await context.requestHumanIntervention({
        message: '搜索按钮点击超时，请手动点击搜索按钮，然后点击继续按钮。',
        timeout: 30000, // 30秒超时
        theme: 'light'
      });
      
      context.log('人工介入完成，继续执行任务', 'info');
    }
    
    // 等待搜索结果加载，设置5秒超时
    context.log('等待搜索结果加载...', 'info');
    try {
      await page.waitForSelector('.result', { timeout: 5000 });
      context.log('搜索结果加载成功', 'success');
    } catch (timeoutError) {
      context.log('搜索结果加载超时，请求人工介入', 'warn');
      
      // 发送超时通知
      context.notify({
        title: '操作超时',
        content: 'hello anbao - 搜索结果加载超时，需要人工介入',
        category: 'TaskResult'
      });
      
      // 请求人工介入
      await context.requestHumanIntervention({
        message: '搜索结果加载超时，请等待页面加载完成，然后点击继续按钮。',
        timeout: 30000, // 30秒超时
        theme: 'light'
      });
      
      context.log('人工介入完成，继续执行任务', 'info');
    }
    
    // 提取搜索结果
    context.log('提取搜索结果...', 'info');
    const searchResults = await page.evaluate(() => {
      const results: Array<{
        index: number;
        title: string;
        url: string;
        snippet: string;
      }> = [];
      const resultElements = document.querySelectorAll('.result');
      
      resultElements.forEach((element, index) => {
        const titleElement = element.querySelector('h3');
        const linkElement = element.querySelector('a');
        const snippetElement = element.querySelector('.c-abstract');
        
        if (titleElement && linkElement) {
          results.push({
            index: index + 1,
            title: titleElement.textContent?.trim() || '',
            url: linkElement.href || '',
            snippet: snippetElement?.textContent?.trim() || ''
          });
        }
      });
      
      return results;
    });
    
    context.log(`成功提取 ${searchResults.length} 条搜索结果`, 'success');
    
    // 将结果保存到文件
    const fs = require('fs').promises;
    const path = require('path');
    const outputDirectory = context.common.output_directory || context.paths.data;
    
    // 确保输出目录存在
    await fs.mkdir(outputDirectory, { recursive: true });
    
    // 生成结果文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultFileName = `baidu-search-anbaoagent-${timestamp}.json`;
    const resultFile = path.join(outputDirectory, resultFileName);
    
    const result = {
      search_term: 'AnbaoAgent',
      search_engine: 'Baidu',
      results_count: searchResults.length,
      extracted_at: new Date().toISOString(),
      results: searchResults
    };
    
    await fs.writeFile(resultFile, JSON.stringify(result, null, 2), 'utf-8');
    context.log(`结果已保存到: ${resultFile}`, 'success');
    
    // 截图功能
    const takeScreenshot = context.common.take_screenshot !== false; // 默认为true
    const screenshotFormat = context.common.screenshot_format || 'png';
    
    if (takeScreenshot) {
      try {
        // 生成截图文件名
        const screenshotPath = path.join(outputDirectory, `baidu-search-${timestamp}.${screenshotFormat}`);
        
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
    
    // 发送完成通知
    context.notify({
      title: '任务完成',
      content: `hello anbao - 百度搜索 AnbaoAgent 成功，找到 ${searchResults.length} 条结果`,
      category: 'TaskResult'
    });
    
    return {
      success: true,
      message: '百度搜索 AnbaoAgent 成功',
      result: result,
      output_file: resultFile,
      results_count: searchResults.length
    };
    
  } catch (error: any) {
    console.error('搜索过程中发生错误:', error);
    context.log(`搜索失败: ${error.message}`, 'error');
    
    // 发送错误通知
    context.notify({
      title: '任务失败',
      content: `hello anbao - 搜索失败: ${error.message}`,
      category: 'TaskResult'
    });
    
    context.forceExit(`搜索失败: ${error.message}`);
  }
}