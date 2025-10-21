import type { Page } from "patchright";

export const handleWeiboCoverUpload = async (
  page: Page,
  coverImagePath: any,
) => {
  await page.getByRole("link", { name: "裁剪封面" }).click();
  await page.getByText("编辑封面").waitFor({ state: "visible" });

  const fileInput = page.locator("input.VideoEdit_file_2aoWb");
  await fileInput.setInputFiles(coverImagePath as string);

  await page.getByRole("button", { name: "完成" }).click();
  await page.getByText("编辑封面").waitFor({ state: "hidden" });
};

export const handleWeiboTagInput = async (page: Page, tagsString: string) => {
  const tags = (tagsString as string).split(/[\s,]+/).filter(Boolean);
  if (tags.length === 0) return;

  const editor = page.getByRole("textbox", {
    name: "有什么新鲜事想分享给大家？",
  });
  await editor.click();
  await page.keyboard.press("End");
  await page.keyboard.insertText(" ");

  for (const tag of tags) {
    await page.keyboard.insertText(`#${tag}# `);
    await page.waitForTimeout(200);
  }
};