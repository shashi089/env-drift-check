#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "node:child_process";
import { Command } from "commander";
import { parseEnv } from "./engine/envParser";
import { checkDrift } from "./engine/driftChecker";
import { report } from "./reporter/consoleReporter";
import { interactiveSetup } from "./engine/interactive";
import { updateEnvFile } from "./engine/envWriter";
import { loadConfig } from "./config/loadConfig";
import { generateExampleFile } from "./engine/envGenerator";
import { scanCodebase } from "./engine/codeScanner";
import { toSarif } from "./reporter/sarifReporter";
import type { Config, DriftResult } from "./types";

const program = new Command();

program
  .name("env-drift-check")
  .description("Interactive .env synchronizer and validator")
  .version("0.4.0");

// ─── check helpers ────────────────────────────────────────────────────────────

function resolveTargetEnv(
  targetPath: string,
  useSystemEnv: boolean,
  isJson: boolean
): Record<string, string> | null {
  if (fs.existsSync(targetPath)) return parseEnv(targetPath);
  if (useSystemEnv) return {};
  if (!isJson) console.error(`File missing: ${path.basename(targetPath)}`);
  return null;
}

function logCheckHeader(targetPath: string, basePath: string, fileExists: boolean, isJson: boolean) {
  if (isJson) return;
  const label = fileExists
    ? path.basename(targetPath)
    : "process.env";
  console.log(`\n Checking ${label} against ${path.basename(basePath)}...`);
}

async function applyInteractiveFix(
  targetPath: string,
  fileExists: boolean,
  missing: string[],
  baseEnv: Record<string, string>,
  config: Config,
  targetEnv: Record<string, string>,
  isJson: boolean
): Promise<DriftResult> {
  if (!fileExists) fs.writeFileSync(targetPath, "");
  const currentEnv = targetEnv["NODE_ENV"] ?? process.env["NODE_ENV"] ?? "development";
  const newValues = await interactiveSetup(missing, baseEnv, config, currentEnv);
  updateEnvFile(targetPath, newValues);
  if (!isJson) console.log(`\n ✅ Updated ${path.basename(targetPath)} with new values.`);
  return checkDrift(baseEnv, parseEnv(targetPath), config);
}

// ─── check command ─────────────────────────────────────────────────────────────

program
  .command("check", { isDefault: true })
  .description("Check for environment drift (default command)")
  .argument("[file]", "Target .env file to check", ".env")
  .option("-b, --base <reference>", "Reference .env file to check against (e.g., .env.example)")
  .option("-i, --interactive", "Launch interactive setup wizard for missing keys")
  .option("-s, --strict", "Fail with non-zero exit code if issues are found")
  .option("-a, --all", "Check all .env* files in the current directory")
  .option("--system-env", "Fallback to process.env during verification")
  .option("-f, --format <format>", "Output format: text, json, or sarif", "text")
  .option("-w, --watch", "Re-validate automatically on .env or config file changes")
  .action(async (file, options) => {
    const config = loadConfig();
    if (options.systemEnv) config.includeSystemEnv = true;

    const basePath = path.resolve(options.base ?? config.baseEnv ?? ".env.example");
    const isJson  = options.format === "json";
    const isSarif = options.format === "sarif";
    const isSilent = isJson || isSarif;

    if (!fs.existsSync(basePath)) {
      if (!isSilent) console.error(`Reference file missing: ${basePath}`);
      process.exit(1);
    }

    const baseEnv = parseEnv(basePath);
    const runResults: Record<string, { success: boolean; result: DriftResult }> = {};

    async function runForFile(targetFile: string): Promise<boolean> {
      const targetPath = path.resolve(targetFile);
      const targetEnv = resolveTargetEnv(targetPath, !!options.systemEnv, isSilent);
      if (targetEnv === null) return false;

      const fileExists = fs.existsSync(targetPath);
      logCheckHeader(targetPath, basePath, fileExists, isSilent);

      let result = checkDrift(baseEnv, targetEnv, config);

      if (result.missing.length > 0 && options.interactive) {
        result = await applyInteractiveFix(targetPath, fileExists, result.missing, baseEnv, config, targetEnv, isSilent);
      }

      if (!isSilent) report(result);

      const success = !result.missing.length && !result.mismatches.length && !result.errors.length;
      runResults[targetFile] = { success, result };
      return success;
    }

    const allFiles = options.all
      ? fs.readdirSync(process.cwd()).filter(f => f.startsWith(".env") && f !== path.basename(basePath))
      : [file];

    async function runAll(): Promise<boolean> {
      let overallSuccess = true;
      for (const f of allFiles) {
        const ok = await runForFile(f);
        if (!ok) overallSuccess = false;
      }
      return overallSuccess;
    }

    const overallSuccess = await runAll();

    if (isJson)  console.log(JSON.stringify(runResults, null, 2));
    if (isSarif) console.log(toSarif(runResults));

    if (options.strict && !overallSuccess) {
      if (!isSilent) console.error("\n Strict mode failed for one or more files");
      process.exit(1);
    }

    if (options.watch) {
      const watchPaths = [...new Set([
        basePath,
        path.resolve("envwise.config.json"),
        path.resolve("envwise.config.js"),
        ...allFiles.map(f => path.resolve(f))
      ])].filter(f => fs.existsSync(f));

      console.log("\n👀 Watching for changes... (Ctrl+C to stop)\n");

      let debounce: ReturnType<typeof setTimeout>;
      let running = false;

      for (const wp of watchPaths) {
        fs.watch(wp, () => {
          clearTimeout(debounce);
          debounce = setTimeout(async () => {
            if (running) return;
            running = true;
            console.clear();
            console.log("🔄 Change detected — re-running check...\n");
            Object.keys(runResults).forEach(k => delete runResults[k]);
            await runAll();
            if (isJson)  console.log(JSON.stringify(runResults, null, 2));
            if (isSarif) console.log(toSarif(runResults));
            running = false;
          }, 300);
        });
      }
    }
  });

// ─── gen-example ───────────────────────────────────────────────────────────────

program
  .command("gen-example")
  .description("Generate or update a .env.example file based on the keys in your target .env")
  .argument("[file]", "Source .env file", ".env")
  .option("-o, --output <output>", "Output file name", ".env.example")
  .action(async (file, options) => {
    try {
      await generateExampleFile(path.resolve(file), path.resolve(options.output));
    } catch (err: unknown) {
      console.error(`Error generating template: ${err instanceof Error ? err.message : err}`);
      process.exit(1);
    }
  });

// ─── scan ──────────────────────────────────────────────────────────────────────

program
  .command("scan")
  .description("Scan workspace source files to identify used process.env variables and check against .env.example")
  .option("-b, --base <reference>", "Reference .env file (e.g. .env.example)", ".env.example")
  .option("--fix", "Append keys missing from .env.example back into it")
  .action((options) => {
    const basePath = path.resolve(options.base);
    let baseKeys: string[] = [];
    if (fs.existsSync(basePath)) {
      baseKeys = Object.keys(parseEnv(basePath));
    } else {
      console.warn(`⚠️ Reference file not found: ${basePath}`);
    }

    console.log("🔍 Scanning codebase for process.env references...");
    const scanResult = scanCodebase(process.cwd());
    console.log(`Scanned ${scanResult.filesScanned} source file(s).`);

    const missingInExample = scanResult.usedKeys.filter(k => !baseKeys.includes(k));
    const unusedInCode = baseKeys.filter(k => !scanResult.usedKeys.includes(k));

    if (scanResult.usedKeys.length > 0) {
      console.log("\n🔑 Environment variables referenced in code:");
      scanResult.usedKeys.forEach(k => console.log(` - ${k}`));
    } else {
      console.log("\nNo process.env references found in code.");
    }

    if (missingInExample.length > 0) {
      console.log("\n❌ Missing in reference template (referenced in code but not in example):");
      missingInExample.forEach(k => console.log(` - ${k}`));

      if (options.fix) {
        const appended = missingInExample.map(k => `${k}=`).join("\n");
        fs.appendFileSync(basePath, `\n# Added by env-drift-check scan --fix\n${appended}\n`);
        console.log(`\n✅ Appended ${missingInExample.length} key(s) to ${options.base}`);
      }
    }

    if (unusedInCode.length > 0) {
      console.log("\n⚠️ Unused in code (defined in example but not found in codebase):");
      unusedInCode.forEach(k => console.log(` - ${k}`));
    }
  });

// ─── diff ──────────────────────────────────────────────────────────────────────

program
  .command("diff <fileA> <fileB>")
  .description("Show a side-by-side diff between two .env files")
  .action((fileA, fileB) => {
    const pathA = path.resolve(fileA);
    const pathB = path.resolve(fileB);

    if (!fs.existsSync(pathA)) { console.error(`File not found: ${fileA}`); process.exit(1); }
    if (!fs.existsSync(pathB)) { console.error(`File not found: ${fileB}`); process.exit(1); }

    const a = parseEnv(pathA);
    const b = parseEnv(pathB);
    const allKeys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort((x, y) => x.localeCompare(y));

    console.log(`\n Diff: ${fileA}  →  ${fileB}\n`);

    let hasChanges = false;
    for (const key of allKeys) {
      if (!(key in a)) {
        console.log(`  + ${key}=${b[key]}   (only in ${fileB})`);
        hasChanges = true;
      } else if (!(key in b)) {
        console.log(`  - ${key}=${a[key]}   (only in ${fileA})`);
        hasChanges = true;
      } else if (a[key] !== b[key]) {
        console.log(`  ~ ${key}: "${a[key]}" → "${b[key]}"`);
        hasChanges = true;
      }
    }

    if (!hasChanges) console.log("  ✔ No differences found.");
  });

// ─── audit ─────────────────────────────────────────────────────────────────────

function isGitTracked(file: string): boolean {
  try { execSync(`git ls-files --error-unmatch "${file}"`, { stdio: "ignore" }); return true; } catch { return false; }
}

function isInGitHistory(file: string): boolean {
  try { return execSync(`git log --all --full-history -- "${file}"`, { encoding: "utf-8" }).trim().length > 0; } catch { return false; }
}

function auditFile(file: string, gitignoreLines: string[]): boolean {
  console.log(`\n ${file}`);
  let fileHasIssues = false;

  const inGitignore = gitignoreLines.some(l => l === file || l === `/${file}`);
  console.log(`  ${inGitignore ? "✔" : "✖"} ${inGitignore ? "Listed" : "NOT listed"} in .gitignore`);
  if (!inGitignore) fileHasIssues = true;

  const tracked = isGitTracked(file);
  const trackedMsg = tracked ? `Tracked by git — run: git rm --cached ${file}` : "Not tracked by git";
  console.log(`  ${tracked ? "✖ DANGER" : "✔"} ${trackedMsg}`);
  if (tracked) fileHasIssues = true;

  const inHistory = isInGitHistory(file);
  const historyMsg = inHistory ? "Found in git history — past commits may contain secrets" : "Not found in git history";
  console.log(`  ${inHistory ? "⚠" : "✔"} ${historyMsg}`);
  if (inHistory) fileHasIssues = true;

  return fileHasIssues;
}

program
  .command("audit")
  .description("Check if .env files are safely excluded from git tracking and history")
  .action(() => {
    const filesToAudit = fs.readdirSync(process.cwd())
      .filter(f => /^\.env(\..+)?$/.test(f) && f !== ".env.example");

    if (filesToAudit.length === 0) {
      console.log("No .env files found in current directory.");
      return;
    }

    const gitignoreLines = fs.existsSync(".gitignore")
      ? fs.readFileSync(".gitignore", "utf-8").split(/\r?\n/).map(l => l.trim())
      : [];

    const hasIssues = filesToAudit.some(file => auditFile(file, gitignoreLines));

    console.log();
    if (hasIssues) {
      console.log(" ⚠️  Issues found. Review the items above.");
      process.exit(1);
    } else {
      console.log(" ✔ All .env files are safely excluded from git.");
    }
  });

// ─── init ──────────────────────────────────────────────────────────────────────

program
  .command("init")
  .description("Initialize a new project with default configuration")
  .action(() => {
    const configPath = path.join(process.cwd(), "envwise.config.json");
    const exampleEnvPath = path.join(process.cwd(), ".env.example");

    if (fs.existsSync(configPath)) {
      console.log("ℹ️ envwise.config.json already exists.");
    } else {
      const defaultConfig = {
        baseEnv: ".env.example",
        rules: {
          PORT: { type: "number", min: 1024, max: 65535, description: "Application port" }
        }
      };
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
      console.log("✅ Created envwise.config.json");
    }

    if (fs.existsSync(exampleEnvPath)) {
      console.log("ℹ️ .env.example already exists.");
    } else {
      fs.writeFileSync(exampleEnvPath, "PORT=3000\n");
      console.log("✅ Created .env.example");
    }

    console.log("\nSetup complete! Run 'npx env-drift-check -i' to sync your .env file.");
  });

program.parse(process.argv);
