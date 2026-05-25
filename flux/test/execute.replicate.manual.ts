// SPDX-License-Identifier: Apache-2.0
//
// Manual gallery helper for running the FLUX.2 Pro target through Replicate.
// This does not replace the BFL adapter: it reuses the deterministic FLUX
// emission, then maps the provider payload into Replicate's official-model
// prediction endpoint for environments that have REPLICATE_API_TOKEN but not
// BFL_API_KEY.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deriveStrategies, resolveComposition, type JsonObject, type MergeStrategies, type Registry } from "@mosvera/runtime";
import { fluxAdapter } from "../src/index.ts";

interface Prediction {
  id?: unknown;
  status?: unknown;
  output?: unknown;
  error?: unknown;
  urls?: { get?: unknown };
}

const here = dirname(fileURLToPath(import.meta.url));
const exampleDir = join(here, "..", "..", "examples", "cinematic-editorial");
const outputDir = join(here, "output-replicate");
const modelEndpoint = "https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro/predictions";

function readJson(path: string): JsonObject {
  return JSON.parse(readFileSync(join(exampleDir, path), "utf8")) as JsonObject;
}

function assertPrediction(value: unknown): Prediction {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Replicate response was not an object");
  }
  return value as Prediction;
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`expected Replicate JSON response, received: ${text.slice(0, 200)}`);
  }
}

function outputUrls(value: unknown): string[] {
  if (typeof value === "string" && value.startsWith("http")) return [value];
  if (Array.isArray(value)) return value.flatMap(outputUrls);
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    return outputUrls(record.url ?? record.image ?? record.output);
  }
  return [];
}

async function createPrediction(input: Record<string, unknown>, token: string): Promise<Prediction> {
  const response = await fetch(modelEndpoint, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${token}`,
      "content-type": "application/json",
      "prefer": "wait",
    },
    body: JSON.stringify({ input }),
  });
  if (!response.ok) {
    throw new Error(`Replicate prediction failed: ${response.status} ${response.statusText} ${await response.text()}`);
  }
  return assertPrediction(await readJsonResponse(response));
}

async function pollPrediction(prediction: Prediction, token: string): Promise<Prediction> {
  let current = prediction;
  for (let i = 0; i < 180; i++) {
    const status = typeof current.status === "string" ? current.status : "";
    if (status === "succeeded") return current;
    if (status === "failed" || status === "canceled") {
      throw new Error(`Replicate prediction ${status}: ${JSON.stringify(current.error ?? current)}`);
    }

    const getUrl = current.urls?.get;
    if (typeof getUrl !== "string") throw new Error("Replicate prediction did not include urls.get");
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    const response = await fetch(getUrl, { headers: { authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`Replicate poll failed: ${response.status} ${response.statusText}`);
    current = assertPrediction(await readJsonResponse(response));
  }
  throw new Error("Replicate prediction timed out");
}

async function main(): Promise<void> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (token === undefined) {
    throw new Error("REPLICATE_API_TOKEN is required for flux/test/execute.replicate.manual.ts");
  }

  const registry: Registry = {
    templates: {
      "cinematic-editorial-base": readJson("template.base.json"),
      noir: readJson("template.noir.json"),
    },
    modifiers: {
      "golden-hour": readJson("modifier.golden-hour.json"),
      "high-contrast": readJson("modifier.high-contrast.json"),
    },
  };
  const strategies: MergeStrategies = {
    ...deriveStrategies(),
    ...(readJson("merge-strategies.json") as unknown as MergeStrategies),
  };
  const canonical = resolveComposition(readJson("composition.json"), registry, strategies);
  const emission = fluxAdapter.emit(canonical);
  const width = typeof emission.payload.width === "number" ? emission.payload.width : 1536;
  const height = typeof emission.payload.height === "number" ? emission.payload.height : 1024;
  const safety = typeof emission.payload.safety_tolerance === "number" ? emission.payload.safety_tolerance : 2;
  const input = {
    prompt: emission.prompt,
    aspect_ratio: "custom",
    width,
    height,
    safety_tolerance: safety,
    output_format: "png",
  };

  const prediction = await pollPrediction(await createPrediction(input, token), token);
  const urls = outputUrls(prediction.output);
  if (urls.length === 0) throw new Error("Replicate prediction succeeded but returned no output URL");

  mkdirSync(outputDir, { recursive: true });
  const imageResponse = await fetch(urls[0]!);
  if (!imageResponse.ok) throw new Error(`Replicate image download failed: ${imageResponse.status} ${imageResponse.statusText}`);
  const image = Buffer.from(await imageResponse.arrayBuffer());

  writeFileSync(join(outputDir, "flux-replicate-0.png"), image);
  writeFileSync(
    join(outputDir, "metadata.json"),
    JSON.stringify(
      {
        model: "black-forest-labs/flux-2-pro",
        input,
        emission,
        prediction: {
          id: prediction.id,
          status: prediction.status,
          output_urls: urls,
          bytes: image.byteLength,
        },
      },
      null,
      2,
    ),
  );
}

await main();
