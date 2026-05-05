# Handoff — M2 Slice C2: Kokoro-82M backend wiring

**Tracked:** Issue #116. **Phase:** v0.3 / Phase 2 (Audio codec v2).
**Predecessors (merged):** Slice A codec-owned routing (#93), Slice B route helpers (#94), Slice C1 audioRender manifest schema (#95), Slice C3 parity goldens (#121), Slice D soft-warn (#96).
**Successor:** Slice E sweep verification (#118) — cross-platform determinism gate.

---

## Goal

Replace `decoderId = "procedural-audio-runtime"` with a real `kokoro-82M:<weights-sha256>` path, gated behind `WITTGENSTEIN_AUDIO_BACKEND=kokoro`. The default backend stays `procedural`. **Do not flip the default** — Slice E #118 is the gate that flips it once cross-platform determinism is verified.

## Library choice (this changes the prior handoff)

Use [`kokoro-js`](https://www.npmjs.com/package/kokoro-js) (npm). It is the maintained JS wrapper around `onnx-community/Kokoro-82M-ONNX` (Apache-2.0), with **bundled JS phonemizer** — no Python, no `espeak-ng`, no `misaki`, no direct `onnxruntime-node` integration. Prior handoff in `docs/handoff/workflow-md-spec.md`-era assumed direct ONNX wiring; that path is over-engineered. Reuse the existing pattern.

```ts
import { KokoroTTS } from "kokoro-js";

const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-ONNX", {
  dtype: "fp32", // NOT q8 — quantization breaks byte-determinism
});
const audio = await tts.generate(text, { voice: "af_bella" }); // pin one default voice
```

**dtype must be `fp32`.** Brief I §H I.7 commits to CPU byte-parity for the byte-parity routes; q8 quantization introduces platform-specific rounding and would break that contract. fp16 has the same risk.

## Reads (in order, then stop)

1. `docs/research/briefs/I_audio_codec_landscape.md` §H I.1 + §H I.7 + §Verdict — decoder rationale + CPU byte-parity / GPU structural-parity contract.
2. `docs/adrs/0015-audio-decoder-family.md` — ratified decoder choice.
3. `docs/research/briefs/J_audio_engineering_and_routes.md` §Verdict 3 + §Verdict 4 — manifest field shape and fixture-class verdicts.
4. `packages/codec-audio/src/codec.ts` — current `procedural-audio-runtime` placeholder (lines 296, 304, 337).
5. `packages/codec-audio/src/types.ts` line 31 — the `Kokoro-82M-family-decoder` union member is already declared; no type change needed.
6. `packages/codec-audio/test/parity.test.ts` — existing fixture / assertion shape to extend.
7. [`onnx-community/Kokoro-82M-ONNX` model card](https://huggingface.co/onnx-community/Kokoro-82M-ONNX) — license, voice list, dtype catalog.

If you find yourself reading anything outside this list, stop and re-anchor on the goal.

## Files you will touch

- `packages/codec-audio/package.json` — add `kokoro-js` (latest stable; pin exact version + commit the pnpm lockfile change).
- `packages/codec-audio/src/decoders/kokoro/index.ts` — **new**. Single-pass `KokoroTTS.from_pretrained(...)` + `tts.generate(text, { voice })` returning Float32 PCM at Kokoro's native rate (24 kHz). Singleton TTS instance to amortize model load.
- `packages/codec-audio/src/decoders/kokoro/manifest.json` — **new**. Pin `repoId: "onnx-community/Kokoro-82M-ONNX"`, `weightsFilename`, `weightsSha256`, `voicesFilename`, `voicesSha256`, `voiceDefault: "af_bella"`, `dtype: "fp32"`, `kokoroJsVersion`. Compute SHA-256 of the actual downloaded files on first run + verify on subsequent runs.
- `packages/codec-audio/src/codec.ts` — branch on `process.env.WITTGENSTEIN_AUDIO_BACKEND === "kokoro"`. When engaged, `decoderId = \`kokoro-82M:${weightsSha256}\``and`decoderHash = hashString(decoderId)`. Default falls through to `procedural-audio-runtime` (do NOT touch lines 304 / 337's else branch).
- `packages/codec-audio/test/kokoro-determinism.test.ts` — **new**. Three back-to-back invocations with the same seed produce byte-identical WAV. **Skip in CI when weights are not cached** (use `process.env.CI` + cache-existence check). The Kokoro test is local-opt-in until Slice E.

## Done when

- `pnpm --filter @wittgenstein/codec-audio test` is green with both `WITTGENSTEIN_AUDIO_BACKEND=procedural` (default; CI runs this) and `=kokoro` (local-only OK at Slice C2; CI's kokoro job stays opt-in until Slice E).
- `WITTGENSTEIN_AUDIO_BACKEND=kokoro pnpm cli tts "hello" --seed 7 --dry-run` writes a manifest with:
  - `audioRender.decoderId = "kokoro-82M:<sha>"`
  - `audioRender.decoderHash` set
  - `audioRender.determinismClass: "structural-parity"` (Slice C2 stays structural; Slice E may flip to byte-parity once cross-platform verified)
- Three back-to-back invocations of the line above on the same machine produce byte-identical WAV (CPU determinism probe — the local single-machine version of Brief I §H I.7).
- `decoderId = "procedural-audio-runtime"` still appears as the default when the env var is unset. **Default flip is Slice E's gate, not yours.**
- `pnpm typecheck`, `pnpm lint`, `pnpm test` (without the env var) all green.

## Out of scope

- GPU backend. CPU only at this slice; GPU is structural-parity by design (Brief I §H I.7).
- Voice cloning.
- New routes.
- Flipping the default backend (Slice E).
- Cross-platform (macOS / Linux / Windows) determinism testing — that is Slice E's gate.
- Any change to `audioRender` schema (Slice C1 #95 locked it; types.ts line 31's union is already correct).
- Any direct `onnxruntime-node` integration — use `kokoro-js`.
- Re-litigating Brief I or ADR-0015.

## Hard constraints (from doctrine; non-negotiable)

- **Manifest spine**: every run writes git SHA, lockfile hash, seed, full LLM I/O if any (Kokoro takes no LLM input — it's the renderer, not the planner), artifact SHA-256. Failures still write a manifest (`docs/hard-constraints.md`).
- **No silent fallbacks**: if Kokoro fails to load weights, return a structured error with a populated manifest. **Do not** silently fall back to procedural — that would lie about which decoder ran.
- **Schema-first**: zod-parse anything Kokoro returns at the boundary if it has structure beyond raw PCM (it doesn't, but the discipline applies).
- **Codec packages depend on `@wittgenstein/schemas` only**; `kokoro-js` is fine because it's an external runtime dep, not a sibling codec. The codec-cruiser CI rule will verify (PR #126).
- **fp32 only** at this slice. q8/fp16 are revisitable in v0.4 if Slice E proves cross-platform determinism is solid; until then they're forbidden.

## If the determinism probe fails

Stop. Do **not** ship the slice with a non-deterministic Kokoro path under the `kokoro` backend name — that would lie. File the finding in Issue #116 with the exact platform / Node version / kokoro-js version / dtype. Hand off to Slice E (#118), which decides whether Piper takes over (Brief I §H I.2) or full procedural fallback fires (Brief I sweep-level kill criterion).

## Open the PR

- Engineering lane (Brief I → ADR-0015 → exec-plan §M2 → code; this slice is the code step).
- Reference Issue #116 in the PR body.
- Cite Brief I §H I.1 + ADR-0015 in the PR body — execution under ratified verdict, not new doctrine.
- Per ADR-0013, `packages/codec-audio/*` is not on the doctrine-bearing list explicitly, but the manifest contract surface (`audioRender` shape, `decoderId` semantics) is shared protocol. Independent second review pass strongly recommended even though not strictly required by §1.
- PR title pattern: `feat(audio): wire Kokoro-82M backend (M2 Slice C2, closes #116)`

## What success looks like (one paragraph)

After this slice merges, a developer with a fresh checkout can `WITTGENSTEIN_AUDIO_BACKEND=kokoro pnpm cli tts "hello" --seed 7 --out /tmp/k.wav --dry-run`, get a real WAV from a real neural TTS, see `audioRender.decoderId: "kokoro-82M:<sha>"` in the manifest, and re-run the command three times to get byte-identical bytes. The default `tts` invocation still runs procedural (decoderId unchanged) so no existing user surface breaks. Slice E then takes the same workflow across macOS arm64 + Linux x64 and decides whether to promote `kokoro` to default or trip Brief I's fallback path.
