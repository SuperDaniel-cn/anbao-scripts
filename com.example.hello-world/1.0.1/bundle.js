// ==AnbaoScript==
// @id          com.example.hello-world
// @name        Hello World
// @version     1.0.1
// @author      Daniel
// @description 一个简单的脚本，用于在控制台打印 'Hello World'。
// @tags        example, hello, test
// @changelog      初始版本。
// @keywords    sogou
// @engine      patchright
// @launchOptions { "headless": false, "slowMo": 50 }
//
// @schema
// {
//   "title": "视频发布脚本参数",
//   "type": "object",
//   "properties": {
//     "video_title": {
//       "type": "string",
//       "title": "1. 视频标题"
//     },
//     "video_file_path": {
//       "type": "string",
//       "format": "file",
//       "title": "2. 本地视频文件"
//     }
// }
// ==/AnbaoScript==

(async function () {
  console.log("你好，世界！这是一个来自安宝脚本市场的脚本。");
})();
