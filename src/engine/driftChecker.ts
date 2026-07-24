import { DriftResult, Config } from "../types";
import { validateValue } from "./validator";
import { detectFramework, getFrameworkWarnings } from "./frameworkChecker";

function resolveValue(
  key: string,
  target: Record<string, string>,
  includeSystemEnv: boolean
): string | undefined {
  if (key in target) return target[key];
  if (includeSystemEnv && key in process.env) return process.env[key];
  return undefined;
}

function isConditionMet(
  requiredIf: Record<string, string>,
  target: Record<string, string>,
  includeSystemEnv: boolean
): boolean {
  return Object.entries(requiredIf).every(([condKey, condVal]) => {
    const actual = resolveValue(condKey, target, includeSystemEnv);
    return actual === condVal;
  });
}

export function checkDrift(
  base: Record<string, string>,
  target: Record<string, string>,
  config: Config
): DriftResult {
  const result: DriftResult = {
    missing: [],
    extra: [],
    errors: [],
    warnings: [],
    mismatches: []
  };

  const includeSystemEnv = !!config.includeSystemEnv;
  const rules = config.rules ?? {};

  // Build effective target — merges actual values with rule defaults for absent keys
  const effective: Record<string, string> = { ...target };
  for (const [key, rule] of Object.entries(rules)) {
    if (!(key in effective) && !(includeSystemEnv && key in process.env) && rule.default !== undefined) {
      effective[key] = rule.default;
    }
  }

  // Missing & extra keys
  for (const key of Object.keys(base)) {
    const value = resolveValue(key, effective, includeSystemEnv);
    if (value !== undefined) continue;

    const rule = rules[key];

    // requiredIf: only required when condition is met
    if (rule?.requiredIf && !isConditionMet(rule.requiredIf, effective, includeSystemEnv)) continue;

    // required: false means the key is optional
    if (rule?.required === false) continue;

    result.missing.push(key);
  }

  for (const key of Object.keys(target)) {
    if (!(key in base)) result.extra.push(key);
  }

  // Value mismatch detection (compare against effective, not raw target)
  for (const key of Object.keys(base)) {
    const value = resolveValue(key, effective, includeSystemEnv);
    if (value !== undefined && base[key] !== value) {
      result.mismatches.push({ key, expected: base[key], actual: value });
    }
  }

  // Rule-based validation & deprecation warnings
  const currentEnv = resolveValue("NODE_ENV", effective, includeSystemEnv) ?? "development";

  for (const [key, rule] of Object.entries(rules)) {
    const value = resolveValue(key, effective, includeSystemEnv);
    if (value === undefined) continue;

    const err = validateValue(key, value, rule, currentEnv);
    if (err) result.errors.push({ key, message: err });

    if (rule.deprecated) {
      const msg = typeof rule.deprecated === "string"
        ? rule.deprecated
        : `${key} is deprecated and should be removed.`;
      result.warnings.push(msg);
    }
  }

  // Framework prefix warnings
  const frameworkHint = config.framework ?? "auto";
  const framework = frameworkHint === "auto" || frameworkHint === undefined
    ? detectFramework(process.cwd())
    : frameworkHint === "none" ? "none" : frameworkHint;

  const frameworkWarnings = getFrameworkWarnings(Object.keys(base), framework);
  result.warnings.push(...frameworkWarnings);

  return result;
}
