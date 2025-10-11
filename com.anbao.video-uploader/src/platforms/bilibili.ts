import { RunOptions, Uploader, PlatformError } from "../types";
import { Page } from "playwright";

// --- Human-like Interaction Helpers ---

/**
 * 在两个值之间生成一个随机延迟。
 * @param min 最小毫秒数
 * @param max 最大毫秒数
 */
const randomDelay = (min = 500, max = 1200) => {
  return new Promise((resolve) =>
    setTimeout(resolve, Math.random() * (max - min) + min)
  );
};

/**
 * 模拟人类点击，包含悬停和随机延迟，以提高稳定性。
 * @param locator Playwright Locator 对象
 */
const humanClick = async (locator: import("playwright").Locator, options?: { force?: boolean }) => {
  await locator.hover({ trial: true }); // 使用 trial 模式以避免在元素快速消失时出错
  await randomDelay(200, 500);
  await locator.click(options);
};

/**
 * 模拟人类打字，带有随机延迟。
 * @param page Playwright Page 对象
 * @param selector 目标元素的选择器
 * @param text 要输入的文本
 */
const humanType = async (page: Page, selector: string, text: string) => {
  const locator = page.locator(selector);
  await humanClick(locator); // 使用新的、更可靠的点击辅助函数
  await locator.fill(""); // 先清空
  await randomDelay(100, 200);
  await locator.type(text, { delay: Math.random() * 150 + 50 });
};

// --- Resilient Action Wrapper ---

const createRetryableAction = (context: RunOptions["context"], page: Page) => {
  return async <T>(
    action: () => Promise<T>,
    description: string,
    retryCount = 2
  ): Promise<T> => {
    for (let i = 0; i < retryCount; i++) {
      try {
        context.log(`[操作] 正在执行: ${description}...`, "info");
        const result = await action();
        await randomDelay(300, 700); // 成功后短暂延迟
        context.log(`[操作] 成功: ${description}`, "info");
        return result;
      } catch (error) {
        context.log(
          `[操作] 失败: ${description} (尝试 ${i + 1}/${retryCount})。错误: ${
            (error as Error).message
          }`,
          "warn"
        );

        if (i < retryCount - 1) {
          await randomDelay(1000, 2000); // 重试前等待更长时间
          context.log("正在重试...", "info");
        } else {
          // 最后一次重试失败，请求人工介入
          await context.requestHumanIntervention({
            message: `自动化操作 "${description}" 多次尝试后仍然失败。\n\n请您手动完成此步骤，然后点击“继续”让脚本从下一步开始。`,
          });
          // 人工介入后，我们假设用户已解决问题，并最后尝试一次
          try {
            context.log("正在进行人工介入后的最后一次尝试...", "info");
            return await action();
          } catch (finalError) {
            throw new PlatformError(
              `在人工介入后，操作 "${description}" 最终还是失败了: ${
                (finalError as Error).message
              }`
            );
          }
        }
      }
    }
    // 理论上不可达
    throw new PlatformError(`操作 "${description}" 彻底失败。`);
  };
};

// --- Platform Implementation ---

async function isLoggedIn({ page, context }: RunOptions): Promise<boolean> {
  context.log("[Bilibili] 检查登录状态...", "info");
  try {
    await page.goto("https://member.bilibili.com/platform/home", {
      waitUntil: "networkidle",
    });

    if (page.url().includes("passport.bilibili.com/login")) {
      context.log("[Bilibili] 检测到登录页面，判定为未登录。", "warn");
      return false;
    }

    const avatarSelector = "img.custom-lazy-img"; // 恢复为之前有效的选择器
    await page.waitForSelector(avatarSelector, { timeout: 10000 });
    const isVisible = await page.isVisible(avatarSelector);
    context.log(
      `[Bilibili] 登录状态检查完成，结果: ${isVisible ? "已登录" : "未登录"}`,
      "info"
    );
    return isVisible;
  } catch (error) {
    context.log(`[Bilibili] 登录检查异常: ${(error as Error).message}`, "warn");
    return false;
  }
}

async function upload({
  page,
  context,
}: RunOptions): Promise<{ postUrl: string }> {
  const doAction = createRetryableAction(context, page);
  const { common } = context;
  const {
    video_file_path,
    video_title,
    video_description,
    topics,
    submit_action,
    bilibili_category,
    bilibili_type,
    bilibili_schedule_enabled,
    bilibili_schedule_time,
    upload_timeout_minutes,
    manual_audit_required,
  } = common;

  await doAction(
    () =>
      page.goto("https://member.bilibili.com/platform/upload/video/frame", {
        waitUntil: "domcontentloaded",
      }),
    "导航到 Bilibili 投稿页面"
  );

  // --- 1. 上传文件 ---
  await doAction(async () => {
    const fileChooserPromise = page.waitForEvent("filechooser");
    await humanClick(page.locator(".bcc-upload-wrapper"));
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(video_file_path);
  }, "选择并上传视频文件");

  const timeoutMs = (upload_timeout_minutes || 30) * 60 * 1000;
  context.log(
    `等待视频处理完成 (超时时间: ${upload_timeout_minutes || 30} 分钟)...`,
    "info"
  );
  await doAction(
    () =>
      page
        .getByText("上传完成")
        .nth(1)
        .waitFor({ state: "visible", timeout: timeoutMs }),
    "等待“上传完成”状态出现"
  );
  context.log("视频处理完成。", "success");

  // 关键业务逻辑：上传成功后必须等待，否则后续操作的元素可能尚未出现
  context.log("等待 3 秒，以确保页面元素加载完成...", "info");
  await randomDelay(3000, 3500);


  // --- 3. 填写标题 ---
  const titleSelector = 'input[placeholder="请输入稿件标题"]';
  await doAction(
    () => humanType(page, titleSelector, video_title),
    "填写视频标题"
  );

  // --- 4. 选择类型 (自制/转载) ---
  const targetType = bilibili_type || "自制";
  await doAction(async () => {
    // 根据用户反馈，使用更精确的定位器来选择稿件类型
    const typeButton = page.locator('div').filter({ hasText: new RegExp(`^${targetType}$`) }).first();
    await humanClick(typeButton);
  }, `选择稿件类型: ${targetType}`);

  // --- 5. 填写标签 ---
  const topicList = topics ? topics.split(/[\s,，]+/).filter(Boolean) : [];
  if (topicList.length > 0) {
    await doAction(async () => {
      const tagInput = page.getByRole("textbox", {
        name: "按回车键Enter创建标签",
      });
      await humanClick(tagInput);
      const getRemainingSlots = async (): Promise<number | null> => {
        try {
          const locator = page.getByText(/还可以添加\d+个标签/);
          const text = await locator.textContent({ timeout: 2000 });
          if (text) {
            const match = text.match(/(\d+)/);
            return match ? parseInt(match[1], 10) : null;
          }
          return null;
        } catch (e) {
          return null;
        }
      };
      const initialSlots = await getRemainingSlots();
      if (initialSlots !== null && initialSlots < 10) {
        const tagsToDelete = 10 - initialSlots;
        context.log(`检测到 ${tagsToDelete} 个默认标签，正在清除...`, "info");
        for (let i = 0; i < tagsToDelete; i++) {
          await page.keyboard.press("Backspace");
          await randomDelay(100, 200);
        }
      }
      for (const topic of topicList) {
        const slotsBeforeAdd = await getRemainingSlots();
        if (slotsBeforeAdd === 0) {
          context.log("标签栏已满，无法添加更多标签。", "warn");
          break;
        }
        await tagInput.fill(topic);
        await tagInput.press("Enter");
        await page.waitForFunction(
          (expected) =>
            document.body.innerText.includes(`还可以添加${expected}个标签`),
          slotsBeforeAdd! - 1,
          { timeout: 5000 }
        );
        context.log(`标签 "${topic}" 添加成功。`, "info");
      }
    }, "填写话题标签");
  }

  // --- 6. 选择分区 ---
  await doAction(async () => {
    const targetCategory = bilibili_category || "知识";
    await humanClick(page.locator(".select-controller").first());
    await randomDelay(300, 500);
    await humanClick(page.getByTitle(targetCategory));
    await randomDelay(100, 200);
    const selectedText = await page
      .locator(".select-item-cont-inserted")
      .textContent();
    if (selectedText?.trim() !== targetCategory) {
      throw new Error(
        `分区选择失败，期望选择 "${targetCategory}"，实际为 "${selectedText}"`
      );
    }
  }, `选择视频分区: ${bilibili_category || "知识"}`);

  // --- 7. 填写简介 ---
  if (video_description) {
    await doAction(
      () =>
        page
          .locator('.ql-editor[contenteditable="true"]')
          .first()
          .fill(video_description),
      "填写视频简介"
    );
  }

  // --- 8. 定时发布 ---
  if (bilibili_schedule_enabled) {
    await doAction(async () => {
      await humanClick(page.locator(".switch-container").first());
      context.log("已开启定时发布功能。", "info");
      if (bilibili_schedule_time) {
        const scheduleDate = new Date(bilibili_schedule_time);
        const dateStr = scheduleDate.toISOString().split("T")[0];
        const timeStr = scheduleDate.toTimeString().substring(0, 5);

        // 设置日期
        await humanClick(page.locator(".date-picker-date"));
        await randomDelay(200, 400);
        await page.evaluate(
          ([date]) => {
            const spans = Array.from(
              document.querySelectorAll(".mx-calendar-content span")
            ) as HTMLElement[];
            const target = spans.find((s) => s.title === date);
            if (target) target.click();
          },
          [dateStr]
        );

        // 设置时间
        await humanClick(page.locator(".time-picker-time"));
        await randomDelay(200, 400);
        await page.evaluate(
          ([time]) => {
            const target = Array.from(
              document.querySelectorAll(".time-select-item")
            ).find((item) => item.textContent?.trim() === time);
            if (target) (target as HTMLElement).click();
          },
          [timeStr]
        );

        context.log(`已设置发布时间为: ${dateStr} ${timeStr}`, "success");
      }
    }, "设置定时发布时间");
  }

  // --- 9. 提交 ---
  if (manual_audit_required) {
    context.log("所有信息已填写完毕，进入人工审核模式...", "info");
    while (true) {
      await context.requestHumanIntervention({
        message: "请您审核后，手动点击‘立即投稿’或‘存为草稿’，然后点击下方的“继续”按钮。",
      });

      context.log("人工审核“继续”被点击，正在校验提交状态...", "info");
      const titleInputStillVisible = await page.locator('input[placeholder="请输入稿件标题"]').isVisible();
      
      if (titleInputStillVisible) {
        context.log("检测到表单仍未提交，将再次请求人工介入。请务必先在页面上点击提交按钮。", "warn");
        // Loop will continue, re-prompting the user.
      } else {
        context.log("表单已提交，任务正常结束。", "success");
        return { postUrl: "submitted_by_user" };
      }
    }
  } else {
    // 未开启人工审核，按原计划自动提交
    context.log("所有信息填写完毕，准备自动提交。", "info");
    const submitText = submit_action === "存草稿" ? "存为草稿" : "立即投稿";
    await doAction(
      () => humanClick(page.getByText(submitText)),
      `点击“${submitText}”按钮`
    );

    if (submit_action === "存草稿") {
      context.log("已自动存为草稿，任务结束。", "success");
      return { postUrl: "draft" };
    }
  }

  // --- 10. 等待发布成功 ---
  await doAction(
    () => page.waitForURL("**/creative-result-succeed/**", { timeout: 120000 }),
    "等待发布成功跳转"
  );

  const successLinkLocator = page.locator("a.success-jump-url");
  const postUrl = await doAction(
    () => successLinkLocator.getAttribute("href"),
    "获取视频链接"
  );

  if (!postUrl) {
    throw new PlatformError("发布成功，但未能获取到视频链接。");
  }

  const fullUrl = postUrl.startsWith("http") ? postUrl : `https:${postUrl}`;
  context.log(`发布成功！视频链接: ${fullUrl}`, "success");
  return { postUrl: fullUrl };
}

async function verify(
  { page, context }: RunOptions,
  { postUrl }: { postUrl: string }
): Promise<boolean> {
  if (postUrl === "draft" || postUrl === "submitted_by_user" || postUrl === "pending_manual_action") {
    context.log("操作为存为草稿或人工提交，跳过后置验证。", "info");
    return true;
  }

  context.log("正在执行发布后验证...", "info");
  
  await page.goto("https://member.bilibili.com/platform/upload-manager/article", { waitUntil: "networkidle" });

  const initialTimeout = 30000; // 30 seconds
  for (let i = 0; i < 3; i++) {
    const timeout = initialTimeout * Math.pow(2, i);
    try {
      context.log(`正在稿件管理页面查找视频... (尝试 ${i + 1}/3, 超时: ${timeout / 1000}s)`, "info");
      const videoLink = page.getByRole('link', { name: context.common.video_title, exact: true });
      await videoLink.waitFor({ state: "visible", timeout });
      context.log("验证成功: 在稿件管理页面找到了匹配的视频。", "success");
      return true;
    } catch (e) {
      if (i < 2) {
        context.log(`未找到视频，可能是审核延迟，将进行下一次尝试...`, "warn");
        await page.reload({ waitUntil: "networkidle" }); // Reload the page before next try
      }
    }
  }

  context.log("验证失败: 多次尝试后，在稿件管理页面仍未找到匹配的视频。", "error");
  return false;
}

export const uploader: Uploader = {
  isLoggedIn,
  upload,
  verify,
};
