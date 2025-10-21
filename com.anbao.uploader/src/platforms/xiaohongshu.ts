import {
  RunOptions,
  Uploader,
  PlatformActionMap,
  Platform,
  UploadResult,
} from "../types.js";
import { handleFileUpload, fillTextField } from "../utils/common/index.js";

// --- 辅助函数与常量 ---
const URLS = {
  CREATOR_HOME: "https://creator.xiaohongshu.com/new/home",
  UPLOAD_PAGE:
    "https://creator.xiaohongshu.com/publish/publish?from=menu&target=video",
};

// --- Uploader 接口实现 (核心生命周期) ---

const xhsActionOrder = [
  "cover_image_path",
  "title",
  "description",
  "tags",
  "schedule_date",
];

const isLoggedIn = async ({ page }: RunOptions): Promise<boolean> => {
  await page.goto(URLS.CREATOR_HOME, {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  // 使用 xhs.md 中提供的选择器
  const avatar = page.getByRole("img").nth(1);
  const publishButton = page.getByText("发布笔记");
  await avatar.waitFor({ state: "visible", timeout: 10000 });
  return await publishButton.isVisible();
};

const uploadVideo = async ({ page, context }: RunOptions): Promise<void> => {
  const { common, log } = context;
  if (!common.video_file_path) {
    throw new Error("未提供视频文件路径，任务无法继续。");
  }

  await page.goto(URLS.UPLOAD_PAGE);

  // 根据 xhs.md，使用 'Choose File' 按钮来定位文件输入框
  const fileInput = page.locator('input[type="file"][accept*=".mp4"]');

  const timeout = ((common.upload_timeout_minutes as number) || 30) * 60 * 1000;
  log(`等待视频上传完成... (最长 ${timeout / 60000} 分钟)`, "info");

  await handleFileUpload({
    filePath: common.video_file_path as string,
    fileInputLocator: fileInput,
    successLocators: [page.getByText("上传成功", { exact: true })],
    timeout,
  });
};

const submit = async ({ page, context }: RunOptions): Promise<UploadResult> => {
  const { final_action } = context.common;

  if (final_action === "人工审查") {
    await context.requestHumanIntervention({
      message: `【小红书】已暂停，请人工审查后手动发布或关闭。`,
    });
    return { status: "draft", postUrl: "（人工操作）" };
  }

  let status: "draft" | "published" | "scheduled" = "published";

  if (context.common.schedule_date) {
    if (final_action === "存草稿") {
      await page.getByRole("button", { name: "暂存离开" }).click();
      status = "draft"; // 定时任务存为草稿
    } else {
      // 默认或 "立即发布" 都视为定时发布
      await page.getByRole("button", { name: "定时发布" }).click();
      status = "scheduled";
    }
  } else if (final_action === "存草稿") {
    await page.getByRole("button", { name: "暂存离开" }).click();
    status = "draft";
  } else {
    // 立即发布
    await page.getByRole("button", { name: "发布" }).click();
  }

  // TODO: 找到一个可靠的发布成功标识
  // 暂时先等待一个短时间
  await page.waitForTimeout(10000);

  return { status, postUrl: page.url() };
};

const uploader: Uploader = {
  actionOrder: xhsActionOrder,
  isLoggedIn,
  uploadVideo,
  submit,
};

// --- PlatformActions 实现 (动态业务动作) ---

const platformActions: PlatformActionMap = {
  cover_image_path: async ({ page, context }, value) => {
    context.log("开始设置封面...", "info");
    await page.getByText("设置封面", { exact: true }).click();

    // 验证模态框弹出
    await page.getByText("获取封面建议").waitFor();

    // 采用事件监听的方式处理文件选择，更加稳健
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByText("上传图片", { exact: true }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(value);

    // 上传后立即点击确定
    await page.getByRole("button", { name: "确定" }).click();

    // 等待模态框关闭后，主页面出现成功提示
    await page
      .getByText("封面效果评估通过，未发现封面质量问题")
      .waitFor({ state: "visible", timeout: 30000 });
    context.log("封面设置成功", "success");
  },

  title: async ({ page }, value) => {
    const titleInput = page.getByRole("textbox", {
      name: "填写标题会有更多赞哦～",
    });
    await fillTextField(titleInput, value);
  },

  description: async ({ page }, value) => {
    // 根据 xhs.md，第二个 textbox 是正文
    const descInput = page.getByRole("textbox").nth(1);
    await fillTextField(descInput, value);
  },

  tags: async ({ page, context }, tagsString: string) => {
    if (!tagsString) return;
    const { log } = context;
    const tags = tagsString.split(/[,，\s]+/).filter(Boolean);

    log("准备输入话题标签...", "info");
    for (const tag of tags) {
      await page.getByRole("button", { name: "话题" }).click();
      // 点击后，'#' 会自动输入，光标已就位
      await page.keyboard.type(tag);
      // 等待片刻，让推荐列表出现，以确保回车键选择的是正确的标签
      await page.waitForTimeout(1000);
      await page.keyboard.press("Enter");
      log(`已输入标签: ${tag}`, "info");
      await page.waitForTimeout(500); // 等待标签添加动画
    }
    log("所有标签输入完毕。", "success");
  },

  schedule_date: async ({ page, context }, value) => {
    const { schedule_time } = context.common;
    const dateTime = `${value} ${schedule_time}`;

    await page.getByText("定时发布").click();
    const dateInput = page.getByRole("combobox", { name: "选择日期和时间" });
    await dateInput.click();
    await dateInput.fill(dateTime);
    await dateInput.press("Enter");
    context.log(`已设置定时发布时间: ${dateTime}`, "info");
  },
};

const platform: Platform = {
  key: "xiaohongshu",
  uploader,
  actions: platformActions,
};

export default platform;
