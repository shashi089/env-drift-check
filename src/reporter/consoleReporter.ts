import { DriftResult } from "../types";

export function report(result: DriftResult) {
  if (result.missing.length) {
    console.log("\n Missing Variables:");
    result.missing.forEach(v => console.log(" -", v));
  }

  if (result.extra.length) {
    console.log("\n Extra Variables:");
    result.extra.forEach(v => console.log(" -", v));
  }

  if (result.errors.length) {
    console.log("\n Errors:");
    result.errors.forEach(e => console.log(" -", `${e.key}: ${e.message}`));
  }

  if (result.mismatches.length) {
    console.log("\n Value Mismatches:");

    result.mismatches.forEach(m => {
      console.log(` - ${m.key.padEnd(15)} Expected: ${m.expected.padEnd(12)} Actual: ${m.actual}`);
    });
  }

  if (
    !result.missing.length &&
    !result.extra.length &&
    !result.errors.length &&
    !result.mismatches.length
  ) {
    console.log("No environment drift detected");
  }
}
