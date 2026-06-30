import { describe, it, expect } from "vitest";
import { validateValue } from "../src/engine/validator";
import type { Rule } from "../src/types";

const dev = "development";
const prod = "production";

describe("validateValue — required", () => {
  it("returns error when required value is empty", () => {
    expect(validateValue("FOO", "", { type: "string" }, dev)).toBe("FOO is required");
  });

  it("returns null when optional value is empty", () => {
    expect(validateValue("FOO", "", { type: "string", required: false }, dev)).toBeNull();
  });
});

describe("validateValue — number", () => {
  const rule: Rule = { type: "number", min: 1024, max: 65535 };

  it("accepts a valid number", () => {
    expect(validateValue("PORT", "3000", rule, dev)).toBeNull();
  });

  it("rejects a non-numeric string", () => {
    expect(validateValue("PORT", "abc", rule, dev)).toMatch(/must be a number/);
  });

  it("rejects a value below min", () => {
    expect(validateValue("PORT", "80", rule, dev)).toMatch(/at least 1024/);
  });

  it("rejects a value above max", () => {
    expect(validateValue("PORT", "99999", rule, dev)).toMatch(/at most 65535/);
  });
});

describe("validateValue — string length", () => {
  const rule: Rule = { type: "string", min: 3, max: 10 };

  it("accepts a valid length", () => {
    expect(validateValue("NAME", "hello", rule, dev)).toBeNull();
  });

  it("rejects too short", () => {
    expect(validateValue("NAME", "ab", rule, dev)).toMatch(/at least 3/);
  });

  it("rejects too long", () => {
    expect(validateValue("NAME", "toolongvalue", rule, dev)).toMatch(/at most 10/);
  });
});

describe("validateValue — boolean", () => {
  const rule: Rule = { type: "boolean" };

  it("accepts true", () => {
    expect(validateValue("FLAG", "true", rule, dev)).toBeNull();
  });

  it("accepts false", () => {
    expect(validateValue("FLAG", "false", rule, dev)).toBeNull();
  });

  it("rejects non-boolean", () => {
    expect(validateValue("FLAG", "yes", rule, dev)).toMatch(/true or false/);
  });

  it("enforces mustBeFalseIn production", () => {
    const r: Rule = { type: "boolean", mustBeFalseIn: "production" };
    expect(validateValue("DEBUG", "true", r, prod)).toMatch(/must be false in production/);
    expect(validateValue("DEBUG", "false", r, prod)).toBeNull();
  });
});

describe("validateValue — enum", () => {
  const rule: Rule = { type: "enum", values: ["development", "staging", "production"] };

  it("accepts a valid value", () => {
    expect(validateValue("NODE_ENV", "staging", rule, dev)).toBeNull();
  });

  it("rejects an unlisted value", () => {
    expect(validateValue("NODE_ENV", "test", rule, dev)).toMatch(/must be one of/);
  });
});

describe("validateValue — email", () => {
  const rule: Rule = { type: "email" };

  it("accepts a valid email", () => {
    expect(validateValue("EMAIL", "user@example.com", rule, dev)).toBeNull();
  });

  it("rejects an invalid email", () => {
    expect(validateValue("EMAIL", "not-an-email", rule, dev)).toMatch(/valid email/);
  });
});

describe("validateValue — url", () => {
  const rule: Rule = { type: "url" };

  it("accepts a valid URL", () => {
    expect(validateValue("DB_URL", "https://db.example.com", rule, dev)).toBeNull();
  });

  it("accepts a postgres connection string", () => {
    expect(validateValue("DB_URL", "postgres://user:pass@host:5432/db", rule, dev)).toBeNull();
  });

  it("rejects an invalid URL", () => {
    expect(validateValue("DB_URL", "not a url", rule, dev)).toMatch(/valid URL/);
  });
});

describe("validateValue — regex", () => {
  const rule: Rule = { type: "regex", regex: "^sk_(test|live)_[0-9a-zA-Z]{24}$" };

  it("accepts a matching value", () => {
    expect(validateValue("API_KEY", "TEST_SECRET", rule, dev)).toBeNull();
  });

  it("rejects a non-matching value", () => {
    expect(validateValue("API_KEY", "pk_wrong_key", rule, dev)).toMatch(/required pattern/);
  });
});

describe("validateValue — mustBeTrueIn", () => {
  it("enforces mustBeTrueIn production when value is false", () => {
    const r: Rule = { type: "boolean", mustBeTrueIn: "production" };
    expect(validateValue("FEATURE_ENABLED", "false", r, prod)).toMatch(/must be true in production/);
  });

  it("passes when mustBeTrueIn value is true in matching env", () => {
    const r: Rule = { type: "boolean", mustBeTrueIn: "production" };
    expect(validateValue("FEATURE_ENABLED", "true", r, prod)).toBeNull();
  });

  it("does not enforce mustBeTrueIn in a different env", () => {
    const r: Rule = { type: "boolean", mustBeTrueIn: "production" };
    expect(validateValue("FEATURE_ENABLED", "false", r, dev)).toBeNull();
  });
});

describe("validateValue — entropy / secret strength", () => {
  it("rejects a low-entropy password", () => {
    expect(validateValue("DB_PASSWORD", "aaaaaaaaa", { type: "string", checkSecretStrength: true }, dev))
      .toMatch(/low entropy/);
  });

  it("accepts a high-entropy secret", () => {
    expect(validateValue("DB_PASSWORD", "xK9#mP2$qL7vN5wR", { type: "string", checkSecretStrength: true }, dev))
      .toBeNull();
  });

  it("auto-triggers entropy check on keys named *PASSWORD*", () => {
    expect(validateValue("DB_PASSWORD", "aaaaaaaaa", { type: "string" }, dev))
      .toMatch(/low entropy/);
  });

  it("auto-triggers entropy check on keys named *SECRET*", () => {
    expect(validateValue("APP_SECRET", "aaaaaaaaa", { type: "string" }, dev))
      .toMatch(/low entropy/);
  });

  it("requires 8+ chars in production even if entropy is ok", () => {
    expect(validateValue("DB_PASSWORD", "ab3#X", { type: "string", checkSecretStrength: true }, prod))
      .toMatch(/at least 8 characters/);
  });
});
