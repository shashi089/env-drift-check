import { DriftResult } from "../types";

export function applyFixes(
  base: Record<string, string>,
  target: Record<string, string>,
  result: DriftResult
): Record<string, string> {
  const fixedEnv = { ...target };

  // Add missing keys
  for (const key of result.missing) {
    if (base[key]) {
      fixedEnv[key] = base[key];
    }
  }

  // Fix mismatched values (base → target)
  for (const mismatch of result.mismatches) {
    if (mismatch.expected) {
      fixedEnv[mismatch.key] = mismatch.expected;
    }
  }

  return fixedEnv;
}
