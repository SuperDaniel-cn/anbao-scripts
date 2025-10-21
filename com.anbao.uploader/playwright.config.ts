import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  // 我们将不在全局配置中定义 use，因为我们需要在测试文件中
  // 手动启动一个持久化上下文来使用 profile。
  use: {},
});
