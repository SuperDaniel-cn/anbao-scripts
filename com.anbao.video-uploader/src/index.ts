import {
  RunOptions,
  Uploader,
  PlatformError,
  LoginError,
} from './types';
import { uploader as bilibiliUploader } from './platforms/bilibili';
import { uploader as douyinUploader } from './platforms/douyin';
// Import other platform modules here

// Platform Registry
const platformRegistry: Record<string, Uploader> = {
  bilibili: bilibiliUploader,
  douyin: douyinUploader,
  // Add other platforms here
};

const getUploader = (baseUrl: string): Uploader | undefined => {
  const lowerCaseUrl = baseUrl.toLowerCase();
  for (const key in platformRegistry) {
    if (lowerCaseUrl.includes(key)) {
      return platformRegistry[key];
    }
  }
  return undefined;
};

export async function run(options: RunOptions) {
  const { context } = options;
  const { platform } = context;

  try {
    context.log(`任务启动，平台: ${platform.name}`, 'info');

    // 1. Find the correct uploader for the current platform
    const uploader = getUploader(platform.base_url);
    if (!uploader) {
      throw new PlatformError(`不支持的平台: ${platform.name} (${platform.base_url})`);
    }
    context.log('成功匹配到平台处理模块。', 'info');

    // 2. Pre-flight Check: Login status
    context.log('正在执行前置检查: 登录状态...', 'info');
    let isLoggedIn = await uploader.isLoggedIn(options);

    if (!isLoggedIn) {
      context.log('用户未登录。', 'warn');
      // TODO: Add smart check for headless mode
      await context.requestHumanIntervention({
        message: `检测到您尚未登录 ${platform.name}，请在浏览器中完成登录后点击“继续”。`,
      });
      
      // Check again after human intervention
      isLoggedIn = await uploader.isLoggedIn(options);
      if (!isLoggedIn) {
        throw new LoginError(`在人工介入后，登录状态依然无效。`);
      }
      context.log('登录成功，继续执行任务。', 'success');
    } else {
      context.log('登录状态有效。', 'success');
    }

    // 3. Core Upload Process
    context.log('正在执行核心上传流程...', 'info');
    const uploadResult = await uploader.upload(options);
    context.log(`核心上传流程完成。视频发布于: ${uploadResult.postUrl}`, 'success');

    // 4. Post-flight Verification (if implemented)
    if (uploader.verify) {
      context.log('正在执行发布后验证...', 'info');
      const isVerified = await uploader.verify(options, uploadResult);
      if (!isVerified) {
        // This is not a critical error, so we just log a warning.
        context.log('发布后验证失败，可能需要您手动确认。', 'warn');
      } else {
        context.log('发布后验证成功！', 'success');
      }
    }

    context.log('任务成功完成！', 'success');
    return {
      success: true,
      message: `视频已成功发布到 ${platform.name}。`,
      url: uploadResult.postUrl,
    };

  } catch (error: any) {
    // 5. Unified Error Handling
    if (error instanceof PlatformError) {
      context.log(`脚本执行失败: ${error.message}`, 'error');
      context.forceExit(error.message);
    } else {
      // For unexpected errors
      const errorMessage = `发生未知错误: ${error.message || 'No error message'}`;
      context.log(errorMessage, 'error');
      console.error(error); // Log the full stack trace for debugging
      context.forceExit(errorMessage);
    }
    
    // This part will not be reached due to forceExit, but it's good practice
    return {
      success: false,
      message: error.message,
    };
  }
}