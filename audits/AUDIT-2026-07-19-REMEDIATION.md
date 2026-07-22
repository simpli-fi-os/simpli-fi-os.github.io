# Simpli-FI Family public-site audit remediation record — 2026-07-19

Status: **LOCAL REMEDIATION RECORDED; ORIGINAL RED VERDICT REMAINS**

This is not a replacement audit and does not authorize deployment. It records
changes made after `AUDIT-2026-07-19.md` and separates locally proven fixes from
human, global-workspace, immutable-CI, and live-production gates.

## Locally remediated findings

| Original finding | Local evidence |
|---|---|
| 1 — invitation token in query | The browser-facing invitation is now `https://simpli-fi-os.com/family/join/#token=…`. The join script reads one exact URL-safe fragment, clears it before rendering, never reads `location.search`, and never stores or displays the capability. |
| 2 — required headers were warnings | The production verifier now records every required CSP, `nosniff`, cache, and no-referrer mismatch as a failing finding and returns nonzero. |
| 3 — competing production hosts | Vercel is documented as the sole intended production host. The GitHub Pages deployment job and `CNAME` were removed; the workflow is verification-only. |
| 12 — inaccurate route/build documentation | The README now lists the Family runtime, legal, security, support, join, and AASA surfaces and the exact local/live commands. |
| 14 and 24 — missing project instruction file | `CLAUDE.md` now records the scoped commands, invitation boundary, legal and deployment gates, and style constraints. |
| 21 — repository-root Pages upload | The GitHub Pages deployment and root artifact upload were removed. |
| 22 — mutable workflow tool versions | The workflow uses `ubuntu-24.04`, Node `22.16.0`, and immutable action commit SHAs. |
| 23 — incomplete ignore policy | `.gitignore` denies `.env*` while allowing safe example templates. |

## Current local proof

- `npm test`: **9 passed, 0 failed**, including a synthetic browser proof that
  clears the fragment before the first DOM read.
- `npm run build`: **PASS**.
- Workflow YAML and AASA/Vercel JSON parsing: **PASS**.
- `git diff --check`: **PASS**.
- The fail-closed live verifier: **FAIL as designed** against the currently
  deployed origin.

The live failure proves the public origin still serves superseded invite-only,
location, finance, and connected-email disclosures, still advertises the old
query-token AASA component, and omits `X-Content-Type-Options: nosniff` on the
AASA response.

## Unresolved release blockers

1. Findings 4 and 5: qualified human counsel and a counsel-approved
   minors-data/verified-request workflow are still required.
2. Finding 6: the authoritative release gate remains `HOLD`; the exact reviewed
   commit has not been deployed or verified live.
3. Findings 7–11, 13, and 15–19: global Claude/tooling/doctrine controls are
   outside this site worktree and remain unresolved by this local change.
4. Finding 20: this remains an uncommitted recovery worktree without immutable
   upstream CI evidence.
5. A fresh full audit is required after counsel approval and immutable CI, and
   immediately before any first production deployment.

No commit, push, deployment, cloud mutation, or App Store action was performed
while creating this record.
