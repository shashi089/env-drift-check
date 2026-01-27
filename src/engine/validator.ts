import { Rule } from "../types";

export function validateValue(
  key: string,
  value: string,
  rule: Rule,
  env: string
): string | null {
  if (!value && rule.required !== false) {
    return `${key} is required`;
  }

  // Number validation
  if (rule.type === "number") {
    const num = Number(value);
    if (isNaN(num)) return `${key} must be a number`;
    if (rule.min !== undefined && num < rule.min) return `${key} must be at least ${rule.min}`;
    if (rule.max !== undefined && num > rule.max) return `${key} must be at most ${rule.max}`;
  }

  // String length validation
  if (rule.type === "string") {
    if (rule.min !== undefined && value.length < rule.min) return `${key} must be at least ${rule.min} chars`;
    if (rule.max !== undefined && value.length > rule.max) return `${key} must be at most ${rule.max} chars`;
  }

  // Enum validation
  if (rule.type === "enum" && rule.values && !rule.values.includes(value)) {
    return `${key} must be one of: ${rule.values.join(", ")}`;
  }

  // Boolean validation
  if (rule.type === "boolean") {
    if (value !== "true" && value !== "false") return `${key} must be true or false`;
    if (rule.mustBeFalseIn === env && value === "true") {
      return `${key} must be false in ${env}`;
    }
  }

  // Email validation
  if (rule.type === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return `${key} must be a valid email`;
  }

  // URL validation
  if (rule.type === "url") {
    try {
      new URL(value);
    } catch {
      return `${key} must be a valid URL`;
    }
  }

  // Regex validation
  if (rule.type === "regex" && rule.regex) {
    const regex = new RegExp(rule.regex);
    if (!regex.test(value)) return `${key} does not match required pattern`;
  }

  return null;
}
