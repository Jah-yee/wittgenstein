# 0019 Queue Label Prefixes

## Status

Accepted.

## Context

ADR-0012 deliberately kept the label taxonomy flat while the repository was
small. That rule worked for provenance, lifecycle, type, and audience labels,
but the queue now carries multiple parallel execution and research lines:
Visual Seed Code image work, audio closeout, sensor research, video horizon
tracking, release surfaces, governance work, and cross-cutting manifest / CLI /
schema cleanup.

Without explicit queue metadata, maintainers and agents have to infer three
different things from prose:

- urgency
- effort size
- milestone / stage ownership

That inference now creates noise. We need a small, mechanical layer of queue
labels that makes triage visible without changing the semantic contracts of the
existing labels.

## Decision

Wittgenstein keeps ADR-0012's semantic labels, but adds three prefixed
queue-label families:

- `priority/*` — queue urgency, not doctrine importance.
- `size/*` — rough expected effort, not story points.
- `stage/*` — the milestone or cross-cutting lane that should own the issue.

These labels are allowed to be prefix-based because they are operational queue
metadata rather than type/provenance/lifecycle doctrine. They should be used in
addition to, not instead of, labels like `enhancement`, `research-derived`,
`tracker`, or `discussion`.

Queue labels may be applied manually by maintainers and automatically by the
issue title labeler when an issue title carries an explicit token such as
`[p1]`, `[size/m]`, `[image]`, `[sensor]`, or `[release]`.

## Consequence

- `docs/labels.md` remains the canonical label reference and now documents both
  semantic labels and queue labels.
- The issue auto-labeler may apply queue labels from title tokens and obvious
  milestone keywords, but it must not infer nuanced priority or size from prose.
- Existing issues should be backfilled manually where the queue status is clear.
- Applying a queue label does not make a tracker agent-eligible. `WORKFLOW.md`
  exclusion labels still win.
