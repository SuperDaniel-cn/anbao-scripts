// ==AnbaoScript==
// @id            com.example.web-scraper
// @name          网页内容抓取器
// @version       1.0.0
// @author        Anbao Team
// @description   一个简单的网页内容抓取脚本，可以从指定网页提取标题和文本内容。
// @tags          web, scraper, content, example
// @keywords      baidu, google, sogou, duckduckgo, bing
// @engine        playwright
// @launchOptions { "headless": false, "slowMo": 50 }
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
//     }
//   },
//   "required": ["target_url"]
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
async function run({ page, context }) {
  context.log("\u5F00\u59CB\u7F51\u9875\u5185\u5BB9\u6293\u53D6\u4EFB\u52A1", "info");
  try {
    const targetUrl = context.common.target_url;
    if (!targetUrl) {
      context.forceExit("\u8BF7\u63D0\u4F9B\u76EE\u6807URL");
      return;
    }
    context.log(`\u6B63\u5728\u8BBF\u95EE: ${targetUrl}`, "info");
    await page.goto(targetUrl, { waitUntil: "networkidle" });
    await page.waitForLoadState("domcontentloaded");
    const title = await page.title();
    context.log(`\u9875\u9762\u6807\u9898: ${title}`, "info");
    const content = await page.evaluate(() => {
      const mainContent = document.querySelector("main, article, .content, #content") || document.querySelector('div[role="main"]') || document.body;
      return mainContent?.textContent?.trim().replace(/\s+/g, " ") || "";
    });
    context.log(`\u5185\u5BB9\u957F\u5EA6: ${content.length} \u5B57\u7B26`, "info");
    const fs = require("fs").promises;
    const path = require("path");
    const result = {
      url: targetUrl,
      title,
      content: content.substring(0, 1e3) + (content.length > 1e3 ? "..." : ""),
      extracted_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const resultFile = path.join(context.paths.data, "scraped-content.json");
    await fs.writeFile(resultFile, JSON.stringify(result, null, 2), "utf-8");
    context.log(`\u7ED3\u679C\u5DF2\u4FDD\u5B58\u5230: ${resultFile}`, "success");
    return {
      success: true,
      message: "\u7F51\u9875\u5185\u5BB9\u6293\u53D6\u6210\u529F",
      result
    };
  } catch (error) {
    console.error("\u6293\u53D6\u8FC7\u7A0B\u4E2D\u53D1\u751F\u9519\u8BEF:", error);
    context.log(`\u6293\u53D6\u5931\u8D25: ${error.message}`, "error");
    context.forceExit(`\u6293\u53D6\u5931\u8D25: ${error.message}`);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  run
});
