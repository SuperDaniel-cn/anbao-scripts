import { Platform } from "../types.js";
import bilibiliPlatform from "./bilibili.js";
import kuaishouPlatform from "./kuaishou.js";
import xiaohongshuPlatform from "./xiaohongshu.js";
import wechatChannelsPlatform from "./wechat-channels.js";
import douyinPlatform from "./douyin.js";

/**
 * 平台注册表。
 * 未来所有新的平台模块都应在此处导入和注册。
 * 这是唯一需要为新平台修改的文件。
 */
const platforms: Platform[] = [
  bilibiliPlatform,
  kuaishouPlatform,
  xiaohongshuPlatform,
  wechatChannelsPlatform,
  douyinPlatform,
  // 在此添加其他平台, e.g.:
];

export default platforms;
