import { RunOptions, Uploader, PlatformError } from '../types';

// --- Helper: Safe Action Wrapper ---

const createSafeAction = (context: RunOptions['context']) => {
  return async <T>(action: () => Promise<T>, errorMessage: string): Promise<T> => {
    try {
      // First attempt
      return await action();
    } catch (error) {
      context.log(`自动化操作失败: ${errorMessage}。错误: ${(error as Error).message}`, 'warn');
      await context.requestHumanIntervention({
        message: `自动化操作失败: "${errorMessage}"\n\n请手动完成此步骤，然后点击“继续”让脚本重试。`,
      });
      
      // Second attempt after human intervention
      context.log('正在重试操作...', 'info');
      try {
        return await action();
      } catch (finalError) {
        throw new PlatformError(`在人工介入后，操作 "${errorMessage}" 仍然失败: ${(finalError as Error).message}`);
      }
    }
  };
};


// --- Platform Implementation ---

async function isLoggedIn({ page, context }: RunOptions): Promise<boolean> {
  // ... (isLoggedIn logic remains the same, as it has its own try/catch)
  context.log('[Bilibili] 正在检查登录状态...', 'info');
  try {
    await page.goto('https://member.bilibili.com/platform/home', { waitUntil: 'domcontentloaded' });
    const currentUrl = page.url();
    if (currentUrl.includes('passport.bilibili.com/login')) {
      context.log('[Bilibili] 检测到页面跳转至登录页，判定为未登录。', 'warn');
      return false;
    }
    const avatarSelector = 'img.custom-lazy-img';
    await page.waitForSelector(avatarSelector, { timeout: 5000 });
    const isLoggedIn = await page.isVisible(avatarSelector);
    context.log(`[Bilibili] 登录状态检查完成，结果: ${isLoggedIn}`, 'info');
    return isLoggedIn;
  } catch (error) {
    context.log('[Bilibili] 登录检查失败，未找到关键元素或发生其他错误。', 'warn');
    return false;
  }
}

async function upload({ page, context }: RunOptions): Promise<{ postUrl: string }> {
  const safeAction = createSafeAction(context);
  const { common } = context;
  const { video_file_path, video_title, video_description, topics, submit_action } = common;

  await safeAction(() => 
    page.goto('https://member.bilibili.com/platform/upload/video/frame', { waitUntil: 'domcontentloaded' }),
    '导航至投稿页面'
  );

  const fileChooserPromise = page.waitForEvent('filechooser');
  await safeAction(() => page.getByText('上传视频').click(), '点击“上传视频”按钮');
  const fileChooser = await fileChooserPromise;
  await safeAction(() => fileChooser.setFiles(video_file_path), '选择视频文件');
  
  const titleInput = page.getByRole('textbox', { name: '请输入稿件标题' });
  await safeAction(() => titleInput.waitFor({ state: 'visible', timeout: 120000 }), '等待视频处理与页面跳转');

  await safeAction(() => titleInput.fill(video_title), '填写视频标题');
  if (video_description) {
    await safeAction(() => page.locator('.ql-editor').fill(video_description), '填写视频简介');
  }

  if (topics) {
    const tagInput = page.getByRole('textbox', { name: '按回车键Enter创建标签' });
    const topicList = topics.split(/[\s,，]+/);
    for (const topic of topicList) {
      if (topic) {
        await safeAction(() => tagInput.fill(topic), `填写话题: ${topic}`);
        await safeAction(() => tagInput.press('Enter'), `确认话题: ${topic}`);
      }
    }
  }

  const finalSubmitButton = page.getByText(submit_action || '立即投稿');
  await safeAction(() => finalSubmitButton.waitFor({ state: 'visible', timeout: 300000 }), '等待上传完成');
  
  await safeAction(() => finalSubmitButton.click(), `点击“${submit_action}”按钮`);

  if (submit_action === '存为草稿') {
    context.log('[Bilibili] 已存为草稿，任务结束。', 'success');
    return { postUrl: 'draft' };
  }

  const successLink = page.locator('a.success-jump-url');
  await safeAction(() => successLink.waitFor({ state: 'visible', timeout: 60000 }), '等待发布成功链接');
  
  const postUrl = await successLink.getAttribute('href');
  if (!postUrl) {
    throw new PlatformError('发布成功，但未能获取到视频链接。');
  }

  const fullUrl = postUrl.startsWith('http') ? postUrl : `https:${postUrl}`;
  context.log(`[Bilibili] 发布成功！视频链接: ${fullUrl}`, 'success');
  return { postUrl: fullUrl };
}

async function verify({ page, context }: RunOptions, { postUrl }: { postUrl: string }): Promise<boolean> {
  // ... (verify logic remains the same)
  if (postUrl === 'draft') {
    context.log('[Bilibili] 操作为存为草稿，跳过后置验证。', 'info');
    return true;
  }
  context.log('[Bilibili] 正在执行发布后验证...', 'info');
  if (!postUrl) return false;
  try {
    await page.goto(postUrl, { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    if (title.includes(context.common.video_title)) {
      context.log('[Bilibili] 验证成功: 页面标题与视频标题匹配。', 'success');
      return true;
    }
    context.log('[Bilibili] 验证失败: 页面标题与视频标题不匹配。', 'warn');
    return false;
  } catch (error) {
    context.log(`[Bilibili] 验证失败，发生错误: ${(error as Error).message}`, 'error');
    return false;
  }
}

export const uploader: Uploader = {
  isLoggedIn,
  upload,
  verify,
};
