# 0017 Orchestration workflow contract — `WORKFLOW.md`

## Status

Accepted (ratifies Brief K §Verdict 1).

## Context

Brief K (`docs/research/briefs/K_orchestration_prior_art.md`) surveyed four 2026 references on agent orchestration and harness design (OpenAI Symphony, Mindfold Trellis, Anthropic harness-design-long-running-apps, Anthropic Managed Agents). Of 17 mapped primitives, 11 were already covered by existing Wittgenstein surfaces, 3 deferred to v0.4, and 3 named for v0.3 adoption.

This ADR ratifies the first of the v0.3 adoptions: a repo-root `WORKFLOW.md` that codifies the agent-dispatch contract any orchestrator (Symphony, GitHub Actions, hand-rolled bash, or future) must respect. The runtime stays unspecified at v0.3 — the contract is what we lock.

The other two v0.3 adoptions (the manifest-spine reframe in `docs/reproducibility.md` and the `docs/agent-guides/README.md` cross-link) ship in the same PR or as small follow-ups; they are documentation reframes, not new doctrine, and do not require a separate ADR.

## Decision

`WORKFLOW.md` at the repo root is the canonical orchestration workflow contract for Wittgenstein. Its key load-bearing decisions:

1. **`agent_eligible_labels: [enhancement, bug]`** — the only labels whose issues an orchestrator may auto-dispatch.
2. **`agent_excluded_labels: [tracker, discussion, horizon-spike, blocked]`** — semantic-contract violations to dispatch (per `docs/labels.md` ratified by ADR-0012). An orchestrator that does not honor this list is non-conformant.
3. **Per-issue isolated workspace** under `~/wittgenstein_workspaces/issue-{identifier}` — Symphony safety invariant (path stays inside root after normalization) preserved verbatim.
4. **Auto-load read order** in the prompt template — `AGENTS.md` → `docs/engineering-discipline.md` → matching `docs/handoff/<slice>.md` (if present) → matching `docs/exec-plans/active/codec-v2-port.md` §M{N} (if applicable).
5. **`max_concurrent_agents: 2`** — matches the maintainer pair locked in CODEOWNERS / ADR-0013. Review capacity, not compute, is the binding constraint.
6. **Spec boundary preserved**: orchestrator does NOT mutate PRs. PR creation, conflict resolution, CI watching are the agent's tooling responsibility, not orchestrator business logic. `hooks.after_run: ""` is intentional.
7. **`runtime: unspecified-at-v0.3`** — Symphony / GitHub Actions / bash all stay candidate-only. The runtime adoption is a separate decision (open RFC, or wait until issue volume crosses ~50 simultaneous open).

`WORKFLOW.md` is added to ADR-0013 §1's doctrine-bearing surface list. Future amendments require independent ratification per ADR-0013.

## Consequence

- `WORKFLOW.md` is the contract any current or future orchestrator MUST consume. The current runtime is the human-pairing-with-agent default.
- `AGENTS.md` Read Order gains `WORKFLOW.md` as an early reference (it tells incoming agents what dispatch contract they are inside).
- `docs/handoff/README.md` cross-links `WORKFLOW.md` so the handoff-brief surface (which the contract references) is discoverable in both directions.
- `.github/workflows/doctrine-guardrail.yml` adds `WORKFLOW.md` to its doctrine-bearing pattern list so changes without an ADR cite trigger the nudge.
- ADR-0013 §1 adds `WORKFLOW.md` to the doctrine-bearing list.
- Brief K's status flips to 🟢 Ratified by ADR-0017 (for §Verdict 1; verdicts 2-5 flip independently when their work lands).
- Issue #146 closes when this PR merges (the WORKFLOW.md write is its action item).
- **Kill criterion**: per Brief K §Kill criteria 1, if within one sprint of `WORKFLOW.md` landing no orchestrator (Symphony, GitHub Actions, or otherwise) consumes it AND no contributor reports it helped them onboard, retire `WORKFLOW.md` and log the lesson. The contract is supposed to earn its keep at our scale; doctrine debt without ROI gets rolled back.
- The other two v0.3 Brief K adoptions (`docs/reproducibility.md` addendum on Brain/Hands/Session naming; `docs/agent-guides/README.md` cross-link) are deliberately bundled with this PR to keep the K verdict whole; they do not need a separate ADR because they are documentation reframes of existing concepts, not new doctrine.
