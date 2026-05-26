// SPDX-License-Identifier: Apache-2.0
//
// Optional abstract base class for table-driven adapters. Concrete providers
// supply manifests, lowering data, compute functions, final payload assembly,
// and execution transport.

import { assemble } from "./assemble.ts";
import type { LoweringTable } from "./lowering-table.ts";
import type {
  CapabilityManifest,
  ComputeRegistry,
  EmissionResult,
  EmitOptions,
  ExecuteOptions,
  GenerationResult,
  JsonObject,
  ProviderAdapter,
  ProviderPayload,
} from "./types.ts";

export abstract class BaseAdapter implements ProviderAdapter {
  abstract readonly id: string;
  abstract readonly version: string;

  abstract manifest(): CapabilityManifest;
  abstract loweringTable(): LoweringTable;
  abstract computeRegistry(): ComputeRegistry;
  abstract buildPayload(parameters: ProviderPayload, prompt: string, options?: EmitOptions): ProviderPayload;
  abstract execute(payload: ProviderPayload, options?: ExecuteOptions): Promise<GenerationResult>;

  emit(canonical: JsonObject, options?: EmitOptions): EmissionResult {
    const emitted = assemble(
      canonical,
      this.loweringTable(),
      this.computeRegistry(),
      options?.criticality ?? {},
    );
    return {
      ...emitted,
      payload: this.buildPayload(emitted.payload, emitted.prompt, options),
    };
  }
}
