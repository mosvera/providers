// SPDX-License-Identifier: Apache-2.0

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { meshyTextTo3DAdapter } from "../src/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const outputDir = join(here, "output");

function requireKey(): void {
  if (process.env.MESHY_API_KEY === undefined) throw new Error("MESHY_API_KEY is required for meshy/test/execute.manual.ts");
}

async function main(): Promise<void> {
  requireKey();
  const emission = meshyTextTo3DAdapter.emit(
    {
      subject: "a simple rounded clay cube with a small M mark",
      medium: "claymation",
      palette: { accent: "#d45f3f" },
      imagery: { treatment: "tabletop_model" },
      quality: "low",
    },
    { providerOptions: { prompt: "simple rounded clay cube, warm orange-red accent, no text", target_formats: ["glb"] } },
  );
  const result = await meshyTextTo3DAdapter.execute(emission.payload);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "metadata.json"), JSON.stringify({ emission, result }, null, 2));
}

await main();
