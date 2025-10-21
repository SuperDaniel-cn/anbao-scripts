import { RunOptions } from "../types.js";

/**
 * 创建一个支持在失败时直接请求人工介入的操作执行器。
 * @param options 包含 context 和 page 的运行选项
 */
export const createActionExecutor = (options: RunOptions) => {
  const { context, page } = options;

  /**
   * @param action 要执行的异步函数
   * @param description 操作的描述，用于日志和人工介入提示
   */
  /**
   * 检查浏览器连接状态
   */
  const checkBrowserConnection = async (): Promise<boolean> => {
    try {
      // 尝试获取浏览器上下文状态
      const context = page.context();
      if (!context) {
        return false;
      }
      
      // 尝试执行一个简单的页面操作来检测连接
      await page.evaluate(() => document.readyState);
      return true;
    } catch (error) {
      // 如果任何操作失败，说明浏览器连接已断开
      return false;
    }
  };

  return async <T>(
    action: () => Promise<T>,
    description: string,
    type: "login" | "generic" = "generic"
  ): Promise<T | undefined> => {
    try {
      // 在执行操作前检查浏览器连接状态
      const isConnected = await checkBrowserConnection();
      if (!isConnected) {
        context.log(`[错误] 浏览器连接已断开，无法执行操作: ${description}`, "error");
        context.forceExit(`浏览器连接已断开，任务终止。请重新启动脚本。`);
        return undefined;
      }

      context.log(`[执行] ${description}`, "info");
      const result = await action();
      context.log(`[成功] ${description}`, "success");
      return result;
    } catch (error: any) {
      // 检查是否是浏览器连接相关的错误
      const isConnected = await checkBrowserConnection();
      if (!isConnected) {
        context.log(`[错误] 浏览器连接已断开: ${description}`, "error");
        context.forceExit(`浏览器连接已断开，任务终止。请重新启动脚本。`);
        return undefined;
      }

      context.log(`[失败] ${description}: ${error.message}`, "warn");

      let message: string;
      if (type === "login") {
        message = `【${context.platform.name}】平台未登录，请手动登录后点击"继续"。`;
      } else {
        message = `【${context.platform.name}】平台操作"${description}"失败，请手动完成后点击"继续"。`;
      }

      await context.requestHumanIntervention({ message });

      context.log(`用户已响应操作: "${description}"。脚本将继续执行。`, "info");

      // 对于登录失败，我们需要再次尝试操作以确认登录状态
      if (type === "login") {
        context.log(`[执行] 再次检查登录状态`, "info");
        try {
          const result = await action();
          context.log(`[成功] 再次检查登录状态`, "success");
          return result;
        } catch (retryError: any) {
          context.log(`[失败] 再次检查登录状态: ${retryError.message}`, "warn");
          return undefined; // 第二次也失败，返回 undefined
        }
      }

      return undefined; // 对于通用操作，假定用户已完成
    }
  };
};
