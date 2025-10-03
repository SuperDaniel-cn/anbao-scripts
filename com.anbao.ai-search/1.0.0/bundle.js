// ==AnbaoScript==
// @id            com.anbao.ai-search
// @name          AI 百度搜索
// @version       1.0.0
// @author        Anbao Team
// @description   使用 AI 代理在百度搜索指定内容。
// @tags          
// @keywords      ai, search, baidu
// @engine        playwright
// @launchOptions { "headless": false }
//
// @schema
// {
//   "title": "AI 百度搜索参数",
//   "type": "object",
//   "properties": {
//     "api_key": {
//       "type": "string",
//       "format": "password",
//       "title": "1. API Key",
//       "description": "你的 API Key，例如 OpenAI 或任何兼容的 LLM 服务商。"
//     },
//     "base_url": {
//       "type": "string",
//       "title": "2. 自定义端点 (可选)",
//       "description": "如果你使用非 OpenAI 的服务 (如本地模型、Ollama、Groq 等)，请在此处填写 API 的 Base URL。"
//     }
//   },
//   "required": ["api_key"]
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
  context.log("\u5F00\u59CB AI \u767E\u5EA6\u641C\u7D22\u4EFB\u52A1", "info");
  const apiKey = context.common.api_key;
  const baseUrl = context.common.base_url;
  if (!apiKey) {
    context.forceExit("\u9519\u8BEF\uFF1A\u672A\u63D0\u4F9B API Key\u3002\u8BF7\u5728\u4EFB\u52A1\u8BBE\u7F6E\u4E2D\u586B\u5199\u3002");
    return;
  }
  context.log("\u6B63\u5728\u8BBF\u95EE\u767E\u5EA6\u9996\u9875...", "info");
  await page.goto("https://www.baidu.com", { waitUntil: "networkidle" });
  try {
    context.log("\u6B63\u5728\u8C03\u7528 AI \u4EE3\u7406\u641C\u7D22 '\u676D\u5DDE\u7684\u5929\u6C14\u5982\u4F55'...");
    const agentResult = await context.invokeAgent(
      "\u5728\u5F53\u524D\u9875\u9762\u4E0A\u627E\u5230\u641C\u7D22\u6846\uFF0C\u8F93\u5165'\u676D\u5DDE\u7684\u5929\u6C14\u5982\u4F55'\u5E76\u70B9\u51FB\u641C\u7D22\u6309\u94AE\u3002\u7136\u540E\u7B49\u5F85\u641C\u7D22\u7ED3\u679C\u52A0\u8F7D\u5B8C\u6210\uFF0C\u5E76\u63D0\u53D6\u5929\u6C14\u4FE1\u606F\u3002",
      { apiKey, baseUrl }
    );
    context.log(`AI \u4EE3\u7406\u6267\u884C\u5B8C\u6210\uFF0C\u7ED3\u679C: ${JSON.stringify(agentResult)}`, "success");
    context.notify({
      title: "AI \u641C\u7D22\u5B8C\u6210",
      content: `hello anbao - AI \u4EE3\u7406\u5DF2\u641C\u7D22\u5230\u676D\u5DDE\u5929\u6C14\u4FE1\u606F\u3002\u7ED3\u679C: ${JSON.stringify(agentResult)}`,
      category: "TaskResult"
    });
    return { success: true, message: "AI \u767E\u5EA6\u641C\u7D22\u4EFB\u52A1\u5B8C\u6210", result: agentResult };
  } catch (error) {
    console.error("\u8C03\u7528 AI \u4EE3\u7406\u65F6\u53D1\u751F\u9519\u8BEF:", error);
    context.log(`AI \u4EE3\u7406\u641C\u7D22\u5931\u8D25: ${error.message}`, "error");
    context.notify({
      title: "AI \u641C\u7D22\u5931\u8D25",
      content: `hello anbao - AI \u4EE3\u7406\u641C\u7D22\u5931\u8D25: ${error.message}`,
      category: "TaskResult"
    });
    context.forceExit(`AI \u4EE3\u7406\u641C\u7D22\u5931\u8D25: ${error.message}`);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  run
});
