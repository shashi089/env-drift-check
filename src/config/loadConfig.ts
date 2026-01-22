import fs from "fs";
import path from "path";

import { Config, Rule } from "../types";

const DEFAULT_CONFIG: Config = {
  baseEnv: ".env.example",
  rules: {}
};

export function loadConfig(): Config {
  const configPath = path.resolve("envwise.config.json");

  if (!fs.existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  const raw = fs.readFileSync(configPath, "utf-8");
  const userConfig = JSON.parse(raw);

  return {
    ...DEFAULT_CONFIG,
    ...userConfig
  };
}
