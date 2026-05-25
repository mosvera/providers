// SPDX-License-Identifier: Apache-2.0

import { BaseAdapter, type ComputeRegistry, type ExecuteOptions, type GenerationResult, type ProviderPayload } from "@mosvera/provider-base";
import { fluxLoweringTable } from "./lowering-table.ts";
import { fluxManifest } from "./manifest.ts";

interface FluxStartResponse {
  id?: unknown;
  polling_url?: unknown;
}

interface FluxPollResponse {
  status?: unknown;
  result?: unknown;
  error?: unknown;
}

const ASPECT_SIZES: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "3:2": { width: 1536, height: 1024 },
  "2:3": { width: 1024, height: 1536 },
  "16:9": { width: 1536, height: 864 },
  "9:16": { width: 864, height: 1536 },
};

function describeLights(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .map((light) => {
      if (typeof light !== "object" || light === null || Array.isArray(light)) return "";
      const record = light as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name : "unnamed";
      const power = record.power === undefined ? "" : ` at power ${String(record.power)}`;
      return `${name} light${power}`;
    })
    .filter(Boolean)
    .join(", ");
}

function humanizeValue(value: unknown): string {
  return String(value).replaceAll("_", " ");
}

function aspectSize(value: unknown): { width: number; height: number } | undefined {
  return typeof value === "string" ? ASPECT_SIZES[value] : undefined;
}

function extractImageUrl(poll: FluxPollResponse): string {
  const candidates: unknown[] = [];
  candidates.push(poll.result);
  if (typeof poll.result === "object" && poll.result !== null && !Array.isArray(poll.result)) {
    const result = poll.result as Record<string, unknown>;
    candidates.push(result.sample, result.image_url, result.url);
  }
  candidates.push((poll as Record<string, unknown>).sample, (poll as Record<string, unknown>).image_url, (poll as Record<string, unknown>).url);

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) return candidate;
  }
  throw new Error("BFL poll response was ready but did not include an image URL");
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`expected JSON response, received: ${text.slice(0, 200)}`);
  }
}

function assertPollResponse(value: unknown): FluxPollResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("BFL poll response was not an object");
  }
  return value as FluxPollResponse;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sortedPayload(input: ProviderPayload): ProviderPayload {
  const out: ProviderPayload = {};
  for (const key of Object.keys(input).sort()) out[key] = input[key];
  return out;
}

export class FluxAdapter extends BaseAdapter {
  readonly id = "bfl-flux-2-pro";
  readonly version = "0.1.0";

  manifest() {
    return fluxManifest;
  }

  loweringTable() {
    return fluxLoweringTable;
  }

  computeRegistry(): ComputeRegistry {
    return {
      describe_lights: describeLights,
      humanize_value: humanizeValue,
      aspect_width(value) {
        return aspectSize(value)?.width;
      },
      aspect_height(value) {
        return aspectSize(value)?.height;
      },
    };
  }

  buildPayload(parameters: ProviderPayload, prompt: string): ProviderPayload {
    const payload: ProviderPayload = {
      prompt,
      width: parameters.width ?? 1024,
      height: parameters.height ?? 1024,
      output_format: "png",
      safety_tolerance: parameters.safety_tolerance ?? 2,
    };
    if (parameters.seed !== undefined) payload.seed = parameters.seed;
    return sortedPayload(payload);
  }

  async execute(payload: ProviderPayload, options?: ExecuteOptions): Promise<GenerationResult> {
    const apiKey = process.env.BFL_API_KEY;
    if (apiKey === undefined) throw new Error("BFL_API_KEY is required to execute the FLUX adapter");

    const endpoint = process.env.BFL_API_URL ?? "https://api.bfl.ai/v1/flux-2-pro";
    const timeoutMs = options?.timeout_ms ?? 120_000;
    const pollIntervalMs = options?.poll_interval_ms ?? 1_000;

    const startResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-key": apiKey,
      },
      body: JSON.stringify(payload),
    });
    if (!startResponse.ok) {
      throw new Error(`BFL start request failed: ${startResponse.status} ${startResponse.statusText}`);
    }

    const start = (await readJson(startResponse)) as FluxStartResponse;
    if (typeof start.polling_url !== "string") throw new Error("BFL start response did not include polling_url");
    const id = typeof start.id === "string" ? start.id : "bfl-generated";

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await sleep(pollIntervalMs);
      const pollResponse = await fetch(start.polling_url, { headers: { "x-key": apiKey } });
      if (!pollResponse.ok) throw new Error(`BFL poll failed: ${pollResponse.status} ${pollResponse.statusText}`);
      const poll = assertPollResponse(await readJson(pollResponse));
      const status = typeof poll.status === "string" ? poll.status.toLowerCase() : "";

      if (status === "ready") {
        const imageUrl = extractImageUrl(poll);
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) throw new Error(`BFL image download failed: ${imageResponse.status} ${imageResponse.statusText}`);
        return {
          id,
          images: [{ data: Buffer.from(await imageResponse.arrayBuffer()).toString("base64"), media_type: "image/png" }],
          metadata: { provider: this.id, status: poll.status },
        };
      }

      if (status === "error" || status === "failed" || status === "failure") {
        throw new Error(`BFL generation failed: ${JSON.stringify(poll.error ?? poll)}`);
      }
    }

    throw new Error(`BFL generation timed out after ${timeoutMs}ms`);
  }
}

export const fluxAdapter = new FluxAdapter();
