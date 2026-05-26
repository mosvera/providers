// SPDX-License-Identifier: Apache-2.0

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fireflyImageAdapter } from "../src/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const outputDir = join(here, "output");

function requireKey(): void {
  if (process.env.FIREFLY_SERVICES_CLIENT_ID === undefined && process.env.FIREFLY_CLIENT_ID === undefined) {
    throw new Error("FIREFLY_SERVICES_CLIENT_ID is required for firefly/test/execute.manual.ts");
  }
  if (
    process.env.FIREFLY_ACCESS_TOKEN === undefined &&
    process.env.FIREFLY_SERVICES_CLIENT_SECRET === undefined &&
    process.env.FIREFLY_CLIENT_SECRET === undefined
  ) {
    throw new Error("FIREFLY_ACCESS_TOKEN or FIREFLY_SERVICES_CLIENT_SECRET is required for firefly/test/execute.manual.ts");
  }
}

async function main(): Promise<void> {
  requireKey();
  const emission = fireflyImageAdapter.emit({
    subject: "a small tactile Mosvera clay tile on a warm workbench",
    medium: "claymation",
    palette: { accent: "#d45f3f" },
    aspect_ratio: "1:1",
  });
  const result = await fireflyImageAdapter.execute(emission.payload);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "metadata.json"), JSON.stringify({ emission, result }, null, 2));
}

await main();
