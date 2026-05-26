// SPDX-License-Identifier: Apache-2.0

import {
  BaseAdapter,
  type ComputeRegistry,
  type EmitOptions,
  type ExecuteOptions,
  type GenerationResult,
  type ProviderPayload,
} from "@mosvera/provider-base";
import { googleGeminiImageLoweringTable, googleVeoVideoLoweringTable } from "./lowering-table.ts";
import { googleGeminiImageManifest, googleVeoVideoManifest } from "./manifest.ts";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

type GoogleResponsePart = {
  inlineData?: { data?: unknown; mimeType?: unknown };
  inline_data?: { data?: unknown; mime_type?: unknown };
  text?: unknown;
};

type GoogleInlineData = {
  data?: unknown;
  mimeType?: unknown;
  mime_type?: unknown;
};

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

function veoAspectRatio(value: unknown): string {
  return value === "9:16" ? "9:16" : "16:9";
}

function veoDurationSeconds(value: number): number {
  return [4, 6, 8].reduce((best, candidate) => {
    return Math.abs(candidate - value) < Math.abs(best - value) ? candidate : best;
  }, 4);
}

function optionString(record: ProviderPayload, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function optionNumber(record: ProviderPayload, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function optionArray(record: ProviderPayload, key: string): unknown[] | undefined {
  const value = record[key];
  return Array.isArray(value) ? value : undefined;
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

function readJson(response: Response): Promise<unknown> {
  return response.text().then((text) => {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new Error(`expected Google JSON response, received: ${text.slice(0, 200)}`);
    }
  });
}

function googleApiKey(): string {
  const key = process.env.GOOGLE_GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (key === undefined) throw new Error("GOOGLE_GEMINI_API_KEY or GOOGLE_API_KEY is required to execute the Google adapter");
  return key;
}

function generatedParts(response: unknown): GoogleResponsePart[] {
  const parts: GoogleResponsePart[] = [];
  if (!isRecord(response)) return parts;
  const candidates = Array.isArray(response.candidates) ? response.candidates : [];
  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue;
    const content = isRecord(candidate.content) ? candidate.content : undefined;
    const candidateParts = Array.isArray(content?.parts) ? content.parts : [];
    for (const part of candidateParts) {
      if (isRecord(part)) parts.push(part as GoogleResponsePart);
    }
  }
  return parts;
}

function generatedInlineData(part: GoogleResponsePart): GoogleInlineData | undefined {
  return part.inlineData ?? part.inline_data;
}

function videoUriFromOperation(operation: unknown): string | undefined {
  if (!isRecord(operation)) return undefined;
  const response = isRecord(operation.response) ? operation.response : undefined;
  const generateVideoResponse = isRecord(response?.generateVideoResponse) ? response.generateVideoResponse : undefined;
  const samples = Array.isArray(generateVideoResponse?.generatedSamples) ? generateVideoResponse.generatedSamples : [];
  const first = samples.find(isRecord);
  const video = isRecord(first?.video) ? first.video : undefined;
  return typeof video?.uri === "string" ? video.uri : undefined;
}

function operationDone(operation: unknown): boolean {
  return isRecord(operation) && operation.done === true;
}

function operationName(operation: unknown): string {
  if (isRecord(operation) && typeof operation.name === "string" && operation.name.length > 0) return operation.name;
  throw new Error("Google video response did not include an operation name");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function commonComputeRegistry(): ComputeRegistry {
  return {
    describe_lights: describeLights,
    humanize_value: humanizeValue,
    veo_aspect_ratio: veoAspectRatio,
  };
}

export class GoogleGeminiImageAdapter extends BaseAdapter {
  readonly id = "google-gemini-image";
  readonly version = "0.1.2";

  manifest() {
    return googleGeminiImageManifest;
  }

  loweringTable() {
    return googleGeminiImageLoweringTable;
  }

  computeRegistry(): ComputeRegistry {
    return commonComputeRegistry();
  }

  buildPayload(parameters: ProviderPayload, prompt: string, options?: EmitOptions): ProviderPayload {
    const providerOptions = options?.providerOptions ?? {};
    const config: ProviderPayload = { responseModalities: ["TEXT", "IMAGE"] };
    const aspectRatio = optionString(providerOptions, "aspect_ratio") ?? optionString(parameters, "aspectRatio");
    if (aspectRatio !== undefined) config.imageConfig = { aspectRatio };
    const payload: ProviderPayload = {
      model: optionString(providerOptions, "model") ?? "gemini-3.1-flash-image-preview",
      contents: [{ parts: [{ text: optionString(providerOptions, "prompt") ?? prompt }] }],
      generationConfig: config,
    };
    const referenceImages = optionArray(providerOptions, "reference_images");
    if (referenceImages !== undefined) payload.reference_images = referenceImages;
    return sortedPayload(payload);
  }

  async execute(payload: ProviderPayload, _options?: ExecuteOptions): Promise<GenerationResult> {
    const model = optionString(payload, "model") ?? "gemini-3.1-flash-image-preview";
    const url = `${GEMINI_BASE_URL}/models/${encodeURIComponent(model)}:generateContent`;
    const body = sortedPayload(Object.fromEntries(Object.entries(payload).filter(([key]) => key !== "model")));
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": googleApiKey(),
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Google image request failed: ${response.status} ${response.statusText} ${await response.text()}`);
    const json = await readJson(response);
    const images = generatedParts(json)
      .map(generatedInlineData)
      .filter((inline): inline is GoogleInlineData => inline !== undefined)
      .flatMap((inline) => {
        const data = inline.data;
        if (typeof data !== "string" || data.length === 0) return [];
        const mediaType = typeof inline.mimeType === "string" ? inline.mimeType : typeof inline.mime_type === "string" ? inline.mime_type : "image/png";
        return [{ data, media_type: mediaType }];
      });
    if (images.length === 0) throw new Error("Google image response did not include inline image data");
    return {
      id: "google-gemini-image-generated",
      images,
      artifacts: images.map((image) => ({ kind: "image", media_type: image.media_type, data: image.data })),
      metadata: { provider: this.id, model },
    };
  }
}

export class GoogleVeoVideoAdapter extends BaseAdapter {
  readonly id = "google-veo-video";
  readonly version = "0.1.2";

  manifest() {
    return googleVeoVideoManifest;
  }

  loweringTable() {
    return googleVeoVideoLoweringTable;
  }

  computeRegistry(): ComputeRegistry {
    return commonComputeRegistry();
  }

  buildPayload(parameters: ProviderPayload, prompt: string, options?: EmitOptions): ProviderPayload {
    const providerOptions = options?.providerOptions ?? {};
    const parametersOut: ProviderPayload = {
      aspectRatio: optionString(providerOptions, "aspect_ratio") ?? optionString(parameters, "aspectRatio") ?? "16:9",
      resolution: optionString(providerOptions, "resolution") ?? optionString(parameters, "resolution") ?? "720p",
    };
    const duration = optionNumber(providerOptions, "duration_seconds");
    if (duration !== undefined) parametersOut.durationSeconds = veoDurationSeconds(duration);
    return sortedPayload({
      model: optionString(providerOptions, "model") ?? "veo-3.1-generate-preview",
      instances: [{ prompt: optionString(providerOptions, "prompt") ?? prompt }],
      parameters: parametersOut,
    });
  }

  async execute(payload: ProviderPayload, options?: ExecuteOptions): Promise<GenerationResult> {
    const model = optionString(payload, "model") ?? "veo-3.1-generate-preview";
    const key = googleApiKey();
    const body = sortedPayload(Object.fromEntries(Object.entries(payload).filter(([k]) => k !== "model")));
    const startResponse = await fetch(`${GEMINI_BASE_URL}/models/${encodeURIComponent(model)}:predictLongRunning`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify(body),
    });
    if (!startResponse.ok) throw new Error(`Google video request failed: ${startResponse.status} ${startResponse.statusText} ${await startResponse.text()}`);
    let operation = await readJson(startResponse);
    const name = operationName(operation);
    const timeoutMs = options?.timeout_ms ?? 420_000;
    const pollIntervalMs = options?.poll_interval_ms ?? 10_000;
    const deadline = Date.now() + timeoutMs;
    while (!operationDone(operation) && Date.now() < deadline) {
      await sleep(pollIntervalMs);
      const poll = await fetch(`${GEMINI_BASE_URL}/${name}`, { headers: { "x-goog-api-key": key } });
      if (!poll.ok) throw new Error(`Google video poll failed: ${poll.status} ${poll.statusText}`);
      operation = await readJson(poll);
    }
    if (!operationDone(operation)) throw new Error(`Google video generation timed out after ${timeoutMs}ms`);
    const uri = videoUriFromOperation(operation);
    if (uri === undefined) throw new Error("Google video operation completed without a downloadable video URI");
    return {
      id: name,
      images: [],
      artifacts: [{ kind: "video", media_type: "video/mp4", url: uri, metadata: { provider: this.id, model } }],
      metadata: { provider: this.id, model, operation: stable(operation) as Record<string, unknown> },
    };
  }
}

export const googleGeminiImageAdapter = new GoogleGeminiImageAdapter();
export const googleVeoVideoAdapter = new GoogleVeoVideoAdapter();
