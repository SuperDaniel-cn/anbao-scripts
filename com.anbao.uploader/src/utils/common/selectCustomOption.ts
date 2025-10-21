import { Locator } from "patchright";

/**
 * 封装了点击一个触发器元素以打开一个列表，然后从该列表中选择一个特定选项的通用交互模式。
 *
 * @param triggerLocator - 需要点击以显示选项列表的元素的 Locator。
 * @param optionLocator - 在列表出现后，需要点击的最终选项的 Locator。
 */
export async function selectCustomOption(
  triggerLocator: Locator,
  optionLocator: Locator,
): Promise<void> {
  await triggerLocator.click();
  await optionLocator.waitFor({ state: "visible", timeout: 5000 });
  await optionLocator.click();
}
