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
  handleKuaishouCoverUpload,
  handleKuaishouScheduler,
  handleKuaishouTagInput,
} from "../utils/platforms/index.js";

// --- 辅助函数与常量 ---
const URLS = {
  UPLOAD_PAGE: "https://cp.kuaishou.com/article/publish/video?tabType=1",
  // 快手发布后似乎没有统一的作品管理页，暂时留空
  MANAGER_PAGE: "https://cp.kuaishou.com/profile",
};

// --- Uploader 接口实现 (核心生命周期) ---

const kuaishouActionOrder = [
  "cover_image_path",
  "description",
  "tags",
  "schedule_date",
];

const isLoggedIn = async ({ page, context }: RunOptions): Promise<boolean> => {
  await page.goto(URLS.UPLOAD_PAGE, {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });

  // 检查是否存在草稿，如果存在则放弃
  const giveUpButton = page.getByRole("button", { name: "放弃" });
  if (await giveUpButton.isVisible({ timeout: 5000 })) {
    await giveUpButton.click();
    context.log("检测到并放弃了已存在的草稿。", "info");
    // 放弃后页面会刷新，等待上传按钮再次出现
    await page
      .getByRole("button", { name: "上传视频" })
      .waitFor({ state: "visible", timeout: 10000 });
  }

  const uploadButton = page.getByRole("button", { name: "上传视频" });
  // 修复：在检查按钮是否可见之前，先等待它出现。
  // 这可以避免在页面加载完成前就做出“未登录”的错误判断。
  await uploadButton.waitFor({ state: "visible", timeout: 15000 });
  return await uploadButton.isVisible();
};

const uploadVideo = async ({ page, context }: RunOptions): Promise<void> => {
  const { common, log } = context;
  if (!common.video_file_path) {
    throw new UploadError("未提供视频文件路径，任务无法继续。");
  }

  // 尝试处理上传前可能出现的 "Skip" 引导按钮
  const skipButton = page.getByRole("button", { name: "Skip" });
  if (await skipButton.isVisible({ timeout: 3000 })) {
    await skipButton.click();
    log("已跳过上传前的操作指引。", "info");
  }

  const fileInputLocator = page.locator('input[type="file"][accept*="video"]');
  const timeout = ((common.upload_timeout_minutes as number) || 30) * 60 * 1000;
  log(`等待视频上传完成... (最长 ${timeout / 60000} 分钟)`, "info");

  await handleFileUpload({
    filePath: common.video_file_path as string,
    fileInputLocator,
    successLocators: [page.getByText("作品描述")],
    timeout,
  });

  // 关键修复：在主视频上传后，等待服务端完成视频处理和封面推荐
  log("等待服务端完成视频处理（最长5分钟）...", "info");
  // 等待第一个推荐封面图片元素加载完成，这是一个更可靠的信号
  await page
    .locator("div[class*='recommend-cover-item'] img")
    .first()
    .waitFor({ state: "visible", timeout: 300000 });
  log("服务端视频处理完毕，推荐封面已生成。", "success");
};

const submit = async ({ page, context }: RunOptions): Promise<UploadResult> => {
  const { final_action } = context.common;

  if (final_action === "人工审查") {
    await context.requestHumanIntervention({
      message: `【快手】已暂停，请人工审查后手动发布或关闭。`,
    });
    return { status: "draft", postUrl: "（人工操作）" };
  }

  // 默认或 "立即投稿"
  await page.getByText("发布", { exact: true }).click();

  // 快手发布后没有明确的成功页面跳转，这里我们假设点击即成功
  // 可以在 verify 阶段做更复杂的验证
  await page.waitForTimeout(5000); // 等待5秒，让发布操作有时间完成

  return { status: "published", postUrl: page.url() };
};

// const verify = async (options: RunOptions, aiVerifier: AIVerifyService) => {
//   const { page, context } = options;
//   const { log, common } = context;

//   log("正在从页面提取实时表单数据...", "info");
//   const actualData = await extractKuaishouFormData(page);

//   const expectedData = {
//     description: common.description,
//     tags: common.tags?.split(/[,，\s]+/).filter(Boolean).map(t => t.toLowerCase()),
//     schedule_date: `${common.schedule_date} ${common.schedule_time}`,
//   };

//   log("准备调用 AI 进行 JSON 对象比对...", "info");
//   const result = await aiVerifier.verifyJSON(actualData, expectedData);

//   if (!result.is_match) {
//     throw new PlatformError(
//       `AI 校验失败: ${
//         result.reason
//       }. 不匹配的字段: [${result.mismatched_fields?.join(", ")}]`
//     );
//   }

//   log("AI 校验成功。", "success");
// };

const uploader: Uploader = {
  actionOrder: kuaishouActionOrder,
  isLoggedIn,
  uploadVideo,
  submit,
  // verify,
};

// --- PlatformActions 实现 (动态业务动作) ---

const platformActions: PlatformActionMap = {
  description: async (options, value) => {
    const editor = options.page.locator("#work-description-edit");
    await editor.click();
    await fillTextField(editor, value, { clear: true });
  },
  tags: async (options, value) => {
    const tags = (value as string).split(/[\s,]+/).filter(Boolean);
    if (tags.length === 0) return;
    const { page, context } = options;
    const { log } = context;

    log("准备输入话题标签...", "info");

    for (const tag of tags.slice(0, 3)) {
      // 快手限制最多3个话题
      log(`正在输入标签: #${tag}`, "info");
      await page.keyboard.type(`#${tag} `); // 模拟键盘输入 #话题<空格>
      await page.waitForTimeout(1500); // 等待话题被识别和转换
    }
    log("所有标签输入完毕。", "success");
  },
  cover_image_path: async (options, value) => {
    await handleKuaishouCoverUpload(options.page, options.context, value);
  },
  schedule_date: async (options, value) => {
    const { schedule_time } = options.context.common;
    const scheduleDateTime = `${value} ${schedule_time}`;
    await handleKuaishouScheduler(
      options.page,
      options.context,
      scheduleDateTime
    );
  },
};

const platform: Platform = {
  key: "kuaishou",
  uploader,
  actions: platformActions,
};

export default platform;
