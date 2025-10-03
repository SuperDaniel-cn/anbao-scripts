const fs = require('fs').promises;
const { execSync } = require('child_process');
const path = require('path');

async function build() {
  try {
    // 读取 package.json
    const pkgPath = path.join(__dirname, 'package.json');
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
    
    // 读取 schema.json
    const schemaPath = path.join(__dirname, 'schema.json');
    const schema = await fs.readFile(schemaPath, 'utf-8').catch(() => '');
    
    // 构建元数据块
    const banner = `// ==AnbaoScript==
// @id            ${pkg.name}
// @name          ${pkg.displayName || pkg.name}
// @version       ${pkg.version}
// @author        ${pkg.author}
// @description   ${pkg.description || ''}
// @tags          ${(pkg.tags || []).join(', ')}
// @keywords      ${(pkg.keywords || []).join(', ')}
// @engine        playwright
// @launchOptions { "headless": false, "slowMo": 50 }
//
// @schema
${schema.trim().replace(/^/gm, '// ')}
// ==/AnbaoScript==`;
    
    // 确保输出目录存在
    const outputDir = path.join(__dirname, '1.0.0');
    await fs.mkdir(outputDir, { recursive: true });
    
    // 执行 esbuild 构建
    console.log('正在构建脚本...');
    
    // 使用 esbuild 的 JavaScript API 而不是命令行
    const esbuild = require('esbuild');
    
    await esbuild.build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      platform: 'node',
      outfile: path.join(outputDir, 'bundle.js'),
      banner: {
        js: banner
      }
    });
    
    console.log(`构建完成！输出文件: ${outputDir}/bundle.js`);
    
  } catch (error) {
    console.error('构建失败:', error);
    process.exit(1);
  }
}

build();