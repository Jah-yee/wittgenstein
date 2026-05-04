# Handoff — write `WORKFLOW.md` (Brief K verdict §1)

**Tracked:** Issue #146. **Slice:** v0.3 collaboration-layer adoption.
**Reads (in order, then stop):**

1. `docs/research/briefs/K_orchestration_prior_art.md` — full verdict, kill criteria, primitive-mapping appendix.
2. [openai/symphony SPEC.md](https://github.com/openai/symphony/blob/main/SPEC.md) — the YAML / state-machine shape we are borrowing the **contract** from.
3. `docs/labels.md` — the agent-eligible vs not-eligible label semantics (do not violate `tracker` / `discussion` / `horizon-spike` / `blocked` semantics).
4. `docs/handoff/README.md` — what a handoff doc is (and isn't).
5. `AGENTS.md` + `PROMPT.md` — what the prompt template must auto-load.

If you find yourself reading anything outside this list, stop and re-anchor.

---

## Goal

Write `WORKFLOW.md` at the repo root. Symphony-spec-shaped (YAML front matter + markdown prompt template). Codifies what an orchestrator (Symphony, GitHub Actions, hand-rolled bash, or future) needs to consume our open-issue queue cleanly. **Do not install Symphony itself.**

The contract is the win. The runtime stays unspecified.

---

## Required sections of `WORKFLOW.md`

The file is markdown with a YAML front matter block at the top. Section numbering below maps 1:1 to the YAML keys.

### 1. `tracker`

```yaml
tracker:
  kind: github-issues
  repo: p-to-q/wittgenstein
  agent_eligible_labels: [enhancement, bug]
  agent_excluded_labels: [tracker, discussion, horizon-spike, blocked]
  active_states: [open]
  terminal_states: [closed]
```

**Rationale (must inline in `WORKFLOW.md` as a comment or paragraph):** the excluded labels exist precisely to NOT auto-run. `tracker` issues wait on external events (Brief A H3, etc.); `discussion` issues need maintainer input first; `horizon-spike` issues require time-boxing humans haven't done yet; `blocked` issues are blocked. Auto-dispatching on any of these violates `docs/labels.md` (ratified by ADR-0012).

### 2. `polling`

```yaml
polling:
  interval_ms: 60000 # 1 min — Symphony default 30s is over-active for our cadence
```

### 3. `workspace`

```yaml
workspace:
  root: ~/wittgenstein_workspaces
  per_issue_subdir_pattern: "issue-{identifier}"
  name_charset: "[A-Za-z0-9._-]" # Symphony safety invariant — paths must stay inside root after normalization
```

**Rationale:** the path-stays-inside-root invariant is a Symphony safety primitive. It must be enforced even if no orchestrator consumes this file yet, because future tooling will assume it.

### 4. `prompt_template`

A Liquid-style markdown block that the orchestrator (when one exists) substitutes per issue. Must auto-load these context surfaces in this order:

1. `AGENTS.md` (vendor-neutral primer)
2. `docs/engineering-discipline.md` (operating manual)
3. `docs/handoff/{slice-name}.md` if a handoff brief matching the issue title exists; otherwise the issue body alone
4. `docs/exec-plans/active/codec-v2-port.md` §M{N} if the issue title matches an M-phase pattern

Variables to expose:

```liquid
{{ issue.identifier }}: {{ issue.title }}
Labels: {{ issue.labels | join: ", " }}
Attempt: {{ attempt }}
Prior runs: {{ prior_run_summaries }}   # v0.4 — placeholder for now, empty string at v0.3
```

### 5. `agent`

```yaml
agent:
  max_concurrent_agents: 2 # we are 2 maintainers; do not exceed
  max_turns: 30
  max_retry_backoff_ms: 300000 # 5 min, matches Symphony default
  stall_timeout_ms: 600000 # 10 min — single-step turns can be slow on cold checkouts
```

### 6. `hooks`

```yaml
hooks:
  before_run: |
    pnpm install --frozen-lockfile
    git fetch upstream main
  after_run: "" # PR creation is the agent's responsibility per Symphony §boundary
  before_remove: ""
  timeout_ms: 120000
```

**Rationale:** `before_run` ensures every agent run starts from a clean install + fresh upstream — closes the "stale fork" failure mode the cold-checkout audit (PR #127) flagged. `after_run` stays empty because PR creation, conflict resolution, and CI-watching live with the agent's tooling, not the orchestrator (Symphony spec boundary, preserved verbatim).

### 7. `runtime`

```yaml
runtime:
  kind: unspecified-at-v0.3
  candidates: [symphony, github-actions, bash]
  notes: |
    The contract above is what matters. Pick a runtime when issue volume crosses
    ~50 simultaneous open issues OR when a contributor opens an RFC. Until then,
    this file is a contract for humans pairing with Codex / Claude Code / etc.
    by hand.
```

---

## Done when

- `WORKFLOW.md` at repo root with all 7 sections + YAML front matter + markdown prompt template body.
- A reader can answer "if I install Symphony tomorrow, will it consume this without surprises?" by reading the file alone.
- `AGENTS.md` Read Order adds a one-line cross-link: `0a. WORKFLOW.md — orchestration contract for agent-driven issue dispatch`.
- `docs/handoff/README.md` adds a one-line cross-link too.
- `pnpm exec prettier --check WORKFLOW.md` green (front matter and tables format cleanly).
- PR body cites Brief K (PR #145) and Issue #146.

## Out of scope

- Installing Symphony as a dependency. **Hard no.**
- Adding `parentRunId` / `events[]` / journal fields to manifest schema (deferred to v0.4 per Brief K §K.1 / §K.4).
- Three-role planner / generator / evaluator formalization (Brief K §K.3 verdict — wait for M2 Slice E #118 to test the need).
- A real orchestrator implementation. Symphony / GitHub Actions / bash all stay candidate-only at v0.3.
- Editing `docs/reproducibility.md` (that's the K.1 addendum, separate concern in same Issue #146).

## Hard constraints

- **Do not** include any auto-dispatch rule that would activate on `tracker` / `discussion` / `horizon-spike` / `blocked` labeled issues. That violates `docs/labels.md`.
- **Do not** specify a credential-handling pattern. Out of scope at v0.3 (Brief K §K.5; depends on MCP adoption).
- **Do not** invent fields not in Symphony's spec without a paragraph explaining why. Borrow the contract first; deviate only with cause.

## If you find a problem with the spec contract while writing

Stop. File a finding as a comment on Issue #146. Do **not** silently re-shape the contract to fit some unspecified preference. Brief K's verdict was that we adopt Symphony's contract; deviating from it is a doctrine challenge per ADR-0014, not drift correction.

## Open the PR

- Engineering lane (Brief K → ADR? → exec-plan → code; this slice is the spec-write step).
- Reference Issue #146 and PR #145 (Brief K) in the PR body.
- Per ADR-0013, `WORKFLOW.md` becomes a new doctrine-bearing surface (it governs how agent dispatch decides what to run). Add it to the doctrine-bearing list in ADR-0013 §1 in the same PR, or pair with ADR-0017 (orchestration adoption ratification). Either is acceptable; the maintainer call is which is cleaner.
- Independent second review pass required before merge.
