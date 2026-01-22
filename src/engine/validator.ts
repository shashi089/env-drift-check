import { Rule } from "../types";

export function validateValue(
  key: string,
  value: string,
  rule: Rule,
  env: string
): string | null {
  if (rule.type === "number" && isNaN(Number(value))) {
    return `${key} must be a number`;
  }

  if (rule.type === "enum" && !rule.values.includes(value)) {
    return `${key} must be one of ${rule.values.join(", ")}`;
  }

  if (
    rule.type === "boolean" &&
    rule.mustBeFalseIn === env &&
    value === "true"
  ) {
    return `${key} must be false in ${env}`;
  }

  return null;
}
