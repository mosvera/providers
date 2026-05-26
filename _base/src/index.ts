// SPDX-License-Identifier: Apache-2.0
//
// @mosvera/provider-base public surface.

export { assemble } from "./assemble.ts";
export { BaseAdapter } from "./base-adapter.ts";
export type {
  ClauseTemplate,
  LoweringRule,
  LoweringTable,
  ParameterRule,
} from "./lowering-table.ts";
export type {
  CapabilityManifest,
  CompileWarning,
  ComputeRegistry,
  Criticality,
  EmissionResult,
  EmitOptions,
  ExecuteOptions,
  GeneratedArtifact,
  GeneratedArtifactKind,
  GeneratedImage,
  GenerationResult,
  JsonObject,
  LoweringAction,
  ProvenanceEntry,
  ProviderAdapter,
  ProviderPayload,
} from "./types.ts";
export { EmissionError } from "./types.ts";
