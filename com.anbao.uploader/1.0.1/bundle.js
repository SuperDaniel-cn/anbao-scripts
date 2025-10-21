// ==AnbaoScript==
// @id            com.anbao.uploader
// @name          多平台视频上传助手
// @version       1.0.1
// @author        Daniel
// @description   一键上传多个国内平台视频的脚本
// @tags          B站, 快手, 小红书, 抖音, 视频号
// @keywords      bilibili, kuaishou, xiaohongshu, douyin, weixin
// @engine        patchright
// @launchOptions { "channel": "chrome", "headless": false, "slowMo": 350 }
// @schema
// {
//   "title": "多平台视频上传脚本",
//   "type": "object",
//   "properties": {
//     "video_file_path": {
//       "type": "string",
//       "format": "file",
//       "title": "1. 视频文件"
//     },
//     "cover_image_path": {
//       "type": "string",
//       "format": "file",
//       "title": "2. 封面文件"
//     },
//     "title": {
//       "type": "string",
//       "title": "3. 视频标题"
//     },
//     "description": {
//       "type": "string",
//       "format": "textarea",
//       "title": "4. 视频简介"
//     },
//     "tags": {
//       "type": "string",
//       "title": "5. 话题标签"
//     },
//     "schedule_date": {
//       "type": "string",
//       "format": "date-time",
//       "title": "6. 定时发布"
//     },
//     "final_action": {
//       "type": "string",
//       "title": "7. 最终操作",
//       "enum": ["发布", "存草稿", "人工审查"],
//       "default": "人工审查"
//     },
//     "partition": {
//       "type": "string",
//       "title": "分区 (B站)",
//       "keyword": ["bilibili"],
//       "enum": [
//         "影视",
//         "娱乐",
//         "音乐",
//         "舞蹈",
//         "动画",
//         "绘画",
//         "鬼畜",
//         "游戏",
//         "资讯",
//         "知识",
//         "人工智能",
//         "科技数码",
//         "汽车",
//         "时尚美妆",
//         "家装房产",
//         "户外潮流",
//         "健身",
//         "体育运动",
//         "手工",
//         "美食",
//         "小剧场",
//         "旅游出行",
//         "三农",
//         "动物",
//         "亲子",
//         "健康",
//         "情感",
//         "vlog",
//         "生活兴趣",
//         "生活经验"
//       ]
//     },
//     "upload_timeout_minutes": {
//       "type": "number",
//       "title": "[高级] 上传超时(分钟)",
//       "default": 30
//     }
//   },
//   "required": [
//     "video_file_path",
//     "title",
//     "description",
//     "final_action",
//     "partition"
//   ]
// }
// ==/AnbaoScript==

// src/types.ts
var PlatformError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "PlatformError";
  }
};
var UploadError = class extends PlatformError {
  constructor(message) {
    super(message);
    this.name = "UploadError";
  }
};

// src/utils/platforms/bilibili.ts
async function handleBilibiliScheduler(page, context, scheduleDate, scheduleTime) {
  const { log } = context;
  if (!scheduleTime || !scheduleDate) return;
  log("准备设置定时发布...", "info");
  await page.locator(".switch-container").first().click();
  await page.getByRole("textbox", { name: "请选择内容" }).waitFor({ state: "visible" });
  const targetDateTime = /* @__PURE__ */ new Date(`${scheduleDate} ${scheduleTime}`);
  const now = /* @__PURE__ */ new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1e3);
  const fifteenDaysLater = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1e3);
  if (targetDateTime < twoHoursLater) {
    throw new PlatformError(
      `定时发布时间 (${targetDateTime.toLocaleString()}) 早于最早允许时间 (${twoHoursLater.toLocaleString()})。`
    );
  }
  if (targetDateTime > fifteenDaysLater) {
    throw new PlatformError(
      `定时发布时间 (${targetDateTime.toLocaleString()}) 晚于最晚允许时间 (${fifteenDaysLater.toLocaleString()})。`
    );
  }
  log("定时发布时间合法性校验通过。", "info");
  await page.locator("div").filter({ hasText: /^\d{4}-\d{2}-\d{2}$/ }).nth(1).click();
  const targetYear = targetDateTime.getFullYear();
  const targetMonth = targetDateTime.getMonth() + 1;
  const targetDay = targetDateTime.getDate();
  const monthHeader = page.locator("div").filter({ hasText: new RegExp(`^${targetYear}年${targetMonth}月$`) });
  await monthHeader.waitFor();
  const dateContainer = page.locator(".weekend-wrp + .date-wrp");
  await dateContainer.waitFor();
  await dateContainer.getByText(String(targetDay), { exact: true }).click();
  log(`已选择日期: ${scheduleDate}`, "info");
  await page.locator("div").filter({ hasText: /^\d{2}:\d{2}$/ }).nth(1).click();
  await page.getByText("000102030405060708091011121314151617181920212223").waitFor();
  await page.getByText("000510152025303540455055").waitFor();
  const targetHour = String(targetDateTime.getHours()).padStart(2, "0");
  let targetMinute = targetDateTime.getMinutes();
  targetMinute = Math.ceil(targetMinute / 5) * 5;
  if (targetMinute === 60) targetMinute = 55;
  const targetMinuteStr = String(targetMinute).padStart(2, "0");
  await page.getByText(targetHour, { exact: true }).click();
  await page.getByText(targetMinuteStr, { exact: true }).last().click();
  log(`已选择时间: ${targetHour}:${targetMinuteStr}`, "info");
}
async function handleBilibiliCoverUpload(page, context, coverImagePath) {
  const { log } = context;
  log("准备更换封面...", "info");
  const changeCoverButton = page.getByText("更换封面");
  await changeCoverButton.waitFor({ state: "attached", timeout: 6e4 });
  await page.waitForFunction(
    () => {
      const button = Array.from(document.querySelectorAll("span")).find(
        (s) => s.textContent === "更换封面"
      );
      return button && !button.parentElement?.classList.contains("disabled");
    },
    null,
    { timeout: 3e5 }
  );
  log("“更换封面”按钮已变为可用状态。", "info");
  await changeCoverButton.click();
  const modal = page.locator(".bcc-dialog__wrap").first();
  await modal.waitFor({ state: "visible" });
  log("封面模态框已出现。", "info");
  await modal.getByText("上传封面").click();
  const coverInput = modal.locator(".cover-select-footer").locator('input[type="file"][style*="display: none"]');
  log(`正在上传封面文件: ${coverImagePath}`, "info");
  await coverInput.setInputFiles(coverImagePath);
  await modal.getByRole("button", { name: "完成" }).click();
  await modal.waitFor({ state: "hidden" });
  log("封面更换成功！", "success");
}
var handleBilibiliTagInput = async (page, tags, tagInput) => {
  await tagInput.waitFor({ state: "visible", timeout: 1e4 });
  await tagInput.click();
  try {
    const remainingTagsText = await page.getByText(/还可以添加\d+个标签/).textContent({ timeout: 5e3 });
    const match = remainingTagsText?.match(/还可以添加(\d+)个标签/);
    if (match && match[1]) {
      const remainingCount = parseInt(match[1], 10);
      const deleteCount = 10 - remainingCount;
      if (deleteCount > 0) {
        for (let i = 0; i < deleteCount; i++) {
          await tagInput.press("Backspace");
        }
      }
    }
  } catch (_error) {
    console.warn("无法找到'还可以添加...'文本来计算标签，将跳过清除步骤。");
  }
  for (const tag of tags) {
    await tagInput.fill(tag);
    await tagInput.press("Enter");
  }
};

// src/utils/platforms/kuaishou.ts
async function handleKuaishouCoverUpload(page, context, coverImagePath) {
  const { log } = context;
  log("准备更换封面...", "info");
  await page.getByText("封面设置").nth(1).click();
  await page.waitForTimeout(1e3);
  const modal = page.getByRole("dialog");
  await modal.waitFor({ state: "visible" });
  log("封面模态框已出现。", "info");
  await modal.getByText("上传封面").click();
  await page.waitForTimeout(500);
  const clearUploadButton = modal.getByText("清空上传");
  const uploadPlaceholder = page.locator("div").filter({ hasText: /^拖拽图片到此或点击上传上传图片$/ }).nth(1);
  if (await clearUploadButton.isVisible({ timeout: 2e3 })) {
    await clearUploadButton.click();
    log("已清空旧的封面缓存。", "info");
    await uploadPlaceholder.waitFor({ state: "visible", timeout: 5e3 });
    log("封面上传UI已重置。", "info");
  }
  const fileInput = uploadPlaceholder.locator('input[type="file"]');
  await fileInput.setInputFiles(coverImagePath);
  await page.getByText("清空上传").waitFor({ state: "visible" });
  log("封面上传成功。", "success");
  await page.getByRole("button", { name: "确认" }).click();
  await modal.waitFor({ state: "hidden" });
  log("封面更换成功！", "success");
}
async function handleKuaishouScheduler(page, context, scheduleDateTime) {
  const { log } = context;
  log("准备设置定时发布...", "info");
  await page.getByRole("radio", { name: "定时发布" }).click();
  const pickerInput = page.locator(".ant-picker-input");
  await pickerInput.hover();
  await page.waitForTimeout(500);
  const clearButton = page.getByRole("button", { name: "close-circle" });
  if (await clearButton.isVisible({ timeout: 2e3 })) {
    await clearButton.click();
    log("已清除默认的定时发布时间。", "info");
  }
  const dateTimeInput = page.getByRole("textbox", { name: "选择日期时间" });
  await dateTimeInput.click();
  const fullDateTime = `${scheduleDateTime}:00`;
  await dateTimeInput.fill(fullDateTime);
  await page.getByRole("button", { name: "确定" }).click();
  const expectedTime = `-${fullDateTime.substring(5)}`;
  await page.getByRole("textbox", { name: new RegExp(expectedTime) }).waitFor({ timeout: 5e3 });
  log(`定时发布时间已成功设置为: ${fullDateTime}`, "success");
}

// src/utils/platforms/douyin.ts
var handleDouyinCoverUpload = async (page, context, value) => {
  await page.locator("div").filter({ hasText: /^选择封面$/ }).nth(1).click();
  await page.getByText("封面检测").waitFor({ state: "visible" });
  const fileInput = page.locator("input.semi-upload-hidden-input");
  await fileInput.setInputFiles(value);
  await page.getByRole("button", { name: "完成" }).click();
  await page.getByText("封面检测").waitFor({ state: "hidden", timeout: 6e4 });
};
var handleDouyinScheduler = async (page, context, value) => {
  await page.locator("label").filter({ hasText: "定时发布" }).click();
  const dateInput = page.getByRole("textbox", { name: "日期和时间" });
  await dateInput.click();
  await dateInput.fill(value);
};

// src/utils/common/fillTextField.ts
async function fillTextField(locator, value, options = {}) {
  const { clear = true } = options;
  await locator.waitFor({ state: "visible", timeout: 15e3 });
  if (clear) {
    await locator.clear();
  }
  await locator.fill(value);
}

// src/utils/common/handleFileUpload.ts
async function handleFileUpload({
  filePath,
  fileInputLocator,
  successLocators,
  timeout
}) {
  await fileInputLocator.setInputFiles(filePath);
  const waitForPromises = successLocators.map(
    (locator) => locator.waitFor({ state: "visible", timeout })
  );
  await Promise.all(waitForPromises);
}

// src/platforms/bilibili.ts
var URLS = {
  CREATOR_HOME: "https://member.bilibili.com/platform/home",
  UPLOAD_PAGE: "https://member.bilibili.com/platform/upload/video/frame",
  MANAGER_PAGE: "https://member.bilibili.com/platform/upload-manager/article"
};
var bilibiliActionOrder = [
  "cover_image_path",
  "title",
  "partition",
  "tags",
  "description",
  "schedule_date"
];
var isLoggedIn = async ({ page }) => {
  await page.goto(URLS.CREATOR_HOME, {
    waitUntil: "domcontentloaded",
    timeout: 15e3
  });
  const loginElement = page.getByText(/成为UP主的第\d+天/);
  await loginElement.waitFor({ state: "visible", timeout: 1e4 });
  return true;
};
var uploadVideo = async ({ page, context }) => {
  const { common, log } = context;
  if (!common.video_file_path) {
    throw new UploadError("未提供视频文件路径，任务无法继续。");
  }
  const uploadUrl = common.target_url || URLS.UPLOAD_PAGE;
  await page.goto(uploadUrl);
  const fileInputLocator = page.locator(
    'input[type="file"][multiple][style*="display: none"]'
  );
  const timeout = (common.upload_timeout_minutes || 30) * 60 * 1e3;
  log(`等待视频处理完成... (最长 ${timeout / 6e4} 分钟)`, "info");
  await handleFileUpload({
    filePath: common.video_file_path,
    fileInputLocator,
    successLocators: [
      page.getByText("上传完成").nth(1),
      page.getByText("更换视频")
    ],
    timeout
  });
  log("已选择类型: 自制", "info");
  await page.getByText("类型自制转载", { exact: true }).getByText("自制").first().click();
};
var submit = async ({ page, context }) => {
  const { final_action } = context.common;
  if (final_action === "人工审查") {
    await context.requestHumanIntervention({
      message: `【Bilibili】已暂停，请人工审查后手动发布或关闭。`
    });
    return { status: "draft", postUrl: "（人工操作）" };
  }
  let status = "published";
  if (final_action === "存草稿") {
    await page.getByText("存草稿").click();
    status = "draft";
  } else {
    await page.getByText("立即投稿").click();
  }
  const videoManagerLink = page.getByRole("link", {
    name: "视频管理",
    exact: true
  });
  await videoManagerLink.waitFor({ timeout: 6e4 });
  return { status, postUrl: page.url() };
};
var uploader = {
  actionOrder: bilibiliActionOrder,
  isLoggedIn,
  uploadVideo,
  submit
};
var platformActions = {
  cover_image_path: async ({ page, context }, value) => {
    await handleBilibiliCoverUpload(page, context, value);
  },
  title: async ({ page }, value) => {
    const titleInput = page.getByRole("textbox", { name: "请输入稿件标题" });
    await fillTextField(titleInput, value);
  },
  partition: async ({ page }, value) => {
    const partitionRoot = page.locator(".video-human-type");
    const trigger = partitionRoot.locator(".select-controller");
    await trigger.click();
    const optionsContainer = page.locator(".drop-list-v2-container");
    await optionsContainer.waitFor({ state: "visible", timeout: 5e3 });
    const option = optionsContainer.getByTitle(value, { exact: true });
    await option.click();
  },
  tags: async ({ page }, value) => {
    const tags = value.split(/[\s,]+/).filter(Boolean);
    if (tags.length === 0) return;
    const tagInput = page.getByRole("textbox", {
      name: "按回车键Enter创建标签"
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
    const schedule_date = value;
    await handleBilibiliScheduler(
      page,
      context,
      schedule_date,
      schedule_time
    );
  }
};
var platform = {
  key: "bilibili",
  uploader,
  actions: platformActions
};
var bilibili_default = platform;

// src/platforms/kuaishou.ts
var URLS2 = {
  UPLOAD_PAGE: "https://cp.kuaishou.com/article/publish/video?tabType=1",
  // 快手发布后似乎没有统一的作品管理页，暂时留空
  MANAGER_PAGE: "https://cp.kuaishou.com/profile"
};
var kuaishouActionOrder = [
  "cover_image_path",
  "description",
  "tags",
  "schedule_date"
];
var isLoggedIn2 = async ({ page, context }) => {
  await page.goto(URLS2.UPLOAD_PAGE, {
    waitUntil: "domcontentloaded",
    timeout: 15e3
  });
  const giveUpButton = page.getByRole("button", { name: "放弃" });
  if (await giveUpButton.isVisible({ timeout: 5e3 })) {
    await giveUpButton.click();
    context.log("检测到并放弃了已存在的草稿。", "info");
    await page.getByRole("button", { name: "上传视频" }).waitFor({ state: "visible", timeout: 1e4 });
  }
  const uploadButton = page.getByRole("button", { name: "上传视频" });
  await uploadButton.waitFor({ state: "visible", timeout: 15e3 });
  return await uploadButton.isVisible();
};
var uploadVideo2 = async ({ page, context }) => {
  const { common, log } = context;
  if (!common.video_file_path) {
    throw new UploadError("未提供视频文件路径，任务无法继续。");
  }
  const skipButton = page.getByRole("button", { name: "Skip" });
  if (await skipButton.isVisible({ timeout: 3e3 })) {
    await skipButton.click();
    log("已跳过上传前的操作指引。", "info");
  }
  const fileInputLocator = page.locator('input[type="file"][accept*="video"]');
  const timeout = (common.upload_timeout_minutes || 30) * 60 * 1e3;
  log(`等待视频上传完成... (最长 ${timeout / 6e4} 分钟)`, "info");
  await handleFileUpload({
    filePath: common.video_file_path,
    fileInputLocator,
    successLocators: [page.getByText("作品描述")],
    timeout
  });
  log("等待服务端完成视频处理（最长5分钟）...", "info");
  await page.locator("div[class*='recommend-cover-item'] img").first().waitFor({ state: "visible", timeout: 3e5 });
  log("服务端视频处理完毕，推荐封面已生成。", "success");
};
var submit2 = async ({ page, context }) => {
  const { final_action } = context.common;
  if (final_action === "人工审查") {
    await context.requestHumanIntervention({
      message: `【快手】已暂停，请人工审查后手动发布或关闭。`
    });
    return { status: "draft", postUrl: "（人工操作）" };
  }
  await page.getByText("发布", { exact: true }).click();
  await page.waitForTimeout(5e3);
  return { status: "published", postUrl: page.url() };
};
var uploader2 = {
  actionOrder: kuaishouActionOrder,
  isLoggedIn: isLoggedIn2,
  uploadVideo: uploadVideo2,
  submit: submit2
  // verify,
};
var platformActions2 = {
  description: async (options, value) => {
    const editor = options.page.locator("#work-description-edit");
    await editor.click();
    await fillTextField(editor, value, { clear: true });
  },
  tags: async (options, value) => {
    const tags = value.split(/[\s,]+/).filter(Boolean);
    if (tags.length === 0) return;
    const { page, context } = options;
    const { log } = context;
    log("准备输入话题标签...", "info");
    for (const tag of tags.slice(0, 3)) {
      log(`正在输入标签: #${tag}`, "info");
      await page.keyboard.type(`#${tag} `);
      await page.waitForTimeout(1500);
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
  }
};
var platform2 = {
  key: "kuaishou",
  uploader: uploader2,
  actions: platformActions2
};
var kuaishou_default = platform2;

// src/platforms/xiaohongshu.ts
var URLS3 = {
  CREATOR_HOME: "https://creator.xiaohongshu.com/new/home",
  UPLOAD_PAGE: "https://creator.xiaohongshu.com/publish/publish?from=menu&target=video"
};
var xhsActionOrder = [
  "cover_image_path",
  "title",
  "description",
  "tags",
  "schedule_date"
];
var isLoggedIn3 = async ({ page }) => {
  await page.goto(URLS3.CREATOR_HOME, {
    waitUntil: "domcontentloaded",
    timeout: 15e3
  });
  const avatar = page.getByRole("img").nth(1);
  const publishButton = page.getByText("发布笔记");
  await avatar.waitFor({ state: "visible", timeout: 1e4 });
  return await publishButton.isVisible();
};
var uploadVideo3 = async ({ page, context }) => {
  const { common, log } = context;
  if (!common.video_file_path) {
    throw new Error("未提供视频文件路径，任务无法继续。");
  }
  await page.goto(URLS3.UPLOAD_PAGE);
  const fileInput = page.locator('input[type="file"][accept*=".mp4"]');
  const timeout = (common.upload_timeout_minutes || 30) * 60 * 1e3;
  log(`等待视频上传完成... (最长 ${timeout / 6e4} 分钟)`, "info");
  await handleFileUpload({
    filePath: common.video_file_path,
    fileInputLocator: fileInput,
    successLocators: [page.getByText("上传成功", { exact: true })],
    timeout
  });
};
var submit3 = async ({ page, context }) => {
  const { final_action } = context.common;
  if (final_action === "人工审查") {
    await context.requestHumanIntervention({
      message: `【小红书】已暂停，请人工审查后手动发布或关闭。`
    });
    return { status: "draft", postUrl: "（人工操作）" };
  }
  let status = "published";
  if (context.common.schedule_date) {
    if (final_action === "存草稿") {
      await page.getByRole("button", { name: "暂存离开" }).click();
      status = "draft";
    } else {
      await page.getByRole("button", { name: "定时发布" }).click();
      status = "scheduled";
    }
  } else if (final_action === "存草稿") {
    await page.getByRole("button", { name: "暂存离开" }).click();
    status = "draft";
  } else {
    await page.getByRole("button", { name: "发布" }).click();
  }
  await page.waitForTimeout(1e4);
  return { status, postUrl: page.url() };
};
var uploader3 = {
  actionOrder: xhsActionOrder,
  isLoggedIn: isLoggedIn3,
  uploadVideo: uploadVideo3,
  submit: submit3
};
var platformActions3 = {
  cover_image_path: async ({ page, context }, value) => {
    context.log("开始设置封面...", "info");
    await page.getByText("设置封面", { exact: true }).click();
    await page.getByText("获取封面建议").waitFor();
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByText("上传图片", { exact: true }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(value);
    await page.getByRole("button", { name: "确定" }).click();
    await page.getByText("封面效果评估通过，未发现封面质量问题").waitFor({ state: "visible", timeout: 3e4 });
    context.log("封面设置成功", "success");
  },
  title: async ({ page }, value) => {
    const titleInput = page.getByRole("textbox", {
      name: "填写标题会有更多赞哦～"
    });
    await fillTextField(titleInput, value);
  },
  description: async ({ page }, value) => {
    const descInput = page.getByRole("textbox").nth(1);
    await fillTextField(descInput, value);
  },
  tags: async ({ page, context }, tagsString) => {
    if (!tagsString) return;
    const { log } = context;
    const tags = tagsString.split(/[,，\s]+/).filter(Boolean);
    log("准备输入话题标签...", "info");
    for (const tag of tags) {
      await page.getByRole("button", { name: "话题" }).click();
      await page.keyboard.type(tag);
      await page.waitForTimeout(1e3);
      await page.keyboard.press("Enter");
      log(`已输入标签: ${tag}`, "info");
      await page.waitForTimeout(500);
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
  }
};
var platform3 = {
  key: "xiaohongshu",
  uploader: uploader3,
  actions: platformActions3
};
var xiaohongshu_default = platform3;

// src/platforms/wechat-channels.ts
var URLS4 = {
  PLATFORM: "https://channels.weixin.qq.com/platform/",
  CREATE_POST: "https://channels.weixin.qq.com/platform/post/create"
};
var wechatChannelsActionOrder = [
  "cover_image_path",
  "description",
  "tags",
  "title",
  "schedule_date"
];
var isLoggedIn4 = async ({ page }) => {
  await page.goto(URLS4.PLATFORM, {
    // 改为 domcontentloaded 以避免因次要网络请求而超时。
    waitUntil: "domcontentloaded",
    timeout: 15e3
  });
  const avatar = page.getByRole("img", { name: "视频号头像" });
  await avatar.waitFor({ state: "visible", timeout: 15e3 });
  return await avatar.isVisible();
};
var uploadVideo4 = async ({ page, context }) => {
  const { common, log } = context;
  if (!common.video_file_path) {
    throw new UploadError("未提供视频文件路径，任务无法继续。");
  }
  await page.goto(URLS4.CREATE_POST);
  await page.getByText("发表动态").waitFor({ state: "visible", timeout: 15e3 });
  const fileInputLocator = page.locator(
    'input[type="file"][accept="video/mp4,video/x-m4v,video/*"]'
  );
  const timeout = (common.upload_timeout_minutes || 30) * 60 * 1e3;
  log(`等待视频上传和处理完成... (最长 ${timeout / 6e4} 分钟)`, "info");
  await handleFileUpload({
    filePath: common.video_file_path,
    fileInputLocator,
    successLocators: [page.getByText("封面预览编辑个人主页和分享卡片(3:4)")],
    timeout
  });
};
var submit4 = async ({ page, context }) => {
  const { final_action, schedule_date } = context.common;
  if (final_action === "人工审查") {
    await context.requestHumanIntervention({
      message: `【视频号】已暂停，请人工审查后手动发布或关闭。`
    });
    return { status: "draft", postUrl: "（人工操作）" };
  }
  if (schedule_date && final_action === "存草稿") {
    await context.requestHumanIntervention({
      message: "视频号不支持对定时发布的内容存草稿，请人工处理。"
    });
    return { status: "draft", postUrl: "（人工操作）" };
  }
  let status = "published";
  if (final_action === "存草稿") {
    await page.getByRole("button", { name: "保存草稿" }).click();
    status = "draft";
    await page.getByRole("button", { name: "保存草稿" }).waitFor({ state: "hidden", timeout: 15e3 });
    context.log("草稿已保存，但缺少最终验证步骤。", "warn");
  } else {
    await page.getByRole("button", { name: "发表" }).click();
    status = "published";
    await page.getByRole("button", { name: "发表" }).waitFor({ state: "hidden", timeout: 15e3 });
    context.log("发表操作已提交，但缺少最终验证步骤。", "warn");
  }
  return { status, postUrl: page.url() };
};
var uploader4 = {
  actionOrder: wechatChannelsActionOrder,
  isLoggedIn: isLoggedIn4,
  uploadVideo: uploadVideo4,
  submit: submit4
};
var platformActions4 = {
  cover_image_path: async ({ page }, value) => {
    const coverImage = page.locator(
      "div.vertical-cover-wrap > div.vertical-img-wrap > img.cover-img-vertical"
    );
    await coverImage.click();
    await page.getByRole("heading", { name: "编辑封面" }).waitFor({ state: "visible" });
    const fileInput = page.locator(
      'input[type="file"][accept="image/jpeg,image/jpg,image/png"]'
    );
    await fileInput.setInputFiles(value);
    await page.getByRole("button", { name: "确认" }).click();
    await page.getByRole("heading", { name: "编辑封面" }).waitFor({ state: "hidden" });
  },
  description: async ({ page }, value) => {
    const editor = page.locator(".input-editor");
    await editor.click();
    await fillTextField(editor, value);
  },
  tags: async ({ page }, value) => {
    const tags = value.split(/[\s,]+/).filter(Boolean);
    if (tags.length === 0) return;
    for (const tag of tags) {
      await page.getByText("#话题").click();
      await page.keyboard.insertText(tag + " ");
      await page.waitForTimeout(200);
    }
  },
  title: async ({ page }, value) => {
    const titleInput = page.getByRole("textbox", {
      name: "概括视频主要内容，字数建议6-16个字符"
    });
    await fillTextField(titleInput, value);
  },
  schedule_date: async ({ page, context }, value) => {
    const { schedule_time } = context.common;
    const scheduleDate = value;
    const scheduleTime = schedule_time || "12:00";
    const fullDateTime = `${scheduleDate} ${scheduleTime}`;
    await page.getByText("定时", { exact: true }).click();
    const dateInput = page.getByRole("textbox", { name: "请选择发表时间" });
    await dateInput.click();
    const targetDate = new Date(fullDateTime);
    const targetDay = targetDate.getDate().toString();
    const targetHour = targetDate.getHours().toString();
    const targetMonthLabel = `${targetDate.getMonth() + 1}月`;
    const currentMonthLabel = await page.locator("span.weui-desktop-picker__panel__label").getByText("月").textContent();
    if (currentMonthLabel !== targetMonthLabel) {
      await page.getByRole("button", { name: "Next Month" }).click();
    }
    await page.locator("table.weui-desktop-picker__table a").filter({ hasNotText: /weui-desktop-picker__disabled/ }).getByText(targetDay, { exact: true }).click();
    const timeInput = page.getByPlaceholder("请选择时间");
    await timeInput.click();
    await timeInput.fill(targetHour);
    await page.locator(".input-editor").click();
  }
};
var platform4 = {
  key: "weixin",
  uploader: uploader4,
  actions: platformActions4
};
var wechat_channels_default = platform4;

// src/platforms/douyin.ts
var URLS5 = {
  UPLOAD_PAGE: "https://creator.douyin.com/creator-micro/content/upload"
};
var douyinActionOrder = [
  "title",
  "description",
  "tags",
  "cover_image_path",
  "schedule_date"
];
var isLoggedIn5 = async ({ page }) => {
  await page.goto(URLS5.UPLOAD_PAGE, {
    waitUntil: "domcontentloaded",
    timeout: 15e3
  });
  const uploadButton = page.getByRole("button", { name: "上传视频" });
  await uploadButton.waitFor({ state: "visible", timeout: 15e3 });
  return await uploadButton.isVisible();
};
var uploadVideo5 = async ({ page, context }) => {
  const { common, log } = context;
  if (!common.video_file_path) {
    throw new UploadError("未提供视频文件路径，任务无法继续。");
  }
  const fileInputLocator = page.locator('input[type="file"][tabindex="-1"]');
  const timeout = (common.upload_timeout_minutes || 30) * 60 * 1e3;
  log(`等待视频上传完成... (最长 ${timeout / 6e4} 分钟)`, "info");
  await handleFileUpload({
    filePath: common.video_file_path,
    fileInputLocator,
    successLocators: [
      page.getByRole("textbox", { name: "填写作品标题，为作品获得更多流量" })
    ],
    timeout
  });
};
var submit5 = async ({ page, context }) => {
  const { final_action } = context.common;
  if (final_action === "人工审查") {
    await context.requestHumanIntervention({
      message: `【抖音】已暂停，请人工审查后手动发布或关闭。`
    });
    return { status: "draft", postUrl: "（人工操作）" };
  }
  let status = "published";
  if (final_action === "存草稿") {
    await page.getByRole("button", { name: "暂存离开" }).click();
    status = "draft";
  } else {
    await page.getByRole("button", { name: "发布", exact: true }).click();
  }
  await page.waitForTimeout(5e3);
  return { status, postUrl: page.url() };
};
var uploader5 = {
  actionOrder: douyinActionOrder,
  isLoggedIn: isLoggedIn5,
  uploadVideo: uploadVideo5,
  submit: submit5
};
var platformActions5 = {
  title: async ({ page }, value) => {
    const titleInput = page.getByRole("textbox", {
      name: "填写作品标题，为作品获得更多流量"
    });
    await fillTextField(titleInput, value);
  },
  description: async ({ page }, value) => {
    await page.locator(".zone-container").click();
    await fillTextField(page.locator(".zone-container"), value);
  },
  tags: async ({ page }, value) => {
    const tags = value.split(/[\s,]+/).filter(Boolean);
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
  }
};
var platform5 = {
  key: "douyin",
  uploader: uploader5,
  actions: platformActions5
};
var douyin_default = platform5;

// src/platforms/index.ts
var platforms = [
  bilibili_default,
  kuaishou_default,
  xiaohongshu_default,
  wechat_channels_default,
  douyin_default
  // 在此添加其他平台, e.g.:
];
var platforms_default = platforms;

// src/utils/executeAction.ts
var createActionExecutor = (options) => {
  const { context, page } = options;
  const checkBrowserConnection = async () => {
    try {
      const context2 = page.context();
      if (!context2) {
        return false;
      }
      await page.evaluate(() => document.readyState);
      return true;
    } catch (error) {
      return false;
    }
  };
  return async (action, description, type = "generic") => {
    try {
      const isConnected = await checkBrowserConnection();
      if (!isConnected) {
        context.log(`[错误] 浏览器连接已断开，无法执行操作: ${description}`, "error");
        context.forceExit(`浏览器连接已断开，任务终止。请重新启动脚本。`);
        return void 0;
      }
      context.log(`[执行] ${description}`, "info");
      const result = await action();
      context.log(`[成功] ${description}`, "success");
      return result;
    } catch (error) {
      const isConnected = await checkBrowserConnection();
      if (!isConnected) {
        context.log(`[错误] 浏览器连接已断开: ${description}`, "error");
        context.forceExit(`浏览器连接已断开，任务终止。请重新启动脚本。`);
        return void 0;
      }
      context.log(`[失败] ${description}: ${error.message}`, "warn");
      let message;
      if (type === "login") {
        message = `【${context.platform.name}】平台未登录，请手动登录后点击"继续"。`;
      } else {
        message = `【${context.platform.name}】平台操作"${description}"失败，请手动完成后点击"继续"。`;
      }
      await context.requestHumanIntervention({ message });
      context.log(`用户已响应操作: "${description}"。脚本将继续执行。`, "info");
      if (type === "login") {
        context.log(`[执行] 再次检查登录状态`, "info");
        try {
          const result = await action();
          context.log(`[成功] 再次检查登录状态`, "success");
          return result;
        } catch (retryError) {
          context.log(`[失败] 再次检查登录状态: ${retryError.message}`, "warn");
          return void 0;
        }
      }
      return void 0;
    }
  };
};

// src/index.ts
var getPlatform = (baseUrl) => {
  const lowerCaseUrl = baseUrl.toLowerCase();
  return platforms_default.find((p) => lowerCaseUrl.includes(p.key));
};
async function run(options) {
  const { context } = options;
  const { platform: platform6, log, common } = context;
  const actionDescriptions = {
    cover_image_path: "上传封面",
    title: "填写标题",
    reprint_source: "处理转载信息",
    partition: "选择分区",
    tags: "填写标签",
    description: "填写简介",
    schedule_date: "设置定时发布"
    // 可以为所有平台添加更多通用或特定的描述
  };
  const platformModule = getPlatform(platform6.base_url);
  if (!platformModule) {
    return context.forceExit(
      `不支持的平台: ${platform6.name} (${platform6.base_url})`
    );
  }
  const { uploader: uploader6, actions } = platformModule;
  const execute = createActionExecutor(options);
  const isLoggedIn6 = await execute(
    () => uploader6.isLoggedIn(options),
    "检查登录状态",
    "login"
  );
  if (isLoggedIn6 !== true) {
    return context.forceExit("登录失败，任务终止。");
  }
  await execute(() => uploader6.uploadVideo(options), "上传主视频文件");
  log("开始执行业务动作...", "info");
  const executionKeys = uploader6.actionOrder || Object.keys(common);
  for (const key of executionKeys) {
    const value = common[key];
    if (value === void 0 || value === null || value === "") continue;
    const handler = actions[key];
    if (handler) {
      const description = actionDescriptions[key] || `执行动作: ${key}`;
      await execute(() => handler(options, value), description);
    }
  }
  log("所有业务动作执行完毕。", "success");
  const uploadResult = await execute(
    () => uploader6.submit(options),
    "最终提交"
  );
  log("所有阶段已成功完成！", "success");
  return {
    success: true,
    message: `视频已在 ${platform6.name} 处理完成。`,
    data: uploadResult || { status: "draft", postUrl: "（人工操作）" }
  };
}
export {
  run
};
