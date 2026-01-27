#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { parseEnv } from "./engine/envParser";
import { checkDrift } from "./engine/driftChecker";
import { report } from "./reporter/consoleReporter";
import { interactiveSetup } from "./engine/interactive";
import { loadConfig } from "./config/loadConfig";

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const interactive = args.includes("--interactive") || args.includes("-i");
const checkAll = args.includes("--all");
const positionalArgs = args.filter(a => !a.startsWith("-"));

const config = loadConfig();
const basePath = path.resolve(config.baseEnv || ".env.example");

if (!fs.existsSync(basePath)) {
  console.error(`Reference file missing: ${basePath}`);
  process.exit(1);
}

const baseEnv = parseEnv(basePath);

async function runForFile(targetFile: string): Promise<boolean> {
  const targetPath = path.resolve(targetFile);
  if (!fs.existsSync(targetPath)) {
    console.error(`File missing: ${targetFile}`);
    return false;
  }

  console.log(`\n Checking ${path.basename(targetPath)} against ${path.basename(basePath)}...`);

  const targetEnv = parseEnv(targetPath);
  let result = checkDrift(baseEnv, targetEnv, config);

  if (result.missing.length > 0 && interactive) {
    const newValues = await interactiveSetup(result.missing, baseEnv, config);

    // Merge new values into targetEnv
    const updatedEnv = { ...targetEnv, ...newValues };

    // Write back to file
    const newContent = Object.entries(updatedEnv)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    fs.writeFileSync(targetPath, newContent);
    console.log(`\n ✅ Updated ${path.basename(targetPath)} with new values.`);

    // Re-check drift
    result = checkDrift(baseEnv, updatedEnv, config);
  }

  report(result);

  const hasIssues = result.missing.length || result.mismatches.length || result.errors.length;
  return !hasIssues;
}

async function main() {
  let allFiles: string[] = [];

  if (checkAll) {
    allFiles = fs.readdirSync(process.cwd())
      .filter(f => f.startsWith(".env") && f !== path.basename(basePath));
  } else {
    allFiles = [positionalArgs[0] || ".env"];
  }

  let overallSuccess = true;

  for (const file of allFiles) {
    const success = await runForFile(file);
    if (!success) overallSuccess = false;
  }

  if (strict && !overallSuccess) {
    console.error("\n Strict mode failed for one or more files");
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
