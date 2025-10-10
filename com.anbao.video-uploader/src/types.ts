import type { Page, BrowserContext } from 'playwright';

// --- Standard Anbao Types ---

/**
 * The context object provided to the script by the Anbao Agent runtime.
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
 * The options object passed to the main 'run' function and all uploader methods.
 */
export interface RunOptions {
  browser: BrowserContext;
  page: Page;
  context: AnbaoContext;
}

// --- Custom Error Types ---

/**
 * Base class for all platform-specific errors to allow for targeted catch blocks.
 */
export class PlatformError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlatformError';
  }
}

export class LoginError extends PlatformError {
  constructor(message: string = 'User is not logged in.') {
    super(message);
    this.name = 'LoginError';
  }
}

export class UploadError extends PlatformError {
    constructor(message: string = 'Failed during the upload process.') {
    super(message);
    this.name = 'UploadError';
  }
}

export class ValidationError extends PlatformError {
    constructor(message: string = 'Business validation failed before final submission.') {
    super(message);
    this.name = 'ValidationError';
  }
}

export class VerificationError extends PlatformError {
    constructor(message: string = 'Post-upload verification failed.') {
    super(message);
    this.name = 'VerificationError';
  }
}


// --- Uploader Interface Contract ---

/**
 * The contract that all platform-specific uploader modules must implement.
 */
export interface Uploader {
  /**
   * Checks if the user is currently logged into the platform.
   * @param options The standard RunOptions object.
   * @returns A promise that resolves to true if logged in, false otherwise.
   */
  isLoggedIn(options: RunOptions): Promise<boolean>;

  /**
   * Executes the core upload and publishing logic for the platform.
   * @param options The standard RunOptions object.
   * @returns A promise that resolves with the URL of the newly published video.
   */
  upload(options: RunOptions): Promise<{ postUrl: string }>;

  /**
   * (Optional) Verifies that the video was successfully published after the upload process.
   * This is typically done by navigating to a "My Videos" page and checking for the new content.
   * @param options The standard RunOptions object.
   * @param resultFromUpload The result object from the 'upload' method, which may contain the post URL.
   * @returns A promise that resolves to true if verification is successful.
   */
  verify?(options: RunOptions, resultFromUpload: { postUrl: string }): Promise<boolean>;
}