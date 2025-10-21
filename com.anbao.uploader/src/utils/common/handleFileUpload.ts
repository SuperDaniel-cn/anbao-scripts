import { Locator } from "patchright";

/**
 * 封装了文件上传并等待操作完成的通用逻辑。
 * 如果操作失败或超时，它将直接抛出异常。
 * 错误处理由调用者（例如 `executeAction`）负责。
 *
 * @param filePath - 要上传的文件的路径。
 * @param fileInputLocator - 文件输入框的 Locator。
 * @param successLocators - 一个或多个表示上传成功的 Locator。函数将等待所有这些元素变为可见。
 * @param timeout - 等待成功的超时时间（毫秒）。
 */
export async function handleFileUpload({
  filePath,
  fileInputLocator,
  successLocators,
  timeout,
}: {
  filePath: string;
  fileInputLocator: Locator;
  successLocators: Locator[];
  timeout: number;
}): Promise<void> {
  // 步骤 1: 设置文件输入
  await fileInputLocator.setInputFiles(filePath);

  // 步骤 2: 并行等待所有成功标志出现
  const waitForPromises = successLocators.map((locator) =>
    locator.waitFor({ state: "visible", timeout }),
  );

  await Promise.all(waitForPromises);
}
