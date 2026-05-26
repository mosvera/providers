# Agent Guidance

This repo contains Mosvera provider adapters. Providers deterministically lower
resolved Mosvera aesthetics into provider-specific payloads, with optional live
execution only in package-local manual scripts.

## Safety Rules

- Do not commit secrets, `.env*`, local config, vault references, generated
  media, caches, private notes, generated outputs, or local machine paths.
- Preserve unrelated user changes and keep edits narrow.
- Use DCO-signed commits when committing.
- Do not publish packages, rotate credentials, change repo visibility, create
  releases, or run live provider APIs unless explicitly asked.

## Repo Boundaries

- Keep `emit()` deterministic and network-free.
- Keep credentials in environment variables read by optional execution paths.
- Never store provider keys, avatar ids, voice ids, reference URLs, or generated
  media in committed files.
- Keep provider-specific options out of Mosvera registry documents.

## Verification

- Run `npm run ci`.
- Run `npm pack --dry-run --workspaces` before package release work.
- Run live smoke scripts only when explicitly asked and credentials are present.
- Run `git diff --check` before committing.
