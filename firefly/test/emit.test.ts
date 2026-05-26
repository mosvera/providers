// SPDX-License-Identifier: Apache-2.0
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireflyImageAdapter } from "../src/index.ts";

describe("FireflyImageAdapter", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("emits a deterministic Image5 payload", () => {
    const emission = fireflyImageAdapter.emit({
      subject: "an editorial product still life",
      medium: "photographic",
      palette: { accent: "#d45f3f" },
      aspect_ratio: "3:2",
    });
    expect(Object.keys(emission.payload)).toEqual(Object.keys(emission.payload).sort());
    expect(emission.payload).toMatchObject({
      aspectRatio: "4:3",
      modelId: "firefly_image",
      numVariations: 1,
      prompt: expect.stringContaining("photographic style"),
      referenceBlobs: [],
    });
  });

  it("keeps user prompt text first while appending Mosvera aesthetic direction", () => {
    const emission = fireflyImageAdapter.emit(
      {
        subject: "an editorial product still life",
        medium: "photographic",
        palette: { accent: "#d45f3f" },
      },
      { providerOptions: { prompt: "A friendly clay builder desk." } },
    );

    expect(emission.payload.prompt).toContain("A friendly clay builder desk.\n\nMosvera aesthetic direction:");
    expect(emission.payload.prompt).toContain("photographic style");
  });

  it("executes with a provided access token and returns image artifacts", async () => {
    vi.stubEnv("FIREFLY_SERVICES_CLIENT_ID", "client-id");
    vi.stubEnv("FIREFLY_ACCESS_TOKEN", "access-token");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ outputs: [{ image: { url: "https://example.com/firefly.png" } }] }), { status: 200 })));
    const result = await fireflyImageAdapter.execute({ prompt: "hi", aspectRatio: "1:1", modelId: "firefly_image", numVariations: 1 });
    expect(result.images).toEqual([]);
    expect(result.artifacts).toEqual([{ kind: "image", media_type: "image/png", url: "https://example.com/firefly.png" }]);
  });
});
