# Anbao Uploader 架构文档

本文档旨在阐述 `com.anbao.uploader` 项目的软件架构，以确保其可维护性、可扩展性和健壮性。

## 1. 核心设计思想

本架构的核心是**关注点分离 (Separation of Concerns)** 和 **开闭原则 (Open/Closed Principle)**。

- **平台无关的核心调度器**: [`src/index.ts`](src/index.ts:42) 作为任务的唯一入口，它负责编排上传的生命周期（鉴权 -> 上传 -> 业务动作 -> 提交），但它**不包含任何特定平台的业务逻辑**。
- **可插拔的平台模块**: 每个支持的上传平台（如Bilibili）都被封装成一个独立的、可插拔的模块。新增或修改一个平台，不会影响到核心调度器或其他平台。

## 2. 架构分层

整个系统分为以下几个关键层次：

### 2.1. 主调度器 (Dispatcher)

- **文件**: [`src/index.ts`](src/index.ts:42)
- **职责**:
  1.  根据 `context.platform.base_url` 从平台注册中心动态查找并加载对应的平台模块。
  2.  按顺序执行上传的核心生命周期：`isLoggedIn`, `uploadVideo`, `submit`。
  3.  在 `uploadVideo` 和 `submit` 之间，动态执行一系列业务动作（如填写标题、更换封面等）。它会优先使用平台模块定义的 `actionOrder` 顺序，以保证UI操作的稳定性。

### 2.2. 平台注册中心 (Registry)

- **文件**: [`src/platforms/index.ts`](src/platforms/index.ts)
- **职责**:
  1.  作为所有平台模块的“桶”文件。
  2.  导入所有具体的平台模块（如 `bilibili.ts`），并将它们汇集到一个 `platforms` 数组中导出。
  3.  这是**唯一一个**在添加新平台时需要修改的文件。

### 2.3. 平台模块 (Platform Module)

- **文件**: [`src/platforms/bilibili.ts`](src/platforms/bilibili.ts) (示例)
- **职责**: 实现特定平台的所有业务逻辑。每个模块都必须导出一个符合 [`Platform`](src/types.ts:183) 接口的对象。
- **[`Platform`](src/types.ts:183) 接口包含**:
  - `key: string`: 平台的唯一标识符 (e.g., `'bilibili'`)。**重要**: 此 `key` 的选择应遵循 `docs/SCRIPT_DEVELOPMENT_GUIDE.md` 中定义的 `@keywords` 匹配规则，即使用平台 `base_url` 中最核心、最不易变的部分 (如 `bilibili`, `weixin`), 而非严格与文件名保持一致。
  - `uploader: Uploader`: 核心生命周期方法的实现集合。
  - `actions: PlatformActionMap`: 具体业务动作（如填写标题）的实现集合。
- **[`Uploader`](src/types.ts:72) 接口包含**:
  - `isLoggedIn`, `uploadVideo`, `submit`: 核心生命周期函数。
  - `actionOrder?: string[]`: **(关键)** 一个可选的字符串数组，用于定义该平台业务动作的**正确执行顺序**，以避免UI交互冲突。

### 2.4. 工具函数层 (Utils)

- **目录**: [`src/utils/`](src/utils/)
- **文件**: [`src/utils/handleTagInput.ts`](src/utils/handleTagInput.ts) (示例)
- **职责**:
  1.  封装可复用的、与平台无关或特定于平台的复杂UI交互逻辑。
  2.  使平台模块的动作处理器（`actions`）保持“轻量”，只负责创建定位器 (`Locator`) 并调用工具函数，而不是堆砌实现细节。
  3.  **示例**: `handleBilibiliTagInput` 封装了点击、清空、输入、回车等一系列操作，平台模块只需两行代码即可调用。

## 3. 执行流程

```
1. run() in index.ts
       |
       v
2. getPlatform(baseUrl) from platforms/index.ts
       |
       v
3. Found 'bilibili' module
       |
       v
4. Execute uploader.isLoggedIn()
       |
       v
5. Execute uploader.uploadVideo()
       |
       v
6. Loop through uploader.actionOrder:
   ['cover_image_path', 'title', 'tags', ...]
       |
       +--> 6a. Execute actions['tags'](page, value)
                 |
                 v
           6b. In bilibili.ts, create Locator with getByRole()
                 |
                 v
           6c. Call handleBilibiliTagInput(page, value, locator) in utils/
       |
       v
7. Execute uploader.submit()
```

## 4. 如何添加一个新平台 (例如：抖音)

1.  在 `src/platforms/` 目录下创建新文件 `douyin.ts`。
2.  在 `douyin.ts` 中，实现 `Uploader` 和 `PlatformActionMap` 接口，并定义 `actionOrder` (如果需要)。
3.  在文件末尾，导出一个统一的 `platform` 对象：
    ```typescript
    const douyinPlatform: Platform = {
      key: "douyin",
      uploader: douyinUploader,
      actions: douyinActions,
    };
    export default douyinPlatform;
    ```
4.  打开 [`src/platforms/index.ts`](src/platforms/index.ts)。
5.  导入并注册新的平台模块：

    ```typescript
    import bilibiliPlatform from "./bilibili.js";
    import douyinPlatform from "./douyin.js"; // <-- 导入

    const platforms: Platform[] = [
      bilibiliPlatform,
      douyinPlatform, // <-- 注册
    ];

    export default platforms;
    ```

6.  **完成**。核心调度逻辑无需任何改动。
