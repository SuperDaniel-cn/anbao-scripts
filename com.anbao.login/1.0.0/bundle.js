// ==AnbaoScript==
// @id            com.anbao.internal.interactive-login
// @name          Interactive Login
// @version       1.0.0
// @author        Anbao Team
// @description   An internal script to launch a browser for manual user interaction, like logging in.
// @tags          
// @keywords      *
// @engine        playwright
// @launchOptions { "headless": false }
//
// @schema
// {
//   "title": "交互式登录",
//   "type": "object",
//   "properties": {}
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
  context.log("\u4EA4\u4E92\u5F0F\u767B\u5F55\u811A\u672C\u5DF2\u542F\u52A8\u3002", "info");
  if (context.platform?.base_url) {
    context.log(`\u6B63\u5728\u5BFC\u822A\u5230\u76EE\u6807\u9875\u9762: ${context.platform.base_url}`, "info");
    await page.goto(context.platform.base_url, { waitUntil: "domcontentloaded" });
  } else {
    context.log("\u672A\u63D0\u4F9B\u5E73\u53F0 URL\uFF0C\u5C06\u6253\u5F00\u4E00\u4E2A\u7A7A\u767D\u9875\u9762\u7528\u4E8E\u624B\u52A8\u64CD\u4F5C\u3002", "warn");
  }
  await context.requestHumanIntervention({
    message: "\u8BF7\u5728\u6D4F\u89C8\u5668\u4E2D\u624B\u52A8\u5B8C\u6210\u6240\u9700\u64CD\u4F5C\uFF08\u5982\u767B\u5F55\uFF09\uFF0C\u7136\u540E\u70B9\u51FB\u201C\u7EE7\u7EED\u201D\u7ED3\u675F\u4EFB\u52A1\u3002"
  });
  context.log("\u7528\u6237\u5DF2\u786E\u8BA4\u5B8C\u6210\u624B\u52A8\u64CD\u4F5C\u3002", "success");
  return { success: true, message: "\u4EA4\u4E92\u5F0F\u4F1A\u8BDD\u5DF2\u7531\u7528\u6237\u624B\u52A8\u7ED3\u675F\u3002" };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  run
});
