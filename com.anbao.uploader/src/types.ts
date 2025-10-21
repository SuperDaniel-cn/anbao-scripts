import { BrowserContext, Page } from "patchright";

/**
 * Anbao Agent 平台提供给脚本的核心上下文对象。
 * 包含执行所需的所有信息和与平台交互的 API。
 */
export interface AnbaoContext {
  /**
   * 通用输入：由用户通过 `@schema` 生成的表单动态填写的参数。
   * @example
   * const title = context.common.video_title;
   */
  common: Record<string, unknown>;

  /**
   * 当前运行实例匹配到的平台信息。
   */
  platform: { name: string; base_url: string };

  /**
   * 当前运行实例所使用的 Profile 信息。
   */
  profile: { name: string };

  /**
   * 路径 API，提供对特定系统目录的访问。
   */
  paths: {
    /** 用户系统的“下载”目录 */
    downloads: string;
    /** 与 Profile 绑定的、可持久化读写的目录 */
    data: string;
  };

  /**
   * 结构化日志 API。用于向用户报告清晰的任务进度。
   * @param message 日志内容。
   * @param level 日志级别，影响 UI 显示。
   */
  log: (message: string, level?: "info" | "warn" | "error" | "success") => void;

  /**
   * 发送一个系统级通知。
   */
  notify: (payload: {
    title: string;
    content: string;
    category?: "ScriptMessage" | "TaskResult";
  }) => void;

  /**
   * 强制退出 API。用于脚本优雅地终止任务并报告业务错误。
   * @param errorMessage 具体的错误信息。
   */
  forceExit: (errorMessage?: string) => void;

  /**
   * 请求人工介入 (Human-in-the-Loop)。
   * @param options 介入请求的配置。
   */
  requestHumanIntervention: (options: {
    message: string;
    timeout?: number;
    theme?: "light" | "dark";
    actions?: { id: string; label: string }[];
  }) => Promise<string | void>;
}

/**
 * 脚本 `run` 函数接收的完整参数。
 */
export interface RunOptions {
  browser: BrowserContext;
  page: Page;
  context: AnbaoContext;
}

/**
 * 平台上传模块必须遵守的契约(接口)。
 */
export interface Uploader {
  /**
   * (可选) 定义平台特定业务动作的执行顺序。
   * 如果提供，调度器将严格按照此顺序执行 `PlatformActionMap` 中的动作。
   * 这对于UI操作有严格时序要求的平台至关重要。
   */
  actionOrder?: string[];

  /**
   * 检查当前浏览器上下文中，平台是否处于登录状态。
   */
  isLoggedIn(options: RunOptions): Promise<boolean>;

  /**
   * 步骤 2: 上传视频文件并等待平台处理完成。
   */
  uploadVideo(options: RunOptions): Promise<void>;

  /**
   * 步骤 3: 执行最终提交操作。
   */
  submit(options: RunOptions): Promise<UploadResult>;
}

/**
 * 定义一个“动作处理器”函数签名。
 * 每个处理器负责处理一个来自 `schema.json` 的字段。
 * @param options - 标准的 RunOptions。
 * @param value - 从 `context.common` 中获取的、与当前动作对应的字段值。
 */
export type ActionHandler = (options: RunOptions, value: any) => Promise<void>;

/**
 * 定义一个平台的“动作地图”。
 * 键名必须严格对应 `schema.json` 中的字段名。
 * 调度器会根据 `context.common` 中的键来动态调用这些处理器。
 */
export type PlatformActionMap = Record<string, ActionHandler>;

/**
 * `upload` 方法成功后的返回结果。
 */
export interface UploadResult {
  /**
   * 上传操作的最终状态。
   * - `published`: 已立即发布。
   * - `draft`: 已保存为草稿。
   * - `scheduled`: 已定时发布。
   */
  status: "published" | "draft" | "scheduled";
  /**
   * 成功发布后，作品的访问 URL (如果可用)。
   */
  postUrl?: string | undefined;
}

// --- Custom Error Types ---

export class PlatformError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlatformError";
  }
}

export class LoginError extends PlatformError {
  constructor(message: string) {
    super(message);
    this.name = "LoginError";
  }
}

export class UploadError extends PlatformError {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

export class ValidationError extends PlatformError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class VerificationError extends PlatformError {
  constructor(message: string) {
    super(message);
    this.name = "VerificationError";
  }
}

/**
 * 定义一个完整的平台模块。
 * 这是平台注册和发现的基本单元。
 */
export interface Platform {
  /**
   * 平台的唯一标识符，用于在 URL 中进行匹配。
   * @example 'bilibili'
   */
  key: string;
  /**
   * 平台的核心上传逻辑实现。
   */
  uploader: Uploader;
  /**
   * 平台支持的动态业务动作映射。
   */
  actions: PlatformActionMap;
}
