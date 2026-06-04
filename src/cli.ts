#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { Command } from "commander";
import { parseEnv } from "./engine/envParser";
import { checkDrift } from "./engine/driftChecker";
import { report } from "./reporter/consoleReporter";
import { interactiveSetup } from "./engine/interactive";
import { updateEnvFile } from "./engine/envWriter";
import { loadConfig } from "./config/loadConfig";
import { generateExampleFile } from "./engine/envGenerator";
import { scanCodebase } from "./engine/codeScanner";

const program = new Command();

program
  .name("env-drift-check")
  .description("Interactive .env synchronizer and validator")
  .version("0.2.1");

program
  .command("check", { isDefault: true })
  .description("Check for environment drift (default command)")
  .argument("[file]", "Target .env file to check", ".env")
  .option("-b, --base <reference>", "Reference .env file to check against (e.g., .env.example)")
  .option("-i, --interactive", "Launch interactive setup wizard for missing keys")
  .option("-s, --strict", "Fail with non-zero exit code if issues are found")
  .option("-a, --all", "Check all .env* files in the current directory")
  .option("--system-env", "Fallback to process.env during verification")
  .option("-f, --format <format>", "Output format: text or json", "text")
  .action(async (file, options) => {
    const config = loadConfig();
    if (options.systemEnv) {
      config.includeSystemEnv = true;
    }
    const basePath = path.resolve(options.base || config.baseEnv || ".env.example");

    if (!fs.existsSync(basePath)) {
      if (options.format !== "json") {
        console.error(`Reference file missing: ${basePath}`);
      }
      process.exit(1);
    }

    const baseEnv = parseEnv(basePath);
    const runResults: Record<string, any> = {};

    async function runForFile(targetFile: string): Promise<boolean> {
      const targetPath = path.resolve(targetFile);
      let targetEnv: Record<string, string> = {};

      const fileExists = fs.existsSync(targetPath);
      if (!fileExists) {
        if (options.systemEnv) {
          targetEnv = {};
        } else {
          if (options.format !== "json") {
            console.error(`File missing: ${targetFile}`);
          }
          return false;
        }
      } else {
        targetEnv = parseEnv(targetPath);
      }

      if (options.format !== "json") {
        if (fileExists) {
          console.log(`\n Checking ${path.basename(targetPath)} against ${path.basename(basePath)}...`);
        } else {
          console.log(`\n Checking process.env against ${path.basename(basePath)}...`);
        }
      }

      let result = checkDrift(baseEnv, targetEnv, config);

      if (result.missing.length > 0 && options.interactive) {
        if (!fileExists) {
          fs.writeFileSync(targetPath, "");
        }
        const currentEnv = targetEnv["NODE_ENV"] || process.env["NODE_ENV"] || "development";
        const newValues = await interactiveSetup(result.missing, baseEnv, config, currentEnv);

        // Update file preserving formatting
        updateEnvFile(targetPath, newValues);
        
        if (options.format !== "json") {
          console.log(`\n ✅ Updated ${path.basename(targetPath)} with new values.`);
        }

        // Re-check drift after update
        const updatedEnv = parseEnv(targetPath);
        result = checkDrift(baseEnv, updatedEnv, config);
      }

      if (options.format !== "json") {
        report(result);
      }

      const hasIssues = result.missing.length || result.mismatches.length || result.errors.length;
      
      runResults[targetFile] = {
        success: !hasIssues,
        result
      };

      return !hasIssues;
    }

    let allFiles: string[] = [];
    if (options.all) {
      allFiles = fs.readdirSync(process.cwd())
        .filter(f => f.startsWith(".env") && f !== path.basename(basePath));
    } else {
      allFiles = [file];
    }

    let overallSuccess = true;
    for (const f of allFiles) {
      const success = await runForFile(f);
      if (!success) overallSuccess = false;
    }

    if (options.format === "json") {
      console.log(JSON.stringify(runResults, null, 2));
    }

    if (options.strict && !overallSuccess) {
      if (options.format !== "json") {
        console.error("\n Strict mode failed for one or more files");
      }
      process.exit(1);
    }
  });

program
  .command("gen-example")
  .description("Generate or update a .env.example file based on the keys in your target .env")
  .argument("[file]", "Source .env file", ".env")
  .option("-o, --output <output>", "Output file name", ".env.example")
  .action(async (file, options) => {
    const sourcePath = path.resolve(file);
    const destPath = path.resolve(options.output);
    try {
      await generateExampleFile(sourcePath, destPath);
    } catch (err: any) {
      console.error(`Error generating template: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command("scan")
  .description("Scan workspace source files to identify used process.env variables and check against .env.example")
  .option("-b, --base <reference>", "Reference .env file (e.g. .env.example)", ".env.example")
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
    }

    if (unusedInCode.length > 0) {
      console.log("\n⚠️ Unused in code (defined in example but not found in codebase):");
      unusedInCode.forEach(k => console.log(` - ${k}`));
    }
  });

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
          PORT: {
            type: "number",
            min: 1024,
            max: 65535,
            description: "Application port"
          }
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
