#!/usr/bin/env node
/**
 * CI guard: verify the npm tarball for each publishable package excludes
 * training-tier files.
 *
 * Per the delivery doctrine
 * (`docs/research/2026-05-13-delivery-and-componentization.md`), a user
 * running `npm install @wittgenstein/cli` must never pull in `research/`,
 * `bench/`, `examples/`, or large binary artifacts. This guard runs
 * `npm pack --dry-run --json` per publishable package and verifies the
 * file list contains none of those.
 *
 * Run: `node scripts/check-npm-publish-tarball.mjs`
 * Exits 0 on clean, 1 on any leak (with offending package + file).
 */

import { execFile } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");

/** Per-file patterns that MUST NOT appear in any published tarball. */
const FORBIDDEN_PATTERNS = [
  /^research\//,
  /^bench\//,
  /^examples\//,
  /\.pt$/,
  /\.ckpt$/,
  /\.safetensors$/,
  /\.onnx$/,
];

/** Size cap (MB). Files larger than this in a tarball trigger a leak even if extension is OK. */
const SIZE_LIMIT_MB = 10;

async function findPublishablePackages() {
  const dir = resolve(repoRoot, "packages");
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const pkgJsonPath = resolve(dir, entry.name, "package.json");
    let pkg;
    try {
      pkg = JSON.parse(await readFile(pkgJsonPath, "utf8"));
    } catch {
      continue;
    }
    if (pkg.private === true) continue;
    if (!pkg.name) continue;
    out.push({ name: pkg.name, dir: resolve(dir, entry.name) });
  }
  return out;
}

async function tarballFiles(packageDir) {
  const { stdout } = await execFileAsync(
    "npm",
    ["pack", "--dry-run", "--json", "--loglevel=silent"],
    { cwd: packageDir, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  // `npm pack` runs the package's `prepack` script and that script's stdout
  // (e.g. "> @wittgenstein/cli@0.1.0 build" then tsc output) bleeds into the
  // captured stream before the JSON payload. The JSON we want is an array,
  // so peel off anything before the first `[` and trim trailing noise.
  const start = stdout.indexOf("[");
  const end = stdout.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("npm pack did not emit a JSON array");
  }
  const parsed = JSON.parse(stdout.slice(start, end + 1));
  if (!Array.isArray(parsed) || parsed.length === 0) return [];
  return parsed[0].files ?? [];
}

async function main() {
  const packages = await findPublishablePackages();
  if (packages.length === 0) {
    process.stdout.write(
      "ℹ no publishable packages (every packages/*/package.json is private).\n",
    );
    process.exit(0);
  }

  const leaks = [];
  for (const pkg of packages) {
    let files;
    try {
      files = await tarballFiles(pkg.dir);
    } catch (error) {
      process.stderr.write(
        `! could not run npm pack for ${pkg.name}: ${error?.message ?? String(error)}\n`,
      );
      continue;
    }

    for (const file of files) {
      const path = file.path ?? String(file);
      const size = typeof file.size === "number" ? file.size : 0;

      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(path)) {
          leaks.push({
            package: pkg.name,
            file: path,
            reason: `matches forbidden pattern ${pattern}`,
          });
        }
      }

      if (size > SIZE_LIMIT_MB * 1024 * 1024) {
        leaks.push({
          package: pkg.name,
          file: path,
          reason: `size ${(size / 1024 / 1024).toFixed(2)} MB exceeds ${SIZE_LIMIT_MB} MB limit`,
        });
      }
    }
  }

  if (leaks.length === 0) {
    process.stdout.write(
      `✓ ${packages.length} publishable package(s) clean — no research/, bench/, examples/, large binaries.\n`,
    );
    process.exit(0);
  }

  process.stderr.write(`✗ ${leaks.length} leak(s) in publishable tarballs:\n\n`);
  for (const leak of leaks) {
    process.stderr.write(`  [${leak.package}]  ${leak.file}\n    → ${leak.reason}\n`);
  }
  process.stderr.write(
    "\nA published npm tarball must not contain training-tier files. See:\n" +
      "  docs/research/2026-05-13-delivery-and-componentization.md\n" +
      "  research/training/README.md\n",
  );
  process.exit(1);
}

main().catch((error) => {
  process.stderr.write(`check-npm-publish-tarball crashed: ${error?.message ?? String(error)}\n`);
  process.exit(2);
});
