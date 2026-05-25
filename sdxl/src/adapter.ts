// SPDX-License-Identifier: Apache-2.0

import Replicate from "replicate";
import { BaseAdapter, type ComputeRegistry, type ExecuteOptions, type GenerationResult, type ProviderPayload } from "@mosvera/provider-base";
import { sdxlLoweringTable } from "./lowering-table.ts";
import { sdxlManifest } from "./manifest.ts";

const SDXL_MODEL = "stability-ai/sdxl:2a865c9a94c9992b6689365b75db2d678d5022505ed3f63a5f53929a31a46947";

const ASPECT_SIZES: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "3:2": { width: 1536, height: 1024 },
  "2:3": { width: 1024, height: 1536 },
  "16:9": { width: 1536, height: 864 },
  "9:16": { width: 864, height: 1536 },
};

export interface SDXLAdapterConfig {
  default_negative_prompt?: string;
  scheduler?: string;
  refine?: string;
  high_noise_frac?: number;
  seed?: number;
}

interface ResolvedSDXLConfig {
  default_negative_prompt: string;
  scheduler: string;
  refine: string;
  high_noise_frac: number;
  seed?: number;
}

function resolveConfig(config: SDXLAdapterConfig): ResolvedSDXLConfig {
  const resolved: ResolvedSDXLConfig = {
    default_negative_prompt: config.default_negative_prompt ?? "ugly, blurry, low quality, distorted, disfigured",
    scheduler: config.scheduler ?? "K_EULER",
    refine: config.refine ?? "expert_ensemble_refiner",
    high_noise_frac: config.high_noise_frac ?? 0.8,
  };
  if (config.seed !== undefined) resolved.seed = config.seed;
  return resolved;
}

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

function sortedPayload(input: ProviderPayload): ProviderPayload {
  const out: ProviderPayload = {};
  for (const key of Object.keys(input).sort()) out[key] = input[key];
  return out;
}

function firstOutput(output: unknown): unknown {
  if (Array.isArray(output)) return output[0];
  return output;
}

async function imageBytesFromOutput(output: unknown): Promise<Buffer> {
  const image = firstOutput(output);
  if (typeof image === "string") {
    const response = await fetch(image);
    if (!response.ok) throw new Error(`Replicate image download failed: ${response.status} ${response.statusText}`);
    return Buffer.from(await response.arrayBuffer());
  }
  if (image instanceof Uint8Array) return Buffer.from(image);
  if (image instanceof ArrayBuffer) return Buffer.from(image);
  if (image instanceof ReadableStream) return Buffer.from(await new Response(image).arrayBuffer());
  if (typeof image === "object" && image !== null) {
    const record = image as {
      arrayBuffer?: () => Promise<ArrayBuffer>;
      blob?: () => Promise<Blob>;
      url?: string | (() => string);
    };
    if (typeof record.arrayBuffer === "function") return Buffer.from(await record.arrayBuffer());
    if (typeof record.blob === "function") return Buffer.from(await (await record.blob()).arrayBuffer());
    const url = typeof record.url === "function" ? record.url() : record.url;
    if (typeof url === "string") {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Replicate image download failed: ${response.status} ${response.statusText}`);
      return Buffer.from(await response.arrayBuffer());
    }
  }
  throw new Error("Replicate SDXL output did not include an image file or URL");
}

export class SDXLAdapter extends BaseAdapter {
  readonly id = "sdxl-replicate";
  readonly version = "0.1.0";

  private readonly config: ResolvedSDXLConfig;

  constructor(config: SDXLAdapterConfig = {}) {
    super();
    this.config = resolveConfig(config);
  }

  manifest() {
    return sdxlManifest;
  }

  loweringTable() {
    return sdxlLoweringTable;
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
      negative_prompt: this.config.default_negative_prompt,
      width: parameters.width ?? 1024,
      height: parameters.height ?? 1024,
      num_outputs: 1,
      num_inference_steps: parameters.num_inference_steps ?? 35,
      guidance_scale: parameters.guidance_scale ?? 7.5,
      scheduler: this.config.scheduler,
      refine: this.config.refine,
      high_noise_frac: this.config.high_noise_frac,
      output_format: "png",
    };
    if (this.config.seed !== undefined) payload.seed = this.config.seed;
    return sortedPayload(payload);
  }

  async execute(payload: ProviderPayload, _options?: ExecuteOptions): Promise<GenerationResult> {
    const token = process.env.REPLICATE_API_TOKEN;
    if (token === undefined) throw new Error("REPLICATE_API_TOKEN is required to execute the SDXL adapter");

    const replicate = new Replicate({ auth: token });
    const output = await replicate.run(SDXL_MODEL, { input: payload });
    const image = await imageBytesFromOutput(output);
    return {
      id: "replicate-sdxl-generated",
      images: [{ data: image.toString("base64"), media_type: "image/png" }],
      metadata: { provider: this.id, replicate_model: SDXL_MODEL },
    };
  }
}

export const sdxlAdapter = new SDXLAdapter();
