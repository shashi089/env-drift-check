import fs from "fs";
import { parseEnv } from "./envParser";
import type { Config, Rule } from "../types";

// Keys whose names suggest they hold credentials or secrets
const SENSITIVE_RE = /password|secret|token|api[_-]?key|private[_-]?key|credential|passphrase|auth[_-]?token|database_url|db_url/i;

function isSensitive(key: string, rule?: Rule): boolean {
  if (rule?.checkSecretStrength) return true;
  return SENSITIVE_RE.test(key);
}

function buildConfigMap(name: string, namespace: string, data: Record<string, string>): string {
  const dataLines = Object.entries(data)
    .map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)
    .join("\n");
  return [
    "apiVersion: v1",
    "kind: ConfigMap",
    "metadata:",
    `  name: ${name}`,
    `  namespace: ${namespace}`,
    "data:",
    dataLines,
  ].join("\n");
}

function buildSecret(name: string, namespace: string, data: Record<string, string>): string {
  const dataLines = Object.entries(data)
    .map(([k, v]) => `  ${k}: ${Buffer.from(v).toString("base64")}`)
    .join("\n");
  return [
    "apiVersion: v1",
    "kind: Secret",
    "metadata:",
    `  name: ${name}-secret`,
    `  namespace: ${namespace}`,
    "type: Opaque",
    "data:",
    dataLines,
  ].join("\n");
}

export interface K8sGeneratorOptions {
  envFile: string;
  outputFile: string;
  name: string;
  namespace: string;
  config: Config;
}

export interface K8sGeneratorResult {
  configMapKeys: string[];
  secretKeys: string[];
  outputPath: string;
}

export function generateK8sManifests(opts: K8sGeneratorOptions): K8sGeneratorResult {
  const env = parseEnv(opts.envFile);
  const rules = opts.config.rules ?? {};

  const configMapData: Record<string, string> = {};
  const secretData: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    if (isSensitive(key, rules[key])) {
      secretData[key] = value;
    } else {
      configMapData[key] = value;
    }
  }

  const parts: string[] = [];
  if (Object.keys(configMapData).length > 0) parts.push(buildConfigMap(opts.name, opts.namespace, configMapData));
  if (Object.keys(secretData).length > 0)    parts.push(buildSecret(opts.name, opts.namespace, secretData));

  fs.writeFileSync(opts.outputFile, parts.join("\n---\n") + "\n");

  return {
    configMapKeys: Object.keys(configMapData),
    secretKeys: Object.keys(secretData),
    outputPath: opts.outputFile,
  };
}
