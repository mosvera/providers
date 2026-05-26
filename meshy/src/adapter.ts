// SPDX-License-Identifier: Apache-2.0

import {
  BaseAdapter,
  type ComputeRegistry,
  type EmitOptions,
  type ExecuteOptions,
  type GenerationResult,
  type ProviderPayload,
} from "@mosvera/provider-base";
import { meshyTextTo3DLoweringTable } from "./lowering-table.ts";
import { meshyTextTo3DManifest } from "./manifest.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function humanizeValue(value: unknown): string {
  return String(value).replaceAll("_", " ");
}

function optionString(record: ProviderPayload, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (isRecord(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) {
      if (child !== undefined) out[key] = stable(child);
    }
    return out;
  }
  return value;
}

function sortedPayload(input: ProviderPayload): ProviderPayload {
  const out: ProviderPayload = {};
  for (const key of Object.keys(input).sort()) {
    const value = input[key];
    if (value !== undefined) out[key] = stable(value);
  }
  return out;
}

function meshyApiKey(): string {
  const key = process.env.MESHY_API_KEY;
  if (key === undefined) throw new Error("MESHY_API_KEY is required to execute the Meshy adapter");
  return key;
}

function baseUrl(): string {
  const configured = process.env.MESHY_API_BASE_URL?.replace(/\/$/, "");
  if (configured === undefined) return "https://api.meshy.ai";
  try {
    const url = new URL(configured);
    if (url.hostname === "www.meshy.ai" || url.hostname === "meshy.ai") return "https://api.meshy.ai";
  } catch {
    return "https://api.meshy.ai";
  }
  return configured;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`expected Meshy JSON response, received: ${text.slice(0, 200)}`);
  }
}

function taskId(value: unknown): string {
  if (isRecord(value) && typeof value.result === "string") return value.result;
  if (isRecord(value) && typeof value.id === "string") return value.id;
  throw new Error("Meshy start response did not include a task id");
}

function status(value: unknown): string {
  return isRecord(value) && typeof value.status === "string" ? value.status.toUpperCase() : "";
}

function modelUrls(value: unknown): Record<string, string> {
  if (!isRecord(value) || !isRecord(value.model_urls)) return {};
  const out: Record<string, string> = {};
  for (const [key, url] of Object.entries(value.model_urls)) {
    if (typeof url === "string" && url.length > 0) out[key] = url;
  }
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MeshyTextTo3DAdapter extends BaseAdapter {
  readonly id = "meshy-text-to-3d";
  readonly version = "0.1.2";

  manifest() {
    return meshyTextTo3DManifest;
  }

  loweringTable() {
    return meshyTextTo3DLoweringTable;
  }

  computeRegistry(): ComputeRegistry {
    return { humanize_value: humanizeValue };
  }

  buildPayload(parameters: ProviderPayload, prompt: string, options?: EmitOptions): ProviderPayload {
    const providerOptions = options?.providerOptions ?? {};
    const payload: ProviderPayload = {
      mode: optionString(providerOptions, "mode") ?? "preview",
      prompt: optionString(providerOptions, "prompt") ?? prompt,
      art_style: optionString(providerOptions, "art_style") ?? "realistic",
      target_formats: Array.isArray(providerOptions.target_formats) ? providerOptions.target_formats : ["glb"],
    };
    if (parameters.target_polycount !== undefined) payload.target_polycount = parameters.target_polycount;
    const previewTaskId = optionString(providerOptions, "preview_task_id");
    if (previewTaskId !== undefined) payload.preview_task_id = previewTaskId;
    return sortedPayload(payload);
  }

  async execute(payload: ProviderPayload, options?: ExecuteOptions): Promise<GenerationResult> {
    const startResponse = await fetch(`${baseUrl()}/openapi/v2/text-to-3d`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${meshyApiKey()}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!startResponse.ok) throw new Error(`Meshy text-to-3D request failed: ${startResponse.status} ${startResponse.statusText} ${await startResponse.text()}`);
    const id = taskId(await readJson(startResponse));
    const timeoutMs = options?.timeout_ms ?? 300_000;
    const pollIntervalMs = options?.poll_interval_ms ?? 5_000;
    const deadline = Date.now() + timeoutMs;
    let task: unknown = undefined;
    while (Date.now() < deadline) {
      await sleep(pollIntervalMs);
      const poll = await fetch(`${baseUrl()}/openapi/v2/text-to-3d/${encodeURIComponent(id)}`, {
        headers: { authorization: `Bearer ${meshyApiKey()}` },
      });
      if (!poll.ok) throw new Error(`Meshy text-to-3D poll failed: ${poll.status} ${poll.statusText}`);
      task = await readJson(poll);
      const current = status(task);
      if (current === "SUCCEEDED" || current === "SUCCESS") {
        const urls = modelUrls(task);
        const entries = Object.entries(urls);
        if (entries.length === 0) throw new Error("Meshy task succeeded without model URLs");
        return {
          id,
          images: [],
          artifacts: entries.map(([format, url]) => ({
            kind: "model_3d",
            media_type: format === "glb" ? "model/gltf-binary" : "application/octet-stream",
            url,
            metadata: { provider: this.id, format },
          })),
          metadata: { provider: this.id, task: stable(task) as Record<string, unknown> },
        };
      }
      if (current === "FAILED" || current === "CANCELED" || current === "CANCELLED") {
        throw new Error(`Meshy task failed: ${JSON.stringify(task)}`);
      }
    }
    throw new Error(`Meshy text-to-3D task timed out after ${timeoutMs}ms`);
  }
}

export const meshyTextTo3DAdapter = new MeshyTextTo3DAdapter();
