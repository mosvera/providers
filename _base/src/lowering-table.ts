// SPDX-License-Identifier: Apache-2.0
//
// Data schema used by adapters to declare deterministic prompt and parameter
// lowering. Concrete adapters should express as much behavior here as data as
// possible; imperative code belongs only in named compute functions.

import type { LoweringAction } from "./types.ts";

export interface LoweringTable {
  /** Adapter identity for provenance. */
  adapter_id: string;

  /** Ordered list of lowering rules. */
  rules: LoweringRule[];

  /** Default prompt clause separator. */
  clause_separator?: string;
}

export interface LoweringRule {
  /** Dot-path into the canonical model, e.g. "lighting.mood". */
  construct: string;

  /** The lowering action, matching the capability manifest. */
  action: LoweringAction;

  /** If the construct contributes to the prompt string. */
  prompt_clause?: ClauseTemplate;

  /** If the construct maps to API parameters. */
  parameters?: ParameterRule[];
}

export interface ClauseTemplate {
  /** Template string with {value} interpolation. */
  template: string;

  /** Sort order for clause assembly. Lower = earlier in prompt. */
  order: number;

  /** Optional value transform before interpolation. */
  transform?: "identity" | "lookup" | "computed";

  /** For lookup transforms: canonical value -> prompt value. */
  lookup?: Record<string, string>;

  /** For computed transforms: named function in the adapter registry. */
  compute_fn?: string;
}

export interface ParameterRule {
  /** The provider API parameter name. */
  parameter: string;

  /** How to derive the value. */
  mapping: "direct" | "lookup" | "computed";

  /** For lookup mappings: canonical value -> provider value. */
  lookup?: Record<string, unknown>;

  /** For computed mappings: named function in the adapter registry. */
  compute_fn?: string;
}
