import { test, expect, chromium } from "@playwright/test";
import * as path from "path";
import { uploader as bilibiliUploader } from "./src/platforms/bilibili";
import { RunOptions } from "./src/types";

test.describe("Bilibili Full E2E Test", () => {
  const userDataDir =
    "/Users/daniel/Library/Application Support/com.anbao.agent/profiles/0199cdd6-e471-75d2-8d96-440822761555";
  const videoPath =
    "/Users/daniel/Downloads/老板总搞突然袭击？一句话噎死你！.mp4";

  test("should complete the full upload lifecycle", async () => {
    test.setTimeout(5 * 60 * 1000); // 5 minutes timeout for the whole test

    const browserContext = await chromium.launchPersistentContext(userDataDir, {
      channel: "chrome",
      headless: false,
      slowMo: 500, // A reasonable speed for observation
    });

    const page = await browserContext.newPage();

    // Mock the Anbao Context
    const mockContext: RunOptions["context"] = {
      common: {
        video_file_path: videoPath,
        video_title: `【测试】${new Date().toISOString()}`,
        video_description: "这是一个由自动化脚本发布的测试视频。",
        topics: "测试, 自动化, Playwright",
        submit_action: "存为草稿", // IMPORTANT: Always save as draft in tests to avoid publishing.
      },
      platform: { name: "bilibili", base_url: "https://www.bilibili.com" },
      profile: { name: "test-profile" },
      paths: { downloads: "", data: "" },
      log: (message, level) =>
        console.log(`[${level?.toUpperCase() || "INFO"}] ${message}`),
      notify: (payload) =>
        console.log(`[NOTIFY] ${payload.title}: ${payload.content}`),
      forceExit: (message) => {
        throw new Error(`Forced Exit: ${message}`);
      },
      requestHumanIntervention: async (options) => {
        console.log(`Requesting human intervention: ${options.message}`);
        await page.evaluate((msg) => alert(msg), options.message);
      },
    };

    const runOptions: RunOptions = {
      browser: browserContext,
      page,
      context: mockContext,
    };

    try {
      // 1. Pre-flight check
      const loggedIn = await bilibiliUploader.isLoggedIn(runOptions);
      expect(loggedIn).toBe(true);
      console.log("Login check successful.");

      // 2. Core upload process
      const uploadResult = await bilibiliUploader.upload(runOptions);
      // Since we set submit_action to '存为草稿', we expect the result to be 'draft'.
      expect(uploadResult.postUrl).toBe("draft");
      console.log(
        `Upload process completed successfully with action: "存为草稿"`
      );

      // 3. Post-flight verification
      if (bilibiliUploader.verify) {
        const verified = await bilibiliUploader.verify(
          runOptions,
          uploadResult
        );
        expect(verified).toBe(true);
        console.log("Verification successful.");
      }

      // 4. Final success notification
      await page.evaluate(() => alert("测试成功！脚本已完成所有阶段。"));
      await page.waitForTimeout(3000);
    } finally {
      await browserContext.close();
    }
  });
});
