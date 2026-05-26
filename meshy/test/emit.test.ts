// SPDX-License-Identifier: Apache-2.0
import { afterEach, describe, expect, it, vi } from "vitest";
import { meshyTextTo3DAdapter } from "../src/index.ts";

describe("MeshyTextTo3DAdapter", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("emits a deterministic text-to-3D payload", () => {
    const emission = meshyTextTo3DAdapter.emit({
      subject: "a clay Mosvera block mascot",
      medium: "claymation",
      palette: { accent: "#d45f3f" },
      imagery: { treatment: "tabletop_model" },
      quality: "low",
    });
    expect(Object.keys(emission.payload)).toEqual(Object.keys(emission.payload).sort());
    expect(emission.payload).toMatchObject({
      art_style: "realistic",
      mode: "preview",
      prompt: expect.stringContaining("claymation 3D asset style"),
      target_formats: ["glb"],
      target_polycount: 30000,
    });
  });

  it("executes and polls for 3D model artifacts", async () => {
    vi.stubEnv("MESHY_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ result: "task-1" }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ id: "task-1", status: "SUCCEEDED", model_urls: { glb: "https://example.com/model.glb" } }), { status: 200 })),
    );
    const result = await meshyTextTo3DAdapter.execute({ mode: "preview", prompt: "hi", target_formats: ["glb"] }, { poll_interval_ms: 1, timeout_ms: 100 });
    expect(result.images).toEqual([]);
    expect(result.artifacts).toEqual([
      { kind: "model_3d", media_type: "model/gltf-binary", url: "https://example.com/model.glb", metadata: { provider: "meshy-text-to-3d", format: "glb" } },
    ]);
  });
});
