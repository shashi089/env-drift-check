#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { parseEnv } from "./engine/envParser";
import { checkDrift } from "./engine/driftChecker";
import { report } from "./reporter/consoleReporter";
import { applyFixes } from "./engine/fixer";
import { loadConfig } from "./config/loadConfig";

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const fix = args.includes("--fix");
const checkAll = args.includes("--all");
const positionalArgs = args.filter(a => !a.startsWith("-"));

const config = loadConfig();
const basePath = path.resolve(config.baseEnv || ".env.example");

if (!fs.existsSync(basePath)) {
  console.error(`Reference file missing: ${basePath}`);
  process.exit(1);
}

const baseEnv = parseEnv(basePath);

function runForFile(targetFile: string): boolean {
  const targetPath = path.resolve(targetFile);
  if (!fs.existsSync(targetPath)) {
    console.error(`File missing: ${targetFile}`);
    return false;
  }

  console.log(`\n Checking ${path.basename(targetPath)} against ${path.basename(basePath)}...`);

  const targetEnv = parseEnv(targetPath);
  let result = checkDrift(baseEnv, targetEnv, config);

  if (fix) {
    const updatedEnv = applyFixes(baseEnv, targetEnv, result);
    fs.writeFileSync(
      targetPath,
      Object.entries(updatedEnv)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n")
    );
    console.log(` Applied fixes to ${path.basename(targetPath)}`);
    result = checkDrift(baseEnv, updatedEnv, config);
  }

  report(result);

  const hasIssues = result.missing.length || result.mismatches.length || result.errors.length;
  return !hasIssues;
}

let allFiles: string[] = [];

if (checkAll) {
  allFiles = fs.readdirSync(process.cwd())
    .filter(f => f.startsWith(".env") && f !== path.basename(basePath));
} else {
  allFiles = [positionalArgs[0] || ".env"];
}

let overallSuccess = true;

for (const file of allFiles) {
  const success = runForFile(file);
  if (!success) overallSuccess = false;
}

if (strict && !overallSuccess) {
  console.error("\n Strict mode failed for one or more files");
  process.exit(1);
}
