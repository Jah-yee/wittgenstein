# Brief L — Sensor codec landscape (chaos / TimesFM / operator extensions)

**Date:** 2026-05-05
**Status:** 🟡 Draft v0.1
**Question:** How should the LLM → Sensor route evolve in v0.4+ to emit signals that are (a) richer / closer to real-world non-stationary structure, (b) more valuable as training data for downstream models, **without** breaking the bit-determinism + decoder-not-generator contracts that make the sensor route credible today?
**Feeds into:** A future ADR (sensor-operator extension); possibly a Brief E sensor-row addendum; possibly a horizon-spike for TimesFM-class exploration.
**Companion:** Brief E (per-modality benchmarks). Brief A and Brief I are cited only as **structural precedent** for the "codec landscape" brief shape — no technical content carries over from image / audio routes.

> Sensor is currently Wittgenstein's "confirmation case": pure NumPy / pure TS, deterministic, no L4 adapter, byte-for-byte goldens (PR #125). The route works. The question this brief asks is _orthogonal_: not "is the route correct?" (yes) but "are the signals it emits structurally rich enough to be valuable for downstream model training?" The honest answer today is: probably not. Procedurally summed sines, exponential decays, and Gaussian noise look reasonable to the eye and replay perfectly, but lack the higher-order non-stationarity, sensitive dependence, and broadband spectral structure that real ECG / IMU / temperature streams carry. This brief surveys three candidate directions for richening the signal **without giving up determinism**, and gives a verdict on which to adopt when.

---

## Stage and boundaries

The sensor route at v0.3 is `LLM → SensorSpec (operators + parameters + seed) → procedural decoder → bytes`. Three ECG / temperature / accelerometer-gyro routes; goldens are byte-for-byte; no L4 adapter; no neural decoder. ADR-0005 (decoder ≠ generator) and the manifest spine (`docs/hard-constraints.md`) are non-negotiable.

The brief does **not**:

- Touch the image route (different decoder lineage; Brief A owns it; do not cross-reference for technical content).
- Touch the audio route (different decoder lineage; Brief I owns it).
- Propose changing the `Codec<Req, Art>.produce` protocol (RFC-0001 / ADR-0008 locked).
- Promote any v0.3 work — this is a v0.4+ research-and-strategy brief.

It does decide:

1. Which **chaotic dynamical operators** (if any) belong in the sensor operator library.
2. What role **TimesFM-class time-series foundation models** play (decoder? adapter? horizon-track only?).
3. What **quality metrics** make "more realistic" a measurable claim (this is partly a Brief E gap).
4. What **validation methodology** prevents the route from drifting into "looks better, isn't actually" cargo-culting.

---

## The three candidate directions

### S1 — Deterministic chaotic operators

A second-order or third-order ODE system integrated with a fixed-step, fixed-precision integrator (RK4 with fixed step size and fixed `f64` precision) is **mathematically chaotic** (positive Lyapunov exponent, sensitive dependence on initial conditions) **AND bit-deterministic** (same seed + same integrator step → identical trajectory bytes). The relevant systems for sensor-shaped signals:

- **Lorenz** (3-equation atmospheric convection model) — broadband 1/f-shaped power spectrum; classic strange attractor; useful as a "complex non-stationary background" channel.
- **Rössler** (3-equation simpler chaotic system) — single-quadratic nonlinearity; closer to a smooth quasi-periodic regime when `c` is small; useful where a less aggressive non-stationarity is wanted.
- **Chua's circuit** (3-equation electronic chaos with piecewise-linear nonlinearity) — well-characterized double-scroll attractor; precedent for circuit-derived ECG-like waveforms.
- **Coupled Hopfield-style oscillators** (small N=3 ring of neurons with non-monotonic activation + delay) — produces irregular bursting that matches some neurological recordings.
- **Pomeau-Manneville intermittency** (a 1D map exhibiting laminar-burst alternation) — useful for "mostly quiet, occasional event" sensor signals (cardiac arrhythmia, gait stumbles).

These are not "neural networks" in the gradient-descent sense; they are deterministic dynamical systems whose dynamics are non-linear enough to qualify as chaotic neural systems in the dynamical-systems literature.

### S2 — TimesFM (Google, ICML 2024, [arXiv 2310.10688](https://arxiv.org/abs/2310.10688))

200M-parameter decoder-only transformer pretrained on 100B real-world time-points. Architecture: input is patches of 32 contiguous timepoints → MLP residual block → transformer stack → output token → MLP head → next patch.

Important property: by construction, `TimesFM(aX + b) = a · TimesFM(X) + b` for positive `a` (scale + shift invariance), with optional flip invariance via inference on `X` and `-X` averaged. Zero-shot performance approaches supervised SOTA on unseen datasets.

**Critical caveat for our route**: TimesFM is a **forecaster** (given history, predict future), not a **renderer** (given spec, emit bytes). Adopting TimesFM as a sensor decoder would:

- Violate ADR-0005 (decoder ≠ generator). The forecasting head IS a generator over future timesteps.
- Break the determinism contract on GPU paths (cuDNN atomics, same gap Brief I §H I.7 already documented for audio).
- Introduce a 200M-param dependency for a route currently shipped in pure NumPy.

What CAN be borrowed without touching the decoder: the **patch-tokenization shape**. If the `IR` sum type's `Latent` variant is ever inhabited for sensor (currently only `Text` is, per ADR-0011), patches of 32 timepoints with an MLP-residual encoding is a pre-validated tokenizer geometry. This is structural inspiration only.

### S3 — Lyapunov exponent + spectral / sample entropy as quality metrics

Real ECG has a positive largest Lyapunov exponent (`λ_max ≈ 0.05–0.5 bits/beat` depending on subject + recording method per [Rosenstein et al. 1993](https://physionet.org/files/lyapunov/1.0.0/RosensteinM93.pdf)). Real EEG sleep stages show distinguishable Lyapunov exponents per stage. **Synthetic procedural ECG (sum of sines + Gaussian noise) has Lyapunov exponent ≈ 0** — the trajectory does not separate exponentially under perturbation. This is a measurable gap.

Useful metrics:

- **Largest Lyapunov exponent** (`λ_max`) — Rosenstein algorithm, non-parametric, robust to short noisy series.
- **Sample entropy** (SampEn) — one of the standard tests for "complexity" in physiological signals; correlates with disease state in HRV literature.
- **Spectral entropy** — Shannon entropy of the power spectrum normalized; cheap to compute; catches whether signal is band-limited noise vs broadband chaos.
- **Surrogate data testing** ([Theiler et al. 1992](https://en.wikipedia.org/wiki/Surrogate_data_testing)) — the validation methodology. Generate phase-randomized surrogates of the candidate signal; if Lyapunov / entropy of original differs significantly from surrogates → genuine non-linear structure, not just colored noise.

**Surrogate testing is non-optional.** Lyapunov exponent alone cannot distinguish chaos from noise (search confirmed this is the standard caveat in the EEG / ECG literature). Without surrogates, "more realistic" is a vibe; with surrogates, it's a measurable, falsifiable claim.

---

## Steelman

### Hypothesis L.1 — Adopt 4-5 chaotic operators as a v0.4 sensor extension

**Claim.** Add Lorenz / Rössler / Chua / Hopfield-oscillator / intermittency map as new entries in the sensor operator library. Each integrated with fixed-step RK4 and fixed `f64` precision so trajectories are bit-deterministic and golden-testable. The LLM's `SensorSpec` gains the ability to compose chaotic operators alongside the existing periodic / decay / noise primitives.

- **Supporting:** Real biological signals exhibit deterministic chaos signatures (positive `λ_max` documented for ECG, EEG, HRV per [PubMed 8373884](https://pubmed.ncbi.nlm.nih.gov/8373884/), [PubMed 12779752](https://pubmed.ncbi.nlm.nih.gov/12779752/), [PLOS One 2014](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0105622)). Procedural sum-of-sines does not. Closing this gap closes a known weakness of synthetic biomedical-style data without breaking determinism. Fixed-step RK4 with `f64` precision IS bit-deterministic across machines (verified well-known result; same as our existing procedural integrator). The operator surface is small (~5 new operators); the work is bounded.
- **Disconfirming:** Chaos amplifies floating-point rounding. Fixed-step RK4 preserves bit-determinism on the **same** numerical backend; cross-platform (`x86_64` glibc vs `arm64` Apple Silicon vs WASM) determinism requires careful integration choice and is not free. Same gap Brief I §H I.7 documented for audio: CPU byte-parity with platform pinning, GPU structural-only. We need an explicit integrator-determinism audit before promoting any chaotic operator to a default route.
- **Implication if true.** `packages/codec-sensor/src/operators/` gains a `chaos/` subdirectory with one file per system. Existing routes (ECG / temperature / IMU) opt into chaos channels via `SensorSpec` syntax (e.g. `{ kind: "lorenz", sigma: 10, rho: 28, beta: 8/3, seed: 7, channel: "background" }`). New goldens land alongside the existing byte-for-byte fixtures. ADR (eventually) ratifies the operator extension.
- **Confidence: 0.6** — the math is established; the determinism contract is reachable on pinned backends; the gap (procedural sine vs real ECG) is a real one this closes.
- **What would flip this.** Integrator audit shows fixed-step RK4 in TS / NumPy is NOT bit-identical across `x86_64` and `arm64` (↓ to 0.3, restrict to single-platform goldens). A Brief E benchmark shows the chaotic-operator output looks LESS like real ECG than the procedural baseline (↓ to 0.1, retire the direction). v0.5 product spec says "synthetic sensor data is for visualization, not training" (↓ to 0.3, the gap doesn't matter).

### Hypothesis L.2 — TimesFM stays horizon-track; do not adopt as sensor decoder or adapter at v0.4

**Claim.** TimesFM is an impressive forecasting foundation model but not a fit for the sensor renderer surface. Adopting it would violate ADR-0005 (decoder ≠ generator) and add a 200M-param GPU-leaning dependency to a route currently shipped in pure NumPy. The patch-tokenization geometry (32-timepoint patches, MLP-residual encoding) is worth remembering as structural inspiration if `IR.Latent` is ever inhabited for sensor, but that's not a v0.4 question.

- **Supporting:** TimesFM is a forecaster (predict future given history), not a renderer (given a spec, emit bytes). The sensor route's contract is "LLM picks a structured spec; the codec renders it deterministically." Inserting a forecaster into the renderer slot is a category error. Even setting that aside, the determinism story is GPU-fragile (Brief I §H I.7 already proved this for audio). And the dependency footprint (200M params, PyTorch-leaning, CUDA-leaning) is wildly out of proportion to a route shipped today in 542 LOC of TS / NumPy.
- **Disconfirming:** If the v0.5+ product spec includes "given a partial real sensor recording, complete it plausibly," that is exactly TimesFM's job and ADR-0005 may need a carved exception (just as Brief A allowed Kokoro-class neural decoders for audio). But that is a long-horizon question, not a v0.4 question.
- **Implication if true.** TimesFM is a horizon-track tracker issue; revisit when (a) v0.5 product spec contemplates sensor extrapolation/completion, OR (b) `IR.Latent` is inhabited for any modality (image likely first per Brief C §H9), at which point the patch-tokenization shape becomes a precedent worth borrowing.
- **Confidence: 0.6** — TimesFM is excellent at what it does; what it does is not what our renderer slot needs.
- **What would flip this.** A v0.5 product requirement for sensor completion / forecasting (↑ to 0.6, open Brief M for the carve-out). A new TimesFM variant that ships a deterministic-by-construction inference path (low odds in 2026).

### Hypothesis L.3 — Add Lyapunov / SampEn / spectral entropy + surrogate data tests as Brief E sensor metrics

**Claim.** Brief E currently lists only structural metrics for sensor (sample rate, channel count, etc.). Real-quality metrics for sensor signals exist and are cheap to compute. Add `λ_max` (Rosenstein algorithm), sample entropy, and spectral entropy as the sensor-row real-quality metrics in Brief E, paired with the surrogate data testing methodology so that "this signal is realistic" is a falsifiable claim, not vibes.

- **Supporting:** All three metrics have established literature for biomedical signals (40+ years of ECG/EEG complexity research). Sample entropy in particular has a well-studied threshold range distinguishing healthy / pathological HRV. Spectral entropy is a one-line FFT + Shannon. None requires neural infrastructure. Surrogate data testing is the gold-standard validation methodology that prevents "Lyapunov-exponent-of-noise" false positives — explicitly called out in the literature (search confirmed this is the standard caveat).
- **Disconfirming:** Adding metrics to Brief E is cheap; running them in CI per fixture is less cheap (Lyapunov estimation needs O(N²) embedding distance computations for the Rosenstein algorithm — minutes for a 10s ECG at 250Hz). The cost is bounded but real.
- **Implication if true.** Brief E sensor row gets concrete metrics. New sensor goldens get a `quality.realism` field with `lambdaMax`, `sampEn`, `spectralEntropy` numbers + a `surrogateRejectionPValue`. The receipt is "this synthetic signal has λ_max within X of real ECG (p < 0.05 vs phase-randomized surrogate)."
- **Confidence: 0.6** — metrics are well-established, surrogate testing is the standard validation, the only cost is CI minutes.
- **What would flip this.** Computing the metrics on every CI run takes > 30s and slows the workflow noticeably (↓ to 0.3, run them as a nightly job not per-PR). The metrics turn out to be insensitive to the chaotic-operator extension (i.e. our procedural ECG and our chaos-extended ECG have indistinguishable λ_max) (↓ to 0.1, the operators don't actually help).

### Hypothesis L.4 — The new operators are deterministic-by-construction; "stochastic-looking, deterministic-replayable" is the design property worth selling

**Claim.** The single most important property of the chaotic operator extension is that it gives us a sensor signal that **looks** stochastic / non-stationary / hard-to-predict, but is **byte-replayable** under the existing manifest spine. This is exactly the sensor-route equivalent of why ADR-0005 prefers frozen VQ decoders over diffusion samplers for image: deterministic replayability + structural richness, not one or the other.

- **Supporting:** Wittgenstein's central thesis is that reproducibility is a feature, not a constraint to relax. The dominant industry assumption is that "more realistic synthetic data" requires sampling-based generators (diffusion, autoregressive sampling at temperature > 0). Deterministic chaos is a counter-example: the trajectory is one-shot computable from `(initial condition, integrator parameters, step size)`, no sampling, no temperature. It happens to look stochastic to a downstream observer because the dynamics are sensitive enough that small spec changes (different seed, slightly different operator parameter) produce visibly different signals — but each individual signal is bit-identical on replay.
- **Disconfirming:** "Deterministic chaos" is a specific math claim that depends on integrator + precision discipline. If we ship a chaos operator and someone uses adaptive-step RK45 instead of fixed-step RK4 (because RK45 is the SciPy default and convenient), the determinism breaks and the receipt lies. We need integrator pinning to be machine-checkable, not just doc-stated.
- **Implication if true.** The eventual ADR doesn't just bless the chaos operators — it bakes in the **integrator-and-precision contract** that keeps them deterministic. Tests assert the full pipeline (chaos operator + integrator + precision) produces the same bytes under three back-to-back runs.
- **Confidence: 0.6** — the framing is right; the determinism discipline needs to be mechanical, not promissory.

---

## Red team

The strongest objection is that **Brief L is asking the wrong question**. The user request was "more realistic, more valuable training data." But the empirical question — does our downstream model (e.g. the existing `polyglot-mini` audio ambient classifier or a future sensor classifier) actually train better on chaos-extended sensor signals than on procedural ones? — is not answered by adding chaotic operators alone. It is answered by running a measurement: train the classifier on procedural data, train on chaos-extended data, compare downstream task accuracy on a held-out real-data benchmark. **The brief's value depends on doing that measurement before the operators promote to default**; without it, "more realistic" is the same vibe trap audit memo (`docs/research/2026-05-03-staff-audit.md`) caught in the original Receipts table.

Mitigation: Verdict §1 explicitly defers default-route promotion until the downstream training measurement runs. Operators ship as opt-in via `SensorSpec` syntax first; promotion to default needs the measurement.

The second objection is that this brief is **trying to do too much in v0.4**. The repo just landed the M2 audio sweep (in flight); M3 sensor port is the natural next thing per the v0.3 roadmap. Adding chaos operators on top of M3 expands M3's scope. Counter: chaos operators don't change the v2 protocol shape — they are new entries in the operator library. M3 ports `codec-sensor` to v2 protocol; the operator extension is post-M3 work that fits under the existing protocol. The two are sequenceable, not coupled.

The third objection is that **TimesFM should be revisited harder for the encoder side**, not just rejected as a decoder. If we ever want a sensor adapter (currently absent — ADR-0005 calls sensor "the no-L4 confirmation case"), TimesFM's pretrained patch-tokenizer is a strong candidate for the SpecToLatent bridge. Counter: agreed — that's exactly what L.2's "if `IR.Latent` is ever inhabited for sensor" carve-out names. We are not closing the door; we are saying don't open it at v0.4.

The fourth objection is that **chaos in real ECG is contested in the literature**. Some papers find positive Lyapunov; others (using surrogate-aware methods) argue ECG is "stochastic with deterministic non-linearities" rather than fully chaotic. Counter: Brief L doesn't claim ECG is fully chaotic; it claims chaos-extended synthetic signals look closer to the literature's measured complexity than pure-procedural ones. The surrogate test is exactly how we settle this empirically per fixture, not by literature appeal.

---

## Kill criteria

The brief should be considered wrong, and rolled back, if any of the following:

1. **Cross-platform integrator non-determinism.** A fixed-step RK4 in TS or NumPy with `f64` precision proves NOT bit-identical between `x86_64` and `arm64` for any of the proposed chaos operators in M3-cycle CI. Then chaos operators stay single-platform-golden until a deterministic-integrator solution is found (use `decimal`-class arithmetic? port to Rust with explicit rounding mode? open question).
2. **Downstream training measurement shows no benefit.** Train the existing `polyglot-mini` ambient classifier (or any toy sensor-route classifier) on chaos-extended ECG fixtures and on procedural ECG fixtures; compare held-out accuracy on a real-recording benchmark. If chaos-extended data does not improve downstream accuracy, the central premise of L.1 fails. Operators stay as a curiosity, not a default.
3. **Surrogate data tests show synthetic chaos is indistinguishable from colored noise.** If the surrogate test rejects no chaos operator's output as "more chaotic than its phase-randomized surrogate," our claim of structural richness is false.
4. **TimesFM ships a deterministic-by-construction inference path AND v0.5 product needs sensor extrapolation.** Then L.2 flips and TimesFM becomes worth Brief M.
5. **Brief E sensor metrics turn out to be insensitive to the operator choice.** If λ_max / SampEn / spectral entropy of chaos-extended ECG fall within the same range as procedural ECG, the metrics aren't doing the receipt work we wanted.

---

## Verdict

1. **Adopt deterministic chaotic operators as a v0.4+ sensor extension** (Lorenz / Rössler / Chua / Hopfield-oscillator / Pomeau-Manneville-intermittency, integrated fixed-step RK4 with `f64`). New entries in `packages/codec-sensor/src/operators/chaos/`. Goldens preserve byte-parity per the existing #125 contract. Operators are opt-in via `SensorSpec` syntax; promotion to default route needs the L.4 downstream-training measurement.
2. **TimesFM = horizon-track only.** No adoption at v0.4 as either decoder or adapter. Patch-tokenization geometry remembered as structural precedent if/when `IR.Latent` is inhabited for sensor (post-Brief-C §H9 image work, much later). Tracker issue opens.
3. **Add Lyapunov / sample entropy / spectral entropy + surrogate data testing as Brief E sensor metrics.** This is the receipt-grade quality gate the audit memo wanted; sensor row in Brief E currently has a gap that this fills.
4. **The integrator-and-precision contract is mechanical, not promissory.** Tests assert byte-identical replay across three back-to-back runs; CI fails if integrator drifts.
5. **No work in v0.3.** Sensor route at v0.3 stays the byte-deterministic procedural shape that just landed via #125. M3 sensor v2-protocol port comes first; operator extension is a follow-up after M3 closes.

Net for v0.4 trajectory: **chaotic operators land as opt-in extensions with measurable receipts and downstream-task validation; TimesFM stays in the horizon notebook; the route's reproducibility-first thesis is preserved AND extended.**

---

## What concretely lands (across phases)

| Phase          | Item                                                                                                       | Where                                                             | Issue                                |
| -------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------ |
| v0.3           | This brief itself                                                                                          | `docs/research/briefs/L_sensor_codec_landscape.md`                | (this PR)                            |
| v0.3           | Brief E sensor-row addendum naming λ_max / SampEn / spectral entropy + surrogate testing                   | `docs/research/briefs/E_benchmarks_v2.md`                         | follow-up small PR                   |
| v0.4           | M3 sensor codec v2 port (independent of this brief)                                                        | `packages/codec-sensor/*`                                         | already named in v0.3 roadmap        |
| v0.4 (post-M3) | Chaotic operator extension (5 operators, opt-in, byte-parity goldens)                                      | `packages/codec-sensor/src/operators/chaos/`                      | spike issue, opened with this PR     |
| v0.4 (paired)  | Integrator + precision audit (cross-platform RK4 byte-identical)                                           | `packages/codec-sensor/test/integrator-determinism.test.ts`       | folded into operator-extension issue |
| v0.4 / v0.5    | Downstream-task measurement (chaos-extended vs procedural fixtures, classifier accuracy on real benchmark) | new `packages/codec-sensor/research/` or polyglot-mini equivalent | second issue, opened with this PR    |
| Horizon        | TimesFM tracker                                                                                            | (this brief §L.2)                                                 | tracker issue, opened with this PR   |
| Horizon        | ADR ratifying the operator extension when measurement passes                                               | `docs/adrs/00XX-sensor-chaos-operators.md`                        | not opened until measurement returns |

---

## References

- Lorenz, E. N. (1963). "Deterministic Nonperiodic Flow." J. Atmos. Sci. 20 (2): 130–141.
- Rössler, O. E. (1976). "An equation for continuous chaos." Physics Letters A 57 (5): 397–398.
- Chua, L. O. (1992). "The genesis of Chua's circuit." Archiv für Elektronik und Übertragungstechnik 46 (4): 250–257.
- Pomeau, Y. & Manneville, P. (1980). "Intermittent transition to turbulence in dissipative dynamical systems." Comm. Math. Phys. 74 (2): 189–197.
- Rosenstein, M. T., Collins, J. J. & De Luca, C. J. (1993). "A practical method for calculating largest Lyapunov exponents from small data sets." [PhysioNet PDF](https://physionet.org/files/lyapunov/1.0.0/RosensteinM93.pdf).
- Theiler, J. et al. (1992). "Testing for nonlinearity in time series: the method of surrogate data." Physica D 58: 77–94.
- Babloyantz, A. & Destexhe, A. (1988 / 1993). [Lyapunov in EEG/sleep PubMed 8373884](https://pubmed.ncbi.nlm.nih.gov/8373884/).
- Govindan, R. B. et al. (2003). [Surrogate + predictability analysis for ECG chaos PubMed 12779752](https://pubmed.ncbi.nlm.nih.gov/12779752/).
- Valenza, G. et al. (2014). [Lyapunov for heartbeat dynamics PLOS One](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0105622).
- Das, A., Kong, W., Sen, R., & Zhou, Y. (2024). "A decoder-only foundation model for time-series forecasting." [arXiv 2310.10688](https://arxiv.org/abs/2310.10688). ICML 2024.
- [google-research/timesfm](https://github.com/google-research/timesfm) — code + weights.
- [Rosenstein algorithm overview](https://sapienlabs.org/the-lyapunov-exponent-in-eeg/) — applied note for non-specialists.

---

## Cross-references in repo

- ADR-0005 — decoder ≠ generator (the boundary L.2 honors).
- ADR-0008 — Codec Protocol v2 (not modified by this brief).
- ADR-0011 — locked vocabulary (no new terms introduced).
- ADR-0014 — governance lane (this brief lands via the engineering chain: Brief → ADR → operator-extension PR + measurement-validation PR).
- Brief E — per-modality benchmarks v2; sensor-row addendum is paired follow-up.
- `docs/hard-constraints.md` — manifest spine, no silent fallbacks (preserved in full).
- `packages/codec-sensor/` — existing pure-NumPy / pure-TS operator library (the surface this brief proposes to extend).
- `fixtures/golden/sensor/` — byte-for-byte goldens (PR #125); chaos extension MUST preserve this contract.
