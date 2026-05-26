// SPDX-License-Identifier: Apache-2.0
//
// Shared provider-adapter types. This package is intentionally provider
// neutral: it defines the deterministic emission contract and the execution
// boundary, but it never names a provider API.

import type {
  CapabilityManifest,
  CompileWarning,
  Criticality,
  JsonObject,
  LoweringAction,
} from "@mosvera/runtime";

export type ProviderPayload = Record<string, unknown>;

export type ComputeRegistry = Record<string, (value: unknown, canonical: JsonObject) => unknown>;

export interface ProviderAdapter {
  readonly id: string;
  readonly version: string;
  manifest(): CapabilityManifest;
  emit(canonical: JsonObject, options?: EmitOptions): EmissionResult;
  execute(payload: ProviderPayload, options?: ExecuteOptions): Promise<GenerationResult>;
}

export interface EmissionResult {
  payload: ProviderPayload;
  prompt: string;
  warnings: CompileWarning[];
  provenance: Record<string, ProvenanceEntry>;
}

export interface GenerationResult {
  id: string;
  images: GeneratedImage[];
  artifacts?: GeneratedArtifact[];
  metadata: Record<string, unknown>;
}

export interface GeneratedImage {
  data: string;
  media_type: string;
  kind?: "image";
}

export type GeneratedArtifactKind = "image" | "video" | "subtitle" | "metadata";

export interface GeneratedArtifact {
  kind: GeneratedArtifactKind;
  media_type: string;
  data?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface EmitOptions {
  criticality?: Record<string, Criticality>;
  providerOptions?: ProviderPayload;
}

export interface ExecuteOptions {
  timeout_ms?: number;
  poll_interval_ms?: number;
}

export interface ProvenanceEntry {
  canonical_construct: string;
  lowering_action: LoweringAction;
  source_value: unknown;
}

export class EmissionError extends Error {
  readonly error = "required_unsupported";
  readonly construct: string;

  constructor(construct: string) {
    super(`required construct "${construct}" is unsupported by this adapter`);
    this.name = "EmissionError";
    this.construct = construct;
  }
}

export type {
  CapabilityManifest,
  CompileWarning,
  Criticality,
  JsonObject,
  LoweringAction,
} from "@mosvera/runtime";
