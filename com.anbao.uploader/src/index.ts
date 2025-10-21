import { RunOptions, Platform } from "./types.js";
import platforms from "./platforms/index.js";
import { createActionExecutor } from "./utils/executeAction.js";

const getPlatform = (baseUrl: string): Platform | undefined => {
  const lowerCaseUrl = baseUrl.toLowerCase();
  return platforms.find((p) => lowerCaseUrl.includes(p.key));
};

export async function run(options: RunOptions) {
  const { context } = options;
  const { platform, log, common } = context;

  // 定义从内部键到用户友好名称的映射
  const actionDescriptions: Record<string, string> = {
    cover_image_path: "上传封面",
    title: "填写标题",
    reprint_source: "处理转载信息",
    partition: "选择分区",
    tags: "填写标签",
    description: "填写简介",
    schedule_date: "设置定时发布",
    // 可以为所有平台添加更多通用或特定的描述
  };

  const platformModule = getPlatform(platform.base_url);
  if (!platformModule) {
    return context.forceExit(
      `不支持的平台: ${platform.name} (${platform.base_url})`
    );
  }

  const { uploader, actions } = platformModule;
  const execute = createActionExecutor(options);

  // --- 阶段 1: 鉴权 ---
  const isLoggedIn = await execute(
    () => uploader.isLoggedIn(options),
    "检查登录状态",
    "login"
  );
  if (isLoggedIn !== true) {
    return context.forceExit("登录失败，任务终止。");
  }

  // --- 阶段 2: 上传主视频 ---
  await execute(() => uploader.uploadVideo(options), "上传主视频文件");

  // --- 阶段 3: 执行业务动作 ---
  log("开始执行业务动作...", "info");
  const executionKeys = uploader.actionOrder || Object.keys(common);
  for (const key of executionKeys) {
    const value = common[key];
    if (value === undefined || value === null || value === "") continue;

    const handler = actions[key];
    if (handler) {
      // 使用映射表中的友好名称，如果找不到则回退到原始键
      const description = actionDescriptions[key] || `执行动作: ${key}`;
      await execute(() => handler(options, value), description);
    }
  }
  log("所有业务动作执行完毕。", "success");

  // --- 阶段 4: 最终提交 ---
  const uploadResult = await execute(
    () => uploader.submit(options),
    "最终提交"
  );

  // --- 任务结束 ---
  log("所有阶段已成功完成！", "success");
  return {
    success: true,
    message: `视频已在 ${platform.name} 处理完成。`,
    data: uploadResult || { status: "draft", postUrl: "（人工操作）" },
  };
}
