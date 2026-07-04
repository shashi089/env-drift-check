import fs from "fs";
import path from "path";

import { Config } from "../types";

const DEFAULT_CONFIG: Config = {
  baseEnv: ".env.example",
  rules: {}
};

/**
 * Loads project configuration from envwise.config.json or envwise.config.js.
 * JSON takes priority. Falls back to defaults if neither file exists.
 *
 * @returns The consolidated configuration object
 */
export function loadConfig(): Config {
  const jsonPath = path.resolve("envwise.config.json");
  const jsPath   = path.resolve("envwise.config.js");

  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, "utf-8");
    let userConfig: Partial<Config>;
    try {
      userConfig = JSON.parse(raw);
    } catch {
      console.error("❌ envwise.config.json is not valid JSON. Please fix it and try again.");
      process.exit(1);
    }
    return { ...DEFAULT_CONFIG, ...userConfig };
  }

  if (fs.existsSync(jsPath)) {
    let userConfig: Partial<Config>;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      userConfig = require(jsPath) as Partial<Config>;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ envwise.config.js could not be loaded: ${msg}`);
      process.exit(1);
    }
    return { ...DEFAULT_CONFIG, ...userConfig };
  }

  return DEFAULT_CONFIG;
}
