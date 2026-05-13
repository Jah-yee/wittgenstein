#!/usr/bin/env node
// CI guard: verify no file under packages/<pkg>/src/ imports from
// research/. The training stack lives in research/training/ and MUST
// stay outside the npm publish surface — packages depend on
// core/codec-* only, never on training code.
//
// Per the delivery doctrine
// (docs/research/2026-05-13-delivery-and-componentization.md):
//
//     Training scripts may import from packages/<pkg> (one-way dep,
//     contributor uses the harness inside training jobs). No file
//     under packages/<pkg>/src/ may import from research/.
//
// Run: node scripts/check-no-research-imports.mjs
// Exits 0 on clean, 1 on any forbidden import.

import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const packagesDir = resolve(repoRoot, "packages");

const IMPORT_PATTERNS = [
  /\bfrom\s+["']([^"']+)["']/g,
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
];

const SKIP_DIRS = new Set(["node_modules", "dist", ".tsbuildinfo", "__snapshots__"]);

async function* walkSource(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkSource(path);
    } else if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry.name)) {
      yield path;
    }
  }
}

function findImports(text) {
  const out = new Set();
  for (const pattern of IMPORT_PATTERNS) {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(text)) !== null) {
      out.add(m[1]);
    }
  }
  return out;
}

function normalizeRel(path) {
  return path.split("\\").join("/");
}

function isResearchRel(rel) {
  const normalized = normalizeRel(rel);
  return normalized === "research" || normalized.startsWith("research/");
}

function importsResearch(specifier, filePath) {
  // Relative imports: resolve and check if the target lands inside research/.
  if (specifier.startsWith(".")) {
    const targetAbs = resolve(dirname(filePath), specifier);
    return isResearchRel(relative(repoRoot, targetAbs));
  }
  // Absolute import specifiers: catch repo-root `/research/...` imports and
  // absolute filesystem paths that resolve inside this checkout's research/.
  if (specifier.startsWith("/")) {
    if (specifier === "/research" || specifier.startsWith("/research/")) {
      return true;
    }
    return isResearchRel(relative(repoRoot, specifier));
  }
  // Package names: look for any hint at "research" — we don't publish a
  // @wittgenstein/research package, so any such bare specifier is a leak.
  return /^research\/|^@wittgenstein\/training\//.test(specifier);
}

async function main() {
  const violations = [];
  try {
    await stat(packagesDir);
  } catch {
    process.stdout.write("ℹ no packages/ directory — nothing to check.\n");
    process.exit(0);
  }

  // Walk each packages/*/src/ tree.
  const packageEntries = await readdir(packagesDir, { withFileTypes: true });
  for (const pkg of packageEntries) {
    if (!pkg.isDirectory()) continue;
    const srcDir = resolve(packagesDir, pkg.name, "src");
    try {
      await stat(srcDir);
    } catch {
      continue;
    }
    for await (const file of walkSource(srcDir)) {
      const text = await readFile(file, "utf8");
      const imports = findImports(text);
      for (const spec of imports) {
        if (importsResearch(spec, file)) {
          violations.push({
            file: relative(repoRoot, file),
            spec,
          });
        }
      }
    }
  }

  if (violations.length === 0) {
    process.stdout.write("✓ no packages/*/src file imports from research/.\n");
    process.exit(0);
  }

  process.stderr.write(`✗ ${violations.length} forbidden research/ import(s):\n\n`);
  for (const v of violations) {
    process.stderr.write(`  ${v.file}\n    imports: ${v.spec}\n`);
  }
  process.stderr.write(
    "\nTraining code lives in research/training/ and stays outside the\n" +
      "npm publish surface. See docs/research/2026-05-13-delivery-and-componentization.md.\n",
  );
  process.exit(1);
}

main().catch((error) => {
  process.stderr.write(`check-no-research-imports crashed: ${error?.message ?? String(error)}\n`);
  process.exit(2);
});
