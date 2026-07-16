import fs from "fs";
import path from "path";

import { Config } from "../types";

const DEFAULT_CONFIG: Config = {
  baseEnv: ".env.example",
  rules: {}
};

function parseJsonConfig(filePath: string): Config {
  const raw = fs.readFileSync(filePath, "utf-8");
  try {
    return JSON.parse(raw) as Config;
  } catch {
    console.error(`❌ ${path.basename(filePath)} is not valid JSON. Please fix it and try again.`);
    process.exit(1);
  }
}

function resolveExtends(config: Config, configDir: string, visited: Set<string>): Config {
  if (!config.extends) return config;

  const parentPath = path.resolve(configDir, config.extends);

  if (visited.has(parentPath)) {
    console.error(`❌ Circular extends detected: ${parentPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(parentPath)) {
    console.error(`❌ Extended config not found: ${parentPath}`);
    process.exit(1);
  }

  visited.add(parentPath);

  let parent: Config;
  if (parentPath.endsWith(".js")) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      parent = require(parentPath) as Config;
    } catch (err: unknown) {
      console.error(`❌ ${path.basename(parentPath)} could not be loaded: ${err instanceof Error ? err.message : err}`);
      process.exit(1);
    }
  } else {
    parent = parseJsonConfig(parentPath);
  }

  // Recursively resolve parent's own extends
  parent = resolveExtends(parent, path.dirname(parentPath), visited);

  const { extends: _, ...child } = config;

  return {
    ...parent,
    ...child,
    rules: { ...parent.rules, ...child.rules }
  };
}

/**
 * Loads configuration from a specific directory.
 * Supports "extends" for config inheritance — child rules override parent rules.
 * JSON takes priority over JS. Falls back to defaults if neither file exists.
 */
export function loadConfigFrom(dir: string): Config {
  const jsonPath = path.resolve(dir, "envwise.config.json");
  const jsPath   = path.resolve(dir, "envwise.config.js");

  if (fs.existsSync(jsonPath)) {
    let userConfig: Config;
    try {
      userConfig = parseJsonConfig(jsonPath);
    } catch {
      process.exit(1);
    }
    userConfig = resolveExtends(userConfig, path.dirname(jsonPath), new Set([jsonPath]));
    return { ...DEFAULT_CONFIG, ...userConfig, rules: { ...DEFAULT_CONFIG.rules, ...userConfig.rules } };
  }

  if (fs.existsSync(jsPath)) {
    let userConfig: Config;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      userConfig = require(jsPath) as Config;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ envwise.config.js could not be loaded: ${msg}`);
      process.exit(1);
    }
    userConfig = resolveExtends(userConfig, path.dirname(jsPath), new Set([jsPath]));
    return { ...DEFAULT_CONFIG, ...userConfig, rules: { ...DEFAULT_CONFIG.rules, ...userConfig.rules } };
  }

  return DEFAULT_CONFIG;
}

/**
 * Loads project configuration from the current working directory.
 * Supports "extends" for config inheritance — child rules override parent rules.
 * JSON takes priority. Falls back to defaults if neither file exists.
 *
 * @returns The consolidated configuration object
 */
export function loadConfig(): Config {
  return loadConfigFrom(process.cwd());
}
