const fs = require("fs").promises;
const path = require("path");

// The script runs from the .github/scripts directory, so we go up two levels
const SCRIPTS_DIR = path.resolve(__dirname, "../../");
const PUBLIC_DIR = path.resolve(__dirname, "../../public");
const REPO_URL = `https://raw.githubusercontent.com/${process.env.GITHUB_REPOSITORY}/main`;

async function parseMetadata(filePath) {
  const content = await fs.readFile(filePath, "utf-8");
  const lines = content.split("\n");
  const metadata = {
    tags: [],
    keywords: [], // Initialize keywords as well
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
    // Ignore directories like .github, public, etc.
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
      tags: [], // This will be populated from the latest version
      versions: [],
    };

    let latestVersionMeta = null;

    for (const version of versionDirs) {
      const versionPath = path.join(scriptPath, version);
      const bundlePath = path.join(versionPath, "bundle.js");

      try {
        await fs.access(bundlePath);
      } catch (e) {
        continue; // Skip if bundle.js doesn't exist
      }

      const metadata = await parseMetadata(bundlePath);

      // The version from metadata is the source of truth
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
        // Use tags from the latest version as the primary display tags
        scriptData.tags = metadata.tags || scriptData.tags;
      }

      scriptData.versions.push({
        version: semverVersion,
        changelog: metadata.changelog || "",
        published_at: new Date().toISOString(),
        download_url: `https://cdn.jsdelivr.net/gh/${process.env.GITHUB_REPOSITORY}@${process.env.GITHUB_REF}/${scriptId}/${version}/bundle.js`,
      });
    }

    // Sort versions descending by semver
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
