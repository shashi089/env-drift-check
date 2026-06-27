import fs from "fs";
import prompts from "prompts";

/**
 * Generates an environment template file (.env.example) from an existing .env file.
 * It retains layout, comments, spacing, and key names but clears actual secret values.
 * Prompts user for confirmation if the target output file already exists.
 * 
 * @param sourcePath - Path to the source .env file
 * @param destPath - Path to the destination template file (.env.example)
 */
export async function generateExampleFile(sourcePath: string, destPath: string): Promise<void> {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source .env file not found at: ${sourcePath}`);
  }

  if (fs.existsSync(destPath)) {
    const response = await prompts({
      type: "confirm",
      name: "overwrite",
      message: `The template file '${destPath}' already exists. Overwrite it?`,
      initial: false
    });

    if (!response.overwrite) {
      console.log("Operation cancelled. Existing file was not modified.");
      return;
    }
  }

  const rawContent = fs.readFileSync(sourcePath, "utf-8");
  const lines = rawContent.split(/\r?\n/);
  const eol = rawContent.includes("\r\n") ? "\r\n" : "\n";
  const outputLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      outputLines.push(line);
      continue;
    }
    const firstEq = line.indexOf("=");
    if (firstEq !== -1) {
      const key = line.slice(0, firstEq).trim();
      outputLines.push(`${key}=`);
    } else {
      outputLines.push(line);
    }
  }

  fs.writeFileSync(destPath, outputLines.join(eol));
  console.log(`✅ Generated template file: ${destPath}`);
}
