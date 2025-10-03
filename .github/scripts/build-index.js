const fs = require("fs").promises;
const path = require("path");

const SCRIPTS_DIR = path.resolve(__dirname, "../../");
const PUBLIC_DIR = path.resolve(__dirname, "../../public");
// 从 GitHub Actions 环境变量中获取仓库所有者和名称
const REPO_URL = `https://raw.githubusercontent.com/${process.env.GITHUB_REPOSITORY}/main`;

async function parseMetadata(filePath) {
  const content = await fs.readFile(filePath, "utf-8");
  const lines = content.split("\n");
  const metadata = {
    tags: [],
  };
  let inBlock = false;

  for (const line of lines) {
    if (line.trim() === "// ==UserScript==") {
      inBlock = true;
      continue;
    }
    if (line.trim() === "// ==/UserScript==") {
      break;
    }
    if (inBlock) {
      const match = line.match(/\/\/\s+@(\S+)\s+(.*)/);
      if (match) {
        const [, key, value] = match;
        const trimmedValue = value.trim();
        if (key === "tags") {
          metadata.tags.push(...trimmedValue.split(",").map((t) => t.trim()));
        } else {
          metadata[key] = trimmedValue;
        }
      }
    }
  }
  return metadata;
}

async function main() {
  const scriptDirs = await fs.readdir(SCRIPTS_DIR);
  const marketIndex = [];

  for (const scriptId of scriptDirs) {
    const scriptPath = path.join(SCRIPTS_DIR, scriptId);
    const stat = await fs.stat(scriptPath);

    if (!stat.isDirectory() || scriptId.startsWith(".")) {
      continue;
    }

    const versionDirs = await fs.readdir(scriptPath);
    const scriptData = {
      id: scriptId,
      name: "",
      description: "",
      author: "",
      tags: [],
      versions: [],
    };

    let latestVersionMeta = null;

    for (const version of versionDirs) {
      const versionPath = path.join(scriptPath, version);
      const bundlePath = path.join(versionPath, "bundle.js");

      try {
        await fs.access(bundlePath);
      } catch (e) {
        continue;
      }

      const metadata = await parseMetadata(bundlePath);

      if (
        !latestVersionMeta ||
        version.localeCompare(latestVersionMeta.version, undefined, {
          numeric: true,
        }) > 0
      ) {
        latestVersionMeta = metadata;
        scriptData.name = metadata.name || scriptData.name;
        scriptData.description = metadata.description || scriptData.description;
        scriptData.author = metadata.author || scriptData.author;
        scriptData.tags = metadata.tags || scriptData.tags;
      }

      scriptData.versions.push({
        version: metadata.version,
        changelog: metadata.changelog || "",
        published_at: new Date().toISOString(),
        download_url: `${REPO_URL}/${scriptId}/${version}/bundle.js`,
      });
    }

    scriptData.versions.sort((a, b) =>
      b.version.localeCompare(a.version, undefined, { numeric: true })
    );

    if (scriptData.versions.length > 0) {
      marketIndex.push(scriptData);
    }
  }

  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  await fs.writeFile(
    path.join(PUBLIC_DIR, "index.json"),
    JSON.stringify(marketIndex, null, 2)
  );

  console.log("Market index generated successfully at public/index.json");
}

main().catch((error) => {
  console.error("Failed to build market index:", error);
  process.exit(1);
});
