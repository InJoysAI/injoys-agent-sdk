import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "../../../../");
const cli = path.join(root, "design/context-dev/tools/specflow/specflow.mjs");
const stamp = `specflow-empty-${process.pid}`;
const archive = path.join(root, "openspec/changes/archive");
const main = path.join(root, "openspec/specs");
const changes = path.join(root, "openspec/changes");

const req = (title) => `### Requirement: ${title}\nSystem MUST retain this fixture.\n\n#### Scenario: fixture\n- **WHEN** exercised\n- **THEN** it remains deterministic\n`;
const delta = (operation, blocks) => `## ${operation} Requirements\n\n${blocks.map(req).join("\n")}`;
const run = (id, capability, spec) => {
  const dir = path.join(changes, id, "specs", capability);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(changes, id, "proposal.md"), "# fixture\n");
  fs.writeFileSync(path.join(changes, id, "tasks.md"), "- [x] fixture\n");
  fs.writeFileSync(path.join(dir, "spec.md"), spec);
  execFileSync(process.execPath, [cli, "archive", id, "--yes", "--no-validate"], { cwd: root, stdio: "inherit" });
};

const cases = [
  ["all", delta("REMOVED", ["Old A"]), ["Old A"], false],
  ["partial", delta("REMOVED", ["Old A"]) + "\n## MODIFIED Requirements\n\n" + req("Keep B"), ["Old A", "Keep B"], true],
  ["added", delta("ADDED", ["New A"]), [], true],
  ["regression", delta("MODIFIED", ["Stable A"]), ["Stable A"], true],
];

try {
  for (const [suffix, spec, initial, keep] of cases) {
    const id = `${stamp}-${suffix}`;
    const capability = `${stamp}-${suffix}-cap`;
    const mainDir = path.join(main, capability);
    if (initial.length) {
      fs.mkdirSync(mainDir, { recursive: true });
      fs.writeFileSync(path.join(mainDir, "spec.md"), `# fixture\n\n## Requirements\n\n${initial.map(req).join("\n")}`);
    }
    run(id, capability, spec);
    assert.equal(fs.existsSync(mainDir), keep, `${suffix}: capability directory disposition`);
    if (keep) assert.match(fs.readFileSync(path.join(mainDir, "spec.md"), "utf8"), /### Requirement:/);
  }
  console.log(JSON.stringify({ status: "PASS", groups: 4, cases: ["all-removed", "partial-retained", "added-created", "archive-regression"] }));
} finally {
  for (const [suffix] of cases) {
    fs.rmSync(path.join(changes, `${stamp}-${suffix}`), { recursive: true, force: true });
    fs.rmSync(path.join(main, `${stamp}-${suffix}-cap`), { recursive: true, force: true });
    fs.rmSync(path.join(archive, `${new Date().toISOString().slice(0, 10)}-${stamp}-${suffix}`), { recursive: true, force: true });
  }
}
