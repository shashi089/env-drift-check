import fs from "fs";
import path from "path";

type Framework = "nextjs" | "vite" | "cra" | "none";

interface FrameworkRule {
  /** Prefix that marks a variable as publicly exposed to the browser. */
  publicPrefix: string;
  /** Display name for warning messages. */
  name: string;
}

const FRAMEWORK_RULES: Record<Exclude<Framework, "none">, FrameworkRule> = {
  nextjs: { publicPrefix: "NEXT_PUBLIC_", name: "Next.js" },
  vite:   { publicPrefix: "VITE_",        name: "Vite"    },
  cra:    { publicPrefix: "REACT_APP_",   name: "CRA"     },
};

const SECRET_PATTERNS = /SECRET|PASSWORD|PRIVATE|TOKEN|KEY|CREDENTIAL|CERT|SEED/i;

export function detectFramework(cwd: string): Framework {
  const pkgPath = path.join(cwd, "package.json");
  if (!fs.existsSync(pkgPath)) return "none";

  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  } catch {
    return "none";
  }

  const deps = {
    ...((pkg.dependencies as Record<string, string>) ?? {}),
    ...((pkg.devDependencies as Record<string, string>) ?? {}),
  };

  if ("next" in deps) return "nextjs";
  if ("vite" in deps) return "vite";
  if ("react-scripts" in deps) return "cra";
  return "none";
}

export function getFrameworkWarnings(
  allKeys: string[],
  framework: Framework
): string[] {
  if (framework === "none") return [];

  const rule = FRAMEWORK_RULES[framework];
  const warnings: string[] = [];

  for (const key of allKeys) {
    if (!key.startsWith(rule.publicPrefix)) continue;
    if (SECRET_PATTERNS.test(key)) {
      warnings.push(
        `⚠ ${key} starts with ${rule.publicPrefix} and will be exposed to the browser — ` +
        `but its name suggests it is a secret. Consider keeping this server-side only.`
      );
    }
  }

  return warnings;
}
