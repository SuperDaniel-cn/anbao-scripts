import {
  RunOptions,
  Uploader,
  PlatformActionMap,
  Platform,
  UploadResult,
  UploadError,
} from "../types.js";
import { fillTextField, handleFileUpload } from "../utils/common/index.js";
import {
  handleDouyinCoverUpload,
  handleDouyinScheduler,
} from "../utils/platforms/index.js";

// --- 辅助函数与常量 ---
const URLS = {
  UPLOAD_PAGE: "https://creator.douyin.com/creator-micro/content/upload",
};

// --- Uploader 接口实现 (核心生命周期) ---

const douyinActionOrder = [
  "title",
  "description",
  "tags",
  "cover_image_path",
  "schedule_date",
];

const isLoggedIn = async ({ page }: RunOptions): Promise<boolean> => {
  await page.goto(URLS.UPLOAD_PAGE, {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  const uploadButton = page.getByRole("button", { name: "上传视频" });
  await uploadButton.waitFor({ state: "visible", timeout: 15000 });
  return await uploadButton.isVisible();
};

const uploadVideo = async ({ page, context }: RunOptions): Promise<void> => {
  const { common, log } = context;
  if (!common.video_file_path) {
    throw new UploadError("未提供视频文件路径，任务无法继续。");
  }

  const fileInputLocator = page.locator('input[type="file"][tabindex="-1"]');
  const timeout = ((common.upload_timeout_minutes as number) || 30) * 60 * 1000;
  log(`等待视频上传完成... (最长 ${timeout / 60000} 分钟)`, "info");

  await handleFileUpload({
    filePath: common.video_file_path as string,
    fileInputLocator,
    successLocators: [page.getByText("预览视频")],
    timeout,
  });
};

const submit = async ({ page, context }: RunOptions): Promise<UploadResult> => {
  const { final_action } = context.common;

  if (final_action === "人工审查") {
    await context.requestHumanIntervention({
      message: `【抖音】已暂停，请人工审查后手动发布或关闭。`,
    });
    return { status: "draft", postUrl: "（人工操作）" };
  }

  let status: "draft" | "published" = "published";
  if (final_action === "存草稿") {
    await page.getByRole("button", { name: "暂存离开" }).click();
    status = "draft";
    // TODO: 验证草稿保存成功
  } else {
    // 默认或 "立即投稿"
    await page.getByRole("button", { name: "发布", exact: true }).click();
    // TODO: 验证发布成功
  }

  await page.waitForTimeout(5000); // 临时等待

  return { status, postUrl: page.url() };
};

const uploader: Uploader = {
  actionOrder: douyinActionOrder,
  isLoggedIn,
  uploadVideo,
  submit,
};

// --- PlatformActions 实现 (动态业务动作) ---

const platformActions: PlatformActionMap = {
  title: async ({ page }, value) => {
    const titleInput = page.getByRole("textbox", {
      name: "填写作品标题，为作品获得更多流量",
    });
    await fillTextField(titleInput, value as string);
  },
  description: async ({ page }, value) => {
    await page.locator(".zone-container").click();
    await fillTextField(page.locator(".zone-container"), value as string);
  },
  tags: async ({ page }, value) => {
    const tags = (value as string).split(/[\s,]+/).filter(Boolean);
    if (tags.length === 0) return;
    await page.keyboard.press("End");
    await page.keyboard.insertText(" ");

    for (const tag of tags) {
      await page.keyboard.insertText(`#${tag} `);
      await page.waitForTimeout(200);
    }
  },
  cover_image_path: async (options, value) => {
    await handleDouyinCoverUpload(options.page, options.context, value);
  },
  schedule_date: async (options, value) => {
    const { schedule_time } = options.context.common;
    const scheduleDateTime = `${value} ${schedule_time}`;
    await handleDouyinScheduler(
      options.page,
      options.context,
      scheduleDateTime
    );
  },
};

const platform: Platform = {
  key: "douyin",
  uploader,
  actions: platformActions,
};

export default platform;
