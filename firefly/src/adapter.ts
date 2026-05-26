// SPDX-License-Identifier: Apache-2.0

import {
  BaseAdapter,
  type ComputeRegistry,
  type EmitOptions,
  type ExecuteOptions,
  type GenerationResult,
  type ProviderPayload,
} from "@mosvera/provider-base";
import { fireflyImageLoweringTable } from "./lowering-table.ts";
import { fireflyImageManifest } from "./manifest.ts";

const DEFAULT_GENERATE_URL = "https://firefly-api.adobe.io/v3/images/generate";
const DEFAULT_IMS_URL = "https://ims-na1.adobelogin.com/ims/token/v3";
const DEFAULT_SCOPE = "openid,AdobeID,firefly_api,ff_apis";

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

function fireflyAspectRatio(value: unknown): string {
  if (value === "1:1" || value === "4:3" || value === "3:4" || value === "16:9" || value === "9:16") return value;
  if (value === "2:3") return "3:4";
  if (value === "3:2") return "4:3";
  return "16:9";
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

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`expected Firefly JSON response, received: ${text.slice(0, 200)}`);
  }
}

function clientId(): string {
  const id = process.env.FIREFLY_SERVICES_CLIENT_ID ?? process.env.FIREFLY_CLIENT_ID;
  if (id === undefined) throw new Error("FIREFLY_SERVICES_CLIENT_ID is required to execute the Firefly adapter");
  return id;
}

async function fireflyAccess(id: string): Promise<string> {
  const direct = process.env.FIREFLY_ACCESS_TOKEN;
  if (direct !== undefined) return direct;
  const secret = process.env.FIREFLY_SERVICES_CLIENT_SECRET ?? process.env.FIREFLY_CLIENT_SECRET;
  if (secret === undefined) throw new Error("FIREFLY_ACCESS_TOKEN or FIREFLY_SERVICES_CLIENT_SECRET is required to execute the Firefly adapter");
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: id,
    client_secret: secret,
    scope: process.env.FIREFLY_SCOPE ?? DEFAULT_SCOPE,
  });
  const response = await fetch(process.env.FIREFLY_TOKEN_URL ?? DEFAULT_IMS_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error(`Firefly auth request failed: ${response.status} ${response.statusText} ${await response.text()}`);
  const json = await readJson(response);
  if (isRecord(json) && typeof json.access_token === "string") return json.access_token;
  throw new Error("Firefly auth response did not include access_token");
}

function outputUrls(value: unknown): string[] {
  if (typeof value === "string" && value.startsWith("http")) return [value];
  if (Array.isArray(value)) return value.flatMap(outputUrls);
  if (isRecord(value)) return outputUrls(value.url ?? value.image ?? value.images ?? value.outputs ?? value.output);
  return [];
}

export class FireflyImageAdapter extends BaseAdapter {
  readonly id = "adobe-firefly-image";
  readonly version = "0.1.2";

  manifest() {
    return fireflyImageManifest;
  }

  loweringTable() {
    return fireflyImageLoweringTable;
  }

  computeRegistry(): ComputeRegistry {
    return {
      describe_lights: describeLights,
      firefly_aspect_ratio: fireflyAspectRatio,
      humanize_value: humanizeValue,
    };
  }

  buildPayload(parameters: ProviderPayload, prompt: string, options?: EmitOptions): ProviderPayload {
    const providerOptions = options?.providerOptions ?? {};
    const payload: ProviderPayload = {
      prompt: optionString(providerOptions, "prompt") ?? prompt,
      aspectRatio: optionString(providerOptions, "aspect_ratio") ?? optionString(parameters, "aspectRatio") ?? "16:9",
      modelId: optionString(providerOptions, "model_id") ?? "firefly_image",
      numVariations: 1,
      referenceBlobs: Array.isArray(providerOptions.reference_blobs) ? providerOptions.reference_blobs : [],
    };
    const modelSpecificPayload = providerOptions.model_specific_payload;
    if (isRecord(modelSpecificPayload)) payload.modelSpecificPayload = modelSpecificPayload;
    return sortedPayload(payload);
  }

  async execute(payload: ProviderPayload, _options?: ExecuteOptions): Promise<GenerationResult> {
    const id = clientId();
    const token = await fireflyAccess(id);
    const response = await fetch(process.env.FIREFLY_GENERATE_URL ?? DEFAULT_GENERATE_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        "x-api-key": id,
        "x-model-version": "image5",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Firefly image request failed: ${response.status} ${response.statusText} ${await response.text()}`);
    const json = await readJson(response);
    const urls = outputUrls(json);
    if (urls.length === 0) throw new Error("Firefly response did not include output URLs");
    return {
      id: "adobe-firefly-image-generated",
      images: [],
      artifacts: urls.map((url) => ({ kind: "image", media_type: "image/png", url })),
      metadata: { provider: this.id, response: stable(json) as Record<string, unknown> },
    };
  }
}

export const fireflyImageAdapter = new FireflyImageAdapter();
