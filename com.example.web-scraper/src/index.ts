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

// 注入复制搜索词按钮的辅助函数
async function injectCopyButton(page: Page, searchTerm: string) {
  try {
    // 注入复制按钮的 JavaScript
    await page.evaluate((term) => {
      // 如果按钮已存在，先移除
      const existingButton = document.getElementById('copy-search-term-btn');
      if (existingButton) {
        existingButton.remove();
      }
      
      // 创建按钮元素
      const button = document.createElement('button');
      button.id = 'copy-search-term-btn';
      button.textContent = '复制搜索词';
      button.style.position = 'fixed';
      button.style.top = '20px';
      button.style.right = '20px';
      button.style.zIndex = '9999';
      button.style.padding = '10px 15px';
      button.style.backgroundColor = '#4CAF50';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '4px';
      button.style.cursor = 'pointer';
      button.style.fontSize = '16px';
      button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      
      // 添加点击事件
      button.addEventListener('click', () => {
        // 复制搜索词到剪贴板
        navigator.clipboard.writeText(term).then(() => {
          alert('搜索词已复制到剪贴板！');
        }).catch(err => {
          console.error('复制失败:', err);
          alert('复制失败，请手动复制搜索词：' + term);
        });
      });
      
      // 将按钮添加到页面
      document.body.appendChild(button);
    }, searchTerm);
    
    return true;
  } catch (error) {
    console.error('注入复制按钮失败:', error);
    return false;
  }
}

export async function run({ page, context }: RunOptions) {
  context.log('开始百度搜索测试任务', 'info');
  
  // 发送开始通知
  context.notify({
    title: '任务开始',
    content: 'hello anbao - 开始百度搜索测试',
    category: 'ScriptMessage'
  });
  
  try {
    // 获取用户输入的搜索词
    const searchTerm = context.common.search_term;
    if (!searchTerm) {
      context.forceExit('请提供搜索词');
      return;
    }
    
    context.log(`使用搜索词: ${searchTerm}`, 'info');
    
    // 步骤1: 打开百度，尝试找到输入框，不能就介入
    context.log('正在访问百度首页...', 'info');
    await page.goto('https://www.baidu.com', { waitUntil: 'networkidle' });
    
    context.log('尝试找到搜索框...', 'info');
    let searchBox;
    try {
      searchBox = await page.waitForSelector('#kw', { timeout: 5000 });
      context.log('成功找到搜索框', 'success');
    } catch (timeoutError) {
      context.log('找不到搜索框，请求人工介入', 'warn');
      
      // 发送超时通知
      context.notify({
        title: '操作超时',
        content: 'hello anbao - 找不到搜索框，需要人工介入',
        category: 'TaskResult'
      });
      
      // 在请求人工介入前，先注入复制搜索词按钮
      await injectCopyButton(page, searchTerm);
      
      // 请求人工介入
      await context.requestHumanIntervention({
        message: `找不到搜索框，已提供复制搜索词按钮。搜索词为: "${searchTerm}"，请手动复制并粘贴到搜索框，然后点击继续按钮。`,
        timeout: 30000, // 30秒超时
        theme: 'light'
      });
      
      context.log('人工介入完成，继续执行任务', 'info');
    }
    
    // 步骤2: 介入之后，应该是点击搜索，不能就介入
    context.log('尝试点击搜索按钮...', 'info');
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
      
      // 在请求人工介入前，先注入复制搜索词按钮
      await injectCopyButton(page, searchTerm);
      
      // 请求人工介入
      await context.requestHumanIntervention({
        message: `搜索按钮点击超时，已提供复制搜索词按钮。搜索词为: "${searchTerm}"，请手动点击搜索按钮，然后点击继续按钮。`,
        timeout: 30000, // 30秒超时
        theme: 'light'
      });
      
      context.log('人工介入完成，继续执行任务', 'info');
    }
    
    // 步骤3: 介入之后，应该是截图，直接截图
    context.log('准备截图...', 'info');
    
    const fs = require('fs').promises;
    const path = require('path');
    const outputDirectory = context.common.output_directory || context.paths.data;
    const screenshotFormat = context.common.screenshot_format || 'png';
    
    // 确保输出目录存在
    await fs.mkdir(outputDirectory, { recursive: true });
    
    // 生成截图文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(outputDirectory, `baidu-search-${timestamp}.${screenshotFormat}`);
    
    try {
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
    
    // 发送完成通知
    context.notify({
      title: '任务完成',
      content: 'hello anbao - 百度搜索测试任务完成，已截图',
      category: 'TaskResult'
    });
    
    return {
      success: true,
      message: '百度搜索测试任务完成',
      screenshot_file: screenshotPath
    };
    
  } catch (error: any) {
    console.error('搜索过程中发生错误:', error);
    context.log(`搜索失败: ${error.message}`, 'error');
    
    // 获取用户输入的搜索词
    const searchTerm = context.common.search_term || '';
    
    // 如果搜索失败，在页面上提供一个复制搜索词按钮
    if (searchTerm) {
      const success = await injectCopyButton(page, searchTerm);
      if (success) {
        context.log('已添加复制搜索词按钮到页面', 'info');
      } else {
        context.log('注入复制搜索词按钮失败', 'warn');
      }
    }
    
    // 发送错误通知
    context.notify({
      title: '任务失败',
      content: `hello anbao - 搜索失败: ${error.message}${searchTerm ? '，已提供复制搜索词按钮' : ''}`,
      category: 'TaskResult'
    });
    
    context.forceExit(`搜索失败: ${error.message}`);
  }
}