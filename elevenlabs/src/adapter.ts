// SPDX-License-Identifier: Apache-2.0

import {
  BaseAdapter,
  type ComputeRegistry,
  type EmitOptions,
  type ExecuteOptions,
  type GenerationResult,
  type ProviderPayload,
} from "@mosvera/provider-base";
import { elevenLabsTtsLoweringTable } from "./lowering-table.ts";
import { elevenLabsTtsManifest } from "./manifest.ts";

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

function elevenLabsApiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (key === undefined) throw new Error("ELEVENLABS_API_KEY is required to execute the ElevenLabs adapter");
  return key;
}

function requireString(value: string | undefined, key: string): string {
  if (value === undefined) throw new Error(`ElevenLabs execution requires ${key}`);
  return value;
}

function mediaTypeFor(format: unknown): string {
  return typeof format === "string" && format.toLowerCase().includes("pcm") ? "audio/wav" : "audio/mpeg";
}

export class ElevenLabsTtsAdapter extends BaseAdapter {
  readonly id = "elevenlabs-tts";
  readonly version = "0.1.2";

  manifest() {
    return elevenLabsTtsManifest;
  }

  loweringTable() {
    return elevenLabsTtsLoweringTable;
  }

  computeRegistry(): ComputeRegistry {
    return { humanize_value: humanizeValue };
  }

  buildPayload(parameters: ProviderPayload, prompt: string, options?: EmitOptions): ProviderPayload {
    const providerOptions = options?.providerOptions ?? {};
    const payload: ProviderPayload = {
      text: optionString(providerOptions, "text") ?? prompt,
      model_id: optionString(providerOptions, "model_id") ?? optionString(parameters, "model_id") ?? "eleven_flash_v2_5",
      output_format: optionString(providerOptions, "output_format") ?? "mp3_44100_128",
    };
    const voiceId = optionString(providerOptions, "voice_id");
    if (voiceId !== undefined) payload.voice_id = voiceId;
    const settings = optionRecord(providerOptions, "voice_settings");
    if (settings !== undefined) payload.voice_settings = settings;
    return sortedPayload(payload);
  }

  async execute(payload: ProviderPayload, _options?: ExecuteOptions): Promise<GenerationResult> {
    const voiceId = requireString(optionString(payload, "voice_id") ?? process.env.ELEVENLABS_VOICE_ID, "voice_id");
    const outputFormat = optionString(payload, "output_format") ?? "mp3_44100_128";
    const body = sortedPayload(Object.fromEntries(Object.entries(payload).filter(([key]) => key !== "voice_id" && key !== "output_format")));
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${encodeURIComponent(outputFormat)}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "xi-api-key": elevenLabsApiKey(),
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`ElevenLabs TTS request failed: ${response.status} ${response.statusText} ${await response.text()}`);
    const data = Buffer.from(await response.arrayBuffer()).toString("base64");
    return {
      id: `elevenlabs-${voiceId}`,
      images: [],
      artifacts: [{ kind: "audio", media_type: mediaTypeFor(outputFormat), data, metadata: { provider: this.id, voice_id: voiceId } }],
      metadata: { provider: this.id, voice_id: voiceId, output_format: outputFormat },
    };
  }
}

export const elevenLabsTtsAdapter = new ElevenLabsTtsAdapter();
