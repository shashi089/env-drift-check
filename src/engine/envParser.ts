import fs from "fs";
import dotenv from "dotenv";

export function parseEnv(path: string): Record<string, string> {
  if (!fs.existsSync(path)) {
    throw new Error(`Env file not found: ${path}`);
  }
  const content = fs.readFileSync(path);
  return dotenv.parse(content);
}
