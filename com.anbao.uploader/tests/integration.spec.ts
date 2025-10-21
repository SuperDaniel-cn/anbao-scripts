import { platformTest, runPlatformTest } from "./helpers.js";
import { chromium } from "@playwright/test";

// --- 配置库：包含所有平台的基础配置 ---
const allPlatforms = [
  {
    platformName: "Douyin",
    platformBaseUrl: "https://creator.douyin.com/",
    profilePath:
      "/Users/daniel/Library/Application Support/com.anbao.agent/profiles/0199cdd6-e471-75d2-8d96-440822761555",
  },
  {
    platformName: "WeChat Channels",
    platformBaseUrl: "https://channels.weixin.qq.com/platform",
    profilePath:
      "/Users/daniel/Library/Application Support/com.anbao.agent/profiles/0199cdd6-e471-75d2-8d96-440822761555",
  },
  {
    platformName: "Bilibili",
    platformBaseUrl: "https://member.bilibili.com/",
    profilePath:
      "/Users/daniel/Library/Application Support/com.anbao.agent/profiles/0199f774-b408-76c0-913b-edb9890205e3",
  },
  {
    platformName: "Kuaishou",
    platformBaseUrl: "https://cp.kuaishou.com/",
    profilePath:
      "/Users/daniel/Library/Application Support/com.anbao.agent/profiles/0199cdd6-e471-75d2-8d96-440822761555",
  },
  {
    platformName: "Xiaohongshu",
    platformBaseUrl: "https://creator.xiaohongshu.com/",
    profilePath:
      "/Users/daniel/Library/Application Support/com.anbao.agent/profiles/0199cdd6-e471-75d2-8d96-440822761555",
  },
];

// --- 临时测试目标：通过平台名称数组来控制要测试的平台 ---
const platformsToTest = ["Bilibili"];

// --- 测试执行逻辑 ---

const testsToRun = allPlatforms.filter((p) =>
  platformsToTest.includes(p.platformName)
);

platformTest.describe("Uploader Integration Tests", () => {
  platformTest.beforeAll(async () => {
    const { execSync } = await import("child_process");
    execSync("npm run build", { stdio: "inherit" });
  });

  for (const platform of testsToRun) {
    platformTest.describe(`${platform.platformName} Upload`, () => {
      platformTest.use({
        browserContext: async ({}, use) => {
          const context = await chromium.launchPersistentContext(
            platform.profilePath,
            {
              headless: false,
              channel: "chrome",
              viewport: null,
              args: ["--start-maximized"],
              slowMo: 500,
            }
          );
          await use(context);
          await context.close();
        },
      });

      platformTest(
        `should run the full upload process`,
        async ({ page, browserContext }) => {
          platformTest.setTimeout(5 * 60 * 1000);
          await runPlatformTest(page, browserContext, {
            platformName: platform.platformName,
            platformBaseUrl: platform.platformBaseUrl,
          });
        }
      );
    });
  }
});
