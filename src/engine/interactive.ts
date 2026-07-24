import prompts from "prompts";
import { Rule, Config } from "../types";
import { validateValue } from "./validator";

export async function interactiveSetup(
    missingKeys: string[],
    baseEnv: Record<string, string>,
    config: Config,
    currentEnv: string = "development"
): Promise<Record<string, string>> {
    const newValues: Record<string, string> = {};

    console.log("\n🛠  Interactive Setup: Let's fill in the missing variables.\n");

    for (const key of missingKeys) {
        const rule: Rule = config.rules?.[key] || { type: "string" };
        const initial = baseEnv[key] || "";

        let promptType: prompts.PromptType = "text";
        if (rule.type === "boolean") promptType = "confirm";
        if (rule.type === "number") promptType = "number";
        if (key.includes("PASSWORD") || key.includes("SECRET")) promptType = "password";

        const label = rule.description ? `${key} (${rule.description}):` : `${key}:`;
        const response = await prompts({
            type: promptType,
            name: "value",
            message: label,
            initial: promptType === "confirm" ? initial === "true" : initial,
            validate: (val) => {
                const strVal = String(val);
                const error = validateValue(key, strVal, rule, currentEnv);
                return error || true;
            }
        });

        if (response.value === undefined) {
            console.log("\nSetup cancelled.");
            process.exit(1);
        }

        newValues[key] = String(response.value);
    }

    return newValues;
}
