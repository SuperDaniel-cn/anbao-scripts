import { test as base, chromium, BrowserContext, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs/promises";
import type { AnbaoContext } from "../src/types.js";

type PlatformTestFixtures = {
  browserContext: BrowserContext;
  page: Page;
};

export const platformTest = base.extend<PlatformTestFixtures>({
  browserContext: [
    async ({}, use) => {
      // This is a placeholder and should be overridden in the actual test file
      // with the correct profile path.
      const profilePath = "/path/to/default/profile";
      const context = await chromium.launchPersistentContext(profilePath, {
        headless: false,
        channel: "chrome",
        viewport: null,
        args: ["--start-maximized"],
        slowMo: 500,
      });
      await use(context);
      await context.close();
    },
    { scope: "test" },
  ],
  page: [
    async ({ browserContext }, use) => {
      const page = await browserContext.newPage();
      await use(page);
    },
    { scope: "test" },
  ],
});

export async function runPlatformTest(
  page: Page,
  browserContext: BrowserContext,
  options: {
    platformName: string;
    platformBaseUrl: string;
  }
) {
  // 根据您的最终指示，直接读取 test-data.json 作为模拟的 context.common
  const mockCommon = JSON.parse(await fs.readFile("tests/test-data.json", "utf-8"));

  const mockContext: AnbaoContext = {
    common: mockCommon,
    platform: { name: options.platformName, base_url: options.platformBaseUrl },
    profile: { name: `${options.platformName} Test Profile` },
    paths: {
      downloads: path.join(process.env.HOME!, "Downloads"),
      data: path.join(
        process.cwd(),
        `test-data-${options.platformName.toLowerCase()}`
      ),
    },
    log: (message: string, level?: "info" | "warn" | "error" | "success") => {
      console.log(
        `[${options.platformName.toUpperCase()}-TEST|${
          level?.toUpperCase() || "INFO"
        }] ${message}`
      );
    },
    notify: (payload) => {
      console.log(
        `[${options.platformName.toUpperCase()}-NOTIFY] ${payload.title}: ${
          payload.content
        }`
      );
    },
    forceExit: (errorMessage?: string) => {
      throw new Error(errorMessage);
    },
    requestHumanIntervention: async (interventionOptions) => {
      console.log(
        `[${options.platformName.toUpperCase()}-HUMAN] ${
          interventionOptions.message
        }`
      );
    },
  };

  const pkg = JSON.parse(await fs.readFile("package.json", "utf-8"));
  const { run } = await import(`../${pkg.version}/bundle.js?v=${Date.now()}`);

  await run({ browser: browserContext, page, context: mockContext });

  console.log(
    `[${options.platformName.toUpperCase()}-TEST] Automation flow finished.`
  );
}
