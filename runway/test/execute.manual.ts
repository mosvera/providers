// SPDX-License-Identifier: Apache-2.0

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runwayGen4ImageAdapter, runwayGen45VideoAdapter } from "../src/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const outputDir = join(here, "output");
const canonical = {
  subject: "a small tactile Mosvera clay tile on a warm workbench",
  medium: "claymation",
  palette: { accent: "#d45f3f" },
  imagery: { treatment: "tabletop_model" },
  motion: { pace: "gentle" },
  aspect_ratio: "16:9",
};

function requireKey(): void {
  if (process.env.RUNWAY_API_KEY === undefined) throw new Error("RUNWAY_API_KEY is required for runway/test/execute.manual.ts");
}

async function main(): Promise<void> {
  requireKey();
  mkdirSync(outputDir, { recursive: true });
  const imageEmission = runwayGen4ImageAdapter.emit(canonical, { providerOptions: { prompt_text: "Small clay Mosvera tile on a warm workbench. No text." } });
  const imageResult = await runwayGen4ImageAdapter.execute(imageEmission.payload);
  const promptImage = imageResult.artifacts?.find((artifact) => artifact.kind === "image" && typeof artifact.url === "string")?.url;
  if (promptImage === undefined) throw new Error("Runway image smoke did not return an image URL for the video promptImage");
  const videoEmission = runwayGen45VideoAdapter.emit(canonical, {
    providerOptions: { prompt_image: promptImage, prompt_text: "A tiny clay tile slowly rotates on a warm workbench.", duration: 5 },
  });
  const videoResult = await runwayGen45VideoAdapter.execute(videoEmission.payload);
  writeFileSync(join(outputDir, "metadata.json"), JSON.stringify({ imageEmission, imageResult, videoEmission, videoResult }, null, 2));
}

await main();
