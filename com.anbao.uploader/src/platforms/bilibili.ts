import {
  RunOptions,
  Uploader,
  PlatformActionMap,
  Platform,
  UploadResult,
  UploadError,
} from "../types.js";
import {
  handleBilibiliTagInput,
  handleBilibiliCoverUpload,
  handleBilibiliScheduler,
} from "../utils/platforms/index.js";
import { handleFileUpload, fillTextField } from "../utils/common/index.js";

// --- 辅助函数与常量 ---
const URLS = {
  CREATOR_HOME: "https://member.bilibili.com/platform/home",
  UPLOAD_PAGE: "https://member.bilibili.com/platform/upload/video/frame",
  MANAGER_PAGE: "https://member.bilibili.com/platform/upload-manager/article",
};

// --- Uploader 接口实现 (核心生命周期) ---

const bilibiliActionOrder = [
  "cover_image_path",
  "title",
  "partition",
  "tags",
  "description",
  "schedule_date",
];

const isLoggedIn = async ({ page }: RunOptions): Promise<boolean> => {
  await page.goto(URLS.CREATOR_HOME, {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  const loginElement = page.getByText(/成为UP主的第\d+天/);
  // 正确的模式：等待元素出现。如果超时，将自动抛出错误，由中心执行器捕获。
  await loginElement.waitFor({ state: "visible", timeout: 10000 });
  return true;
};

const uploadVideo = async ({ page, context }: RunOptions): Promise<void> => {
  const { common, log } = context;
  if (!common.video_file_path) {
    throw new UploadError("未提供视频文件路径，任务无法继续。");
  }

  const uploadUrl = (common.target_url as string) || URLS.UPLOAD_PAGE;
  await page.goto(uploadUrl);

  const fileInputLocator = page.locator(
    'input[type="file"][multiple][style*="display: none"]'
  );
  const timeout = ((common.upload_timeout_minutes as number) || 30) * 60 * 1000;
  log(`等待视频处理完成... (最长 ${timeout / 60000} 分钟)`, "info");

  await handleFileUpload({
    filePath: common.video_file_path as string,
    fileInputLocator,
    successLocators: [
      page.getByText("上传完成").nth(1),
      page.getByText("更换视频"),
    ],
    timeout,
  });

  // 强制选择“自制”
  log("已选择类型: 自制", "info");
  await page
    .getByText("类型自制转载", { exact: true })
    .getByText("自制")
    .first()
    .click();
};

const submit = async ({ page, context }: RunOptions): Promise<UploadResult> => {
  const { final_action } = context.common;

  if (final_action === "人工审查") {
    await context.requestHumanIntervention({
      message: `【Bilibili】已暂停，请人工审查后手动发布或关闭。`,
    });
    return { status: "draft", postUrl: "（人工操作）" };
  }

  let status: "draft" | "published" = "published";
  if (final_action === "存草稿") {
    await page.getByText("存草稿").click();
    status = "draft";
    // “存草稿”的专属验证逻辑
    const videoManagerLink = page.getByRole("link", {
      name: "视频管理",
      exact: true,
    });
    await videoManagerLink.waitFor({ timeout: 60000 });
  } else {
    // 默认或 "立即投稿"
    await page.getByText("立即投稿").click();
    // “立即投稿”的专属验证逻辑
    await page.getByText("稿件投递成功").waitFor({ timeout: 30000 });
  }

  return { status, postUrl: page.url() };
};

const uploader: Uploader = {
  actionOrder: bilibiliActionOrder,
  isLoggedIn,
  uploadVideo,
  submit,
};

// --- PlatformActions 实现 (动态业务动作) ---

const platformActions: PlatformActionMap = {
  cover_image_path: async ({ page, context }, value) => {
    await handleBilibiliCoverUpload(page, context, value);
  },

  title: async ({ page }, value) => {
    const titleInput = page.getByRole("textbox", { name: "请输入稿件标题" });
    await fillTextField(titleInput, value);
  },

  partition: async ({ page }, value) => {
    // 终极版修复：根据您提供的标准HTML结构，使用最精确的选择器
    // 1. 锁定包含“分区”的、最外层的唯一容器
    const partitionRoot = page.locator(".video-human-type");

    // 2. 在这个容器内部，点击唯一的触发器
    const trigger = partitionRoot.locator(".select-controller");
    await trigger.click();

    // 3. 等待下拉菜单容器出现
    const optionsContainer = page.locator(".drop-list-v2-container");
    await optionsContainer.waitFor({ state: "visible", timeout: 5000 });

    // 4. 在这个正确的容器内，点击确切的选项
    const option = optionsContainer.getByTitle(value, { exact: true });
    await option.click();
  },

  tags: async ({ page }, value) => {
    const tags = (value as string).split(/[\s,]+/).filter(Boolean);
    if (tags.length === 0) return;

    const tagInput = page.getByRole("textbox", {
      name: "按回车键Enter创建标签",
    });
    await handleBilibiliTagInput(page, tags, tagInput);
  },

  description: async ({ page }, value) => {
    const descEditor = page.locator(
      '.ql-editor[data-placeholder*="填写更全面的相关信息"]'
    );
    await descEditor.click();
    await fillTextField(descEditor, value, { clear: false });
  },

  schedule_date: async ({ page, context }, value) => {
    const { schedule_time } = context.common;
    const schedule_date = value as string;
    await handleBilibiliScheduler(
      page,
      context,
      schedule_date as string,
      schedule_time as string
    );
  },
};

const platform: Platform = {
  key: "bilibili",
  uploader,
  actions: platformActions,
};

export default platform;
