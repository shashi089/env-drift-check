import fs from "fs";
import yaml from "js-yaml";
import type { Config } from "../types";

interface ComposeService {
  environment?: Record<string, string | null> | string[];
  env_file?: string | string[];
}

interface ComposeFile {
  services?: Record<string, ComposeService>;
}

export interface ServiceValidationResult {
  service: string;
  /** Keys explicitly set in the environment block */
  definedKeys: string[];
  /** env_file entries referenced (resolved at runtime — not enumerated) */
  envFileRefs: string[];
  /** Keys in the compose environment block that are not in the schema */
  unknownKeys: string[];
  /** Required schema keys absent from this service's environment block */
  missingRequiredKeys: string[];
}

export interface ComposeValidationResult {
  services: ServiceValidationResult[];
  totalUnknown: number;
  totalMissing: number;
}

function extractKeys(environment: Record<string, string | null> | string[]): string[] {
  if (Array.isArray(environment)) {
    return environment.map(entry => {
      const eq = entry.indexOf("=");
      return eq === -1 ? entry : entry.slice(0, eq);
    });
  }
  return Object.keys(environment);
}

function extractEnvFileRefs(envFile: string | string[] | undefined): string[] {
  if (!envFile) return [];
  return Array.isArray(envFile) ? envFile : [envFile];
}

function getRequiredSchemaKeys(config: Config): string[] {
  const rules = config.rules ?? {};
  return Object.entries(rules)
    .filter(([, rule]) => rule.required !== false && !rule.default && !rule.requiredIf)
    .map(([key]) => key);
}

function getSchemaKeys(config: Config): Set<string> {
  return new Set(Object.keys(config.rules ?? {}));
}

export function validateCompose(composeFile: string, config: Config): ComposeValidationResult {
  const raw = fs.readFileSync(composeFile, "utf-8");
  const parsed = yaml.load(raw) as ComposeFile;

  const services = parsed?.services ?? {};
  const schemaKeys = getSchemaKeys(config);
  const requiredKeys = getRequiredSchemaKeys(config);

  const results: ServiceValidationResult[] = [];

  for (const [serviceName, service] of Object.entries(services)) {
    const definedKeys = service.environment ? extractKeys(service.environment) : [];
    const envFileRefs = extractEnvFileRefs(service.env_file);
    const hasEnvFile = envFileRefs.length > 0;

    // Keys in compose not found in schema (skip check if schema has no rules — nothing to compare)
    const unknownKeys = schemaKeys.size > 0
      ? definedKeys.filter(k => !schemaKeys.has(k))
      : [];

    // Required schema keys absent from compose (skip if env_file is used — vars come at runtime)
    const missingRequiredKeys = hasEnvFile
      ? []
      : requiredKeys.filter(k => !definedKeys.includes(k));

    results.push({ service: serviceName, definedKeys, envFileRefs, unknownKeys, missingRequiredKeys });
  }

  return {
    services: results,
    totalUnknown: results.reduce((n, r) => n + r.unknownKeys.length, 0),
    totalMissing: results.reduce((n, r) => n + r.missingRequiredKeys.length, 0),
  };
}
