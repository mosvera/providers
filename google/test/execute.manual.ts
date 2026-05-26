// SPDX-License-Identifier: Apache-2.0

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { googleGeminiImageAdapter, googleVeoVideoAdapter } from "../src/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const outputDir = join(here, "output");
const canonical = {
  subject: "a small tactile Mosvera clay tile on a warm workbench",
  medium: "claymation",
  palette: { background: "#f6e7cc", accent: "#d45f3f" },
  imagery: { treatment: "tabletop_model" },
  motion: { pace: "gentle" },
  aspect_ratio: "16:9",
  quality: "low",
};

function requireKey(): void {
  if (process.env.GOOGLE_GEMINI_API_KEY === undefined && process.env.GOOGLE_API_KEY === undefined) {
    throw new Error("GOOGLE_GEMINI_API_KEY or GOOGLE_API_KEY is required for google/test/execute.manual.ts");
  }
}

async function main(): Promise<void> {
  requireKey();
  mkdirSync(outputDir, { recursive: true });
  const imageEmission = googleGeminiImageAdapter.emit(canonical, {
    providerOptions: { prompt: "Small clay Mosvera tile on a warm workbench. No text." },
  });
  const imageResult = await googleGeminiImageAdapter.execute(imageEmission.payload);
  const image = imageResult.images[0];
  if (image !== undefined) writeFileSync(join(outputDir, "google-image.png"), Buffer.from(image.data, "base64"));

  let videoSummary: unknown = { skipped: "set GOOGLE_SMOKE_VIDEO=1 to run the Veo smoke" };
  if (process.env.GOOGLE_SMOKE_VIDEO === "1") {
    const videoEmission = googleVeoVideoAdapter.emit(canonical, {
      providerOptions: { prompt: "A tiny clay tile slowly rotates on a warm workbench.", duration_seconds: 4, resolution: "720p" },
    });
    const videoResult = await googleVeoVideoAdapter.execute(videoEmission.payload);
    videoSummary = { emission: videoEmission, result: videoResult };
  }

  writeFileSync(
    join(outputDir, "metadata.json"),
    JSON.stringify(
      {
        image: {
          emission: imageEmission,
          result: { id: imageResult.id, images: imageResult.images.map((i) => ({ media_type: i.media_type, bytes: Buffer.byteLength(i.data, "base64") })) },
        },
        video: videoSummary,
      },
      null,
      2,
    ),
  );
}

await main();
