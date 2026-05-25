// SPDX-License-Identifier: Apache-2.0

import OpenAI from "openai";
import type { ImageGenerateParamsNonStreaming, ImagesResponse } from "openai/resources/images";
import { BaseAdapter, type ComputeRegistry, type ExecuteOptions, type GenerationResult, type ProviderPayload } from "@mosvera/provider-base";
import { openaiLoweringTable } from "./lowering-table.ts";
import { openaiManifest } from "./manifest.ts";

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

function sortedPayload(input: ProviderPayload): ProviderPayload {
  const out: ProviderPayload = {};
  for (const key of Object.keys(input).sort()) out[key] = input[key];
  return out;
}

async function imageDataFromResponse(image: NonNullable<ImagesResponse["data"]>[number]): Promise<string> {
  if (typeof image.b64_json === "string") return image.b64_json;
  if (typeof image.url === "string") {
    const response = await fetch(image.url);
    if (!response.ok) throw new Error(`failed to fetch generated image: ${response.status} ${response.statusText}`);
    return Buffer.from(await response.arrayBuffer()).toString("base64");
  }
  throw new Error("OpenAI image response did not include b64_json or url");
}

export class OpenAIAdapter extends BaseAdapter {
  readonly id = "openai-gpt-image-1";
  readonly version = "0.1.0";

  manifest() {
    return openaiManifest;
  }

  loweringTable() {
    return openaiLoweringTable;
  }

  computeRegistry(): ComputeRegistry {
    return { describe_lights: describeLights, humanize_value: humanizeValue };
  }

  buildPayload(parameters: ProviderPayload, prompt: string): ProviderPayload {
    const payload: ProviderPayload = {
      model: "gpt-image-1",
      prompt,
      n: 1,
      output_format: "png",
    };
    for (const key of ["size", "quality", "moderation"] as const) {
      if (parameters[key] !== undefined) payload[key] = parameters[key];
    }
    return sortedPayload(payload);
  }

  async execute(payload: ProviderPayload, _options?: ExecuteOptions): Promise<GenerationResult> {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.images.generate(payload as unknown as ImageGenerateParamsNonStreaming);
    const data = response.data ?? [];
    const images = await Promise.all(
      data.map(async (image) => ({
        data: await imageDataFromResponse(image),
        media_type: "image/png",
      })),
    );

    return {
      id: `openai-${String(response.created ?? "generated")}`,
      images,
      metadata: {
        provider: this.id,
        created: response.created,
      },
    };
  }
}

export const openaiAdapter = new OpenAIAdapter();
