import { Locator } from "patchright";

/**
 * 封装了向指定的文本字段（输入框、文本域等）填入内容的通用逻辑。
 * 该函数会先清空字段，然后填入新值。
 * @param locator - 目标文本字段的 Locator。
 * @param value - 要填入的字符串值。
 * @param options - 可选参数。
 * @param options.clear - 是否在填入前清空字段，默认为 true。
 */

export async function fillTextField(
  locator: Locator,
  value: string,
  options: { clear?: boolean } = {},
): Promise<void> {
  const { clear = true } = options;
  await locator.waitFor({ state: "visible", timeout: 15000 });
  if (clear) {
    await locator.clear();
  }
  await locator.fill(value);
}
