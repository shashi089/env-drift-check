import prompts from "prompts";
import { Rule, Config } from "../types";
import { validateValue } from "./validator";

export async function interactiveSetup(
    missingKeys: string[],
    baseEnv: Record<string, string>,
    config: Config
): Promise<Record<string, string>> {
    const newValues: Record<string, string> = {};

    console.log("\n🛠  Interactive Setup: Let's fill in the missing variables.\n");

    for (const key of missingKeys) {
        const rule: Rule = config.rules?.[key] || { type: "string" };
        const initial = baseEnv[key] || "";

        // Determine prompt type
        let promptType: prompts.PromptType = "text";
        if (rule.type === "boolean") promptType = "confirm";
        if (rule.type === "number") promptType = "number";
        if (key.includes("PASSWORD") || key.includes("SECRET")) promptType = "password";

        const response = await prompts({
            type: promptType,
            name: "value",
            message: `${key}${rule.description ? ` (${rule.description})` : ""}:`,
            initial: promptType === "confirm" ? initial === "true" : initial,
            validate: (val) => {
                const strVal = String(val);
                const error = validateValue(key, strVal, rule, "local"); // Assuming 'local' context for now
                return error || true;
            }
        });

        // Handle user cancellation (Ctrl+C)
        if (response.value === undefined) {
            console.log("\nSetup cancelled.");
            process.exit(1);
        }

        newValues[key] = String(response.value);
    }

    return newValues;
}
