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
import { loadConfig, loadConfigFrom } from "./config/loadConfig";
import { generateExampleFile } from "./engine/envGenerator";
import { scanCodebase } from "./engine/codeScanner";
import { toSarif } from "./reporter/sarifReporter";
import { generateK8sManifests } from "./engine/k8sGenerator";
import { validateCompose } from "./engine/composeValidator";
import type { Config, DriftResult } from "./types";

const program = new Command();

program
  .name("env-drift-check")
  .description("Interactive .env synchronizer and validator")
  .version("0.5.0");

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
    const baseExists = fs.existsSync(basePath);
    if (baseExists) {
      baseKeys = Object.keys(parseEnv(basePath));
    }

    console.log("🔍 Scanning codebase for process.env references...");
    const scanResult = scanCodebase(process.cwd());
    console.log(`Scanned ${scanResult.filesScanned} source file(s).`);

    if (scanResult.usedKeys.length > 0) {
      console.log(`\n🔑 Found ${scanResult.usedKeys.length} environment variable(s) referenced in code:`);
      scanResult.usedKeys.forEach(k => console.log(` - ${k}`));
    } else {
      console.log("\nNo process.env references found in code.");
    }

    if (!baseExists) {
      if (options.fix && scanResult.usedKeys.length > 0) {
        const content = `# Generated by env-drift-check scan --fix\n` + scanResult.usedKeys.map(k => `${k}=`).join("\n") + "\n";
        fs.writeFileSync(basePath, content);
        console.log(`\n✅ Created ${options.base} with ${scanResult.usedKeys.length} key(s).`);
      } else {
        console.log(`\nℹ️  No reference file found (${options.base}). Run with --fix to create one from the keys above.`);
      }
      return;
    }

    const missingInExample = scanResult.usedKeys.filter(k => !baseKeys.includes(k));
    const unusedInCode = baseKeys.filter(k => !scanResult.usedKeys.includes(k));

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

// ─── gen-configmap ─────────────────────────────────────────────────────────────

program
  .command("gen-configmap")
  .description("Split a .env file into a Kubernetes ConfigMap (safe) and Secret (sensitive)")
  .argument("[file]", "Source .env file", ".env")
  .option("-o, --output <file>", "Output YAML file", "k8s-env.yaml")
  .option("-n, --name <name>", "Base name for the K8s resources", "app-config")
  .option("--namespace <ns>", "Kubernetes namespace", "default")
  .action((file, options) => {
    const envFile = path.resolve(file);
    if (!fs.existsSync(envFile)) {
      console.error(`File not found: ${file}`);
      process.exit(1);
    }

    const config = loadConfig();
    const result = generateK8sManifests({
      envFile,
      outputFile: path.resolve(options.output),
      name: options.name,
      namespace: options.namespace,
      config,
    });

    console.log(`\n Generated: ${result.outputPath}\n`);

    if (result.configMapKeys.length > 0) {
      console.log(`  ConfigMap — ${result.configMapKeys.length} key(s):`);
      result.configMapKeys.forEach(k => console.log(`    ${k}`));
    }

    if (result.secretKeys.length > 0) {
      console.log(`\n  Secret — ${result.secretKeys.length} key(s) (values base64-encoded):`);
      result.secretKeys.forEach(k => console.log(`    ${k}`));
    }

    if (result.configMapKeys.length === 0 && result.secretKeys.length === 0) {
      console.log("  No keys found in source file.");
    }

    console.log();
  });

// ─── validate-compose ──────────────────────────────────────────────────────────

program
  .command("validate-compose")
  .description("Validate environment blocks in docker-compose.yml against the schema")
  .argument("[file]", "docker-compose.yml file", "docker-compose.yml")
  .option("-b, --base <schema>", "Reference .env file (used when no schema rules defined)", ".env.example")
  .option("-s, --strict", "Exit with non-zero code if unknown or missing keys are found")
  .action((file, options) => {
    const composePath = path.resolve(file);
    if (!fs.existsSync(composePath)) {
      console.error(`File not found: ${file}`);
      process.exit(1);
    }

    const config = loadConfig();

    // If no rules defined in config, fall back to base env keys as the schema
    if (!config.rules || Object.keys(config.rules).length === 0) {
      const basePath = path.resolve(options.base ?? config.baseEnv ?? ".env.example");
      if (fs.existsSync(basePath)) {
        const baseKeys = Object.keys(parseEnv(basePath));
        config.rules = Object.fromEntries(baseKeys.map(k => [k, { type: "string" as const }]));
      }
    }

    console.log(`\n Validating ${path.basename(composePath)}...\n`);

    let result;
    try {
      result = validateCompose(composePath, config);
    } catch (err: unknown) {
      console.error(`Failed to parse ${file}: ${err instanceof Error ? err.message : err}`);
      process.exit(1);
    }

    for (const svc of result.services) {
      console.log(` Service: ${svc.service}`);

      if (svc.envFileRefs.length > 0) {
        console.log(`   ℹ env_file: ${svc.envFileRefs.join(", ")} — vars resolved at runtime`);
      }

      if (svc.definedKeys.length === 0 && svc.envFileRefs.length === 0) {
        console.log("   (no environment block)");
      }

      for (const k of svc.definedKeys) {
        const isUnknown = svc.unknownKeys.includes(k);
        console.log(`   ${isUnknown ? "✖" : "✔"} ${k}${isUnknown ? " — not in schema" : ""}`);
      }

      for (const k of svc.missingRequiredKeys) {
        console.log(`   ⚠ ${k} — required in schema but not set`);
      }

      console.log();
    }

    if (result.services.length === 0) {
      console.log("  No services found in compose file.");
    } else {
      const summaryParts: string[] = [];
      if (result.totalUnknown > 0) summaryParts.push(`${result.totalUnknown} unknown key(s)`);
      if (result.totalMissing > 0) summaryParts.push(`${result.totalMissing} missing required key(s)`);

      if (summaryParts.length === 0) {
        console.log(" ✔ All environment vars match the schema.");
      } else {
        console.log(` ⚠️  Issues found: ${summaryParts.join(", ")}`);
        if (options.strict) process.exit(1);
      }
    }

    console.log();
  });

// ─── monorepo ──────────────────────────────────────────────────────────────────

function expandPackagePatterns(patterns: string): string[] {
  const dirs: string[] = [];
  for (const pattern of patterns.split(",").map(p => p.trim())) {
    if (pattern.endsWith("/*")) {
      const parent = path.resolve(pattern.slice(0, -2));
      if (fs.existsSync(parent)) {
        fs.readdirSync(parent, { withFileTypes: true })
          .filter(d => d.isDirectory())
          .forEach(d => dirs.push(path.join(parent, d.name)));
      }
    } else {
      const resolved = path.resolve(pattern);
      if (fs.existsSync(resolved)) dirs.push(resolved);
    }
  }
  return dirs;
}

program
  .command("monorepo")
  .description("Validate .env files across all packages in a monorepo")
  .option("-p, --packages <patterns>", "Comma-separated directory patterns to scan", "packages/*,apps/*")
  .option("-s, --strict", "Exit with code 1 if any package fails")
  .option("-f, --format <format>", "Output format: text or json", "text")
  .action((options) => {
    const pkgDirs = expandPackagePatterns(options.packages);
    const isJson = options.format === "json";

    if (pkgDirs.length === 0) {
      console.log("No package directories found matching the given patterns.");
      return;
    }

    if (!isJson) console.log(`\n Scanning ${pkgDirs.length} package(s)...\n`);

    let passing = 0, failing = 0, skipped = 0;
    const jsonResults: Record<string, unknown> = {};

    for (const pkgDir of pkgDirs) {
      const pkgName = path.relative(process.cwd(), pkgDir);
      const config = loadConfigFrom(pkgDir);
      const basePath = path.resolve(pkgDir, config.baseEnv ?? ".env.example");
      const targetPath = path.resolve(pkgDir, ".env");

      if (!fs.existsSync(basePath)) {
        skipped++;
        if (!isJson) console.log(`  ⚪ ${pkgName}  (no .env.example — skipped)`);
        else jsonResults[pkgName] = { status: "skipped" };
        continue;
      }

      const baseEnv = parseEnv(basePath);
      const targetEnv = fs.existsSync(targetPath) ? parseEnv(targetPath) : {};
      const result = checkDrift(baseEnv, targetEnv, config);
      const ok = !result.missing.length && !result.errors.length;

      if (ok) {
        passing++;
        if (!isJson) console.log(`  ✔ ${pkgName}`);
        else jsonResults[pkgName] = { status: "pass" };
      } else {
        failing++;
        if (!isJson) {
          console.log(`  ✖ ${pkgName}`);
          if (result.missing.length) console.log(`       ✖ Missing: ${result.missing.join(", ")}`);
          if (result.errors.length)  console.log(`       ✖ Errors:  ${result.errors.map(e => e.key).join(", ")}`);
        } else {
          jsonResults[pkgName] = { status: "fail", missing: result.missing, errors: result.errors };
        }
      }
    }

    if (isJson) {
      console.log(JSON.stringify(jsonResults, null, 2));
    } else {
      console.log(`\n  ${"─".repeat(33)}`);
      console.log(`  Packages scanned : ${pkgDirs.length}`);
      console.log(`  Passing          : ${passing}`);
      if (failing > 0) console.log(`  Failing          : ${failing}`);
      if (skipped > 0) console.log(`  Skipped          : ${skipped}`);
      console.log(failing > 0
        ? `\n  ⚠️  ${failing} package(s) have issues.`
        : `\n  ✔ All packages passed.`
      );
    }

    if (options.strict && failing > 0) process.exit(1);
  });

program.parse(process.argv);
