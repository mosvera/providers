// SPDX-License-Identifier: Apache-2.0
//
// Manual integration script. It is intentionally not a vitest test and only
// runs when BFL_API_KEY is present.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deriveStrategies, resolveComposition, type JsonObject, type MergeStrategies, type Registry } from "@mosvera/runtime";
import { fluxAdapter } from "../src/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const exampleDir = join(here, "..", "..", "examples", "cinematic-editorial");
const outputDir = join(here, "output");

function readJson(path: string): JsonObject {
  return JSON.parse(readFileSync(join(exampleDir, path), "utf8")) as JsonObject;
}

async function main(): Promise<void> {
  if (process.env.BFL_API_KEY === undefined) {
    throw new Error("BFL_API_KEY is required for flux/test/execute.manual.ts");
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
  const result = await fluxAdapter.execute(emission.payload);

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "metadata.json"), JSON.stringify({ emission, result: { ...result, images: result.images.map((i) => ({ media_type: i.media_type, bytes: Buffer.from(i.data, "base64").byteLength })) } }, null, 2));
  result.images.forEach((image, index) => {
    writeFileSync(join(outputDir, `flux-${index}.png`), Buffer.from(image.data, "base64"));
  });
}

await main();
