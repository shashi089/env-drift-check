import { DriftResult } from "../types";

interface SarifResult {
  ruleId: string;
  level: "error" | "warning" | "note";
  message: { text: string };
  locations: Array<{ physicalLocation: { artifactLocation: { uri: string; uriBaseId: string } } }>;
}

function location(uri: string): SarifResult["locations"] {
  return [{ physicalLocation: { artifactLocation: { uri, uriBaseId: "%SRCROOT%" } } }];
}

/**
 * Converts a DriftResult map (keyed by file) to a SARIF 2.1.0 JSON string.
 * Output can be uploaded to GitHub's security tab via github/codeql-action/upload-sarif.
 */
export function toSarif(
  runResults: Record<string, { success: boolean; result: DriftResult }>
): string {
  const results: SarifResult[] = [];

  for (const [file, { result }] of Object.entries(runResults)) {
    for (const key of result.missing) {
      results.push({ ruleId: "EDC001", level: "error", message: { text: `${key} is missing from ${file}` }, locations: location(file) });
    }
    for (const { key, message } of result.errors) {
      results.push({ ruleId: "EDC002", level: "error", message: { text: message }, locations: location(file) });
    }
    for (const key of result.extra) {
      results.push({ ruleId: "EDC003", level: "note", message: { text: `${key} is present in ${file} but not in the base template` }, locations: location(file) });
    }
    for (const warning of result.warnings) {
      results.push({ ruleId: "EDC004", level: "warning", message: { text: warning }, locations: location(file) });
    }
    for (const { key, expected, actual } of result.mismatches) {
      results.push({ ruleId: "EDC005", level: "warning", message: { text: `${key} in ${file}: expected "${expected}", got "${actual}"` }, locations: location(file) });
    }
  }

  const sarif = {
    $schema: "https://schemastore.azurewebsites.net/schemas/json/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [{
      tool: {
        driver: {
          name: "env-drift-check",
          version: "0.3.0",
          informationUri: "https://github.com/shashi089/env-drift-check",
          rules: [
            { id: "EDC001", name: "MissingKey",          shortDescription: { text: "Required environment variable is missing" } },
            { id: "EDC002", name: "ValidationError",     shortDescription: { text: "Environment variable fails schema validation" } },
            { id: "EDC003", name: "ExtraKey",            shortDescription: { text: "Undocumented environment variable present" } },
            { id: "EDC004", name: "DeprecationWarning",  shortDescription: { text: "Deprecated or flagged environment variable in use" } },
            { id: "EDC005", name: "ValueMismatch",       shortDescription: { text: "Environment variable value differs from template" } },
          ]
        }
      },
      results
    }]
  };

  return JSON.stringify(sarif, null, 2);
}
