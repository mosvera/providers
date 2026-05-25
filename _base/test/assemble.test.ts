// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { assemble, EmissionError, type LoweringTable } from "../src/index.ts";

const table: LoweringTable = {
  adapter_id: "test",
  rules: [
    { construct: "subject", action: "native", prompt_clause: { template: "{value}", order: 0 } },
    { construct: "medium", action: "approximate", prompt_clause: { template: "{value} style", order: 10 } },
    {
      construct: "aspect_ratio",
      action: "native",
      parameters: [{ parameter: "size", mapping: "lookup", lookup: { "3:2": "1536x1024" } }],
    },
    {
      construct: "quality",
      action: "native",
      parameters: [{ parameter: "quality", mapping: "direct" }],
    },
    {
      construct: "safety",
      action: "native",
      parameters: [{ parameter: "moderation", mapping: "lookup", lookup: { standard: "auto" } }],
    },
    {
      construct: "palette.accent",
      action: "approximate",
      prompt_clause: { template: "accent color ({value})", order: 50, transform: "lookup", lookup: { amber: "#c8943f" } },
    },
    {
      construct: "lights",
      action: "emulate",
      prompt_clause: { template: "{value}", order: 25, transform: "computed", compute_fn: "describe_lights" },
    },
    { construct: "forbidden", action: "unsupported" },
  ],
};

const registry = {
  describe_lights(value: unknown): string {
    if (!Array.isArray(value)) return "";
    return value
      .map((light) => {
        if (typeof light !== "object" || light === null || Array.isArray(light)) return "";
        const name = "name" in light ? String(light.name) : "unnamed";
        const power = "power" in light ? ` at power ${String(light.power)}` : "";
        return `${name} light${power}`;
      })
      .filter(Boolean)
      .join(", ");
  },
};

describe("assemble", () => {
  it("emits an empty prompt and parameter payload for an empty model", () => {
    expect(assemble({}, table)).toEqual({ payload: {}, prompt: "", warnings: [], provenance: {} });
  });

  it("interpolates a single prompt clause", () => {
    expect(assemble({ subject: "a lighthouse" }, table).prompt).toBe("a lighthouse");
  });

  it("orders multiple prompt clauses deterministically", () => {
    const out = assemble({ medium: "cinematic", subject: "a lighthouse" }, table);
    expect(out.prompt).toBe("a lighthouse, cinematic style");
  });

  it("maps lookup transforms into prompt clauses", () => {
    const out = assemble({ palette: { accent: "amber" } }, table);
    expect(out.prompt).toBe("accent color (#c8943f)");
  });

  it("maps direct and lookup parameters", () => {
    const out = assemble({ aspect_ratio: "3:2", quality: "high", safety: "standard" }, table);
    expect(out.payload).toEqual({ moderation: "auto", quality: "high", size: "1536x1024" });
  });

  it("uses compute functions for array prompt clauses", () => {
    const out = assemble({ lights: [{ name: "key", power: 6 }, { name: "fill", power: 3 }] }, table, registry);
    expect(out.prompt).toBe("key light at power 6, fill light at power 3");
  });

  it("warns and drops an optional construct missing from the lowering table", () => {
    const out = assemble({ grain: "heavy" }, table);
    expect(out).toEqual({
      payload: {},
      prompt: "",
      warnings: [{ construct: "grain", action: "unsupported" }],
      provenance: {},
    });
  });

  it("throws for required unsupported constructs", () => {
    expect(() => assemble({ forbidden: true }, table, {}, { forbidden: "required" })).toThrow(EmissionError);
  });

  it("warns and drops optional unsupported constructs", () => {
    const out = assemble({ forbidden: true }, table);
    expect(out.warnings).toEqual([{ construct: "forbidden", action: "unsupported" }]);
    expect(out.payload).toEqual({});
  });

  it("warns for approximate and emulated lowering", () => {
    const out = assemble({ medium: "cinematic", lights: [{ name: "key" }] }, table, registry);
    expect(out.warnings).toEqual([
      { construct: "lights", action: "emulate" },
      { construct: "medium", action: "approximate" },
    ]);
  });

  it("records provenance for payload parameters and prompt clauses", () => {
    const out = assemble({ subject: "a lighthouse", aspect_ratio: "3:2" }, table);
    expect(out.provenance).toEqual({
      "prompt.0": { canonical_construct: "subject", lowering_action: "native", source_value: "a lighthouse" },
      size: { canonical_construct: "aspect_ratio", lowering_action: "native", source_value: "3:2" },
    });
  });

  it("is deterministic for byte-identical inputs", () => {
    const canonical = {
      subject: "a lighthouse",
      medium: "cinematic",
      palette: { accent: "amber" },
      aspect_ratio: "3:2",
    };
    expect(JSON.stringify(assemble(canonical, table))).toBe(JSON.stringify(assemble(canonical, table)));
  });
});
