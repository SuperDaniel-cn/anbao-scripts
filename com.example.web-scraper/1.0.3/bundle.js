// ==AnbaoScript==
// @id            com.example.web-scraper
// @name          网页内容抓取器
// @version       1.0.3
// @author        Anbao Team
// @description   一个功能强大的网页内容抓取脚本，支持自定义输出目录、截图功能、通知功能和人工介入。
// @tags          web, scraper, content, example, screenshot, notification, human-intervention
// @keywords      baidu, google, sogou, duckduckgo, bing
// @engine        patchright
// @launchOptions { "channel": "chrome", "headless": false, "slowMo": 50 }
//
// @schema
// {
//   "title": "网页内容抓取参数",
//   "type": "object",
//   "properties": {
//     "target_url": {
//       "type": "string",
//       "title": "1. 目标网页URL",
//       "description": "要抓取内容的网页地址"
//     },
//     "max_content_length": {
//       "type": "integer",
//       "title": "2. 最大内容长度",
//       "description": "限制抓取的内容最大字符数",
//       "default": 1000
//     },
//     "include_images": {
//       "type": "boolean",
//       "title": "3. 包含图片信息",
//       "description": "是否同时抓取页面中的图片信息",
//       "default": false
//     },
//     "output_format": {
//       "type": "string",
//       "title": "4. 输出格式",
//       "description": "结果文件的输出格式",
//       "enum": ["json", "txt"],
//       "default": "json"
//     },
//     "output_directory": {
//       "type": "string",
//       "format": "directory",
//       "title": "5. 输出目录",
//       "description": "选择保存结果的目录"
//     },
//     "take_screenshot": {
//       "type": "boolean",
//       "title": "6. 截图功能",
//       "description": "是否在抓取内容时截取网页截图",
//       "default": true
//     },
//     "screenshot_format": {
//       "type": "string",
//       "title": "7. 截图格式",
//       "description": "截图文件的格式",
//       "enum": ["png", "jpg"],
//       "default": "png"
//     }
//   },
//   "required": ["target_url"]
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
async function run({ page, context }) {
  context.log("\u5F00\u59CB\u767E\u5EA6\u641C\u7D22 AnbaoAgent \u4EFB\u52A1", "info");
  context.notify({
    title: "\u4EFB\u52A1\u5F00\u59CB",
    content: "hello anbao - \u5F00\u59CB\u767E\u5EA6\u641C\u7D22 AnbaoAgent",
    category: "ScriptMessage"
  });
  try {
    context.log("\u6B63\u5728\u8BBF\u95EE\u767E\u5EA6\u9996\u9875...", "info");
    await page.goto("https://www.baidu.com", { waitUntil: "networkidle" });
    context.log("\u7B49\u5F85\u641C\u7D22\u6846\u52A0\u8F7D...", "info");
    let searchBox;
    try {
      searchBox = await page.waitForSelector("#kw", { timeout: 5e3 });
      context.log("\u641C\u7D22\u6846\u52A0\u8F7D\u6210\u529F", "success");
    } catch (timeoutError) {
      context.log("\u641C\u7D22\u6846\u52A0\u8F7D\u8D85\u65F6\uFF0C\u8BF7\u6C42\u4EBA\u5DE5\u4ECB\u5165", "warn");
      context.notify({
        title: "\u64CD\u4F5C\u8D85\u65F6",
        content: "hello anbao - \u641C\u7D22\u6846\u52A0\u8F7D\u8D85\u65F6\uFF0C\u9700\u8981\u4EBA\u5DE5\u4ECB\u5165",
        category: "TaskResult"
      });
      await context.requestHumanIntervention({
        message: "\u641C\u7D22\u6846\u52A0\u8F7D\u8D85\u65F6\uFF0C\u8BF7\u624B\u52A8\u68C0\u67E5\u9875\u9762\u72B6\u6001\uFF0C\u7136\u540E\u70B9\u51FB\u7EE7\u7EED\u6309\u94AE\u3002",
        timeout: 3e4,
        // 30秒超时
        theme: "light"
      });
      context.log("\u4EBA\u5DE5\u4ECB\u5165\u5B8C\u6210\uFF0C\u7EE7\u7EED\u6267\u884C\u4EFB\u52A1", "info");
      searchBox = await page.$("#kw");
      if (!searchBox) {
        context.forceExit("\u4EBA\u5DE5\u4ECB\u5165\u540E\u4ECD\u65E0\u6CD5\u627E\u5230\u641C\u7D22\u6846");
        return;
      }
    }
    context.log("\u8F93\u5165\u641C\u7D22\u5173\u952E\u8BCD: AnbaoAgent", "info");
    await searchBox.fill("AnbaoAgent");
    context.log("\u70B9\u51FB\u641C\u7D22\u6309\u94AE...", "info");
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
      await context.requestHumanIntervention({
        message: "\u641C\u7D22\u6309\u94AE\u70B9\u51FB\u8D85\u65F6\uFF0C\u8BF7\u624B\u52A8\u70B9\u51FB\u641C\u7D22\u6309\u94AE\uFF0C\u7136\u540E\u70B9\u51FB\u7EE7\u7EED\u6309\u94AE\u3002",
        timeout: 3e4,
        // 30秒超时
        theme: "light"
      });
      context.log("\u4EBA\u5DE5\u4ECB\u5165\u5B8C\u6210\uFF0C\u7EE7\u7EED\u6267\u884C\u4EFB\u52A1", "info");
    }
    context.log("\u7B49\u5F85\u641C\u7D22\u7ED3\u679C\u52A0\u8F7D...", "info");
    try {
      await page.waitForSelector(".result", { timeout: 5e3 });
      context.log("\u641C\u7D22\u7ED3\u679C\u52A0\u8F7D\u6210\u529F", "success");
    } catch (timeoutError) {
      context.log("\u641C\u7D22\u7ED3\u679C\u52A0\u8F7D\u8D85\u65F6\uFF0C\u8BF7\u6C42\u4EBA\u5DE5\u4ECB\u5165", "warn");
      context.notify({
        title: "\u64CD\u4F5C\u8D85\u65F6",
        content: "hello anbao - \u641C\u7D22\u7ED3\u679C\u52A0\u8F7D\u8D85\u65F6\uFF0C\u9700\u8981\u4EBA\u5DE5\u4ECB\u5165",
        category: "TaskResult"
      });
      await context.requestHumanIntervention({
        message: "\u641C\u7D22\u7ED3\u679C\u52A0\u8F7D\u8D85\u65F6\uFF0C\u8BF7\u7B49\u5F85\u9875\u9762\u52A0\u8F7D\u5B8C\u6210\uFF0C\u7136\u540E\u70B9\u51FB\u7EE7\u7EED\u6309\u94AE\u3002",
        timeout: 3e4,
        // 30秒超时
        theme: "light"
      });
      context.log("\u4EBA\u5DE5\u4ECB\u5165\u5B8C\u6210\uFF0C\u7EE7\u7EED\u6267\u884C\u4EFB\u52A1", "info");
    }
    context.log("\u63D0\u53D6\u641C\u7D22\u7ED3\u679C...", "info");
    const searchResults = await page.evaluate(() => {
      const results = [];
      const resultElements = document.querySelectorAll(".result");
      resultElements.forEach((element, index) => {
        const titleElement = element.querySelector("h3");
        const linkElement = element.querySelector("a");
        const snippetElement = element.querySelector(".c-abstract");
        if (titleElement && linkElement) {
          results.push({
            index: index + 1,
            title: titleElement.textContent?.trim() || "",
            url: linkElement.href || "",
            snippet: snippetElement?.textContent?.trim() || ""
          });
        }
      });
      return results;
    });
    context.log(`\u6210\u529F\u63D0\u53D6 ${searchResults.length} \u6761\u641C\u7D22\u7ED3\u679C`, "success");
    const fs = require("fs").promises;
    const path = require("path");
    const outputDirectory = context.common.output_directory || context.paths.data;
    await fs.mkdir(outputDirectory, { recursive: true });
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const resultFileName = `baidu-search-anbaoagent-${timestamp}.json`;
    const resultFile = path.join(outputDirectory, resultFileName);
    const result = {
      search_term: "AnbaoAgent",
      search_engine: "Baidu",
      results_count: searchResults.length,
      extracted_at: (/* @__PURE__ */ new Date()).toISOString(),
      results: searchResults
    };
    await fs.writeFile(resultFile, JSON.stringify(result, null, 2), "utf-8");
    context.log(`\u7ED3\u679C\u5DF2\u4FDD\u5B58\u5230: ${resultFile}`, "success");
    const takeScreenshot = context.common.take_screenshot !== false;
    const screenshotFormat = context.common.screenshot_format || "png";
    if (takeScreenshot) {
      try {
        const screenshotPath = path.join(outputDirectory, `baidu-search-${timestamp}.${screenshotFormat}`);
        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
          type: screenshotFormat
        });
        context.log(`\u622A\u56FE\u5DF2\u4FDD\u5B58\u5230: ${screenshotPath}`, "success");
      } catch (screenshotError) {
        context.log(`\u622A\u56FE\u5931\u8D25: ${screenshotError.message}`, "warn");
      }
    }
    context.notify({
      title: "\u4EFB\u52A1\u5B8C\u6210",
      content: `hello anbao - \u767E\u5EA6\u641C\u7D22 AnbaoAgent \u6210\u529F\uFF0C\u627E\u5230 ${searchResults.length} \u6761\u7ED3\u679C`,
      category: "TaskResult"
    });
    return {
      success: true,
      message: "\u767E\u5EA6\u641C\u7D22 AnbaoAgent \u6210\u529F",
      result,
      output_file: resultFile,
      results_count: searchResults.length
    };
  } catch (error) {
    console.error("\u641C\u7D22\u8FC7\u7A0B\u4E2D\u53D1\u751F\u9519\u8BEF:", error);
    context.log(`\u641C\u7D22\u5931\u8D25: ${error.message}`, "error");
    context.notify({
      title: "\u4EFB\u52A1\u5931\u8D25",
      content: `hello anbao - \u641C\u7D22\u5931\u8D25: ${error.message}`,
      category: "TaskResult"
    });
    context.forceExit(`\u641C\u7D22\u5931\u8D25: ${error.message}`);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  run
});
