# Changes

Chronological per-phase log for `@mosvera/providers`. Newest entries on
top. The rich "why/how" for family-wide work lives in `docs/narrative/` in
the `niclydon/mosvera` repository; entries here are the scannable index.

---

## 2026-10-27 — SDK majors current (OpenAI 7, Runway 4)

- Dependabot config and a within-range workspace refresh landed as PR #1
  (TypeScript 5.9.3, vitest 4.1.12, tsx 4.23.15); CodeQL scanning added as
  PR #9.
- The accumulated majors landed as one combined, CI-verified PR #10
  (commit `040eae4`): OpenAI 7.45.1, @runwayml/sdk 4.24.0, TypeScript
  7.0.2, vitest 5.0.5, @types/node 26.6.5, GitHub Actions 7. The three
  shared dev majors were applied in the root manifest and all ten
  workspace manifests, because each workspace pins its own copies and a
  root-only bump silently leaves them behind. Full workspace suite green
  (65 provider tests plus base and root suites). The seven individual
  Dependabot PRs were closed as superseded by the combined PR.
- No package versions changed in this pass; the published provider
  packages remain at their 0.1.x versions. The bumps are development-side
  (SDK majors affect the provider implementations' build and test
  environment) and will ride the next package release.

Family record:
`docs/narrative/2026-10-27-public-face-and-the-0-1-3-release-train.md` in
`niclydon/mosvera`.

---
