import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { detectFramework, getFrameworkWarnings } from "../src/engine/frameworkChecker";

const TMP_DIR = path.join(process.cwd(), "_tmp_fw_test");

function writePkg(deps: Record<string, string>) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(TMP_DIR, "package.json"),
    JSON.stringify({ dependencies: deps })
  );
}

describe("detectFramework", () => {
  beforeEach(() => fs.mkdirSync(TMP_DIR, { recursive: true }));
  afterEach(() => fs.rmSync(TMP_DIR, { recursive: true, force: true }));

  it("returns 'nextjs' when 'next' is in dependencies", () => {
    writePkg({ next: "^14.0.0" });
    expect(detectFramework(TMP_DIR)).toBe("nextjs");
  });

  it("returns 'vite' when 'vite' is in dependencies", () => {
    writePkg({ vite: "^5.0.0" });
    expect(detectFramework(TMP_DIR)).toBe("vite");
  });

  it("returns 'cra' when 'react-scripts' is in dependencies", () => {
    writePkg({ "react-scripts": "5.0.1" });
    expect(detectFramework(TMP_DIR)).toBe("cra");
  });

  it("returns 'none' when no known framework is present", () => {
    writePkg({ express: "^4.0.0" });
    expect(detectFramework(TMP_DIR)).toBe("none");
  });

  it("returns 'none' when package.json does not exist", () => {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
    expect(detectFramework(TMP_DIR)).toBe("none");
  });

  it("returns 'none' when package.json is malformed JSON", () => {
    fs.mkdirSync(TMP_DIR, { recursive: true });
    fs.writeFileSync(path.join(TMP_DIR, "package.json"), "{ not valid json }");
    expect(detectFramework(TMP_DIR)).toBe("none");
  });
});

describe("getFrameworkWarnings", () => {
  it("warns when NEXT_PUBLIC_ key looks like a secret", () => {
    const warnings = getFrameworkWarnings(
      ["NEXT_PUBLIC_API_KEY", "NEXT_PUBLIC_TITLE"],
      "nextjs"
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/NEXT_PUBLIC_API_KEY/);
    expect(warnings[0]).toMatch(/exposed to the browser/);
  });

  it("does not warn for safe NEXT_PUBLIC_ keys", () => {
    const warnings = getFrameworkWarnings(["NEXT_PUBLIC_APP_NAME", "NEXT_PUBLIC_LOCALE"], "nextjs");
    expect(warnings).toHaveLength(0);
  });

  it("warns on VITE_ prefix with secret key names", () => {
    const warnings = getFrameworkWarnings(["VITE_SECRET_TOKEN", "VITE_TITLE"], "vite");
    expect(warnings.some(w => w.includes("VITE_SECRET_TOKEN"))).toBe(true);
    expect(warnings.some(w => w.includes("VITE_TITLE"))).toBe(false);
  });

  it("warns on REACT_APP_ prefix with secret key names", () => {
    const warnings = getFrameworkWarnings(["REACT_APP_PASSWORD", "REACT_APP_THEME"], "cra");
    expect(warnings.some(w => w.includes("REACT_APP_PASSWORD"))).toBe(true);
    expect(warnings.some(w => w.includes("REACT_APP_THEME"))).toBe(false);
  });

  it("returns empty array when framework is 'none'", () => {
    expect(getFrameworkWarnings(["SECRET_KEY", "NEXT_PUBLIC_TOKEN"], "none")).toHaveLength(0);
  });

  it("does not warn for non-prefixed secret keys", () => {
    const warnings = getFrameworkWarnings(["SECRET_KEY", "DATABASE_PASSWORD"], "nextjs");
    expect(warnings).toHaveLength(0);
  });
});
