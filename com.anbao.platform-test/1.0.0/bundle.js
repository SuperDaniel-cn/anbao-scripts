// ==AnbaoScript==
// @id            com.anbao.platform-test
// @name          平台功能测试脚本
// @version       1.0.0
// @author        Anbao Team
// @description   测试平台 keyword 功能，支持搜狗和百度，搜狗支持截图，百度支持自定义搜索词，通用通知。
// @tags          
// @keywords      baidu, sogou
// @engine        playwright
// @launchOptions { "headless": false }
//
// @schema
// {
//   "title": "平台功能测试参数",
//   "type": "object",
//   "properties": {
//     "common_message": {
//       "type": "string",
//       "title": "1. 通用通知消息",
//       "description": "所有平台都会触发的通知消息",
//       "default": "hello anbao"
//     },
//     "baidu_search_term": {
//       "type": "string",
//       "title": "2. 百度搜索词",
//       "description": "在百度上搜索的关键词",
//       "keyword": ["baidu"]
//     },
//     "sogou_take_screenshot": {
//       "type": "boolean",
//       "title": "3. 搜狗截图",
//       "description": "是否在搜狗搜索后截图",
//       "default": true,
//       "keyword": ["sogou"]
//     },
//     "output_directory": {
//       "type": "string",
//       "format": "directory",
//       "title": "4. 输出目录",
//       "description": "保存截图和结果的目录"
//     }
//   }
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
  const commonMessage = context.common.common_message || "hello anbao";
  const outputDirectory = context.common.output_directory || context.paths.data;
  context.log("\u5F00\u59CB\u5E73\u53F0\u529F\u80FD\u6D4B\u8BD5\u4EFB\u52A1", "info");
  context.notify({
    title: "\u4EFB\u52A1\u5F00\u59CB",
    content: `\u901A\u7528\u901A\u77E5: ${commonMessage}`,
    category: "ScriptMessage"
  });
  const fs = require("fs").promises;
  const path = require("path");
  await fs.mkdir(outputDirectory, { recursive: true });
  const isBaidu = context.platform.base_url.includes("baidu.com");
  const isSogou = context.platform.base_url.includes("sogou.com");
  if (isBaidu) {
    context.log("\u5F53\u524D\u5E73\u53F0\u4E3A\u767E\u5EA6", "info");
    const searchTerm = context.common.baidu_search_term;
    if (!searchTerm) {
      context.forceExit("\u767E\u5EA6\u5E73\u53F0\u9700\u8981\u63D0\u4F9B\u641C\u7D22\u8BCD");
      return;
    }
    context.log(`\u6B63\u5728\u767E\u5EA6\u641C\u7D22: ${searchTerm}`, "info");
    await page.goto(`https://www.baidu.com/s?wd=${encodeURIComponent(searchTerm)}`, { waitUntil: "networkidle" });
    context.log("\u767E\u5EA6\u641C\u7D22\u5B8C\u6210", "success");
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const screenshotPath = path.join(outputDirectory, `baidu-search-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    context.log(`\u767E\u5EA6\u641C\u7D22\u622A\u56FE\u5DF2\u4FDD\u5B58\u5230: ${screenshotPath}`, "success");
    context.notify({
      title: "\u767E\u5EA6\u641C\u7D22\u5B8C\u6210",
      content: `hello anbao - \u767E\u5EA6\u641C\u7D22 "${searchTerm}" \u5B8C\u6210\uFF0C\u5DF2\u622A\u56FE\u3002\u901A\u7528\u901A\u77E5: ${commonMessage}`,
      category: "TaskResult"
    });
  } else if (isSogou) {
    context.log("\u5F53\u524D\u5E73\u53F0\u4E3A\u641C\u72D7", "info");
    const takeScreenshot = context.common.sogou_take_screenshot;
    context.log("\u6B63\u5728\u8BBF\u95EE\u641C\u72D7\u9996\u9875...", "info");
    await page.goto("https://www.sogou.com", { waitUntil: "networkidle" });
    context.log("\u641C\u72D7\u9996\u9875\u8BBF\u95EE\u5B8C\u6210", "success");
    if (takeScreenshot) {
      context.log("\u51C6\u5907\u641C\u72D7\u622A\u56FE...", "info");
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
      const screenshotPath = path.join(outputDirectory, `sogou-homepage-${timestamp}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      context.log(`\u641C\u72D7\u9996\u9875\u622A\u56FE\u5DF2\u4FDD\u5B58\u5230: ${screenshotPath}`, "success");
    } else {
      context.log("\u672A\u9009\u62E9\u641C\u72D7\u622A\u56FE", "info");
    }
    context.notify({
      title: "\u641C\u72D7\u5E73\u53F0\u64CD\u4F5C\u5B8C\u6210",
      content: `hello anbao - \u641C\u72D7\u5E73\u53F0\u64CD\u4F5C\u5B8C\u6210${takeScreenshot ? "\uFF0C\u5DF2\u622A\u56FE" : ""}\u3002\u901A\u7528\u901A\u77E5: ${commonMessage}`,
      category: "TaskResult"
    });
  } else {
    context.log("\u672A\u77E5\u5E73\u53F0\uFF0C\u4E0D\u6267\u884C\u7279\u5B9A\u64CD\u4F5C", "warn");
    context.notify({
      title: "\u672A\u77E5\u5E73\u53F0",
      content: `\u672A\u77E5\u5E73\u53F0\uFF0C\u672A\u6267\u884C\u7279\u5B9A\u64CD\u4F5C\u3002\u901A\u7528\u901A\u77E5: ${commonMessage}`,
      category: "TaskResult"
    });
  }
  return { success: true, message: "\u5E73\u53F0\u529F\u80FD\u6D4B\u8BD5\u4EFB\u52A1\u5B8C\u6210" };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  run
});
