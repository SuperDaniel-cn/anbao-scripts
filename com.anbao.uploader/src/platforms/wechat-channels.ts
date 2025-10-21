import {
  RunOptions,
  Uploader,
  PlatformActionMap,
  Platform,
  UploadResult,
  UploadError,
} from "../types.js";
import { handleFileUpload, fillTextField } from "../utils/common/index.js";

// --- 辅助函数与常量 ---
const URLS = {
  PLATFORM: "https://channels.weixin.qq.com/platform/",
  CREATE_POST: "https://channels.weixin.qq.com/platform/post/create",
};

// --- Uploader 接口实现 (核心生命周期) ---

const wechatChannelsActionOrder = [
  "cover_image_path",
  "description",
  "tags",
  "title",
  "schedule_date",
];

const isLoggedIn = async ({ page }: RunOptions): Promise<boolean> => {
  await page.goto(URLS.PLATFORM, {
    // 改为 domcontentloaded 以避免因次要网络请求而超时。
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  const avatar = page.getByRole("img", { name: "视频号头像" });
  // 显式等待关键元素出现，这比等待 networkidle 更可靠。
  // 如果元素在10秒内没有出现，此操作会抛出错误，由 executeAction 捕获。
  await avatar.waitFor({ state: "visible", timeout: 15000 });
  return await avatar.isVisible();
};

const uploadVideo = async ({ page, context }: RunOptions): Promise<void> => {
  const { common, log } = context;
  if (!common.video_file_path) {
    throw new UploadError("未提供视频文件路径，任务无法继续。");
  }

  await page.goto(URLS.CREATE_POST);
  await page
    .getByText("发表动态")
    .waitFor({ state: "visible", timeout: 15000 });

  const fileInputLocator = page.locator(
    'input[type="file"][accept="video/mp4,video/x-m4v,video/*"]'
  );
  const timeout = ((common.upload_timeout_minutes as number) || 30) * 60 * 1000;
  log(`等待视频上传和处理完成... (最长 ${timeout / 60000} 分钟)`, "info");

  await handleFileUpload({
    filePath: common.video_file_path as string,
    fileInputLocator,
    successLocators: [page.getByText("封面预览编辑个人主页和分享卡片(3:4)")],
    timeout,
  });
};

const submit = async ({ page, context }: RunOptions): Promise<UploadResult> => {
  const { final_action, schedule_date } = context.common;

  if (final_action === "人工审查") {
    await context.requestHumanIntervention({
      message: `【视频号】已暂停，请人工审查后手动发布或关闭。`,
    });
    return { status: "draft", postUrl: "（人工操作）" };
  }

  if (schedule_date && final_action === "存草稿") {
    await context.requestHumanIntervention({
      message: "视频号不支持对定时发布的内容存草稿，请人工处理。",
    });
    return { status: "draft", postUrl: "（人工操作）" };
  }

  let status: "draft" | "published" = "published";
  if (final_action === "存草稿") {
    await page.getByRole("button", { name: "保存草稿" }).click();
    status = "draft";
    // 验证：等待“保存草稿”按钮消失，表示操作已开始或完成
    await page
      .getByRole("button", { name: "保存草稿" })
      .waitFor({ state: "hidden", timeout: 15000 });
    context.log("草稿已保存，但缺少最终验证步骤。", "warn");
  } else {
    await page.getByRole("button", { name: "发表" }).click();
    status = "published";
    // 验证：等待“发表”按钮消失，表示操作已开始或完成
    await page
      .getByRole("button", { name: "发表" })
      .waitFor({ state: "hidden", timeout: 15000 });
    context.log("发表操作已提交，但缺少最终验证步骤。", "warn");
  }

  return { status, postUrl: page.url() };
};

const uploader: Uploader = {
  actionOrder: wechatChannelsActionOrder,
  isLoggedIn,
  uploadVideo,
  submit,
};

// --- PlatformActions 实现 (动态业务动作) ---

const platformActions: PlatformActionMap = {
  cover_image_path: async ({ page }, value) => {
    // 移除用于调试的暂停代码
    // 根据用户提供的精确 HTML 结构，使用更稳定的 div class 选择器
    const coverImage = page.locator(
      "div.vertical-cover-wrap > div.vertical-img-wrap > img.cover-img-vertical"
    );
    await coverImage.click();

    await page
      .getByRole("heading", { name: "编辑封面" })
      .waitFor({ state: "visible" });

    const fileInput = page.locator(
      'input[type="file"][accept="image/jpeg,image/jpg,image/png"]'
    );
    await fileInput.setInputFiles(value as string);

    await page.getByRole("button", { name: "确认" }).click();
    await page
      .getByRole("heading", { name: "编辑封面" })
      .waitFor({ state: "hidden" });
  },

  description: async ({ page }, value) => {
    const editor = page.locator(".input-editor");
    await editor.click();
    await fillTextField(editor, value as string);
  },

  tags: async ({ page }, value) => {
    const tags = (value as string).split(/[\s,]+/).filter(Boolean);
    if (tags.length === 0) return;

    for (const tag of tags) {
      await page.getByText("#话题").click();
      await page.keyboard.insertText(tag + " ");
      await page.waitForTimeout(200);
    }
  },

  title: async ({ page }, value) => {
    const titleInput = page.getByRole("textbox", {
      name: "概括视频主要内容，字数建议6-16个字符",
    });
    await fillTextField(titleInput, value as string);
  },

  schedule_date: async ({ page, context }, value) => {
    const { schedule_time } = context.common;
    const scheduleDate = value as string;
    const scheduleTime = (schedule_time as string) || "12:00";
    const fullDateTime = `${scheduleDate} ${scheduleTime}`;

    // --- 采纳已验证的 Python 脚本逻辑，完全模拟用户点击操作 ---

    // 1. 点击“定时”开关
    await page.getByText("定时", { exact: true }).click();

    // 2. 点击日期输入框，弹出日期选择器
    const dateInput = page.getByRole("textbox", { name: "请选择发表时间" });
    await dateInput.click();

    // 3. 解析日期和时间
    const targetDate = new Date(fullDateTime);
    const targetDay = targetDate.getDate().toString();
    const targetHour = targetDate.getHours().toString();
    const targetMonthLabel = `${targetDate.getMonth() + 1}月`;

    // 4. 检查并切换月份
    const currentMonthLabel = await page
      .locator("span.weui-desktop-picker__panel__label")
      .getByText("月")
      .textContent();
    if (currentMonthLabel !== targetMonthLabel) {
      // 假设总是切换到下一个月
      await page.getByRole("button", { name: "Next Month" }).click();
    }

    // 5. 点击正确的“天”
    await page
      .locator("table.weui-desktop-picker__table a")
      .filter({ hasNotText: /weui-desktop-picker__disabled/ })
      .getByText(targetDay, { exact: true })
      .click();

    // 6. 输入小时
    const timeInput = page.getByPlaceholder("请选择时间");
    await timeInput.click();

    // 根据您的建议，使用 .fill() 来直接设置小时。
    // 这比模拟双击和键入更简洁、更直接。
    await timeInput.fill(targetHour);

    // 7. 点击页面其他地方（如描述编辑器）以确认时间输入
    await page.locator(".input-editor").click();
  },
};

const platform: Platform = {
  key: "weixin",
  uploader,
  actions: platformActions,
};

export default platform;
