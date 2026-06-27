import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { parseEnv } from "../src/engine/envParser";

const TMP = path.join(os.tmpdir(), "env-drift-check-parser-tests");

beforeAll(() => fs.mkdirSync(TMP, { recursive: true }));
afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }));

function write(name: string, content: string): string {
  const p = path.join(TMP, name);
  fs.writeFileSync(p, content);
  return p;
}

describe("parseEnv", () => {
  it("parses simple key=value pairs", () => {
    const f = write("simple.env", "PORT=3000\nHOST=localhost\n");
    expect(parseEnv(f)).toEqual({ PORT: "3000", HOST: "localhost" });
  });

  it("skips blank lines and comments", () => {
    const f = write("comments.env", "# comment\n\nFOO=bar\n");
    expect(parseEnv(f)).toEqual({ FOO: "bar" });
  });

  it("strips inline comments from unquoted values", () => {
    const f = write("inline.env", "FOO=bar # inline comment\n");
    expect(parseEnv(f)).toEqual({ FOO: "bar" });
  });

  it("preserves spaces inside double-quoted values", () => {
    const f = write("dquote.env", 'NAME="hello world"\n');
    expect(parseEnv(f)).toEqual({ NAME: "hello world" });
  });

  it("preserves spaces inside single-quoted values", () => {
    const f = write("squote.env", "NAME='hello world'\n");
    expect(parseEnv(f)).toEqual({ NAME: "hello world" });
  });

  it("handles values with equals signs", () => {
    const f = write("equals.env", "URL=postgres://user:pass@host/db?a=1\n");
    expect(parseEnv(f)).toEqual({ URL: "postgres://user:pass@host/db?a=1" });
  });

  it("handles empty values", () => {
    const f = write("empty.env", "EMPTY=\n");
    expect(parseEnv(f)).toEqual({ EMPTY: "" });
  });

  it("handles CRLF line endings", () => {
    const f = write("crlf.env", "A=1\r\nB=2\r\n");
    expect(parseEnv(f)).toEqual({ A: "1", B: "2" });
  });

  it("throws when file does not exist", () => {
    expect(() => parseEnv(path.join(TMP, "nonexistent.env"))).toThrow("Env file not found");
  });

  it("handles keys with no value (just KEY=)", () => {
    const f = write("novalue.env", "KEY=\n");
    expect(parseEnv(f)["KEY"]).toBe("");
  });
});
