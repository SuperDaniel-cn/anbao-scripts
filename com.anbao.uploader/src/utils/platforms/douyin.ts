import type { Page } from "patchright";
import type { AnbaoContext } from "../../types.js";

export const handleDouyinCoverUpload = async (
  page: Page,
  context: AnbaoContext,
  value: any
) => {
  await page
    .locator("div")
    .filter({ hasText: /^选择封面$/ })
    .nth(1)
    .click();
  await page.getByText("封面检测").waitFor({ state: "visible" });

  const fileInput = page.locator("input.semi-upload-hidden-input");
  await fileInput.setInputFiles(value as string);

  // 这个点击操作会关闭模态框。
  await page.getByRole("button", { name: "完成" }).click();

  // 验证：等待“封面检测”模态框消失，以确认操作成功。
  await page.getByText("封面检测").waitFor({ state: "hidden", timeout: 60000 });
};

export const handleDouyinScheduler = async (
  page: Page,
  context: AnbaoContext,
  value: any
) => {
  await page.locator("label").filter({ hasText: "定时发布" }).click();
  const dateInput = page.getByRole("textbox", { name: "日期和时间" });
  await dateInput.click();
  await dateInput.fill(value as string);
  // TODO: 需要增加确认逻辑，例如点击页面其他地方
};
