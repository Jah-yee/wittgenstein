# M2 Slice E Kokoro Sweep Verdict — 2026-05-06

**Status:** release-facing receipt for Issue #118  
**Inputs:** macOS local sweep, Linux GitHub Actions sweep from Issue #164 / PR #181  
**Verdict:** Kokoro is same-platform deterministic but not cross-platform byte-identical.

This receipt closes the M2 Slice E question without pretending the result is cleaner than it is.
The Kokoro backend is useful and deterministic within each tested platform, but the same seed
does not produce byte-identical WAV bytes across macOS arm64 and Linux x64.

## Commands

macOS:

```sh
pnpm sweep:audio-kokoro -- --out artifacts/tmp/kokoro-sweep-macos-current.json
```

Linux:

```sh
gh workflow run kokoro-sweep.yml -f runs=3 -f seed=7
```

Workflow run:

- <https://github.com/p-to-q/wittgenstein/actions/runs/25421565027>

## macOS Receipt

```json
{
  "ok": true,
  "platform": {
    "os": "darwin",
    "arch": "arm64",
    "release": "25.5.0",
    "node": "v22.20.0"
  },
  "backend": "kokoro",
  "seed": 7,
  "runsRequested": 3,
  "uniqueArtifactShaCount": 1,
  "artifactSha256": "d67ff7e5a0a3773b034db3c7347f0bc98782e3b93d4b3e48b6eca1002e18d3cc"
}
```

## Linux Receipt

```json
{
  "ok": true,
  "platform": {
    "os": "linux",
    "arch": "x64",
    "release": "6.17.0-1010-azure",
    "node": "v20.19.0"
  },
  "backend": "kokoro",
  "seed": 7,
  "runsRequested": 3,
  "uniqueArtifactShaCount": 1,
  "artifactSha256": "9e26275d17f4891108e8408cd22a20f5d14e42b64e662e661de5c36b5bd13316"
}
```

Both receipts report the same decoder evidence:

```json
{
  "sampleRateHz": 24000,
  "channels": 1,
  "durationSec": 4.55,
  "container": "wav",
  "bitDepth": 32,
  "determinismClass": "structural-parity",
  "decoderId": "kokoro-82M:53a71ac22a70778d57162e4f92eafc62852d9e04a4460b20638d2424796e6037",
  "decoderHash": "a13bb941e2560aaea824d1f6caf0fe3c509eb2d0c5c0b7b1f6b5c67e922bc143"
}
```

## Decision

- Kokoro same-platform determinism passes on macOS arm64 and Linux x64.
- Kokoro cross-platform byte identity does **not** pass:
  - macOS: `d67ff7e5a0a3773b034db3c7347f0bc98782e3b93d4b3e48b6eca1002e18d3cc`
  - Linux: `9e26275d17f4891108e8408cd22a20f5d14e42b64e662e661de5c36b5bd13316`
- For v0.3, keep `procedural-audio-runtime` as the default speech backend.
- Keep Kokoro opt-in behind `WITTGENSTEIN_AUDIO_BACKEND=kokoro`.
- Preserve Kokoro's manifest class as `determinismClass: "structural-parity"`.
- Do not claim Piper fallback is implemented; Piper remains the ADR-0015 fallback family if the project later chooses to wire it.

## Follow-Up

- Issue #151 should run the final cold-checkout receipt after this verdict lands.
- Issue #149 should write the final prerelease notes with this verdict, not the earlier "pending sweep" wording.
- Any future attempt to flip the speech default to Kokoro needs a new receipt or a deliberate decision that structural parity is acceptable for the default backend.
