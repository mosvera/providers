// SPDX-License-Identifier: Apache-2.0

import {
  BaseAdapter,
  type ComputeRegistry,
  type EmitOptions,
  type ExecuteOptions,
  type GenerationResult,
  type ProviderPayload,
} from "@mosvera/provider-base";
import { runwayGen4ImageLoweringTable, runwayGen45VideoLoweringTable } from "./lowering-table.ts";
import { runwayGen4ImageManifest, runwayGen45VideoManifest } from "./manifest.ts";

const RUNWAY_BASE_URL = "https://api.dev.runwayml.com/v1";
const RUNWAY_VERSION = "2024-11-06";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function humanizeValue(value: unknown): string {
  return String(value).replaceAll("_", " ");
}

function describeLights(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .map((light) => {
      if (!isRecord(light)) return "";
      const name = typeof light.name === "string" ? light.name : "unnamed";
      const power = light.power === undefined ? "" : ` at power ${String(light.power)}`;
      return `${name} light${power}`;
    })
    .filter(Boolean)
    .join(", ");
}

function runwayImageRatio(value: unknown): string {
  if (value === "1:1") return "1024:1024";
  if (value === "9:16" || value === "2:3") return "1080:1920";
  return "1920:1080";
}

function runwayVideoRatio(value: unknown): string {
  return value === "9:16" || value === "2:3" ? "720:1280" : "1280:720";
}

function optionString(record: ProviderPayload, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function optionNumber(record: ProviderPayload, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function combinedPrompt(userPrompt: string | undefined, mosveraPrompt: string): string {
  if (userPrompt === undefined) return mosveraPrompt;
  if (mosveraPrompt.length === 0) return userPrompt;
  return `${userPrompt}\n\nMosvera aesthetic direction: ${mosveraPrompt}`;
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

function commonComputeRegistry(): ComputeRegistry {
  return {
    describe_lights: describeLights,
    humanize_value: humanizeValue,
    runway_image_ratio: runwayImageRatio,
    runway_video_ratio: runwayVideoRatio,
  };
}

function runwayApiKey(): string {
  const key = process.env.RUNWAY_API_KEY;
  if (key === undefined) throw new Error("RUNWAY_API_KEY is required to execute the Runway adapter");
  return key;
}

function runwayHeaders(): Record<string, string> {
  return {
    authorization: `Bearer ${runwayApiKey()}`,
    "content-type": "application/json",
    "x-runway-version": RUNWAY_VERSION,
  };
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`expected Runway JSON response, received: ${text.slice(0, 200)}`);
  }
}

function taskId(value: unknown): string {
  if (isRecord(value) && typeof value.id === "string") return value.id;
  throw new Error("Runway start response did not include a task id");
}

function taskStatus(value: unknown): string {
  return isRecord(value) && typeof value.status === "string" ? value.status.toLowerCase() : "";
}

function taskOutput(value: unknown): string[] {
  if (!isRecord(value)) return [];
  const output = value.output;
  if (typeof output === "string") return [output];
  if (Array.isArray(output)) return output.filter((item): item is string => typeof item === "string");
  return [];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startRunwayTask(endpoint: string, payload: ProviderPayload): Promise<unknown> {
  const response = await fetch(`${RUNWAY_BASE_URL}/${endpoint}`, {
    method: "POST",
    headers: runwayHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Runway ${endpoint} request failed: ${response.status} ${response.statusText} ${await response.text()}`);
  return readJson(response);
}

async function pollRunwayTask(id: string, options?: ExecuteOptions): Promise<unknown> {
  const timeoutMs = options?.timeout_ms ?? 300_000;
  const pollIntervalMs = options?.poll_interval_ms ?? 2_500;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(pollIntervalMs);
    const response = await fetch(`${RUNWAY_BASE_URL}/tasks/${encodeURIComponent(id)}`, { headers: runwayHeaders() });
    if (!response.ok) throw new Error(`Runway task poll failed: ${response.status} ${response.statusText}`);
    const task = await readJson(response);
    const status = taskStatus(task);
    if (status === "succeeded" || status === "success" || status === "completed") return task;
    if (status === "failed" || status === "failure" || status === "cancelled" || status === "canceled") {
      throw new Error(`Runway task failed: ${JSON.stringify(task)}`);
    }
  }
  throw new Error(`Runway task timed out after ${timeoutMs}ms`);
}

export class RunwayGen4ImageAdapter extends BaseAdapter {
  readonly id = "runway-gen4-image";
  readonly version = "0.1.2";

  manifest() {
    return runwayGen4ImageManifest;
  }

  loweringTable() {
    return runwayGen4ImageLoweringTable;
  }

  computeRegistry(): ComputeRegistry {
    return commonComputeRegistry();
  }

  buildPayload(parameters: ProviderPayload, prompt: string, options?: EmitOptions): ProviderPayload {
    const providerOptions = options?.providerOptions ?? {};
    const payload: ProviderPayload = {
      model: optionString(providerOptions, "model") ?? "gen4_image",
      promptText: combinedPrompt(optionString(providerOptions, "prompt_text"), prompt),
      ratio: optionString(providerOptions, "ratio") ?? optionString(parameters, "ratio") ?? "1920:1080",
    };
    const referenceImages = providerOptions.reference_images;
    if (Array.isArray(referenceImages)) payload.referenceImages = referenceImages;
    return sortedPayload(payload);
  }

  async execute(payload: ProviderPayload, options?: ExecuteOptions): Promise<GenerationResult> {
    const start = await startRunwayTask("text_to_image", payload);
    const id = taskId(start);
    const task = await pollRunwayTask(id, options);
    const outputs = taskOutput(task);
    if (outputs.length === 0) throw new Error("Runway image task completed without output URLs");
    return {
      id,
      images: [],
      artifacts: outputs.map((url) => ({ kind: "image", media_type: "image/png", url })),
      metadata: { provider: this.id, task: stable(task) as Record<string, unknown> },
    };
  }
}

export class RunwayGen45VideoAdapter extends BaseAdapter {
  readonly id = "runway-gen45-video";
  readonly version = "0.1.2";

  manifest() {
    return runwayGen45VideoManifest;
  }

  loweringTable() {
    return runwayGen45VideoLoweringTable;
  }

  computeRegistry(): ComputeRegistry {
    return commonComputeRegistry();
  }

  buildPayload(parameters: ProviderPayload, prompt: string, options?: EmitOptions): ProviderPayload {
    const providerOptions = options?.providerOptions ?? {};
    const duration = Math.min(Math.max(optionNumber(providerOptions, "duration") ?? 5, 1), 10);
    const payload: ProviderPayload = {
      model: optionString(providerOptions, "model") ?? "gen4.5",
      promptText: combinedPrompt(optionString(providerOptions, "prompt_text"), prompt),
      ratio: optionString(providerOptions, "ratio") ?? optionString(parameters, "ratio") ?? "1280:720",
      duration,
    };
    const promptImage = optionString(providerOptions, "prompt_image");
    if (promptImage !== undefined) payload.promptImage = promptImage;
    return sortedPayload(payload);
  }

  async execute(payload: ProviderPayload, options?: ExecuteOptions): Promise<GenerationResult> {
    const start = await startRunwayTask("image_to_video", payload);
    const id = taskId(start);
    const task = await pollRunwayTask(id, options);
    const outputs = taskOutput(task);
    if (outputs.length === 0) throw new Error("Runway video task completed without output URLs");
    return {
      id,
      images: [],
      artifacts: outputs.map((url) => ({ kind: "video", media_type: "video/mp4", url })),
      metadata: { provider: this.id, task: stable(task) as Record<string, unknown> },
    };
  }
}

export const runwayGen4ImageAdapter = new RunwayGen4ImageAdapter();
export const runwayGen45VideoAdapter = new RunwayGen45VideoAdapter();
