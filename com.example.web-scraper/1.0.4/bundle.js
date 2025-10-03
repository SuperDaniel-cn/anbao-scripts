// ==AnbaoScript==
// @id            com.example.web-scraper
// @name          网页内容抓取器
// @version       1.0.4
// @author        Anbao Team
// @description   一个功能强大的网页内容抓取脚本，支持自定义输出目录、截图功能、通知功能和人工介入。
// @tags          web, scraper, content, example, screenshot, notification, human-intervention
// @keywords      baidu, google, sogou, duckduckgo, bing
// @engine        patchright
// @launchOptions { "channel": "chrome", "headless": false, "slowMo": 50 }
//
// @schema
// {
//   "title": "百度搜索测试参数",
//   "type": "object",
//   "properties": {
//     "search_term": {
//       "type": "string",
//       "title": "1. 搜索词",
//       "description": "要在百度搜索的关键词"
//     },
//     "output_directory": {
//       "type": "string",
//       "format": "directory",
//       "title": "2. 输出目录",
//       "description": "选择保存截图的目录"
//     },
//     "screenshot_format": {
//       "type": "string",
//       "title": "3. 截图格式",
//       "description": "截图文件的格式",
//       "enum": ["png", "jpg"],
//       "default": "png"
//     }
//   },
//   "required": ["search_term"]
// }
// ==/AnbaoScript==
"use strict";
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
async function injectCopyButton(page, searchTerm) {
  try {
    await page.evaluate((term) => {
      const existingButton = document.getElementById("copy-search-term-btn");
      if (existingButton) {
        existingButton.remove();
      }
      const button = document.createElement("button");
      button.id = "copy-search-term-btn";
      button.textContent = "\u590D\u5236\u641C\u7D22\u8BCD";
      button.style.position = "fixed";
      button.style.top = "20px";
      button.style.right = "20px";
      button.style.zIndex = "9999";
      button.style.padding = "10px 15px";
      button.style.backgroundColor = "#4CAF50";
      button.style.color = "white";
      button.style.border = "none";
      button.style.borderRadius = "4px";
      button.style.cursor = "pointer";
      button.style.fontSize = "16px";
      button.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
      button.addEventListener("click", () => {
        navigator.clipboard.writeText(term).then(() => {
          alert("\u641C\u7D22\u8BCD\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F\uFF01");
        }).catch((err) => {
          console.error("\u590D\u5236\u5931\u8D25:", err);
          alert("\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236\u641C\u7D22\u8BCD\uFF1A" + term);
        });
      });
      document.body.appendChild(button);
    }, searchTerm);
    return true;
  } catch (error) {
    console.error("\u6CE8\u5165\u590D\u5236\u6309\u94AE\u5931\u8D25:", error);
    return false;
  }
}
async function run({ page, context }) {
  context.log("\u5F00\u59CB\u767E\u5EA6\u641C\u7D22\u6D4B\u8BD5\u4EFB\u52A1", "info");
  context.notify({
    title: "\u4EFB\u52A1\u5F00\u59CB",
    content: "hello anbao - \u5F00\u59CB\u767E\u5EA6\u641C\u7D22\u6D4B\u8BD5",
    category: "ScriptMessage"
  });
  try {
    const searchTerm = context.common.search_term;
    if (!searchTerm) {
      context.forceExit("\u8BF7\u63D0\u4F9B\u641C\u7D22\u8BCD");
      return;
    }
    context.log(`\u4F7F\u7528\u641C\u7D22\u8BCD: ${searchTerm}`, "info");
    context.log("\u6B63\u5728\u8BBF\u95EE\u767E\u5EA6\u9996\u9875...", "info");
    await page.goto("https://www.baidu.com", { waitUntil: "networkidle" });
    context.log("\u5C1D\u8BD5\u627E\u5230\u641C\u7D22\u6846...", "info");
    let searchBox;
    try {
      searchBox = await page.waitForSelector("#kw", { timeout: 5e3 });
      context.log("\u6210\u529F\u627E\u5230\u641C\u7D22\u6846", "success");
    } catch (timeoutError) {
      context.log("\u627E\u4E0D\u5230\u641C\u7D22\u6846\uFF0C\u8BF7\u6C42\u4EBA\u5DE5\u4ECB\u5165", "warn");
      context.notify({
        title: "\u64CD\u4F5C\u8D85\u65F6",
        content: "hello anbao - \u627E\u4E0D\u5230\u641C\u7D22\u6846\uFF0C\u9700\u8981\u4EBA\u5DE5\u4ECB\u5165",
        category: "TaskResult"
      });
      await injectCopyButton(page, searchTerm);
      await context.requestHumanIntervention({
        message: `\u627E\u4E0D\u5230\u641C\u7D22\u6846\uFF0C\u5DF2\u63D0\u4F9B\u590D\u5236\u641C\u7D22\u8BCD\u6309\u94AE\u3002\u641C\u7D22\u8BCD\u4E3A: "${searchTerm}"\uFF0C\u8BF7\u624B\u52A8\u590D\u5236\u5E76\u7C98\u8D34\u5230\u641C\u7D22\u6846\uFF0C\u7136\u540E\u70B9\u51FB\u7EE7\u7EED\u6309\u94AE\u3002`,
        timeout: 3e4,
        // 30秒超时
        theme: "light"
      });
      context.log("\u4EBA\u5DE5\u4ECB\u5165\u5B8C\u6210\uFF0C\u7EE7\u7EED\u6267\u884C\u4EFB\u52A1", "info");
    }
    context.log("\u5C1D\u8BD5\u70B9\u51FB\u641C\u7D22\u6309\u94AE...", "info");
    try {
      await Promise.race([
        page.click("#su"),
        new Promise((_, reject) => setTimeout(() => reject(new Error("\u641C\u7D22\u6309\u94AE\u70B9\u51FB\u8D85\u65F6")), 5e3))
      ]);
      context.log("\u641C\u7D22\u6309\u94AE\u70B9\u51FB\u6210\u529F", "success");
    } catch (timeoutError) {
      context.log("\u641C\u7D22\u6309\u94AE\u70B9\u51FB\u8D85\u65F6\uFF0C\u8BF7\u6C42\u4EBA\u5DE5\u4ECB\u5165", "warn");
      context.notify({
        title: "\u64CD\u4F5C\u8D85\u65F6",
        content: "hello anbao - \u641C\u7D22\u6309\u94AE\u70B9\u51FB\u8D85\u65F6\uFF0C\u9700\u8981\u4EBA\u5DE5\u4ECB\u5165",
        category: "TaskResult"
      });
      await injectCopyButton(page, searchTerm);
      await context.requestHumanIntervention({
        message: `\u641C\u7D22\u6309\u94AE\u70B9\u51FB\u8D85\u65F6\uFF0C\u5DF2\u63D0\u4F9B\u590D\u5236\u641C\u7D22\u8BCD\u6309\u94AE\u3002\u641C\u7D22\u8BCD\u4E3A: "${searchTerm}"\uFF0C\u8BF7\u624B\u52A8\u70B9\u51FB\u641C\u7D22\u6309\u94AE\uFF0C\u7136\u540E\u70B9\u51FB\u7EE7\u7EED\u6309\u94AE\u3002`,
        timeout: 3e4,
        // 30秒超时
        theme: "light"
      });
      context.log("\u4EBA\u5DE5\u4ECB\u5165\u5B8C\u6210\uFF0C\u7EE7\u7EED\u6267\u884C\u4EFB\u52A1", "info");
    }
    context.log("\u51C6\u5907\u622A\u56FE...", "info");
    const fs = require("fs").promises;
    const path = require("path");
    const outputDirectory = context.common.output_directory || context.paths.data;
    const screenshotFormat = context.common.screenshot_format || "png";
    await fs.mkdir(outputDirectory, { recursive: true });
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const screenshotPath = path.join(outputDirectory, `baidu-search-${timestamp}.${screenshotFormat}`);
    try {
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
        type: screenshotFormat
      });
      context.log(`\u622A\u56FE\u5DF2\u4FDD\u5B58\u5230: ${screenshotPath}`, "success");
    } catch (screenshotError) {
      context.log(`\u622A\u56FE\u5931\u8D25: ${screenshotError.message}`, "warn");
    }
    context.notify({
      title: "\u4EFB\u52A1\u5B8C\u6210",
      content: "hello anbao - \u767E\u5EA6\u641C\u7D22\u6D4B\u8BD5\u4EFB\u52A1\u5B8C\u6210\uFF0C\u5DF2\u622A\u56FE",
      category: "TaskResult"
    });
    return {
      success: true,
      message: "\u767E\u5EA6\u641C\u7D22\u6D4B\u8BD5\u4EFB\u52A1\u5B8C\u6210",
      screenshot_file: screenshotPath
    };
  } catch (error) {
    console.error("\u641C\u7D22\u8FC7\u7A0B\u4E2D\u53D1\u751F\u9519\u8BEF:", error);
    context.log(`\u641C\u7D22\u5931\u8D25: ${error.message}`, "error");
    const searchTerm = context.common.search_term || "";
    if (searchTerm) {
      const success = await injectCopyButton(page, searchTerm);
      if (success) {
        context.log("\u5DF2\u6DFB\u52A0\u590D\u5236\u641C\u7D22\u8BCD\u6309\u94AE\u5230\u9875\u9762", "info");
      } else {
        context.log("\u6CE8\u5165\u590D\u5236\u641C\u7D22\u8BCD\u6309\u94AE\u5931\u8D25", "warn");
      }
    }
    context.notify({
      title: "\u4EFB\u52A1\u5931\u8D25",
      content: `hello anbao - \u641C\u7D22\u5931\u8D25: ${error.message}${searchTerm ? "\uFF0C\u5DF2\u63D0\u4F9B\u590D\u5236\u641C\u7D22\u8BCD\u6309\u94AE" : ""}`,
      category: "TaskResult"
    });
    context.forceExit(`\u641C\u7D22\u5931\u8D25: ${error.message}`);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  run
});
