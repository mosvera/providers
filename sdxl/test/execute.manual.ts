// SPDX-License-Identifier: Apache-2.0
//
// Manual gallery helper for the SDXL Replicate adapter. Requires
// REPLICATE_API_TOKEN and writes the generated image plus metadata into
// sdxl/test/output/.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deriveStrategies, resolveComposition, type JsonObject, type MergeStrategies, type Registry } from "@mosvera/runtime";
import { sdxlAdapter } from "../src/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const exampleDir = join(here, "..", "..", "examples", "cinematic-editorial");
const outputDir = join(here, "output");

function readJson(path: string): JsonObject {
  return JSON.parse(readFileSync(join(exampleDir, path), "utf8")) as JsonObject;
}

async function main(): Promise<void> {
  if (process.env.REPLICATE_API_TOKEN === undefined) {
    throw new Error("REPLICATE_API_TOKEN is required for sdxl/test/execute.manual.ts");
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
  const emission = sdxlAdapter.emit(canonical);
  const result = await sdxlAdapter.execute(emission.payload);
  const image = result.images[0];
  if (image === undefined) throw new Error("SDXL execution returned no images");

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "sdxl-0.png"), Buffer.from(image.data, "base64"));
  writeFileSync(
    join(outputDir, "metadata.json"),
    JSON.stringify(
      {
        emission,
        result: {
          id: result.id,
          metadata: result.metadata,
          image_bytes: Buffer.byteLength(image.data, "base64"),
        },
      },
      null,
      2,
    ),
  );
}

await main();
