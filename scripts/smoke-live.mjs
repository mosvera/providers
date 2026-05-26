// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from "node:child_process";

const checks = [
  {
    name: "google",
    env: ["GOOGLE_GEMINI_API_KEY", "GOOGLE_API_KEY"],
    command: ["npm", ["run", "execute:manual", "--workspace", "@mosvera/provider-google"]],
  },
  {
    name: "runway",
    env: ["RUNWAY_API_KEY"],
    command: ["npm", ["run", "execute:manual", "--workspace", "@mosvera/provider-runway"]],
  },
  {
    name: "elevenlabs",
    env: ["ELEVENLABS_API_KEY"],
    command: ["npm", ["run", "execute:manual", "--workspace", "@mosvera/provider-elevenlabs"]],
  },
  {
    name: "firefly",
    env: ["FIREFLY_ACCESS_TOKEN", "FIREFLY_SERVICES_CLIENT_SECRET", "FIREFLY_CLIENT_SECRET"],
    alsoRequires: ["FIREFLY_SERVICES_CLIENT_ID", "FIREFLY_CLIENT_ID"],
    command: ["npm", ["run", "execute:manual", "--workspace", "@mosvera/provider-firefly"]],
  },
  {
    name: "meshy",
    env: ["MESHY_API_KEY"],
    command: ["npm", ["run", "execute:manual", "--workspace", "@mosvera/provider-meshy"]],
  },
];

function hasAny(names) {
  return names.some((name) => typeof process.env[name] === "string" && process.env[name].length > 0);
}

const results = [];
for (const check of checks) {
  if (!hasAny(check.env) || (check.alsoRequires !== undefined && !hasAny(check.alsoRequires))) {
    results.push({ provider: check.name, status: "skipped", reason: "credential env not present" });
    continue;
  }
  const [cmd, args] = check.command;
  const result = spawnSync(cmd, args, { stdio: "inherit", env: process.env });
  results.push({ provider: check.name, status: result.status === 0 ? "passed" : "failed" });
  if (result.status !== 0) process.exitCode = result.status ?? 1;
}

console.log(JSON.stringify({ smoke: results }, null, 2));
