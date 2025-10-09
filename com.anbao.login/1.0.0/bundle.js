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
//   "title": "Anbao Schema 能力测试参数",
//   "type": "object",
//   "properties": {
//     "output_directory": {
//       "type": "string",
//       "format": "directory",
//       "title": "0. 输出目录"
//     },
//     "string_default": {
//       "type": "string",
//       "title": "1. 短文本 (string)"
//     },
//     "string_textarea": {
//       "type": "string",
//       "format": "textarea",
//       "title": "2. 长文本 (textarea)"
//     },
//     "string_password": {
//       "type": "string",
//       "format": "password",
//       "title": "3. 密码/密钥 (password)"
//     },
//     "string_date": {
//       "type": "string",
//       "format": "date",
//       "title": "4. 日期 (date)"
//     },
//     "string_date_time": {
//       "type": "string",
//       "format": "date-time",
//       "title": "5. 日期和时间 (date-time)"
//     },
//     "string_enum": {
//       "type": "string",
//       "enum": ["选项A", "选项B", "选项C"],
//       "title": "6. 下拉单选 (enum)"
//     },
//     "number_field": {
//       "type": "number",
//       "title": "7. 数值 (number)"
//     },
//     "integer_field": {
//       "type": "integer",
//       "title": "8. 整数 (integer)"
//     },
//     "boolean_field": {
//       "type": "boolean",
//       "title": "9. 布尔值 (boolean)"
//     },
//     "string_file": {
//       "type": "string",
//       "format": "file",
//       "title": "10. 文件选择 (file)"
//     },
//     "string_directory": {
//       "type": "string",
//       "format": "directory",
//       "title": "11. 目录选择 (directory)"
//     }
//   },
//   "required": [
//     "output_directory",
//     "string_default",
//     "string_textarea",
//     "string_password",
//     "string_date",
//     "string_date_time",
//     "string_enum",
//     "number_field",
//     "integer_field",
//     "boolean_field",
//     "string_file",
//     "string_directory"
//   ]
// }
// ==/AnbaoScript==
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  run: () => run
});
module.exports = __toCommonJS(src_exports);
var fs = __toESM(require("fs/promises"));
var path = __toESM(require("path"));
async function run({ page, context }) {
  context.log("Schema \u80FD\u529B\u6D4B\u8BD5\u811A\u672C\u5DF2\u542F\u52A8\u3002", "info");
  const userInput = context.common;
  context.log(`\u63A5\u6536\u5230\u7684\u7528\u6237\u8F93\u5165: ${JSON.stringify(userInput, null, 2)}`, "info");
  const outputDir = userInput.output_directory || context.paths.data;
  const outputFileName = "schema_test_output.json";
  const outputPath = path.join(outputDir, outputFileName);
  try {
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(userInput, null, 2), "utf-8");
    context.log(`\u7528\u6237\u8F93\u5165\u5DF2\u6210\u529F\u4FDD\u5B58\u5230: ${outputPath}`, "success");
  } catch (error) {
    context.log(`\u4FDD\u5B58\u7528\u6237\u8F93\u5165\u5931\u8D25: ${error.message}`, "error");
    context.forceExit(`\u4FDD\u5B58\u7528\u6237\u8F93\u5165\u5931\u8D25: ${error.message}`);
  }
  return { success: true, message: "Schema \u80FD\u529B\u6D4B\u8BD5\u5B8C\u6210\uFF0C\u7528\u6237\u8F93\u5165\u5DF2\u4FDD\u5B58\u3002" };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  run
});
