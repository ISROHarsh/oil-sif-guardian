# OIL-SIF Guardian — Engineering Rules & Operational Discipline

> **Guiding Principle:** `AI recommends. Evidence explains. HSE decides. Feedback improves the system.`

---

## The 15 Non-Negotiable Engineering Rules

1. **`main` is always runnable**: Never push broken, unvalidated, or untested code to `main`.
2. **Features live in dedicated branches**: Branch off `main` or `staging` using `feature/<short-name>` or `fix/<short-name>`.
3. **Pull Requests are mandatory**: All changes merge through reviewed PRs with automated CI checks.
4. **Contracts precede implementation**: `docs/DATA_SCHEMA.md` and `docs/API_CONTRACT.md` are authoritative. No uncoordinated contract mutations.
5. **Tests travel with code**: Every new feature or bug fix must include corresponding unit, integration, or regression tests.
6. **Zero confidential OIL data in Git**: Real operational records must never be committed. Use synthetic or sanitized demo datasets.
7. **Zero secrets in Git**: API keys, database credentials, and tokens must only exist in `.env` (gitignored).
8. **Raw data is immutable**: Original narrative text (`raw_text`) must never be overwritten; cleaned versions populate `normalized_text`.
9. **Models and datasets are versioned**: Always track `model_version` (e.g. `psif-v1.0`) and dataset revisions (`gold-v1`).
10. **Predictions are fully auditable**: Store model version, threshold, confidence, triggered rules, and human review decisions.
11. **Safety rules must have regression tests**: Every deterministic rule must have verified positive and negative test cases.
12. **AI is never the autonomous safety authority**: Predictions are prioritization recommendations; human HSE personnel hold final accountability.
13. **Never fabricate performance numbers**: Benchmark results must come from actual evaluated test partitions.
14. **Avoid premature complexity**: Do not introduce complex distributed pipelines, recurrent networks, or heavy LLM fine-tuning before the baseline pipeline is stable.
15. **Clear module ownership**: Changes to backend, frontend, ML, rules, and documentation must stay within their defined boundaries.

---

## Branching & Release Lifecycle

```text
main (Release-ready, protected)
  ▲
  │ (Validated PR)
staging (Integration environment)
  ▲
  │ (Feature PR + CI pass)
feature/<name> / fix/<name>
```

### Commit Convention (Conventional Commits)
- `feat: <description>` — New user-facing capability or pipeline step.
- `fix: <description>` — Bug fix or correction.
- `test: <description>` — Adding or updating test suites.
- `docs: <description>` — Documentation improvements.
- `refactor: <description>` — Code cleanup without behavior modification.
- `chore: <description>` — Build, CI, or dependency updates.

---

## Definition of Done (DoD)

### Code / Backend / Frontend
- Feature fulfills user requirements and API contract.
- Unit and integration tests pass with 100% success.
- Static typing and lint checks pass.
- No accidental files or secrets in git diff.
- Documentation updated.

### Machine Learning / Rules
- Training configuration and dataset version locked.
- Baseline comparison documented.
- False-negative error analysis performed.
- Probability calibration verified.
- Golden regression suite passed.
