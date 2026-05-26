// SPDX-License-Identifier: Apache-2.0
//
// Manual integration script. It is intentionally not a vitest test and only
// runs when HEYGEN_API_KEY and HEYGEN_AVATAR_ID are present.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deriveStrategies, resolveComposition, type JsonObject, type MergeStrategies, type Registry } from "@mosvera/runtime";
import { heygenAdapter } from "../src/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const exampleDir = join(here, "..", "..", "examples", "cinematic-editorial");
const outputDir = join(here, "output");
const DEFAULT_SMOKE_SCRIPT = "Mosvera HeyGen smoke test complete.";
const MAX_SMOKE_WORDS = 45;

function readJson(path: string): JsonObject {
  return JSON.parse(readFileSync(join(exampleDir, path), "utf8")) as JsonObject;
}

async function download(url: string, path: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HeyGen video download failed: ${response.status} ${response.statusText}`);
  writeFileSync(path, Buffer.from(await response.arrayBuffer()));
}

function smokeScript(): string {
  const script = process.env.HEYGEN_SCRIPT ?? DEFAULT_SMOKE_SCRIPT;
  const words = script.trim().split(/\s+/).filter(Boolean);
  if (words.length > MAX_SMOKE_WORDS) {
    throw new Error(`HEYGEN_SCRIPT must stay under ${MAX_SMOKE_WORDS} words for smoke tests; received ${words.length}`);
  }
  return script;
}

async function main(): Promise<void> {
  const avatarId = process.env.HEYGEN_AVATAR_ID;
  if (process.env.HEYGEN_API_KEY === undefined) {
    throw new Error("HEYGEN_API_KEY is required for heygen/test/execute.manual.ts");
  }
  if (avatarId === undefined) {
    throw new Error("HEYGEN_AVATAR_ID is required for heygen/test/execute.manual.ts");
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
  const providerOptions: Record<string, unknown> = {
    avatar_id: avatarId,
    script: smokeScript(),
    title: process.env.HEYGEN_TITLE ?? "Mosvera HeyGen smoke test",
  };
  if (process.env.HEYGEN_VOICE_ID !== undefined) providerOptions.voice_id = process.env.HEYGEN_VOICE_ID;
  const emission = heygenAdapter.emit(canonical, { providerOptions });
  const result = await heygenAdapter.execute(emission.payload);

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "metadata.json"), JSON.stringify({ emission, result }, null, 2));
  const video = result.artifacts?.find((artifact) => artifact.kind === "video");
  if (video?.url !== undefined) await download(video.url, join(outputDir, "heygen.mp4"));
}

await main();
