# Research Program

**Status:** non-doctrine program map
**Stage:** post-v0.2 doctrine lock, post-M2 Slice C2 implementation, pre-Slice E verification
**Purpose:** show how engineering-borrow research, model/literature research, and
implementation-facing investigation fit together before the next execution gate.

This page is not a new decision surface. It is a map over existing surfaces so agents,
humans, and maintainers can see what has been investigated, what was adopted, and what
remains open without reconstructing the answer from chat or PR history.

Canonical decisions still live in RFCs and ADRs. Execution still lives in active
exec-plans, agent guides, and code.

---

## Research posture

Per [ADR-0019](adrs/0019-research-first-development-discipline.md), Wittgenstein treats
research as a default precursor to non-local engineering work. The repo uses three
research shapes.

1. **Broad research** evaluates path choice, object studies, decoder families,
   modality boundaries, benchmark framing, and thesis-adjacent background. It should
   name kill criteria and preserve uncertainty instead of sounding more settled than
   the evidence.
2. **Engineering-borrow research** looks at working systems and copies the smallest
   robust practice that fits this repo. It should prefer concrete source/docs over
   vibes, and it should say what not to copy.
3. **Implementation-facing investigation** resolves a concrete unknown inside an active
   slice: package choice, helper cut line, manifest receipt shape, verification plan,
   or reproducibility probe design.

All three kinds of research are useful only when they feed a specific downstream surface:

```text
finding -> note / brief -> RFC or ADR -> exec-plan / agent-guide -> code / issue
```

When the question is large, the research should also be large enough to settle it
honestly. A major decoder choice, benchmark stack, architectural cut line, or external
object comparison should not be reduced to a quick skim. The repo wants substantial
research where the decision surface is substantial.

Governance decisions use the separate lane from ADR-0014. This page does not create a
third lane; it names the research work that should happen before decisions and before
non-local implementation.

---

## Current closure assessment

### 1. Engineering-borrow review

The engineering-borrow requirement is mostly satisfied for the pre-M2 boundary.

| Area                     | Evidence                                                                                                                 | Adopted or preserved                                                                                                                             | Current judgment                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Codec Protocol v2        | Brief H surveyed unified, tRPC, LangChain Runnable, MCP SDK, Vercel AI SDK provider spec, unplugin, PostCSS, and ESLint. | Standard Schema input typing; typed warnings; sidecar; forkable context; stable lifecycle phases; declared warning ids; rejected practice block. | Closed enough for M0/M1A and safe to carry into M2.        |
| Image port               | `docs/agent-guides/image-port.md`, PR #68, and current `packages/codec-image` implementation.                            | `ImageCodec extends BaseCodec`; codec-authored manifest rows; sidecar warnings; single raster route; no second image path.                       | Closed.                                                    |
| Audio route architecture | Brief J surveyed Express, Hono, Fastify, tRPC, and Apollo Federation against current `codec-audio` code.                 | Flat codec-owned route table; helper-functions-first route collapse; no `BaseAudioRoute` unless duplication remains above threshold.             | Closed in doctrine and now implemented through M2 Slice D. |
| M2 execution memo        | `docs/research/m2-implementation-design-2026-04.md`.                                                                     | Route-local vs helper cut line; speech backend contract; parity contract; caller migration shape.                                                | Executed through Slice C2; Slice E is the remaining gate.  |
| Media/runtime references | TEN / Remotion / HyperFrames captured as future references in issue/audit discussion.                                    | Kept as horizon / engineering-borrow objects, not as M2 blockers.                                                                                | Not needed before M2.                                      |

Important nuance: this repo has **borrowed patterns**, not vendored external code. That is
the right choice at this stage. Pulling framework code into the repo before M2 would add
license and maintenance surface without solving the immediate audio-port problem.

### 2. Broad research

The model/literature requirement is also satisfied for the pre-M2 boundary.

| Area                       | Evidence                                        | Ratified or downstream owner                                                                            | Current judgment                                           |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Image decoder thesis       | Brief A, Brief G, ADR-0004, ADR-0005, ADR-0008. | Image path remains strict: structured scene -> adapter -> frozen decoder -> PNG.                        | Closed for M1A; M1B remains future decoder work.           |
| Codec protocol / IR stance | Brief B, Brief C, RFC-0001, ADR-0008.           | `Codec<Req, Art>.produce`, `Text \| Latent \| Hybrid` IR, only `Text` inhabited at v0.2.                | Closed for current port train.                             |
| CLI/runtime ergonomics     | Brief D, RFC-0002, ADR-0009, issue #77.         | CLI doctrine accepted; implementation still open but not an M2 blocker.                                 | Closed as doctrine, open as feature work.                  |
| Audio decoder family       | Brief I, ADR-0015.                              | Kokoro-82M-family default; Piper-family fallback; no v0.3 audio tokenizer; procedural soundscape/music. | Closed enough for M2, with parity tests as execution gate. |
| Audio engineering shape    | Brief J, #87 inventory, M2 implementation memo. | Helper-first route collapse; audio manifest fields; route deprecation window; parity split.             | Closed for M2 planning.                                    |

The remaining unknowns are execution checks, not missing research:

- Kokoro CPU byte-parity must be verified in M2.
- Piper fallback must be concretely pinned if Kokoro fails the gate.
- The sweep-level verdict must be recorded honestly in the manifest/docs surface before v0.3 cuts.

### 3. Implementation-facing investigation

This third research shape is easy to miss because it often looks like "execution prep,"
but it is one of the repo's most valuable habits. These are not broad object studies;
they are narrow investigations that make the next slice materially safer or clearer.

| Area                        | Evidence                                                 | Downstream use                                                             | Current judgment                         |
| --------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------- |
| M2 slice boundaries         | `docs/research/m2-implementation-design-2026-04.md`      | Drew the actual cut lines for Slice A/B/C1/C2/C3 before implementation.    | Landed and justified its keep.           |
| Cold-checkout verification  | `docs/research/2026-05-04-cold-checkout-verification.md` | Found the CLI entrypoint drift and turned it into a concrete follow-up PR. | Strong example of research serving code. |
| Per-slice handoff briefs    | `docs/handoff/*.md`                                      | Convert broad context into execution-ready prompts and bounded reads.      | Valuable when a slice is non-trivial.    |
| Slice E preflight reasoning | Issue #118 staged checklist and receipts plan            | Narrows the sweep before platform work begins.                             | Active and appropriately narrow.         |

---

## What is not closed at the current stage

These items are real, but they should not preempt Slice E.

| Item                                    | Why it stays open                                                          | Owner                                                        |
| --------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `#77` CLI/auth/doctor execution         | Ratified CLI doctrine exists, but this is a separate feature line.         | Future CLI execution PR.                                     |
| `#70` M1B image adapter/decoder bridge  | Depends on a usable LFQ-family decoder line; not needed for audio routing. | Future M1B research/implementation.                          |
| `#66` / `#67` horizon spikes            | Useful, deliberately speculative.                                          | Time-boxed future spikes.                                    |
| Long-form theory notes                  | Need clearer labels over time, but are not active execution guidance.      | Future reclassification pass if they start feeding new RFCs. |
| TEN / Remotion / HyperFrames comparison | Useful for future video/backend design, not an audio preflight blocker.    | Future video/backend brief or issue.                         |

---

## Engineering-quality gate before Slice E

Before running the sweep verdict, the repo should satisfy the following. As of
2026-05-05, it mostly does.

- No open PR blocks `#118`.
- `README.md`, `PROMPT.md`, `AGENTS.md`, `WORKFLOW.md`, implementation-status, and roadmap
  surfaces point to the same post-#116 / pre-#118 state.
- Brief I is ratified by ADR-0015.
- Brief J and the M2 implementation memo are subordinate to ADR-0015 and the active
  exec-plan, not standalone doctrine.
- Codec Protocol v2 is not types-only scaffolding: `BaseCodec.produce()` validates
  route matching and fails loudly when no route matches.
- `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass on main; release-facing receipts
  still need the final cold-checkout rerun and release-note pass.

---

## Recommendation

Run Slice E as planned: cross-platform sweep verification and honest verdict capture.

Do not start another broad research sweep before Slice E. The next research-like action
should happen inside M2 implementation only when code forces a concrete question, such
as the exact Kokoro/Piper package, weights, hash, or deterministic backend pin. That is
not a retreat from ADR-0019; it is the right-sized application of it for the current
stage. The broad research is already done here, so the remaining research should be the
narrow, implementation-facing kind that feeds Slice E directly.

If a future contributor wants to broaden the research surface, require one of:

- a named blocker in active implementation;
- a new external object study with a specific downstream decision;
- a horizon spike with a time box and kill criteria.

Otherwise, keep research serving execution rather than becoming a parallel product.
