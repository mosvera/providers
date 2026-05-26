// SPDX-License-Identifier: Apache-2.0

import {
  BaseAdapter,
  type ComputeRegistry,
  type EmitOptions,
  type ExecuteOptions,
  type GenerationResult,
  type ProviderPayload,
} from "@mosvera/provider-base";
import { heygenLoweringTable } from "./lowering-table.ts";
import { heygenManifest } from "./manifest.ts";

interface HeyGenStartResponse {
  data?: unknown;
  video_id?: unknown;
  id?: unknown;
}

interface HeyGenPollResponse {
  data?: unknown;
  status?: unknown;
  state?: unknown;
  error?: unknown;
}

const HEYGEN_CREATE_KEYS = new Set([
  "aspect_ratio",
  "audio_asset_id",
  "audio_url",
  "avatar_id",
  "background",
  "callback_id",
  "callback_url",
  "caption",
  "engine",
  "expressiveness",
  "fit",
  "motion_prompt",
  "output_format",
  "remove_background",
  "resolution",
  "script",
  "title",
  "type",
  "voice_id",
  "voice_settings",
  "watermark",
]);

const STATUS_DONE = new Set(["completed", "complete", "done", "ready", "success", "succeeded"]);
const STATUS_FAILED = new Set(["error", "failed", "failure", "canceled", "cancelled"]);

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

function heygenAspectRatio(value: unknown): string {
  if (value === "9:16" || value === "16:9" || value === "1:1") return value;
  if (value === "2:3") return "9:16";
  return "16:9";
}

function backgroundFromColor(value: unknown): { value: string } | undefined {
  return typeof value === "string" && value.length > 0 ? { value } : undefined;
}

function optionString(record: ProviderPayload, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function optionBoolean(record: ProviderPayload, key: string): boolean | undefined {
  const value = record[key];
  return typeof value === "boolean" ? value : undefined;
}

function optionRecord(record: ProviderPayload, key: string): Record<string, unknown> | undefined {
  const value = record[key];
  return isRecord(value) ? value : undefined;
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

function titleFromPrompt(prompt: string): string {
  const clauses = prompt.split(";");
  const headline = clauses.find((clause) => clause.trim().toLowerCase().startsWith("headline intent:"));
  const first = (headline ?? clauses[0])
    ?.trim()
    .replace(/^(headline intent|context label|video subject):\s*/i, "")
    .trim();
  if (first === undefined || first.length === 0) return "Mosvera avatar video";
  return first.length > 80 ? `${first.slice(0, 77)}...` : first;
}

function captionValue(value: unknown): unknown {
  if (value === true) return { file_format: "srt" };
  if (value === false || value === undefined) return undefined;
  if (typeof value === "string" && value.length > 0) return { file_format: value };
  if (isRecord(value)) return value;
  return undefined;
}

function backgroundValue(value: unknown): unknown {
  if (typeof value === "string" && value.length > 0) return { value };
  if (isRecord(value)) return value;
  return undefined;
}

function toCreatePayload(payload: ProviderPayload): ProviderPayload {
  const out: ProviderPayload = {};
  for (const [key, value] of Object.entries(payload)) {
    if (HEYGEN_CREATE_KEYS.has(key)) out[key] = value;
  }
  return out;
}

function readJson(response: Response): Promise<unknown> {
  return response.text().then((text) => {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new Error(`expected JSON response, received: ${text.slice(0, 200)}`);
    }
  });
}

function extractRecord(value: unknown): Record<string, unknown> {
  if (isRecord(value)) return value;
  throw new Error("HeyGen response was not an object");
}

function nestedRecord(value: unknown, key: string): Record<string, unknown> | undefined {
  if (!isRecord(value)) return undefined;
  const child = value[key];
  return isRecord(child) ? child : undefined;
}

function stringFromCandidates(...candidates: unknown[]): string | undefined {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) return candidate;
  }
  return undefined;
}

function videoIdFromStart(start: HeyGenStartResponse): string {
  const data = nestedRecord(start, "data");
  const id = stringFromCandidates(data?.video_id, data?.id, start.video_id, start.id);
  if (id === undefined) throw new Error("HeyGen start response did not include a video id");
  return id;
}

function statusFromPoll(poll: HeyGenPollResponse): string {
  const data = nestedRecord(poll, "data");
  return stringFromCandidates(data?.status, data?.state, poll.status, poll.state)?.toLowerCase() ?? "";
}

function videoUrlFromPoll(poll: HeyGenPollResponse): string | undefined {
  const data = nestedRecord(poll, "data");
  return stringFromCandidates(data?.video_url, data?.download_url, data?.url, (poll as Record<string, unknown>).video_url, (poll as Record<string, unknown>).download_url);
}

function subtitleUrlFromPoll(poll: HeyGenPollResponse): string | undefined {
  const data = nestedRecord(poll, "data");
  return stringFromCandidates(data?.caption_url, data?.subtitle_url, (poll as Record<string, unknown>).caption_url, (poll as Record<string, unknown>).subtitle_url);
}

function mediaTypeFor(format: unknown): string {
  return format === "webm" ? "video/webm" : "video/mp4";
}

function hasContent(payload: ProviderPayload): boolean {
  return optionString(payload, "script") !== undefined || optionString(payload, "audio_url") !== undefined || optionString(payload, "audio_asset_id") !== undefined;
}

function requirePayload(value: string | undefined, key: string): string {
  if (value === undefined) throw new Error(`HeyGen execution requires ${key}`);
  return value;
}

function createEndpoint(): string {
  const base = process.env.HEYGEN_API_BASE_URL ?? "https://api.heygen.com";
  return process.env.HEYGEN_CREATE_URL ?? `${base.replace(/\/$/, "")}/v3/videos`;
}

function statusEndpoint(videoId: string): string {
  const base = process.env.HEYGEN_API_BASE_URL ?? "https://api.heygen.com";
  const configured = process.env.HEYGEN_STATUS_URL;
  if (configured !== undefined) return configured.replace("{video_id}", encodeURIComponent(videoId));
  return `${base.replace(/\/$/, "")}/v3/videos/${encodeURIComponent(videoId)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class HeyGenAdapter extends BaseAdapter {
  readonly id = "heygen-avatar-video";
  readonly version = "0.1.1";

  manifest() {
    return heygenManifest;
  }

  loweringTable() {
    return heygenLoweringTable;
  }

  computeRegistry(): ComputeRegistry {
    return {
      background_from_color: backgroundFromColor,
      describe_lights: describeLights,
      heygen_aspect_ratio: heygenAspectRatio,
      humanize_value: humanizeValue,
    };
  }

  buildPayload(parameters: ProviderPayload, prompt: string, options?: EmitOptions): ProviderPayload {
    const providerOptions = options?.providerOptions ?? {};
    const payload: ProviderPayload = {
      type: optionString(providerOptions, "type") ?? "avatar",
      title: optionString(providerOptions, "title") ?? titleFromPrompt(prompt),
      resolution: optionString(providerOptions, "resolution") ?? optionString(parameters, "resolution") ?? "1080p",
      aspect_ratio: optionString(providerOptions, "aspect_ratio") ?? optionString(parameters, "aspect_ratio") ?? "16:9",
      output_format: optionString(providerOptions, "output_format") ?? "mp4",
    };

    for (const key of ["avatar_id", "voice_id", "script", "audio_url", "audio_asset_id", "callback_url", "callback_id", "fit"] as const) {
      const value = optionString(providerOptions, key);
      if (value !== undefined) payload[key] = value;
    }

    const background = backgroundValue(providerOptions.background ?? parameters.background);
    if (background !== undefined) payload.background = background;

    const caption = captionValue(providerOptions.caption);
    if (caption !== undefined) payload.caption = caption;

    const motionPrompt = optionString(providerOptions, "motion_prompt") ?? prompt;
    if (motionPrompt.length > 0) payload.motion_prompt = motionPrompt;

    for (const key of ["engine", "expressiveness", "voice_settings", "watermark"] as const) {
      const value = optionRecord(providerOptions, key);
      if (value !== undefined) payload[key] = value;
    }

    for (const key of ["remove_background"] as const) {
      const value = optionBoolean(providerOptions, key);
      if (value !== undefined) payload[key] = value;
    }

    return sortedPayload(payload);
  }

  async execute(payload: ProviderPayload, options?: ExecuteOptions): Promise<GenerationResult> {
    const apiKey = process.env.HEYGEN_API_KEY;
    if (apiKey === undefined) throw new Error("HEYGEN_API_KEY is required to execute the HeyGen adapter");
    requirePayload(optionString(payload, "avatar_id"), "avatar_id");
    if (!hasContent(payload)) throw new Error("HeyGen execution requires script, audio_url, or audio_asset_id");

    const startResponse = await fetch(createEndpoint(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(toCreatePayload(payload)),
    });
    if (!startResponse.ok) {
      throw new Error(`HeyGen start request failed: ${startResponse.status} ${startResponse.statusText}`);
    }

    const start = extractRecord(await readJson(startResponse)) as HeyGenStartResponse;
    const id = videoIdFromStart(start);
    const timeoutMs = options?.timeout_ms ?? 300_000;
    const pollIntervalMs = options?.poll_interval_ms ?? 2_500;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      await sleep(pollIntervalMs);
      const pollResponse = await fetch(statusEndpoint(id), {
        headers: { "x-api-key": apiKey },
      });
      if (!pollResponse.ok) {
        throw new Error(`HeyGen status request failed: ${pollResponse.status} ${pollResponse.statusText}`);
      }
      const poll = extractRecord(await readJson(pollResponse)) as HeyGenPollResponse;
      const status = statusFromPoll(poll);
      const videoUrl = videoUrlFromPoll(poll);

      if ((status === "" && videoUrl !== undefined) || STATUS_DONE.has(status)) {
        if (videoUrl === undefined) throw new Error("HeyGen status response was ready but did not include a video URL");
        const subtitleUrl = subtitleUrlFromPoll(poll);
        return {
          id,
          images: [],
          artifacts: [
            {
              kind: "video",
              media_type: mediaTypeFor(payload.output_format),
              url: videoUrl,
              metadata: { provider: this.id, status },
            },
            ...(subtitleUrl === undefined ? [] : [{ kind: "subtitle" as const, media_type: "text/vtt", url: subtitleUrl }]),
          ],
          metadata: {
            provider: this.id,
            status,
            response: stable(poll),
          },
        };
      }

      if (STATUS_FAILED.has(status)) {
        throw new Error(`HeyGen generation failed: ${JSON.stringify((poll.data as Record<string, unknown> | undefined)?.error ?? poll.error ?? poll)}`);
      }
    }

    throw new Error(`HeyGen generation timed out after ${timeoutMs}ms`);
  }
}

export const heygenAdapter = new HeyGenAdapter();
