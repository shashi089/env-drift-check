import fs from "fs";
import path from "path";

export interface CodebaseScanResult {
  usedKeys: string[];
  filesScanned: number;
}

/**
 * Scans JavaScript and TypeScript source files in the current workspace
 * to find environment variables referenced as process.env.KEY or process.env['KEY'].
 * 
 * @param baseDir - Directory to scan (e.g., process.cwd())
 * @returns Scan result containing array of unique environment keys found
 */
export function scanCodebase(baseDir: string): CodebaseScanResult {
  const foundKeys = new Set<string>();
  let filesScanned = 0;

  const EXCLUDED_DIRS = new Set(["node_modules", "dist", "build", "coverage", ".git", ".gemini", "assets", "docs"]);
  const TARGET_EXTENSIONS = new Set([".js", ".ts", ".jsx", ".tsx", ".mjs", ".cjs"]);

  const regex = /\bprocess\.env\.([A-Z_][A-Z0-9_]*)\b|\bprocess\.env\[['"`]([A-Z_][A-Z0-9_]*)['"`]\]/g;

  function walk(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      let stat: fs.Stats;
      try {
        stat = fs.statSync(fullPath);
      } catch {
        continue; // Handle broken symlinks or permissions
      }

      if (stat.isDirectory()) {
        if (EXCLUDED_DIRS.has(file)) continue;
        walk(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(file);
        if (TARGET_EXTENSIONS.has(ext)) {
          filesScanned++;
          const content = fs.readFileSync(fullPath, "utf-8");
          let match;
          // Reset regex index before scanning each file
          regex.lastIndex = 0;
          while ((match = regex.exec(content)) !== null) {
            // match[1] corresponds to process.env.KEY
            // match[2] corresponds to process.env['KEY']
            const key = match[1] || match[2];
            if (key) {
              foundKeys.add(key);
            }
          }
        }
      }
    }
  }

  walk(baseDir);

  return {
    usedKeys: Array.from(foundKeys).sort(),
    filesScanned
  };
}
