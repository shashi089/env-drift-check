#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { Command } from "commander";
import { parseEnv } from "./engine/envParser";
import { checkDrift } from "./engine/driftChecker";
import { report } from "./reporter/consoleReporter";
import { interactiveSetup } from "./engine/interactive";
import { loadConfig } from "./config/loadConfig";

const program = new Command();

program
  .name("env-drift-check")
  .description("Interactive .env synchronizer and validator")
  .version("0.1.7");

program
  .command("check", { isDefault: true })
  .description("Check for environment drift (default command)")
  .argument("[file]", "Target .env file to check", ".env")
  .option("-b, --base <reference>", "Reference .env file to check against (e.g., .env.example)")
  .option("-i, --interactive", "Launch interactive setup wizard for missing keys")
  .option("-s, --strict", "Fail with non-zero exit code if issues are found")
  .option("-a, --all", "Check all .env* files in the current directory")
  .action(async (file, options) => {
    const config = loadConfig();
    const basePath = path.resolve(options.base || config.baseEnv || ".env.example");

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

      if (result.missing.length > 0 && options.interactive) {
        const newValues = await interactiveSetup(result.missing, baseEnv, config);

        // Merge new values into targetEnv
        const updatedEnv = { ...targetEnv, ...newValues };

        // Write back to file preserving formatting
        const rawContent = fs.readFileSync(targetPath, "utf-8");
        const lines = rawContent.split(/\r?\n/);
        const eol = rawContent.includes("\r\n") ? "\r\n" : "\n";

        const updatedLines: string[] = [];
        const keysToUpdate = { ...newValues };

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) {
            updatedLines.push(line);
            continue;
          }

          const firstEq = line.indexOf("=");
          if (firstEq !== -1) {
            const key = line.slice(0, firstEq).trim();
            if (key in keysToUpdate) {
              const prefix = line.slice(0, firstEq + 1);

              const rawValue = line.slice(firstEq + 1);
              let suffix = "";
              let inQuote = false;
              let quoteChar = "";
              for (let i = 0; i < rawValue.length; i++) {
                const c = rawValue[i];
                if ((c === '"' || c === "'") && !inQuote) {
                  inQuote = true;
                  quoteChar = c;
                } else if (c === quoteChar && inQuote) {
                  inQuote = false;
                } else if (c === '#' && !inQuote) {
                  // Keep spacing before the comment if possible
                  const spaceMatch = rawValue.slice(0, i).match(/\s+$/);
                  const spaces = spaceMatch ? spaceMatch[0] : " ";
                  suffix = spaces + rawValue.slice(i);
                  break;
                }
              }

              updatedLines.push(`${prefix}${keysToUpdate[key]}${suffix}`);
              delete keysToUpdate[key];
              continue;
            }
          }
          updatedLines.push(line);
        }

        if (Object.keys(keysToUpdate).length > 0) {
          for (const [k, v] of Object.entries(keysToUpdate)) {
            updatedLines.push(`${k}=${v}`);
          }
        }

        const newContent = updatedLines.join(eol);
        fs.writeFileSync(targetPath, newContent);
        console.log(`\n ✅ Updated ${path.basename(targetPath)} with new values.`);

        // Re-check drift
        result = checkDrift(baseEnv, updatedEnv, config);
      }

      report(result);

      const hasIssues = result.missing.length || result.mismatches.length || result.errors.length;
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

    if (options.strict && !overallSuccess) {
      console.error("\n Strict mode failed for one or more files");
      process.exit(1);
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
