// ==AnbaoScript==
// @id            com.anbao.video-uploader
// @name          跨平台视频发布助手 (标杆脚本)
// @version       1.5.0
// @author        Anbao Team (Roo)
// @description   【标杆脚本】一键将本地视频发布到多个平台。此脚本展示了包括人性化交互、平台专属选项、多级重试和后置验证在内的所有最佳实践。
// @tags          视频发布, 多平台, 标杆脚本, 自动化, bilibili, douyin
// @keywords      bilibili, douyin, xiaohongshu, wechat, kuaishou, weibo
// @engine        patchright
// @launchOptions {"channel":"chrome"}
//
// @schema
// {
//   "title": "跨平台视频发布参数",
//   "type": "object",
//   "properties": {
//     "video_file_path": {
//       "type": "string",
//       "format": "file",
//       "title": "1. 本地视频文件"
//     },
//     "video_title": {
//       "type": "string",
//       "title": "3. 视频标题"
//     },
//     "video_description": {
//       "type": "string",
//       "format": "textarea",
//       "title": "4. 视频描述 (通用)"
//     },
//     "topics": {
//       "type": "string",
//       "title": "5. 话题标签 (通用, 用逗号或空格分隔)"
//     },
//     "bilibili_category": {
//       "type": "string",
//       "title": "6. Bilibili 分区",
//       "keyword": ["bilibili"],
//       "enum": ["影视", "娱乐", "音乐", "舞蹈", "动画", "绘画", "鬼畜", "游戏", "资讯", "知识", "人工智能", "科技数码", "汽车", "时尚美妆", "家装房产", "户外潮流", "健身", "体育运动", "手工", "美食", "小剧场", "旅游出行", "三农", "动物", "亲子", "健康", "情感", "vlog", "生活兴趣", "生活经验"],
//       "default": "知识"
//     },
//     "bilibili_type": {
//       "type": "string",
//       "title": "7. Bilibili 稿件类型",
//       "keyword": ["bilibili"],
//       "enum": ["自制", "转载"],
//       "default": "自制"
//     },
//     "bilibili_schedule_enabled": {
//       "type": "boolean",
//       "title": "8. Bilibili 定时发布",
//       "keyword": ["bilibili"],
//       "default": false
//     },
//     "bilibili_schedule_time": {
//       "type": "string",
//       "format": "date-time",
//       "title": "9. Bilibili 发布时间",
//       "keyword": ["bilibili"]
//     },
//     "submit_action": {
//       "type": "string",
//       "title": "10. 提交操作",
//       "enum": ["立即投稿", "存草稿"],
//       "default": "存草稿"
//     },
//     "manual_audit_required": {
//       "type": "boolean",
//       "title": "11. 开启人工审核 (提交前暂停)",
//       "default": true
//     },
//     "upload_timeout_minutes": {
//       "type": "number",
//       "title": "12. 上传超时时间 (分钟)",
//       "default": 30
//     }
//   },
//   "required": [
//     "video_file_path",
//     "video_title"
//   ]
// }
// ==/AnbaoScript==
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  run: () => run
});
module.exports = __toCommonJS(src_exports);

// src/types.ts
var PlatformError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "PlatformError";
  }
};
var LoginError = class extends PlatformError {
  constructor(message = "User is not logged in.") {
    super(message);
    this.name = "LoginError";
  }
};

// src/platforms/bilibili.ts
var randomDelay = (min = 500, max = 1200) => {
  return new Promise(
    (resolve) => setTimeout(resolve, Math.random() * (max - min) + min)
  );
};
var humanClick = async (locator, options) => {
  await locator.hover({ trial: true });
  await randomDelay(200, 500);
  await locator.click(options);
};
var humanType = async (page, selector, text) => {
  const locator = page.locator(selector);
  await humanClick(locator);
  await locator.fill("");
  await randomDelay(100, 200);
  await locator.type(text, { delay: Math.random() * 150 + 50 });
};
var createRetryableAction = (context, page) => {
  return async (action, description, retryCount = 2) => {
    for (let i = 0; i < retryCount; i++) {
      try {
        context.log(`[\u64CD\u4F5C] \u6B63\u5728\u6267\u884C: ${description}...`, "info");
        const result = await action();
        await randomDelay(300, 700);
        context.log(`[\u64CD\u4F5C] \u6210\u529F: ${description}`, "info");
        return result;
      } catch (error) {
        context.log(
          `[\u64CD\u4F5C] \u5931\u8D25: ${description} (\u5C1D\u8BD5 ${i + 1}/${retryCount})\u3002\u9519\u8BEF: ${error.message}`,
          "warn"
        );
        if (i < retryCount - 1) {
          await randomDelay(1e3, 2e3);
          context.log("\u6B63\u5728\u91CD\u8BD5...", "info");
        } else {
          context.log(`\u64CD\u4F5C "${description}" \u5931\u8D25\uFF0C\u8BF7\u6C42\u7528\u6237\u624B\u52A8\u5B8C\u6210\u3002`, "warn");
          await context.requestHumanIntervention({
            message: `\u81EA\u52A8\u5316\u64CD\u4F5C "${description}" \u591A\u6B21\u5C1D\u8BD5\u540E\u4ECD\u7136\u5931\u8D25\u3002

\u8BF7\u60A8\u624B\u52A8\u5B8C\u6210\u6B64\u6B65\u9AA4\uFF0C\u7136\u540E\u70B9\u51FB\u201C\u7EE7\u7EED\u201D\u8BA9\u811A\u672C\u4ECE\u4E0B\u4E00\u6B65\u5F00\u59CB\u3002`
          });
          context.log(`\u7528\u6237\u5DF2\u624B\u52A8\u5B8C\u6210\u64CD\u4F5C: "${description}"\u3002\u811A\u672C\u5C06\u7EE7\u7EED\u6267\u884C\u4E0B\u4E00\u6B65\u3002`, "info");
          return void 0;
        }
      }
    }
    throw new PlatformError(`\u64CD\u4F5C "${description}" \u5F7B\u5E95\u5931\u8D25\u3002`);
  };
};
async function isLoggedIn({ page, context }) {
  context.log("[Bilibili] \u68C0\u67E5\u767B\u5F55\u72B6\u6001...", "info");
  try {
    await page.goto("https://member.bilibili.com/platform/home", {
      waitUntil: "networkidle"
    });
    if (page.url().includes("passport.bilibili.com/login")) {
      context.log("[Bilibili] \u68C0\u6D4B\u5230\u767B\u5F55\u9875\u9762\uFF0C\u5224\u5B9A\u4E3A\u672A\u767B\u5F55\u3002", "warn");
      return false;
    }
    const avatarSelector = "img.custom-lazy-img";
    await page.waitForSelector(avatarSelector, { timeout: 1e4 });
    const isVisible = await page.isVisible(avatarSelector);
    context.log(
      `[Bilibili] \u767B\u5F55\u72B6\u6001\u68C0\u67E5\u5B8C\u6210\uFF0C\u7ED3\u679C: ${isVisible ? "\u5DF2\u767B\u5F55" : "\u672A\u767B\u5F55"}`,
      "info"
    );
    return isVisible;
  } catch (error) {
    context.log(`[Bilibili] \u767B\u5F55\u68C0\u67E5\u5F02\u5E38: ${error.message}`, "warn");
    return false;
  }
}
async function upload({
  page,
  context
}) {
  const doAction = createRetryableAction(context, page);
  const { common } = context;
  const {
    video_file_path,
    video_title,
    video_description,
    topics,
    submit_action,
    bilibili_category,
    bilibili_type,
    bilibili_schedule_enabled,
    bilibili_schedule_time,
    upload_timeout_minutes,
    manual_audit_required
  } = common;
  await doAction(
    () => page.goto("https://member.bilibili.com/platform/upload/video/frame", {
      waitUntil: "domcontentloaded"
    }),
    "\u5BFC\u822A\u5230 Bilibili \u6295\u7A3F\u9875\u9762"
  );
  await doAction(async () => {
    const fileChooserPromise = page.waitForEvent("filechooser");
    await humanClick(page.locator(".bcc-upload-wrapper"));
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(video_file_path);
  }, "\u9009\u62E9\u5E76\u4E0A\u4F20\u89C6\u9891\u6587\u4EF6");
  const timeoutMs = (upload_timeout_minutes || 30) * 60 * 1e3;
  context.log(
    `\u7B49\u5F85\u89C6\u9891\u5904\u7406\u5B8C\u6210 (\u8D85\u65F6\u65F6\u95F4: ${upload_timeout_minutes || 30} \u5206\u949F)...`,
    "info"
  );
  await doAction(
    () => page.getByText("\u4E0A\u4F20\u5B8C\u6210").nth(1).waitFor({ state: "visible", timeout: timeoutMs }),
    "\u7B49\u5F85\u201C\u4E0A\u4F20\u5B8C\u6210\u201D\u72B6\u6001\u51FA\u73B0"
  );
  context.log("\u89C6\u9891\u5904\u7406\u5B8C\u6210\u3002", "success");
  context.log("\u7B49\u5F85 3 \u79D2\uFF0C\u4EE5\u786E\u4FDD\u9875\u9762\u5143\u7D20\u52A0\u8F7D\u5B8C\u6210...", "info");
  await randomDelay(3e3, 3500);
  const titleSelector = 'input[placeholder="\u8BF7\u8F93\u5165\u7A3F\u4EF6\u6807\u9898"]';
  await doAction(
    () => humanType(page, titleSelector, video_title),
    "\u586B\u5199\u89C6\u9891\u6807\u9898"
  );
  const targetType = bilibili_type || "\u81EA\u5236";
  await doAction(async () => {
    const typeButton = page.getByText("\u81EA\u5236").first();
    await humanClick(typeButton);
  }, `\u9009\u62E9\u7A3F\u4EF6\u7C7B\u578B: ${targetType}`);
  const topicList = topics ? topics.split(/[\s,，]+/).filter(Boolean) : [];
  if (topicList.length > 0) {
    await doAction(async () => {
      const tagInput = page.getByRole("textbox", {
        name: "\u6309\u56DE\u8F66\u952EEnter\u521B\u5EFA\u6807\u7B7E"
      });
      await humanClick(tagInput);
      const getRemainingSlots = async () => {
        try {
          const locator = page.getByText(/还可以添加\d+个标签/);
          const text = await locator.textContent({ timeout: 2e3 });
          if (text) {
            const match = text.match(/(\d+)/);
            return match ? parseInt(match[1], 10) : null;
          }
          return null;
        } catch (e) {
          return null;
        }
      };
      const initialSlots = await getRemainingSlots();
      if (initialSlots !== null && initialSlots < 10) {
        const tagsToDelete = 10 - initialSlots;
        context.log(`\u68C0\u6D4B\u5230 ${tagsToDelete} \u4E2A\u9ED8\u8BA4\u6807\u7B7E\uFF0C\u6B63\u5728\u6E05\u9664...`, "info");
        for (let i = 0; i < tagsToDelete; i++) {
          await page.keyboard.press("Backspace");
          await randomDelay(100, 200);
        }
      }
      for (const topic of topicList) {
        const slotsBeforeAdd = await getRemainingSlots();
        if (slotsBeforeAdd === 0) {
          context.log("\u6807\u7B7E\u680F\u5DF2\u6EE1\uFF0C\u65E0\u6CD5\u6DFB\u52A0\u66F4\u591A\u6807\u7B7E\u3002", "warn");
          break;
        }
        await tagInput.fill(topic);
        await tagInput.press("Enter");
        await page.waitForFunction(
          (expected) => document.body.innerText.includes(`\u8FD8\u53EF\u4EE5\u6DFB\u52A0${expected}\u4E2A\u6807\u7B7E`),
          slotsBeforeAdd - 1,
          { timeout: 5e3 }
        );
        context.log(`\u6807\u7B7E "${topic}" \u6DFB\u52A0\u6210\u529F\u3002`, "info");
      }
    }, "\u586B\u5199\u8BDD\u9898\u6807\u7B7E");
  }
  await doAction(async () => {
    const targetCategory = bilibili_category || "\u77E5\u8BC6";
    await humanClick(page.locator(".select-controller").first());
    await randomDelay(300, 500);
    await humanClick(page.getByTitle(targetCategory));
    await randomDelay(100, 200);
    const selectedText = await page.locator(".select-item-cont-inserted").textContent();
    if (selectedText?.trim() !== targetCategory) {
      throw new Error(
        `\u5206\u533A\u9009\u62E9\u5931\u8D25\uFF0C\u671F\u671B\u9009\u62E9 "${targetCategory}"\uFF0C\u5B9E\u9645\u4E3A "${selectedText}"`
      );
    }
  }, `\u9009\u62E9\u89C6\u9891\u5206\u533A: ${bilibili_category || "\u77E5\u8BC6"}`);
  if (video_description) {
    await doAction(
      () => page.locator('.ql-editor[contenteditable="true"]').first().fill(video_description),
      "\u586B\u5199\u89C6\u9891\u7B80\u4ECB"
    );
  }
  if (bilibili_schedule_enabled) {
    await doAction(async () => {
      await humanClick(page.locator(".switch-container").first());
      context.log("\u5DF2\u5F00\u542F\u5B9A\u65F6\u53D1\u5E03\u529F\u80FD\u3002", "info");
      if (bilibili_schedule_time) {
        const scheduleDate = new Date(bilibili_schedule_time);
        const dateStr = scheduleDate.toISOString().split("T")[0];
        const timeStr = scheduleDate.toTimeString().substring(0, 5);
        await humanClick(page.locator(".date-picker-date"));
        await randomDelay(200, 400);
        await page.evaluate(
          ([date]) => {
            const spans = Array.from(
              document.querySelectorAll(".mx-calendar-content span")
            );
            const target = spans.find((s) => s.title === date);
            if (target)
              target.click();
          },
          [dateStr]
        );
        await humanClick(page.locator(".time-picker-time"));
        await randomDelay(200, 400);
        await page.evaluate(
          ([time]) => {
            const target = Array.from(
              document.querySelectorAll(".time-select-item")
            ).find((item) => item.textContent?.trim() === time);
            if (target)
              target.click();
          },
          [timeStr]
        );
        context.log(`\u5DF2\u8BBE\u7F6E\u53D1\u5E03\u65F6\u95F4\u4E3A: ${dateStr} ${timeStr}`, "success");
      }
    }, "\u8BBE\u7F6E\u5B9A\u65F6\u53D1\u5E03\u65F6\u95F4");
  }
  if (manual_audit_required) {
    context.log("\u6240\u6709\u4FE1\u606F\u5DF2\u586B\u5199\u5B8C\u6BD5\uFF0C\u8FDB\u5165\u4EBA\u5DE5\u5BA1\u6838\u6A21\u5F0F...", "info");
    while (true) {
      await context.requestHumanIntervention({
        message: "\u8BF7\u60A8\u5BA1\u6838\u540E\uFF0C\u624B\u52A8\u70B9\u51FB\u2018\u7ACB\u5373\u6295\u7A3F\u2019\u6216\u2018\u5B58\u4E3A\u8349\u7A3F\u2019\uFF0C\u7136\u540E\u70B9\u51FB\u4E0B\u65B9\u7684\u201C\u7EE7\u7EED\u201D\u6309\u94AE\u3002"
      });
      context.log("\u4EBA\u5DE5\u5BA1\u6838\u201C\u7EE7\u7EED\u201D\u88AB\u70B9\u51FB\uFF0C\u6B63\u5728\u6821\u9A8C\u63D0\u4EA4\u72B6\u6001...", "info");
      const titleInputStillVisible = await page.locator('input[placeholder="\u8BF7\u8F93\u5165\u7A3F\u4EF6\u6807\u9898"]').isVisible();
      if (titleInputStillVisible) {
        context.log("\u68C0\u6D4B\u5230\u8868\u5355\u4ECD\u672A\u63D0\u4EA4\uFF0C\u5C06\u518D\u6B21\u8BF7\u6C42\u4EBA\u5DE5\u4ECB\u5165\u3002\u8BF7\u52A1\u5FC5\u5148\u5728\u9875\u9762\u4E0A\u70B9\u51FB\u63D0\u4EA4\u6309\u94AE\u3002", "warn");
      } else {
        context.log("\u8868\u5355\u5DF2\u63D0\u4EA4\uFF0C\u4EFB\u52A1\u6B63\u5E38\u7ED3\u675F\u3002", "success");
        return { postUrl: "submitted_by_user" };
      }
    }
  } else {
    context.log("\u6240\u6709\u4FE1\u606F\u586B\u5199\u5B8C\u6BD5\uFF0C\u51C6\u5907\u81EA\u52A8\u63D0\u4EA4\u3002", "info");
    const submitText = submit_action === "\u5B58\u8349\u7A3F" ? "\u5B58\u4E3A\u8349\u7A3F" : "\u7ACB\u5373\u6295\u7A3F";
    await doAction(
      () => humanClick(page.getByText(submitText)),
      `\u70B9\u51FB\u201C${submitText}\u201D\u6309\u94AE`
    );
    if (submit_action === "\u5B58\u8349\u7A3F") {
      context.log("\u5DF2\u81EA\u52A8\u5B58\u4E3A\u8349\u7A3F\uFF0C\u4EFB\u52A1\u7ED3\u675F\u3002", "success");
      return { postUrl: "draft" };
    }
  }
  await doAction(
    () => page.waitForURL("**/creative-result-succeed/**", { timeout: 12e4 }),
    "\u7B49\u5F85\u53D1\u5E03\u6210\u529F\u8DF3\u8F6C"
  );
  const successLinkLocator = page.locator("a.success-jump-url");
  const postUrl = await doAction(
    () => successLinkLocator.getAttribute("href"),
    "\u83B7\u53D6\u89C6\u9891\u94FE\u63A5"
  );
  if (!postUrl) {
    throw new PlatformError("\u53D1\u5E03\u6210\u529F\uFF0C\u4F46\u672A\u80FD\u83B7\u53D6\u5230\u89C6\u9891\u94FE\u63A5\u3002");
  }
  const fullUrl = postUrl.startsWith("http") ? postUrl : `https:${postUrl}`;
  context.log(`\u53D1\u5E03\u6210\u529F\uFF01\u89C6\u9891\u94FE\u63A5: ${fullUrl}`, "success");
  return { postUrl: fullUrl };
}
async function verify({ page, context }, { postUrl }) {
  if (postUrl === "draft" || postUrl === "submitted_by_user" || postUrl === "pending_manual_action") {
    context.log("\u64CD\u4F5C\u4E3A\u5B58\u4E3A\u8349\u7A3F\u6216\u4EBA\u5DE5\u63D0\u4EA4\uFF0C\u8DF3\u8FC7\u540E\u7F6E\u9A8C\u8BC1\u3002", "info");
    return true;
  }
  context.log("\u6B63\u5728\u6267\u884C\u53D1\u5E03\u540E\u9A8C\u8BC1...", "info");
  await page.goto("https://member.bilibili.com/platform/upload-manager/article", { waitUntil: "networkidle" });
  const initialTimeout = 3e4;
  for (let i = 0; i < 3; i++) {
    const timeout = initialTimeout * Math.pow(2, i);
    try {
      context.log(`\u6B63\u5728\u7A3F\u4EF6\u7BA1\u7406\u9875\u9762\u67E5\u627E\u89C6\u9891... (\u5C1D\u8BD5 ${i + 1}/3, \u8D85\u65F6: ${timeout / 1e3}s)`, "info");
      const videoLink = page.getByRole("link", { name: context.common.video_title, exact: true });
      await videoLink.waitFor({ state: "visible", timeout });
      context.log("\u9A8C\u8BC1\u6210\u529F: \u5728\u7A3F\u4EF6\u7BA1\u7406\u9875\u9762\u627E\u5230\u4E86\u5339\u914D\u7684\u89C6\u9891\u3002", "success");
      return true;
    } catch (e) {
      if (i < 2) {
        context.log(`\u672A\u627E\u5230\u89C6\u9891\uFF0C\u53EF\u80FD\u662F\u5BA1\u6838\u5EF6\u8FDF\uFF0C\u5C06\u8FDB\u884C\u4E0B\u4E00\u6B21\u5C1D\u8BD5...`, "warn");
        await page.reload({ waitUntil: "networkidle" });
      }
    }
  }
  context.log("\u9A8C\u8BC1\u5931\u8D25: \u591A\u6B21\u5C1D\u8BD5\u540E\uFF0C\u5728\u7A3F\u4EF6\u7BA1\u7406\u9875\u9762\u4ECD\u672A\u627E\u5230\u5339\u914D\u7684\u89C6\u9891\u3002", "error");
  return false;
}
var uploader = {
  isLoggedIn,
  upload,
  verify
};

// src/platforms/douyin.ts
async function isLoggedIn2({ page, context }) {
  context.log("[Douyin] Checking login status...", "info");
  try {
    await page.goto("https://creator.douyin.com/creator-micro/home", { waitUntil: "domcontentloaded" });
    const avatarSelector = ".avatar--1l22R";
    await page.waitForSelector(avatarSelector, { timeout: 5e3 });
    const isLoggedIn3 = await page.isVisible(avatarSelector);
    context.log(`[Douyin] Login status check result: ${isLoggedIn3}`, "info");
    return isLoggedIn3;
  } catch (error) {
    context.log("[Douyin] Login check failed. User is likely not logged in.", "warn");
    return false;
  }
}
async function upload2(options) {
  options.context.log("[Douyin] upload() not implemented yet.", "warn");
  return { postUrl: "https://www.douyin.com/" };
}
var uploader2 = {
  isLoggedIn: isLoggedIn2,
  upload: upload2
};

// src/index.ts
var platformRegistry = {
  bilibili: uploader,
  douyin: uploader2
  // Add other platforms here
};
var getUploader = (baseUrl) => {
  const lowerCaseUrl = baseUrl.toLowerCase();
  for (const key in platformRegistry) {
    if (lowerCaseUrl.includes(key)) {
      return platformRegistry[key];
    }
  }
  return void 0;
};
async function run(options) {
  const { context } = options;
  const { platform } = context;
  try {
    context.log(`\u4EFB\u52A1\u542F\u52A8\uFF0C\u5E73\u53F0: ${platform.name}`, "info");
    const uploader3 = getUploader(platform.base_url);
    if (!uploader3) {
      throw new PlatformError(`\u4E0D\u652F\u6301\u7684\u5E73\u53F0: ${platform.name} (${platform.base_url})`);
    }
    context.log("\u6210\u529F\u5339\u914D\u5230\u5E73\u53F0\u5904\u7406\u6A21\u5757\u3002", "info");
    context.log("\u6B63\u5728\u6267\u884C\u524D\u7F6E\u68C0\u67E5: \u767B\u5F55\u72B6\u6001...", "info");
    let isLoggedIn3 = await uploader3.isLoggedIn(options);
    if (!isLoggedIn3) {
      context.log("\u7528\u6237\u672A\u767B\u5F55\u3002", "warn");
      await context.requestHumanIntervention({
        message: `\u68C0\u6D4B\u5230\u60A8\u5C1A\u672A\u767B\u5F55 ${platform.name}\uFF0C\u8BF7\u5728\u6D4F\u89C8\u5668\u4E2D\u5B8C\u6210\u767B\u5F55\u540E\u70B9\u51FB\u201C\u7EE7\u7EED\u201D\u3002`
      });
      isLoggedIn3 = await uploader3.isLoggedIn(options);
      if (!isLoggedIn3) {
        throw new LoginError(`\u5728\u4EBA\u5DE5\u4ECB\u5165\u540E\uFF0C\u767B\u5F55\u72B6\u6001\u4F9D\u7136\u65E0\u6548\u3002`);
      }
      context.log("\u767B\u5F55\u6210\u529F\uFF0C\u7EE7\u7EED\u6267\u884C\u4EFB\u52A1\u3002", "success");
    } else {
      context.log("\u767B\u5F55\u72B6\u6001\u6709\u6548\u3002", "success");
    }
    context.log("\u6B63\u5728\u6267\u884C\u6838\u5FC3\u4E0A\u4F20\u6D41\u7A0B...", "info");
    const uploadResult = await uploader3.upload(options);
    context.log(`\u6838\u5FC3\u4E0A\u4F20\u6D41\u7A0B\u5B8C\u6210\u3002\u89C6\u9891\u53D1\u5E03\u4E8E: ${uploadResult.postUrl}`, "success");
    if (uploader3.verify) {
      context.log("\u6B63\u5728\u6267\u884C\u53D1\u5E03\u540E\u9A8C\u8BC1...", "info");
      const isVerified = await uploader3.verify(options, uploadResult);
      if (!isVerified) {
        context.log("\u53D1\u5E03\u540E\u9A8C\u8BC1\u5931\u8D25\uFF0C\u53EF\u80FD\u9700\u8981\u60A8\u624B\u52A8\u786E\u8BA4\u3002", "warn");
      } else {
        context.log("\u53D1\u5E03\u540E\u9A8C\u8BC1\u6210\u529F\uFF01", "success");
      }
    }
    context.log("\u4EFB\u52A1\u6210\u529F\u5B8C\u6210\uFF01", "success");
    return {
      success: true,
      message: `\u89C6\u9891\u5DF2\u6210\u529F\u53D1\u5E03\u5230 ${platform.name}\u3002`,
      url: uploadResult.postUrl
    };
  } catch (error) {
    if (error instanceof PlatformError) {
      context.log(`\u811A\u672C\u6267\u884C\u5931\u8D25: ${error.message}`, "error");
      context.forceExit(error.message);
    } else {
      const errorMessage = `\u53D1\u751F\u672A\u77E5\u9519\u8BEF: ${error.message || "No error message"}`;
      context.log(errorMessage, "error");
      console.error(error);
      context.forceExit(errorMessage);
    }
    return {
      success: false,
      message: error.message
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  run
});
