<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# @mosvera/provider-base

Shared infrastructure for Mosvera provider adapters.

This package contains no provider-specific logic. It defines the adapter
interface from ADR-0012, the lowering-table data model, the pure clause
assembly engine, and the optional `BaseAdapter` class used by the reference
adapters.

## Contract

Adapters implement three boundaries:

- `manifest()` returns the MEP-0003 capability manifest.
- `emit(canonical)` deterministically lowers a canonical composition into a
  provider payload, assembled prompt, warnings, and provenance.
- `execute(payload)` is the non-deterministic network boundary.

`emit()` never calls a provider API. It is pure and snapshot-testable.

Execution results keep the original image-oriented `images` field for
compatibility and may also include generalized `artifacts`. Image providers
return image artifacts; video providers return video artifacts.

`providerOptions` are adapter-local call-time inputs, not Mosvera registry
data. Prompt-like options supplied by the caller are user intent and should be
preserved. Prompt-only adapters append compiled Mosvera direction after the
user prompt; speech and avatar adapters keep `text` or `script` as spoken
content and map Mosvera direction into provider style/motion fields where
available.

## Lowering Tables

The lowering table is the tuning surface. Rules map canonical dot paths such
as `lighting.mood` and `palette.accent` to prompt clauses, provider
parameters, or both. Complex cases such as `lights[]` and aspect-ratio pixel
calculation use named compute functions supplied by the concrete adapter.

## Errors

`required` + `unsupported` raises `EmissionError` before any provider call can
be made. Optional unsupported constructs emit warnings and are dropped.
