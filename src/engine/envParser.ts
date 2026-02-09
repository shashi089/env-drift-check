import fs from "fs";

/**
 * Parses a .env file from the given file system path.
 * It handles comments, empty lines, and quoted values.
 * 
 * @param path - The absolute or relative path to the .env file
 * @returns A record containing key-value pairs of the environment variables
 * @throws {Error} If the file does not exist
 */
export function parseEnv(path: string): Record<string, string> {
  if (!fs.existsSync(path)) {
    throw new Error(`Env file not found: ${path}`);
  }

  const content = fs.readFileSync(path, 'utf8');
  const result: Record<string, string> = {};

  // Split into lines and process each
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Match KEY=VALUE (taking the first '=' as the separator)
    const firstEqual = trimmed.indexOf('=');
    if (firstEqual === -1) continue;

    const key = trimmed.slice(0, firstEqual).trim();
    const rawValue = trimmed.slice(firstEqual + 1).trim();
    let value = "";

    if (rawValue.startsWith('"') || rawValue.startsWith("'")) {
      const quote = rawValue[0];
      const closingQuoteIndex = rawValue.indexOf(quote, 1);
      if (closingQuoteIndex !== -1) {
        value = rawValue.slice(1, closingQuoteIndex);
      } else {
        value = rawValue.slice(1); // Unclosed quote
      }
    } else {
      const hashIndex = rawValue.indexOf('#');
      if (hashIndex !== -1) {
        value = rawValue.slice(0, hashIndex).trim();
      } else {
        value = rawValue;
      }
    }

    result[key] = value;
  }

  return result;
}
