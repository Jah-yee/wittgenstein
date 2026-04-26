import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("harness modality blindness", () => {
  it("does not branch on request.modality === image", async () => {
    const source = await readFile(
      resolve(process.cwd(), "packages/core/src/runtime/harness.ts"),
      "utf8",
    );
    expect(source.includes('request.modality === "image"')).toBe(false);
  });
});
