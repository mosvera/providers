// SPDX-License-Identifier: Apache-2.0
//
// Pure clause-assembly engine for provider emission. The engine is
// deliberately table-driven: provider-specific choices are represented by the
// lowering table and compute registry supplied by the concrete adapter.

import type { CompileWarning, Criticality, Json, JsonObject, LoweringAction } from "@mosvera/runtime";
import type { ClauseTemplate, LoweringRule, LoweringTable, ParameterRule } from "./lowering-table.ts";
import { EmissionError, type ComputeRegistry, type EmissionResult, type ProvenanceEntry } from "./types.ts";

interface PathValue {
  path: string;
  value: unknown;
}

interface PromptClause {
  order: number;
  construct: string;
  action: LoweringAction;
  source_value: unknown;
  text: string;
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectPaths(value: unknown, prefix = ""): PathValue[] {
  const paths: PathValue[] = [];
  if (prefix !== "") paths.push({ path: prefix, value });
  if (isRecord(value)) {
    for (const key of Object.keys(value).sort()) {
      collectPaths(value[key], prefix === "" ? key : `${prefix}.${key}`).forEach((p) => paths.push(p));
    }
  }
  return paths;
}

function topLevel(path: string): string {
  return path.split(".")[0] ?? path;
}

function criticalityFor(path: string, criticality: Record<string, Criticality>): Criticality {
  return criticality[path] ?? criticality[topLevel(path)] ?? "optional";
}

function warningFor(construct: string, action: LoweringAction): CompileWarning | undefined {
  if (action === "approximate" || action === "emulate" || action === "unsupported") {
    return { construct, action };
  }
  return undefined;
}

function asLookupKey(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function resolveClauseValue(template: ClauseTemplate, value: unknown, canonical: JsonObject, registry: ComputeRegistry): unknown {
  const transform = template.transform ?? "identity";
  if (transform === "identity") return value;
  if (transform === "lookup") {
    const lookup = template.lookup ?? {};
    const key = asLookupKey(value);
    return key in lookup ? lookup[key] : value;
  }

  const name = template.compute_fn;
  if (name === undefined || !(name in registry)) {
    throw new Error(`missing compute function for prompt clause: ${name ?? "(none)"}`);
  }
  return registry[name]!(value, canonical);
}

function renderClause(template: ClauseTemplate, value: unknown, canonical: JsonObject, registry: ComputeRegistry): string {
  const resolved = resolveClauseValue(template, value, canonical, registry);
  if (resolved === undefined || resolved === null || resolved === "") return "";
  return template.template.replaceAll("{value}", String(resolved));
}

function resolveParameterValue(rule: ParameterRule, value: unknown, canonical: JsonObject, registry: ComputeRegistry): unknown {
  if (rule.mapping === "direct") return value;
  if (rule.mapping === "lookup") {
    const lookup = rule.lookup ?? {};
    const key = asLookupKey(value);
    return key in lookup ? lookup[key] : undefined;
  }

  const name = rule.compute_fn;
  if (name === undefined || !(name in registry)) {
    throw new Error(`missing compute function for parameter: ${name ?? "(none)"}`);
  }
  return registry[name]!(value, canonical);
}

function hasDescendantRule(path: string, rules: Set<string>): boolean {
  const prefix = `${path}.`;
  for (const rule of rules) {
    if (rule.startsWith(prefix)) return true;
  }
  return false;
}

function isInsideDroppedPath(path: string, dropped: string[]): boolean {
  return dropped.some((prefix) => path !== prefix && path.startsWith(`${prefix}.`));
}

function sortedRecord(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(input).sort()) out[key] = input[key];
  return out;
}

function addWarningOnce(warnings: CompileWarning[], warning: CompileWarning): void {
  if (!warnings.some((w) => w.construct === warning.construct && w.action === warning.action)) {
    warnings.push(warning);
  }
}

function handleUnsupported(
  construct: string,
  value: unknown,
  criticality: Record<string, Criticality>,
  warnings: CompileWarning[],
): void {
  if (criticalityFor(construct, criticality) === "required") throw new EmissionError(construct);
  addWarningOnce(warnings, { construct, action: "unsupported" });
  void value;
}

function addProvenance(
  provenance: Record<string, ProvenanceEntry>,
  key: string,
  construct: string,
  action: LoweringAction,
  value: unknown,
): void {
  provenance[key] = {
    canonical_construct: construct,
    lowering_action: action,
    source_value: value,
  };
}

/**
 * Assemble a provider-neutral canonical model into provider parameters and a
 * prompt string according to a lowering table. This function is pure: no I/O,
 * no network calls, and no provider-specific branching.
 */
export function assemble(
  canonical: JsonObject,
  table: LoweringTable,
  registry: ComputeRegistry = {},
  criticality: Record<string, Criticality> = {},
): EmissionResult {
  const rules = new Map<string, LoweringRule>();
  for (const rule of table.rules) rules.set(rule.construct, rule);

  const ruleConstructs = new Set(rules.keys());
  const warnings: CompileWarning[] = [];
  const parameters: Record<string, unknown> = {};
  const provenance: Record<string, ProvenanceEntry> = {};
  const clauses: PromptClause[] = [];
  const droppedPaths: string[] = [];

  for (const { path, value } of collectPaths(canonical as Json)) {
    if (isInsideDroppedPath(path, droppedPaths)) continue;

    const rule = rules.get(path);
    if (rule === undefined) {
      if (isRecord(value) && hasDescendantRule(path, ruleConstructs)) continue;
      if (Array.isArray(value) || !isRecord(value)) {
        handleUnsupported(path, value, criticality, warnings);
      } else {
        handleUnsupported(path, value, criticality, warnings);
        droppedPaths.push(path);
      }
      continue;
    }

    if (rule.action === "unsupported") {
      handleUnsupported(rule.construct, value, criticality, warnings);
      if (isRecord(value)) droppedPaths.push(path);
      continue;
    }

    const warning = warningFor(rule.construct, rule.action);
    if (warning !== undefined) addWarningOnce(warnings, warning);

    if (rule.prompt_clause !== undefined) {
      const text = renderClause(rule.prompt_clause, value, canonical, registry);
      if (text !== "") {
        clauses.push({
          order: rule.prompt_clause.order,
          construct: rule.construct,
          action: rule.action,
          source_value: value,
          text,
        });
      }
    }

    for (const parameterRule of rule.parameters ?? []) {
      const parameterValue = resolveParameterValue(parameterRule, value, canonical, registry);
      if (parameterValue === undefined) {
        handleUnsupported(rule.construct, value, criticality, warnings);
        continue;
      }
      parameters[parameterRule.parameter] = parameterValue;
      addProvenance(provenance, parameterRule.parameter, rule.construct, rule.action, value);
    }
  }

  clauses.sort((a, b) => a.order - b.order || a.construct.localeCompare(b.construct) || a.text.localeCompare(b.text));
  clauses.forEach((clause, i) => {
    addProvenance(provenance, `prompt.${i}`, clause.construct, clause.action, clause.source_value);
  });

  const prompt = clauses.map((c) => c.text).join(table.clause_separator ?? ", ");
  return {
    payload: sortedRecord(parameters),
    prompt,
    warnings,
    provenance: Object.fromEntries(Object.entries(provenance).sort(([a], [b]) => a.localeCompare(b))),
  };
}
