import fs from "fs";

/**
 * Updates an existing .env file with new values while preserving 
 * comments, empty lines, and original formatting.
 * 
 * @param filePath - Path to the .env file
 * @param newValues - Record of key-value pairs to update or add
 */
export function updateEnvFile(filePath: string, newValues: Record<string, string>): void {
  const rawContent = fs.readFileSync(filePath, "utf-8");
  const lines = rawContent.split(/\r?\n/);
  const eol = rawContent.includes("\r\n") ? "\r\n" : "\n";

  const updatedLines: string[] = [];
  const keysToUpdate = { ...newValues };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      updatedLines.push(line);
      continue;
    }

    const firstEq = line.indexOf("=");
    if (firstEq !== -1) {
      const key = line.slice(0, firstEq).trim();
      if (key in keysToUpdate) {
        const prefix = line.slice(0, firstEq + 1);

        // Logic to preserve trailing comments
        const rawValue = line.slice(firstEq + 1);
        let suffix = "";
        let inQuote = false;
        let quoteChar = "";
        
        for (let i = 0; i < rawValue.length; i++) {
          const c = rawValue[i];
          if ((c === '"' || c === "'") && !inQuote) {
            inQuote = true;
            quoteChar = c;
          } else if (c === quoteChar && inQuote) {
            inQuote = false;
          } else if (c === '#' && !inQuote) {
            const spaceMatch = rawValue.slice(0, i).match(/\s+$/);
            const spaces = spaceMatch ? spaceMatch[0] : " ";
            suffix = spaces + rawValue.slice(i);
            break;
          }
        }

        updatedLines.push(`${prefix}${keysToUpdate[key]}${suffix}`);
        delete keysToUpdate[key];
        continue;
      }
    }
    updatedLines.push(line);
  }

  // Add remaining new keys to the end of the file
  if (Object.keys(keysToUpdate).length > 0) {
    // Add a newline if the file doesn't end with one
    if (updatedLines.length > 0 && updatedLines[updatedLines.length - 1].trim() !== "") {
        updatedLines.push("");
    }
    for (const [k, v] of Object.entries(keysToUpdate)) {
      updatedLines.push(`${k}=${v}`);
    }
  }

  const newContent = updatedLines.join(eol);
  fs.writeFileSync(filePath, newContent);
}
