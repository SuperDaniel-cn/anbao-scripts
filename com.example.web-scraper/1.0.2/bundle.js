// ==AnbaoScript==
// @id            com.example.web-scraper
// @name          网页内容抓取器
// @version       1.0.2
// @author        Anbao Team
// @description   一个功能强大的网页内容抓取脚本，支持自定义输出目录、截图功能和通知功能。
// @tags          web, scraper, content, example, screenshot, notification
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
  context.log("\u5F00\u59CB\u7F51\u9875\u5185\u5BB9\u6293\u53D6\u4EFB\u52A1", "info");
  context.notify({
    title: "\u4EFB\u52A1\u5F00\u59CB",
    content: "hello anbao",
    category: "ScriptMessage"
  });
  try {
    const targetUrl = context.common.target_url;
    const maxContentLength = context.common.max_content_length || 1e3;
    const outputFormat = context.common.output_format || "json";
    const outputDirectory = context.common.output_directory || context.paths.data;
    const takeScreenshot = context.common.take_screenshot !== false;
    const screenshotFormat = context.common.screenshot_format || "png";
    if (!targetUrl) {
      context.forceExit("\u8BF7\u63D0\u4F9B\u76EE\u6807URL");
      return;
    }
    context.log(`\u6B63\u5728\u8BBF\u95EE: ${targetUrl}`, "info");
    context.log(`\u4F7F\u7528\u8F93\u51FA\u76EE\u5F55: ${outputDirectory}`, "info");
    await page.goto(targetUrl, { waitUntil: "networkidle" });
    await page.waitForLoadState("domcontentloaded");
    const title = await page.title();
    context.log(`\u9875\u9762\u6807\u9898: ${title}`, "info");
    let screenshotPath = "";
    if (takeScreenshot) {
      try {
        const fs2 = require("fs").promises;
        const path2 = require("path");
        await fs2.mkdir(outputDirectory, { recursive: true });
        const timestamp2 = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
        screenshotPath = path2.join(outputDirectory, `screenshot-${timestamp2}.${screenshotFormat}`);
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
    const content = await page.evaluate(() => {
      const mainContent = document.querySelector("main, article, .content, #content") || document.querySelector('div[role="main"]') || document.body;
      return mainContent?.textContent?.trim().replace(/\s+/g, " ") || "";
    });
    context.log(`\u5185\u5BB9\u957F\u5EA6: ${content.length} \u5B57\u7B26`, "info");
    const fs = require("fs").promises;
    const path = require("path");
    await fs.mkdir(outputDirectory, { recursive: true });
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const resultFileName = `scraped-content-${timestamp}.${outputFormat}`;
    const resultFile = path.join(outputDirectory, resultFileName);
    const result = {
      url: targetUrl,
      title,
      content: content.substring(0, maxContentLength) + (content.length > maxContentLength ? "..." : ""),
      full_content_length: content.length,
      extracted_at: (/* @__PURE__ */ new Date()).toISOString(),
      screenshot_path: screenshotPath || void 0
    };
    if (outputFormat === "json") {
      await fs.writeFile(resultFile, JSON.stringify(result, null, 2), "utf-8");
    } else {
      const textContent = `URL: ${targetUrl}
\u6807\u9898: ${title}
\u63D0\u53D6\u65F6\u95F4: ${result.extracted_at}

\u5185\u5BB9:
${result.content}`;
      await fs.writeFile(resultFile, textContent, "utf-8");
    }
    context.log(`\u7ED3\u679C\u5DF2\u4FDD\u5B58\u5230: ${resultFile}`, "success");
    context.notify({
      title: "\u4EFB\u52A1\u5B8C\u6210",
      content: "hello anbao - \u7F51\u9875\u5185\u5BB9\u6293\u53D6\u6210\u529F",
      category: "TaskResult"
    });
    return {
      success: true,
      message: "\u7F51\u9875\u5185\u5BB9\u6293\u53D6\u6210\u529F",
      result,
      output_file: resultFile,
      screenshot_file: screenshotPath || null
    };
  } catch (error) {
    console.error("\u6293\u53D6\u8FC7\u7A0B\u4E2D\u53D1\u751F\u9519\u8BEF:", error);
    context.log(`\u6293\u53D6\u5931\u8D25: ${error.message}`, "error");
    context.notify({
      title: "\u4EFB\u52A1\u5931\u8D25",
      content: `hello anbao - \u6293\u53D6\u5931\u8D25: ${error.message}`,
      category: "TaskResult"
    });
    context.forceExit(`\u6293\u53D6\u5931\u8D25: ${error.message}`);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  run
});
