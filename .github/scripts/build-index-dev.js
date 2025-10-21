const fs = require("fs").promises;
const path = require("path");

// The script runs from the .github/scripts directory, so we go up two levels
const SCRIPTS_DIR = path.resolve(__dirname, "../../");
const PUBLIC_DEV_DIR = path.resolve(__dirname, "../../public/dev"); // Deploy to a /dev subdirectory
const REPO_URL = `https://raw.githubusercontent.com/${process.env.GITHUB_REPOSITORY}/develop`; // Use 'develop' branch for URLs

async function parseMetadata(filePath) {
  const content = await fs.readFile(filePath, "utf-8");
  const lines = content.split("\n");
  const metadata = {
    tags: [],
    keywords: [],
  };
  let inBlock = false;

  for (const line of lines) {
    if (line.trim() === "// ==AnbaoScript==") {
      inBlock = true;
      continue;
    }
    if (line.trim() === "// ==/AnbaoScript==") {
      break;
    }
    if (inBlock) {
      const match = line.match(/\/\/\s+@(\S+)\s+(.*)/);
      if (match) {
        const [, key, value] = match;
        const trimmedValue = value.trim();
        switch (key) {
          case "tags":
            metadata.tags.push(...trimmedValue.split(",").map((t) => t.trim()));
            break;
          case "changelog":
            metadata.changelog = trimmedValue;
            break;
          case "keywords":
            metadata.keywords.push(
              ...trimmedValue.split(",").map((k) => k.trim())
            );
            break;
          default:
            metadata[key] = trimmedValue;
            break;
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
    if (
      scriptId.startsWith(".") ||
      scriptId === "public" ||
      scriptId === "node_modules"
    ) {
      continue;
    }

    const scriptPath = path.join(SCRIPTS_DIR, scriptId);
    const stat = await fs.stat(scriptPath);

    if (!stat.isDirectory()) {
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
      const semverVersion = metadata.version;
      if (!semverVersion) continue;

      if (
        !latestVersionMeta ||
        semverVersion.localeCompare(latestVersionMeta.version, undefined, {
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
        version: semverVersion,
        changelog: metadata.changelog || "",
        published_at: new Date().toISOString(),
        // **MODIFIED**: Use the 'develop' branch for download URLs
        download_url: `https://cdn.jsdelivr.net/gh/${process.env.GITHUB_REPOSITORY}@develop/${scriptId}/${version}/bundle.js`,
      });
    }

    scriptData.versions.sort((a, b) =>
      b.version.localeCompare(a.version, undefined, { numeric: true })
    );

    if (scriptData.versions.length > 0) {
      marketIndex.push(scriptData);
    }
  }

  await fs.mkdir(PUBLIC_DEV_DIR, { recursive: true });
  await fs.writeFile(
    path.join(PUBLIC_DEV_DIR, "index.json"), // **MODIFIED**: Output to public/dev/index.json
    JSON.stringify(marketIndex, null, 2)
  );

  console.log("Dev market index generated successfully at public/dev/index.json");
}

main().catch((error) => {
  console.error("Failed to build dev market index:", error);
  process.exit(1);
});