import { Page } from "patchright";
import { AnbaoContext } from "../../types.js";

/**
 * 封装了快手平台更换封面的复杂交互。
 */
export async function handleKuaishouCoverUpload(
  page: Page,
  context: AnbaoContext,
  coverImagePath: string,
): Promise<void> {
  const { log } = context;

  log("准备更换封面...", "info");
  await page.getByText("封面设置").nth(1).click();
  await page.waitForTimeout(1000); // 等待动画
  const modal = page.getByRole("dialog");
  await modal.waitFor({ state: "visible" });
  log("封面模态框已出现。", "info");
  await modal.getByText("上传封面").click();
  await page.waitForTimeout(500);

  const clearUploadButton = modal.getByText("清空上传");
  const uploadPlaceholder = page
    .locator("div")
    .filter({ hasText: /^拖拽图片到此或点击上传上传图片$/ })
    .nth(1);

  if (await clearUploadButton.isVisible({ timeout: 2000 })) {
    await clearUploadButton.click();
    log("已清空旧的封面缓存。", "info");
    await uploadPlaceholder.waitFor({ state: "visible", timeout: 5000 });
    log("封面上传UI已重置。", "info");
  }

  const fileInput = uploadPlaceholder.locator('input[type="file"]');
  await fileInput.setInputFiles(coverImagePath);

  await page.getByText("清空上传").waitFor({ state: "visible" });
  log("封面上传成功。", "success");

  await page.getByRole("button", { name: "确认" }).click();
  await modal.waitFor({ state: "hidden" });
  log("封面更换成功！", "success");
}

/**
 * 封装了快手平台设置定时发布的复杂交互。
 */
export async function handleKuaishouScheduler(
  page: Page,
  context: AnbaoContext,
  scheduleDateTime: string,
): Promise<void> {
  const { log } = context;

  log("准备设置定时发布...", "info");
  await page.getByRole("radio", { name: "定时发布" }).click();

  const pickerInput = page.locator(".ant-picker-input");
  await pickerInput.hover();
  await page.waitForTimeout(500);

  const clearButton = page.getByRole("button", { name: "close-circle" });
  if (await clearButton.isVisible({ timeout: 2000 })) {
    await clearButton.click();
    log("已清除默认的定时发布时间。", "info");
  }

  const dateTimeInput = page.getByRole("textbox", { name: "选择日期时间" });
  await dateTimeInput.click();

  const fullDateTime = `${scheduleDateTime}:00`;
  await dateTimeInput.fill(fullDateTime);
  await page.getByRole("button", { name: "确定" }).click();

  const expectedTime = `-${fullDateTime.substring(5)}`;
  await page
    .getByRole("textbox", { name: new RegExp(expectedTime) })
    .waitFor({ timeout: 5000 });
  log(`定时发布时间已成功设置为: ${fullDateTime}`, "success");
}

/**
 * 封装了快手平台添加话题标签的交互。
 */
export async function handleKuaishouTagInput(
  page: Page,
  context: AnbaoContext,
  tags: string[],
): Promise<void> {
  const { log } = context;
  const addTopicButton = page.getByText("#话题");

  log("准备输入话题标签...", "info");
  for (const tag of tags) {
    await addTopicButton.click();
    await page.keyboard.insertText(tag);
    await page.waitForTimeout(500);
    await page.keyboard.press("Enter");
    log(`已输入标签: ${tag}`, "info");
  }
  log("所有标签输入完毕。", "success");
}

/*
 * @description 从快手上传页面提取实时表单数据
 * @param page Playwright Page 对象
 * @returns 包含从页面提取的数据的对象
 */
// export const extractKuaishouFormData = async (page: Page): Promise<Record<string, any>> => {
//   // 快手的描述和标签耦合在一起，需要特殊处理
//   const editorLocator = page.locator("#work-description-edit");
//   const fullText = (await editorLocator.textContent()) || "";
//
//   // 提取并分离标签
//   const tagRegex = /#(\S+)/g;
//   const tags = fullText.match(tagRegex)?.map(t => t.substring(1).trim()) || [];
//
//   // 从描述中移除标签部分
//   const description = fullText.replace(tagRegex, '').trim();
//
//   // 提取定时发布时间
//   let schedule_date = '';
//   // 反向利用 handleKuaishouScheduler 中的验证逻辑来读取时间
//   const scheduleInputLocator = page.getByRole("textbox", { name: /-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/ });
//   if (await scheduleInputLocator.isVisible()) {
//       const nameAttr = await scheduleInputLocator.getAttribute('name');
//       const match = nameAttr?.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})$/);
//       schedule_date = match ? match[1] || '' : '';
//   }
//
//   return {
//     description,
//     tags,
//     schedule_date,
//   };
// };
