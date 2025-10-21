import { Page, Locator } from "patchright";
import { AnbaoContext, PlatformError } from "../../types.js";

/**
 * 封装了 Bilibili 平台设置定时发布的复杂交互。
 */
export async function handleBilibiliScheduler(
  page: Page,
  context: AnbaoContext,
  scheduleDate: string,
  scheduleTime: string,
): Promise<void> {
  const { log } = context;

  if (!scheduleTime || !scheduleDate) return;

  log("准备设置定时发布...", "info");
  await page.locator(".switch-container").first().click();
  await page
    .getByRole("textbox", { name: "请选择内容" })
    .waitFor({ state: "visible" });

  const targetDateTime = new Date(`${scheduleDate} ${scheduleTime}`);
  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const fifteenDaysLater = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

  if (targetDateTime < twoHoursLater) {
    throw new PlatformError(
      `定时发布时间 (${targetDateTime.toLocaleString()}) 早于最早允许时间 (${twoHoursLater.toLocaleString()})。`,
    );
  }
  if (targetDateTime > fifteenDaysLater) {
    throw new PlatformError(
      `定时发布时间 (${targetDateTime.toLocaleString()}) 晚于最晚允许时间 (${fifteenDaysLater.toLocaleString()})。`,
    );
  }
  log("定时发布时间合法性校验通过。", "info");

  // --- 日期选择 ---
  await page
    .locator("div")
    .filter({ hasText: /^\d{4}-\d{2}-\d{2}$/ })
    .nth(1)
    .click();
  const targetYear = targetDateTime.getFullYear();
  const targetMonth = targetDateTime.getMonth() + 1;
  const targetDay = targetDateTime.getDate();
  const monthHeader = page
    .locator("div")
    .filter({ hasText: new RegExp(`^${targetYear}年${targetMonth}月$`) });
  await monthHeader.waitFor();
  const dateContainer = page.locator(".weekend-wrp + .date-wrp");
  await dateContainer.waitFor();
  await dateContainer.getByText(String(targetDay), { exact: true }).click();
  log(`已选择日期: ${scheduleDate}`, "info");

  // --- 时间选择 ---
  await page
    .locator("div")
    .filter({ hasText: /^\d{2}:\d{2}$/ })
    .nth(1)
    .click();
  await page
    .getByText("000102030405060708091011121314151617181920212223")
    .waitFor();
  await page.getByText("000510152025303540455055").waitFor();
  const targetHour = String(targetDateTime.getHours()).padStart(2, "0");
  let targetMinute = targetDateTime.getMinutes();
  // Bilibili 的时间选择器是以 5 分钟为间隔的
  targetMinute = Math.ceil(targetMinute / 5) * 5;
  if (targetMinute === 60) targetMinute = 55; // 处理边界情况
  const targetMinuteStr = String(targetMinute).padStart(2, "0");
  await page.getByText(targetHour, { exact: true }).click();
  // 修复：使用 .last() 来选择分钟，避免严格模式冲突
  await page.getByText(targetMinuteStr, { exact: true }).last().click();
  log(`已选择时间: ${targetHour}:${targetMinuteStr}`, "info");
}

/**
 * 封装了 Bilibili 平台更换封面的复杂交互。
 */
export async function handleBilibiliCoverUpload(
  page: Page,
  context: AnbaoContext,
  coverImagePath: string,
): Promise<void> {
  const { log } = context;

  log("准备更换封面...", "info");
  const changeCoverButton = page.getByText("更换封面");
  await changeCoverButton.waitFor({ state: "attached", timeout: 60000 });

  await page.waitForFunction(
    () => {
      const button = Array.from(document.querySelectorAll("span")).find(
        (s) => s.textContent === "更换封面",
      );
      return button && !button.parentElement?.classList.contains("disabled");
    },
    null,
    { timeout: 300000 },
  );
  log("“更换封面”按钮已变为可用状态。", "info");

  await changeCoverButton.click();
  const modal = page.locator(".bcc-dialog__wrap").first();
  await modal.waitFor({ state: "visible" });
  log("封面模态框已出现。", "info");

  await modal.getByText("上传封面").click();
  const coverInput = modal
    .locator(".cover-select-footer")
    .locator('input[type="file"][style*="display: none"]');

  log(`正在上传封面文件: ${coverImagePath}`, "info");
  await coverInput.setInputFiles(coverImagePath);

  await modal.getByRole("button", { name: "完成" }).click();
  await modal.waitFor({ state: "hidden" });
  log("封面更换成功！", "success");
}

/**
 * 抽象处理B站标签输入的通用逻辑。
 */
export const handleBilibiliTagInput = async (
  page: Page,
  tags: string[],
  tagInput: Locator,
) => {
  await tagInput.waitFor({ state: "visible", timeout: 10000 });
  await tagInput.click();

  try {
    const remainingTagsText = await page
      .getByText(/还可以添加\d+个标签/)
      .textContent({ timeout: 5000 });

    const match = remainingTagsText?.match(/还可以添加(\d+)个标签/);
    if (match && match[1]) {
      const remainingCount = parseInt(match[1], 10);
      const deleteCount = 10 - remainingCount;
      if (deleteCount > 0) {
        for (let i = 0; i < deleteCount; i++) {
          await tagInput.press("Backspace");
        }
      }
    }
  } catch (_error) {
    console.warn("无法找到'还可以添加...'文本来计算标签，将跳过清除步骤。");
  }

  for (const tag of tags) {
    await tagInput.fill(tag);
    await tagInput.press("Enter");
  }
};

/*
 * @description 从 Bilibili 上传页面提取实时表单数据
 * @param page Playwright Page 对象
 * @returns 包含从页面提取的数据的对象
 */
// export const extractBilibiliFormData = async (page: Page): Promise<Record<string, any>> => {
//   return await page.evaluate(() => {
//     const getText = (selector: string) => document.querySelector(selector)?.textContent?.trim() || '';
//     const getValue = (selector: string) => (document.querySelector(selector) as HTMLInputElement)?.value?.trim() || '';
//     const getTags = () => Array.from(document.querySelectorAll('.tag-pre-wrp .label-item-v2-content')).map(el => el.textContent?.trim()).filter(Boolean) as string[];
//     const getDesc = () => (document.querySelector('.ql-editor[data-placeholder*="填写更全面的相关信息"]') as HTMLElement)?.innerText?.trim() || '';
//
//     return {
//       title: getValue('input[placeholder="请输入稿件标题"]'),
//       reprint_source: getValue('input[placeholder*="转载视频请注明来源"]'),
//       partition: getText('.select-item-cont-inserted'),
//       tags: getTags(),
//       description: getDesc(),
//     };
//   });
// };
