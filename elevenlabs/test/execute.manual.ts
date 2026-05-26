// SPDX-License-Identifier: Apache-2.0

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { elevenLabsTtsAdapter } from "../src/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const outputDir = join(here, "output");

function requireKey(): void {
  if (process.env.ELEVENLABS_API_KEY === undefined) throw new Error("ELEVENLABS_API_KEY is required for elevenlabs/test/execute.manual.ts");
}

async function main(): Promise<void> {
  requireKey();
  const emission = elevenLabsTtsAdapter.emit(
    {
      subject: "Mosvera provider smoke test",
      voice: { headline: "Mosvera audio smoke complete.", body: "Aesthetic intent compiled into a short local audio artifact." },
      motion: { pace: "warm" },
      quality: "low",
    },
    { providerOptions: { voice_id: process.env.ELEVENLABS_VOICE_ID, text: "Mosvera audio smoke complete." } },
  );
  const result = await elevenLabsTtsAdapter.execute(emission.payload);
  const audio = result.artifacts?.find((artifact) => artifact.kind === "audio");
  mkdirSync(outputDir, { recursive: true });
  if (audio?.data !== undefined) writeFileSync(join(outputDir, "elevenlabs.mp3"), Buffer.from(audio.data, "base64"));
  writeFileSync(join(outputDir, "metadata.json"), JSON.stringify({ emission, result: { ...result, artifacts: result.artifacts?.map((a) => ({ ...a, data: a.data === undefined ? undefined : `[${Buffer.byteLength(a.data, "base64")} bytes]` })) } }, null, 2));
}

await main();
