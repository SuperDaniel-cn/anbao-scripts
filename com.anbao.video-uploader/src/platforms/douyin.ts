import { RunOptions, Uploader } from '../types';

async function isLoggedIn({ page, context }: RunOptions): Promise<boolean> {
  context.log('[Douyin] Checking login status...', 'info');
  try {
    await page.goto('https://creator.douyin.com/creator-micro/home', { waitUntil: 'domcontentloaded' });
    
    // On Douyin creator platform, a logged-in user has an avatar element.
    const avatarSelector = '.avatar--1l22R';
    await page.waitForSelector(avatarSelector, { timeout: 5000 });
    
    const isLoggedIn = await page.isVisible(avatarSelector);
    context.log(`[Douyin] Login status check result: ${isLoggedIn}`, 'info');
    return isLoggedIn;
  } catch (error) {
    context.log('[Douyin] Login check failed. User is likely not logged in.', 'warn');
    return false;
  }
}

async function upload(options: RunOptions): Promise<{ postUrl: string }> {
  options.context.log('[Douyin] upload() not implemented yet.', 'warn');
  // Placeholder
  return { postUrl: 'https://www.douyin.com/' };
}

export const uploader: Uploader = {
  isLoggedIn,
  upload,
};