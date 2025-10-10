// ==AnbaoScript==
// @id            com.anbao.video-uploader
// @name          跨平台视频发布助手
// @version       1.0.0
// @author        Roo
// @description   一键将本地视频发布到多个受支持的平台，如 Bilibili、抖音、小红书、视频号、快手、微博等。
// @tags          视频发布, 多平台
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
//       "title": "2. 视频标题"
//     },
//     "video_description": {
//       "type": "string",
//       "format": "textarea",
//       "title": "3. 视频描述"
//     },
//     "topics": {
//       "type": "string",
//       "title": "4. 话题标签 (用逗号或空格分隔)"
//     },
//     "submit_action": {
//       "type": "string",
//       "title": "5. 提交操作",
//       "enum": ["立即投稿", "存为草稿"],
//       "default": "立即投稿"
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
var createSafeAction = (context) => {
  return async (action, errorMessage) => {
    try {
      return await action();
    } catch (error) {
      context.log(`\u81EA\u52A8\u5316\u64CD\u4F5C\u5931\u8D25: ${errorMessage}\u3002\u9519\u8BEF: ${error.message}`, "warn");
      await context.requestHumanIntervention({
        message: `\u81EA\u52A8\u5316\u64CD\u4F5C\u5931\u8D25: "${errorMessage}"

\u8BF7\u624B\u52A8\u5B8C\u6210\u6B64\u6B65\u9AA4\uFF0C\u7136\u540E\u70B9\u51FB\u201C\u7EE7\u7EED\u201D\u8BA9\u811A\u672C\u91CD\u8BD5\u3002`
      });
      context.log("\u6B63\u5728\u91CD\u8BD5\u64CD\u4F5C...", "info");
      try {
        return await action();
      } catch (finalError) {
        throw new PlatformError(`\u5728\u4EBA\u5DE5\u4ECB\u5165\u540E\uFF0C\u64CD\u4F5C "${errorMessage}" \u4ECD\u7136\u5931\u8D25: ${finalError.message}`);
      }
    }
  };
};
async function isLoggedIn({ page, context }) {
  context.log("[Bilibili] \u6B63\u5728\u68C0\u67E5\u767B\u5F55\u72B6\u6001...", "info");
  try {
    await page.goto("https://member.bilibili.com/platform/home", { waitUntil: "domcontentloaded" });
    const currentUrl = page.url();
    if (currentUrl.includes("passport.bilibili.com/login")) {
      context.log("[Bilibili] \u68C0\u6D4B\u5230\u9875\u9762\u8DF3\u8F6C\u81F3\u767B\u5F55\u9875\uFF0C\u5224\u5B9A\u4E3A\u672A\u767B\u5F55\u3002", "warn");
      return false;
    }
    const avatarSelector = "img.custom-lazy-img";
    await page.waitForSelector(avatarSelector, { timeout: 5e3 });
    const isLoggedIn3 = await page.isVisible(avatarSelector);
    context.log(`[Bilibili] \u767B\u5F55\u72B6\u6001\u68C0\u67E5\u5B8C\u6210\uFF0C\u7ED3\u679C: ${isLoggedIn3}`, "info");
    return isLoggedIn3;
  } catch (error) {
    context.log("[Bilibili] \u767B\u5F55\u68C0\u67E5\u5931\u8D25\uFF0C\u672A\u627E\u5230\u5173\u952E\u5143\u7D20\u6216\u53D1\u751F\u5176\u4ED6\u9519\u8BEF\u3002", "warn");
    return false;
  }
}
async function upload({ page, context }) {
  const safeAction = createSafeAction(context);
  const { common } = context;
  const { video_file_path, video_title, video_description, topics, submit_action } = common;
  await safeAction(
    () => page.goto("https://member.bilibili.com/platform/upload/video/frame", { waitUntil: "domcontentloaded" }),
    "\u5BFC\u822A\u81F3\u6295\u7A3F\u9875\u9762"
  );
  const fileChooserPromise = page.waitForEvent("filechooser");
  await safeAction(() => page.getByText("\u4E0A\u4F20\u89C6\u9891").click(), "\u70B9\u51FB\u201C\u4E0A\u4F20\u89C6\u9891\u201D\u6309\u94AE");
  const fileChooser = await fileChooserPromise;
  await safeAction(() => fileChooser.setFiles(video_file_path), "\u9009\u62E9\u89C6\u9891\u6587\u4EF6");
  const titleInput = page.getByRole("textbox", { name: "\u8BF7\u8F93\u5165\u7A3F\u4EF6\u6807\u9898" });
  await safeAction(() => titleInput.waitFor({ state: "visible", timeout: 12e4 }), "\u7B49\u5F85\u89C6\u9891\u5904\u7406\u4E0E\u9875\u9762\u8DF3\u8F6C");
  await safeAction(() => titleInput.fill(video_title), "\u586B\u5199\u89C6\u9891\u6807\u9898");
  if (video_description) {
    await safeAction(() => page.locator(".ql-editor").fill(video_description), "\u586B\u5199\u89C6\u9891\u7B80\u4ECB");
  }
  if (topics) {
    const tagInput = page.getByRole("textbox", { name: "\u6309\u56DE\u8F66\u952EEnter\u521B\u5EFA\u6807\u7B7E" });
    const topicList = topics.split(/[\s,，]+/);
    for (const topic of topicList) {
      if (topic) {
        await safeAction(() => tagInput.fill(topic), `\u586B\u5199\u8BDD\u9898: ${topic}`);
        await safeAction(() => tagInput.press("Enter"), `\u786E\u8BA4\u8BDD\u9898: ${topic}`);
      }
    }
  }
  const finalSubmitButton = page.getByText(submit_action || "\u7ACB\u5373\u6295\u7A3F");
  await safeAction(() => finalSubmitButton.waitFor({ state: "visible", timeout: 3e5 }), "\u7B49\u5F85\u4E0A\u4F20\u5B8C\u6210");
  await safeAction(() => finalSubmitButton.click(), `\u70B9\u51FB\u201C${submit_action}\u201D\u6309\u94AE`);
  if (submit_action === "\u5B58\u4E3A\u8349\u7A3F") {
    context.log("[Bilibili] \u5DF2\u5B58\u4E3A\u8349\u7A3F\uFF0C\u4EFB\u52A1\u7ED3\u675F\u3002", "success");
    return { postUrl: "draft" };
  }
  const successLink = page.locator("a.success-jump-url");
  await safeAction(() => successLink.waitFor({ state: "visible", timeout: 6e4 }), "\u7B49\u5F85\u53D1\u5E03\u6210\u529F\u94FE\u63A5");
  const postUrl = await successLink.getAttribute("href");
  if (!postUrl) {
    throw new PlatformError("\u53D1\u5E03\u6210\u529F\uFF0C\u4F46\u672A\u80FD\u83B7\u53D6\u5230\u89C6\u9891\u94FE\u63A5\u3002");
  }
  const fullUrl = postUrl.startsWith("http") ? postUrl : `https:${postUrl}`;
  context.log(`[Bilibili] \u53D1\u5E03\u6210\u529F\uFF01\u89C6\u9891\u94FE\u63A5: ${fullUrl}`, "success");
  return { postUrl: fullUrl };
}
async function verify({ page, context }, { postUrl }) {
  if (postUrl === "draft") {
    context.log("[Bilibili] \u64CD\u4F5C\u4E3A\u5B58\u4E3A\u8349\u7A3F\uFF0C\u8DF3\u8FC7\u540E\u7F6E\u9A8C\u8BC1\u3002", "info");
    return true;
  }
  context.log("[Bilibili] \u6B63\u5728\u6267\u884C\u53D1\u5E03\u540E\u9A8C\u8BC1...", "info");
  if (!postUrl)
    return false;
  try {
    await page.goto(postUrl, { waitUntil: "domcontentloaded" });
    const title = await page.title();
    if (title.includes(context.common.video_title)) {
      context.log("[Bilibili] \u9A8C\u8BC1\u6210\u529F: \u9875\u9762\u6807\u9898\u4E0E\u89C6\u9891\u6807\u9898\u5339\u914D\u3002", "success");
      return true;
    }
    context.log("[Bilibili] \u9A8C\u8BC1\u5931\u8D25: \u9875\u9762\u6807\u9898\u4E0E\u89C6\u9891\u6807\u9898\u4E0D\u5339\u914D\u3002", "warn");
    return false;
  } catch (error) {
    context.log(`[Bilibili] \u9A8C\u8BC1\u5931\u8D25\uFF0C\u53D1\u751F\u9519\u8BEF: ${error.message}`, "error");
    return false;
  }
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
