# Anbao Agent 脚本开发指南 (v6.0 - 市场版)

本指南将指导您如何为 Anbao Agent 平台开发、打包和部署自动化脚本。这是我们平台脚本开发的**最终标准**。

## 1. 核心理念: 优雅的单文件 FaaS

Anbao Agent 的脚本系统是一个“函数即服务”(FaaS)平台。其核心设计哲学是**优雅**与**内聚**：

1.  **单文件即一切**: 您的所有逻辑、能力声明和输入定义，都内聚在一个**单一的 `bundle.js` 文件**中。这是一个可独立分发和理解的、自包含的自动化单元。
2.  **脚本声明其领地**: 您的脚本通过文件头部的 `// @keywords` 注释，来明确声明它兼容哪些平台。平台将据此智能匹配可用的**凭证 (Profiles)**，为您提供“防呆”保护。
3.  **开发者聚焦业务**: 您无需关心浏览器启动、账号管理、任务调度等任何平台级事务。您只需聚焦于编写能在给定 `page` 对象上运行的业务逻辑。

---

## 2. 元数据块: 脚本的“身份证”

您的 `bundle.js` 文件**必须**在文件顶部包含一个元数据块。这是平台识别您脚本能力和意图的唯一方式。

### 2.1 格式

```javascript
// ==AnbaoScript==
// @id          com.bilibili.video-uploader
// @name        Bilibili 视频发布助手
// @version     1.0.1
// @author      Anbao Team
// @description 自动将本地视频发布到 Bilibili。
// @changelog   初始版本，支持基本上传功能。
// @tags        bilibili, video, uploader, automation
// @keywords    bilibili
// @engine      patchright
// @launchOptions { "headless": false, "slowMo": 50 }
//
// @schema
// {
//   "title": "视频发布脚本参数",
//   "type": "object",
//   "properties": {
//     "video_title": {
//       "type": "string",
//       "title": "1. 视频标题"
//     },
//     "video_file_path": {
//       "type": "string",
//       "format": "file",
//       "title": "2. 本地视频文件"
//     }
// }
// ==/AnbaoScript==

// ... (esbuild 打包后的代码) ...
```

### 2.2 支持的标签

- `@id` (必需): 脚本的全局唯一标识符。这是聚合所有版本的**唯一依据**。
  - **格式**: 强烈推荐使用**反向域名 (reverse-domain name)** 格式，例如 `com.author.script-name`，以从根本上避免冲突。
  - **不变性**: 一旦设定，一个逻辑脚本的 `@id` **永远不应改变**。
- `@name` (必需): 脚本的名称。
- `@version` (必需): 脚本的版本号, 遵循 [SemVer](https://semver.org/)。
- `@description` (可选): 脚本的简短描述。
- `@author` (必需): 脚本的作者或团队名称。
- `@changelog` (可选): 描述此版本变更的日志。将显示在市场的版本历史中。
- `@tags` (可选): **用于市场展示和搜索**的标签。这是一个**逗号分隔**的列表，用于用户发现脚本。
- `@keywords` (必需): **用于平台内部凭证匹配**的功能性关键词。这是一个**逗号分隔**的列表，用于在创建调度任务时，智能过滤出兼容的凭证，防止误操作。
  - **核心思想**: 关键词用于简单的**包含**匹配。例如，关键词 `douyin` 会匹配 `base_url` 为 `https://www.douyin.com` 的平台。
  - **特殊通配符**: 你可以使用 `*` 作为通配符，表示该脚本与**所有**平台兼容。
  - **最佳实践**: 使用平台域名中最核心、最不易变的部分作为关键词，例如 `douyin`, `bilibili`, `zhihu`。
  - **示例**:
    - `// @keywords    douyin, bilibili`
    - `// @keywords    *`
- `@engine` (可选): 选择用于执行脚本的浏览器自动化引擎。这对于需要增强反检测能力的场景非常有用。
  - **可选值**:
    - `playwright`: (默认值) 使用标准的 Playwright 引擎。
    - `patchright`: 使用 `patchright` 引擎，它是一个带有反检测补丁的 Playwright 分支。
  - **示例**: `// @engine patchright`
- `@launchOptions` (可选): 定义浏览器启动时使用的 [Playwright LaunchOptions](https://playwright.dev/docs/api/class-browsertype#browser-type-launch-persistent-context)。值必须是一个**单行的、合法的 JSON 对象**。这允许开发者精细控制浏览器行为。
  - **核心功能**:
    - **调试**: 通过设置 `"headless": false`，可以在“有头”模式下运行脚本，便于观察和调试。
    - **切换浏览器**: 通过设置 `"channel": "chrome"`，可以指示平台使用**系统上安装的 Google Chrome 浏览器**来运行此脚本，而不是使用内置的、独立的 Chromium。这对于需要特定 Chrome 功能或扩展的场景非常有用。
  - **优先级**: 当 `@launchOptions` 中包含 `"channel": "chrome"` 时，平台将**优先**使用系统 Chrome。如果未指定 `channel`，则默认使用内置的、独立的 `Chromium` 浏览器。
  - **示例**:
    - 调试模式: `// @launchOptions { "headless": false, "slowMo": 100 }`
    - 使用系统 Chrome: `// @launchOptions { "channel": "chrome" }`
- `@schema` (可选): 标记一个多行块的开始，其内容为一个 **JSON 对象**，用于定义脚本的输入参数。平台将根据它为用户动态生成输入表单。请注意，`@schema` 标签和 JSON 的 `{` 之间需要换行。

---

### 2.3 `@keywords` vs `@tags` (重要区别)

-   `@keywords` (功能性): **给机器读的**。它的唯一用途是在创建调度任务时，将脚本与具有匹配 `base_url` 的平台凭证进行关联。例如，`// @keywords bilibili` 会匹配所有 `base_url` 包含 `bilibili` 的平台。
-   `@tags` (展示性): **给人读的**。它的唯一用途是在脚本市场中作为可点击的标签，方便用户进行分类浏览和搜索。

## 3. Anbao Schema: 定义你的脚本输入

我们通过扩展 JSON Schema 的 `format` 字段，来为您的脚本提供丰富的 UI 输入能力。

### 3.1 控制表单顺序

默认情况下, 表单项会根据其字段名 (key) 的**字母顺序**进行渲染。

为了获得可控的、自定义的渲染顺序, 您可以在每个字段的 `title` 属性前加上 `数字.` 前缀。UI 将会解析这个数字并按升序对表单项进行排序。

- **带排序前缀**: `"title": "1. 目标URL"`
- **无排序前缀**: `"title": "视频描述"`

带有前缀的字段会排在没有前缀的字段前面。

### 3.2 UI 渲染规则

| 开发者意图        | `schema` 定义 (`type` 和 `format`)            | Anbao UI 渲染行为                                        | 传递给脚本的值 (`context.common`)         |
| :---------------- | :-------------------------------------------- | :------------------------------------------------------- | :---------------------------------------- |
| **短文本** (默认) | `{"type": "string"}`                          | 渲染一个标准的单行输入框。                               | `string`                                  |
| **长文本**        | `{"type": "string", "format": "textarea"}`    | 渲染一个多行文本域。                                     | `string`                                  |
| **密码/密钥**     | `{"type": "string", "format": "password"}`    | 渲染一个密码输入框。                                     | `string`                                  |
| **数值**          | `{"type": "number"}` 或 `{"type": "integer"}` | 渲染一个数字输入框。                                     | `number`                                  |
| **布尔值**        | `{"type": "boolean"}`                         | 渲染一个开关或复选框。                                   | `boolean`                                 |
| **文件选择**      | `{"type": "string", "format": "file"}`        | 渲染一个“选择文件”按钮，打开系统**文件**选择对话框。     | `string` (用户选择的文件的**绝对路径**)   |
| **目录选择**      | `{"type": "string", "format": "directory"}`   | 渲染一个“选择文件夹”按钮，打开系统**文件夹**选择对话框。 | `string` (用户选择的文件夹的**绝对路径**) |

### 3.3 创建平台专属字段

您可以为 `schema` 中的某个字段添加一个 `keyword` 属性（一个字符串数组），来将其限制为只在特定平台下显示。

- **核心逻辑**:
  1.  当用户在 UI 上选择了一个或多个“凭证”后，系统会获取这些凭证关联的平台的 `base_url`。
  2.  系统会检查某个字段的 `keyword` 数组中的**任何一个**关键字，是否被**任何一个**已选平台的 `base_url` 所**包含**。
  3.  如果匹配成功，该字段就会在表单中显示。
- **通用字段**: 如果一个字段**没有** `keyword` 属性，它将被视为**通用字段**，在任何情况下都会显示。
- **UI 提示**: 对于专属字段，其标题旁边会自动附加 `[keyword1, keyword2]` 标识，以方便用户识别。

- **示例**:

  ```json
  // @keywords    bilibili, douyin
  // @schema
  // {
  //   "title": "跨平台发布脚本",
  //   "type": "object",
  //   "properties": {
  //     "common_description": {
  //       "type": "string",
  //       "title": "1. 通用视频描述"
  //     },
  //     "bili_danmaku_enabled": {
  //       "type": "boolean",
  //       "title": "2. 开启弹幕",
  //       "keyword": ["bilibili"]
  //     },
  //     "douyin_challenge_name": {
  //       "type": "string",
  //       "title": "3. 参与挑战",
  //       "keyword": ["douyin"]
  //     }
  //   }
  // }
  ```

  - **行为分析**:
    - `common_description` 字段始终显示。
    - 当用户选择的凭证关联到 `base_url` 包含 `bilibili` 的平台时，`bili_danmaku_enabled` 字段会显示，其标题为 `2. 开启弹幕 [bilibili]`。
    - 当用户选择的凭证关联到 `base_url` 包含 `douyin` 的平台时，`douyin_challenge_name` 字段会显示，其标题为 `3. 参与挑战 [douyin]`。

---

## 4. 开发契约: 平台与脚本的交互规范

### 4.1 执行入口: `run`

您的 `bundle.js` **必须**导出一个名为 `run` 的 `async` 函数。

### 4.2 输入: `RunOptions`

`run` 函数接收一个参数对象，包含 `browser`, `page`, 和 `context`。

### 4.3 核心上下文: `AnbaoContext`

这是您获取平台能力的核心。

```typescript
export interface AnbaoContext {
  /**
   * 通用输入：由用户通过 `@schema` 生成的表单动态填写的参数。
   * @example
   * const title = context.common.video_title;
   * const filePath = context.common.video_file_path; // "C:\\Users\\Me\\Videos\\my_video.mp4"
   */
  common: Record<string, any>;

  /**
   * 当前运行实例匹配到的平台信息。
   */
  platform: { name: string; base_url: string };

  /**
   * 当前运行实例所使用的 Profile 信息。
   * 核心价值：这个 Profile 已由用户提前配置好登录状态 (Cookies)。
   */
  profile: { name: string };

  /**
   * 路径 API
   */
  paths: {
    downloads: string; // 用户系统的“下载”目录
    data: string; // 与 Profile 绑定的、可持久化读写的目录
  };

  /**
   * 结构化日志 API。
   * 用于在任务日志中创建具有明确步骤和状态的日志条目。
   * 这对于向用户展示清晰、可跟进的任务进度至关重要。
   *
   * @example
   * context.log('开始上传视频...', 'info');
   * // ... a long running operation ...
   * context.log('视频上传成功', 'success');
   */
  log: (message: string, level?: 'info' | 'warn' | 'error' | 'success') => void;

  /**
   * 发送一个系统级通知。
   * 这将在 Anbao Agent 的通知中心创建一个新的通知，并（如果用户允许）显示一个原生系统通知。
   *
   * @example
   * context.notify({
   *   title: '下载完成',
   *   content: '文件 "report.pdf" 已成功下载到您的下载目录。'
   * });
   *
   * // 发送一个与任务结果相关的通知
   * context.notify({
   *   title: '任务成功',
   *   content: 'Bilibili 视频发布任务已成功完成。',
   *   category: 'TaskResult'
   * });
   */
  notify: (payload: { title: string; content: string; category?: 'ScriptMessage' | 'TaskResult' }) => void;

  /**
   * 强制退出 API。
   * 当脚本遇到可预期的、业务逻辑上的失败时，应调用此函数来优雅地终止任务。
   * 它会向平台报告一个明确的错误信息，而不是抛出一个通用的、未处理的异常。
   *
   * @example
   * if (!videoUploaded) {
   *   context.forceExit('视频上传失败，请检查网络连接。');
   * }
   */
  forceExit: (errorMessage?: string) => void;

  /**
   * 请求人工介入 (Human-in-the-Loop)。
   * 当脚本遇到无法自动处理的情况（如验证码）时，调用此函数。
   * 它会暂停脚本，发送高优先级通知给用户，并在页面注入一个“继续”按钮。
   * 用户手动处理完毕后，点击按钮，脚本将从暂停处继续执行。
   *
   * @param options 介入请求的配置
   * @returns {Promise<void>} 一个在用户点击“继续”或超时后完成的 Promise。
   *
   * @example
   * try {
   *   if (await page.locator('#captcha').isVisible()) {
   *     throw new AutomationError('Captcha', '检测到验证码，请手动处理。');
   *   }
   * } catch (error) {
   *   if (error instanceof AutomationError) {
   *     await context.requestHumanIntervention({ message: error.message });
   *   } else {
   *     throw error;
   *   }
   * }
   * // 代码将从这里继续
   */
  requestHumanIntervention: (options: { message: string; timeout?: number; theme?: 'light' | 'dark' }) => Promise<void>;
}
```

### 4.4 输出: 成功与失败

脚本的执行有三种终止方式：

- **成功**: `run` 函数正常结束并 `return` 一个 JSON 可序列化的对象。这是任务成功的唯一标志。
- **优雅失败**: 在函数中调用 `context.forceExit("错误信息")`。这将立即终止脚本，并将任务状态标记为失败，同时记录您提供的错误信息。
- **异常失败**: `run` 函数中 `throw` 一个 `Error` 对象。平台会捕获这个异常，将任务标记为失败，并记录异常的堆栈信息。

---

## 5. 日志与调试

### 5.1 全局 `console` 捕获

为了最大程度地简化调试，Anbao Agent 平台会自动捕获在脚本执行期间发生的所有标准 `console` 输出。

- `console.log()`
- `console.info()`
- `console.warn()`
- `console.error()`

所有这些调用都会被自动重定向到任务的日志流中，并以相应的级别显示。您不再需要为了查看调试信息而使用 `context.log`。

### 5.2 结构化日志: `context.log`

`console.log` 用于**开发者调试**，而 `context.log` 用于**向用户报告进度**。

当您需要创建一个具有明确业务含义、需要在 UI 中清晰展示给用户的日志条目时，请使用 `context.log`。它接受一个可选的 `level` 参数，可以用来控制日志在 UI 中的视觉表现 (例如，`success` 可能会显示为绿色)。

```typescript
// 示例: 一个发布流程
export async function run({ page, context }: RunOptions) {
  context.log('任务开始', 'info');

  console.log('正在定位标题输入框...'); // 这条是给开发者看的调试信息
  const titleInput = await page.waitForSelector('#title-input');

  context.log('填写视频标题', 'info');
  await titleInput.type(context.common.video_title);

  // ... more operations ...

  context.log('发布成功！', 'success');
  return { success: true, message: '视频已发布' };
}
```

---

## 6. 标准开发流程

我们推荐使用 `package.json` 作为元数据的“单一事实来源”，并配合构建脚本来自动生成文件头。

### 6.1 步骤一: 环境设置

```bash
mkdir my-script && cd my-script
pnpm init
pnpm add -D typescript @types/node esbuild playwright
pnpm tsc --init
```

### 6.2 步骤二: 编写脚本 (`src/index.ts`)

```typescript
import { BrowserContext, Page } from 'playwright';
// ... AnbaoContext 类型定义 ...

export interface RunOptions {
  browser: BrowserContext;
  page: Page;
  context: AnbaoContext;
}

export async function run({ browser, page, context }: RunOptions) {
  // ... 业务逻辑 ...
}
```

### 6.3 步骤三: 定义元数据 (`package.json`)

在 `package.json` 中定义所有脚本元数据。这是推荐的最佳实践。

```json
{
  "name": "com.bilibili.video-uploader",
  "displayName": "Bilibili 视频发布助手",
  "version": "1.0.1",
  "author": "Anbao Team",
  "description": "自动将本地视频发布到 Bilibili 平台。",
  "tags": ["bilibili", "video", "uploader", "automation"],
  "keywords": ["bilibili"]
}
```

### 6.4 步骤四: 创建构建脚本 (`build.js`)

创建一个 `build.js` 文件，它将读取 `package.json` 和 `schema.json` (如果存在) 来动态生成元数据块。

```javascript
const fs = require('fs').promises;
const { execSync } = require('child_process');

async function build() {
  const pkg = JSON.parse(await fs.readFile('package.json', 'utf-8'));
  const schema = await fs.readFile('schema.json', 'utf-8').catch(() => '');

  const banner = `// ==AnbaoScript==
// @id            ${pkg.name}
// @name          ${pkg.displayName || pkg.name}
// @version       ${pkg.version}
// @author        ${pkg.author}
// @description   ${pkg.description || ''}
// @tags          ${(pkg.tags || []).join(', ')}
// @keywords      ${(pkg.keywords || []).join(', ')}
// @engine        playwright
// @schema
${schema.trim().replace(/^/gm, '// ')}
// ==/AnbaoScript==`;

  execSync(
    `esbuild src/index.ts --bundle --platform=node --outfile=dist/bundle.js --banner:js="${banner.replace(/\n/g, '\\n')}"`,
    { stdio: 'inherit' }
  );
}

build().catch(console.error);
```

### 6.5 步骤五: 配置并运行构建

在 `package.json` 中添加 `build` 脚本:

```json
"scripts": {
  "build": "node build.js"
}
```

然后运行 `pnpm build`。

### 6.6 步骤六: 交付

将最终生成的 `dist/bundle.js` 文件交付给 Anbao Agent 平台或上传到脚本市场仓库。

---

## 7. 平台执行流程

```mermaid
graph TD
    subgraph "开发者"
        A[编写 TS 脚本和 schema.json] --> B[运行 pnpm build];
        B --> C[生成单一的 bundle.js<br>(内联了所有元数据)];
    end

    subgraph "用户 @ Anbao Agent UI"
        D[1. 上传/选择脚本] --> E{2. 前端解析<br>@schema};
        E --> F[3. 渲染动态表单];
        F --> G[4. 用户填写表单<br>并选择凭证];
        G --> H[5. 点击“运行”];
    end

    subgraph "后端 @ Bevy ECS"
        I[BrowserGuardian]
        H --> I;
        I --> J[为每个任务<br>构建 Context];
        J --> K[启动 Sidecar<br>注入 Context];
    end
```
