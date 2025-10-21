const fs = require("fs").promises;
const path = require("path");
const esbuild = require("esbuild");

async function build() {
  try {
    // 1. 读取并更新 package.json
    const pkgPath = path.join(__dirname, "package.json");
    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));

    let [major, minor, patch] = pkg.version.split(".").map(Number);
    patch++;
    if (patch > 99) {
      patch = 0;
      minor++;
    }
    if (minor > 99) {
      minor = 0;
      major++;
    }
    if (major > 99) {
      console.warn("主版本号已达到最大值 99");
      major = 99;
    }
    const newVersion = `${major}.${minor}.${patch}`;
    pkg.version = newVersion;

    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
    console.log(`版本号已更新为: ${newVersion}`);

    // 2. 读取 schema.json
    const schemaPath = path.join(__dirname, "schema.json");
    const schema = await fs.readFile(schemaPath, "utf-8").catch(() => "");

    // 3. 构建元数据块
    const banner = `// ==AnbaoScript==
// @id            ${pkg.name}
// @name          ${pkg.displayName || pkg.name}
// @version       ${pkg.version}
// @author        ${pkg.author}
// @description   ${pkg.description || ""}
// @tags          ${(pkg.tags || []).join(", ")}
// @keywords      ${(pkg.keywords || []).join(", ")}
// @engine        patchright
// @launchOptions { "channel": "chrome", "headless": false, "slowMo": 350 }
// @schema
${schema.trim().replace(/^/gm, "// ")}
// ==/AnbaoScript==`;

    // 4. 确保版本号目录存在
    const outputDir = path.join(__dirname, newVersion);
    await fs.mkdir(outputDir, { recursive: true });

    // 5. 执行 esbuild 构建
    console.log("正在构建脚本...");
    await esbuild.build({
      entryPoints: ["src/index.ts"],
      bundle: true,
      platform: "node",
      format: "esm",
      outfile: path.join(outputDir, "bundle.js"),
      charset: "utf8", // 修复：确保输出文件为 UTF-8 编码
      banner: {
        js: banner,
      },
    });

    // 6. 复制 README.md 到版本目录
    const readmePath = path.join(__dirname, "README.md");
    const readmeOutputPath = path.join(outputDir, "README.md");
    
    try {
      await fs.copyFile(readmePath, readmeOutputPath);
      console.log(`README.md 已复制到: ${readmeOutputPath}`);
    } catch (error) {
      console.warn("警告: 无法复制 README.md 文件:", error.message);
    }

    console.log(`构建完成！输出文件: ${path.join(outputDir, "bundle.js")}`);
  } catch (error) {
    console.error("构建失败:", error);
    process.exit(1);
  }
}

build();
