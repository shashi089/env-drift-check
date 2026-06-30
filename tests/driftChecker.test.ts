import { describe, it, expect } from "vitest";
import { checkDrift } from "../src/engine/driftChecker";
import type { Config } from "../src/types";

const emptyConfig: Config = { rules: {} };

describe("checkDrift — missing / extra keys", () => {
  it("detects keys present in base but missing from target", () => {
    const result = checkDrift({ A: "", B: "" }, { A: "1" }, emptyConfig);
    expect(result.missing).toContain("B");
    expect(result.missing).not.toContain("A");
  });

  it("detects keys present in target but absent from base", () => {
    const result = checkDrift({ A: "" }, { A: "1", GHOST: "2" }, emptyConfig);
    expect(result.extra).toContain("GHOST");
  });

  it("reports no issues when keys match exactly", () => {
    const result = checkDrift({ A: "1" }, { A: "1" }, emptyConfig);
    expect(result.missing).toHaveLength(0);
    expect(result.extra).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });
});

describe("checkDrift — value mismatches", () => {
  it("detects when values differ between base and target", () => {
    const result = checkDrift({ PORT: "3000" }, { PORT: "8080" }, emptyConfig);
    const m = result.mismatches.find(x => x.key === "PORT");
    expect(m).toBeDefined();
    expect(m?.expected).toBe("3000");
    expect(m?.actual).toBe("8080");
  });

  it("does not flag a mismatch when values are equal", () => {
    const result = checkDrift({ PORT: "3000" }, { PORT: "3000" }, emptyConfig);
    expect(result.mismatches).toHaveLength(0);
  });
});

describe("checkDrift — schema validation", () => {
  it("runs type validation and surfaces errors", () => {
    const config: Config = {
      rules: { PORT: { type: "number", min: 1024, max: 65535 } }
    };
    const result = checkDrift({ PORT: "" }, { PORT: "abc", NODE_ENV: "development" }, config);
    expect(result.errors.some(e => e.key === "PORT")).toBe(true);
  });

  it("reports deprecation warnings", () => {
    const config: Config = {
      rules: { OLD_KEY: { type: "string", deprecated: "Use NEW_KEY instead." } }
    };
    const result = checkDrift({ OLD_KEY: "" }, { OLD_KEY: "val" }, config);
    expect(result.warnings.some(w => w.includes("NEW_KEY"))).toBe(true);
  });

  it("reports no errors for a valid value", () => {
    const config: Config = {
      rules: { PORT: { type: "number" } }
    };
    const result = checkDrift({ PORT: "" }, { PORT: "3000" }, config);
    expect(result.errors).toHaveLength(0);
  });
});

describe("checkDrift — default values", () => {
  it("does not mark a key as missing when it has a default", () => {
    const config: Config = { rules: { PORT: { type: "number", default: "3000" } } };
    const result = checkDrift({ PORT: "" }, {}, config);
    expect(result.missing).not.toContain("PORT");
  });

  it("validates the default value through schema rules", () => {
    const config: Config = { rules: { PORT: { type: "number", min: 1024, default: "80" } } };
    const result = checkDrift({ PORT: "" }, {}, config);
    expect(result.errors.some(e => e.key === "PORT")).toBe(true);
  });
});

describe("checkDrift — requiredIf conditional rules", () => {
  it("marks key as missing when requiredIf condition is met", () => {
    const config: Config = {
      rules: { OAUTH_CLIENT_ID: { type: "string", requiredIf: { AUTH_TYPE: "oauth" } } }
    };
    const result = checkDrift({ OAUTH_CLIENT_ID: "" }, { AUTH_TYPE: "oauth" }, config);
    expect(result.missing).toContain("OAUTH_CLIENT_ID");
  });

  it("does not mark key as missing when requiredIf condition is not met", () => {
    const config: Config = {
      rules: { OAUTH_CLIENT_ID: { type: "string", requiredIf: { AUTH_TYPE: "oauth" } } }
    };
    const result = checkDrift({ OAUTH_CLIENT_ID: "" }, { AUTH_TYPE: "local" }, config);
    expect(result.missing).not.toContain("OAUTH_CLIENT_ID");
  });
});

describe("checkDrift — systemEnv fallback", () => {
  it("treats process.env as the target when includeSystemEnv is true", () => {
    const original = process.env["TEST_SYS_KEY"];
    process.env["TEST_SYS_KEY"] = "injected";

    const config: Config = { includeSystemEnv: true, rules: {} };
    const result = checkDrift({ TEST_SYS_KEY: "" }, {}, config);
    expect(result.missing).not.toContain("TEST_SYS_KEY");

    if (original === undefined) delete process.env["TEST_SYS_KEY"];
    else process.env["TEST_SYS_KEY"] = original;
  });

  it("flags missing key when systemEnv is off and key is absent", () => {
    const result = checkDrift({ DEFINITELY_NOT_SET_XYZ: "" }, {}, emptyConfig);
    expect(result.missing).toContain("DEFINITELY_NOT_SET_XYZ");
  });
});
