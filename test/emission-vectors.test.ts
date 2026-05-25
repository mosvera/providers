// SPDX-License-Identifier: Apache-2.0
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { JsonObject } from "@mosvera/runtime";
import { fluxAdapter } from "../flux/src/index.ts";
import { openaiAdapter } from "../openai/src/index.ts";
import { sdxlAdapter } from "../sdxl/src/index.ts";

interface EmissionVector {
  id: string;
  provider: string;
  canonical: JsonObject;
  expected_prompt: string;
  expected_parameters: Record<string, unknown>;
  expected_warnings: Array<{ construct: string; action: string }>;
}

const adapters = {
  "openai-gpt-image-1": openaiAdapter,
  "bfl-flux-2-pro": fluxAdapter,
  "sdxl-replicate": sdxlAdapter,
};

const vectorDir = join(process.cwd(), "test", "fixtures", "compliance", "emission");

function payloadParameters(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (key !== "prompt") out[key] = value;
  }
  return out;
}

function loadVectors(): EmissionVector[] {
  return readdirSync(vectorDir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => JSON.parse(readFileSync(join(vectorDir, file), "utf8")) as EmissionVector);
}

describe("emission conformance vectors", () => {
  for (const vector of loadVectors()) {
    it(vector.id, () => {
      const adapter = adapters[vector.provider as keyof typeof adapters];
      expect(adapter, `adapter for ${vector.provider}`).toBeDefined();
      const emission = adapter.emit(vector.canonical);
      expect(emission.prompt).toBe(vector.expected_prompt);
      expect(payloadParameters(emission.payload)).toEqual(vector.expected_parameters);
      expect(emission.warnings).toEqual(vector.expected_warnings);
    });
  }
});
