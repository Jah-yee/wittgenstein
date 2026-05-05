# 0018 Explicit fallback discipline — planned, typed, receipt-bearing

## Status

Accepted (governance lane per ADR-0014; ratifies the fallback shape already emerging across audio, sensor, benchmarks, and workflow-facing agent practice).

## Context

Wittgenstein already carries several different kinds of fallback behavior, but until now the repo did not name the shared rule:

1. **Audio decoder family.** ADR-0015 names Kokoro as the primary speech decoder, Piper as the explicit fallback if Kokoro fails the parity gate, and procedural-only as the honest v0.3 floor if both fail the sweep.
2. **Sensor packaging.** `docs/codecs/sensor.md` already permits JSON + CSV to ship when the HTML dashboard layer is unavailable, provided the run records `quality.partial`.
3. **Metric / benchmark surfaces.** The active exec plan already names primary-vs-fallback metric pairs (for example VQAScore with CLIPScore fallback) and requires degraded evaluation to surface through `quality.partial` rather than masquerading as full-quality evidence.
4. **Untrusted-code execution boundary.** ADR-0016 already establishes a different class of "fallback": production engagement of the painter path must hard-error rather than silently falling through to the research-grade subprocess sandbox.

The repo's hard constraints already say "no silent fallbacks," but that rule alone does not tell contributors what to do when a primary path is blocked. In practice, that ambiguity creates two failure modes:

- agents improvise convenience behavior that changes artifact semantics without doctrine,
- or contributors avoid any degradation path at all, even when a narrow, honest fallback would preserve useful progress.

The point of this ADR is to make fallback discipline explicit for maintainers and agents without weakening the manifest spine or the "decoder is not generator" thesis.

## Decision

1. **Fallbacks are allowed only when they are explicit, contract-preserving, and receipt-bearing.** A fallback is not "whatever still works." It is a pre-declared branch that preserves the repo's truth contract, emits structured evidence, and does not lie about the artifact that actually ran.

2. **Fallbacks in Wittgenstein fall into four classes:**
   - **Same-contract fallback** — the modality contract stays the same while the concrete backend changes. Example: Kokoro → Piper inside speech TTS.
   - **Partial-output fallback** — the core artifact remains valid, but an auxiliary layer is missing or degraded. Example: sensor CSV + JSON emit while the HTML dashboard is unavailable.
   - **Evaluation fallback** — the evaluation surface degrades to a weaker but named metric or evidence path. Example: primary metric unavailable, fallback metric recorded as degraded evidence.
   - **Hard-stop fallback** — the correct behavior is to stop rather than silently downgrade into an unsafe or doctrine-breaking path. Example: production painter execution refusing to fall through to the research-grade subprocess sandbox.

3. **Ad hoc fallback invention is not allowed in implementation work.** If a fallback changes user-visible behavior, artifact semantics, default backend selection, determinism claims, or evaluation meaning, it must already exist in the relevant brief / ADR / exec-plan / issue scope. Agents and implementers may execute a ratified fallback tree; they may not quietly design a new one inside a feature PR.

4. **Every engaged fallback must leave receipts.** At minimum, the run record must make the degraded path auditable through the manifest and/or structured warning/error surface. The exact fields vary by modality, but the fallback must surface enough truth to answer:
   - what primary path was intended,
   - what fallback actually ran,
   - whether output quality or determinism changed,
   - why the fallback was taken.

   Typical evidence includes `decoderId`, `determinismClass`, `quality.partial`, structured warnings, and structured errors. Silence is non-conformant.

5. **Simplification fallback is allowed only when the reduced path still tells the truth.** Removing a non-essential layer to preserve a smaller honest artifact is valid; substituting a different artifact class and pretending it is the target is not. This preserves the repo's existing bans on raster-image escape hatches and other convenience paths that would hide research dependencies.

6. **When no ratified fallback exists, the correct behavior is to stop and escalate.** A structured failure with a manifest is better than an undocumented convenience path. "Fail loudly" remains part of fallback policy, not an exception to it.

## Consequence

- `docs/engineering-discipline.md` carries a short inline summary telling contributors to classify blocked paths as same-contract / partial-output / evaluation / hard-stop, and to refuse ad hoc fallback invention.
- `WORKFLOW.md` carries a maintainer / orchestrator rule: before dispatch, confirm whether the task already has a ratified fallback tree; during execution, agents may take only those explicit branches and must leave receipts when they do.
- `AGENTS.md` carries a single-pointer reminder in its working rules so first-contact agents do not confuse "high agency" with "make up a fallback."
- Future fallback additions that materially change artifact semantics or evaluation meaning still go through the appropriate lane. This ADR governs the shared discipline, not every individual fallback tree.
- Existing doctrine remains intact:
  - no second raster image path,
  - no silent fallback,
  - manifest spine remains mandatory,
  - hard-stop boundaries such as ADR-0016 stay load-bearing.
