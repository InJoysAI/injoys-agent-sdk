#!/usr/bin/env node
/**
 * Specflow (Context-Dev) - OpenSpec-independent change workflow.
 *
 * Keeps the existing directory structure:
 * - openspec/changes/<change-id>/{proposal.md,tasks.md,specs/<capability>/spec.md,design.md?}
 * - openspec/specs/<capability>/spec.md (main specs)
 *
 * Commands:
 * - new <change-id> [--capability <capability>] [--title <title>]
 * - status <change-id> [--json]
 * - instructions <artifact> --change <change-id> [--json]
 * - templates [--json]
 * - validate <change-id> [--strict] [--json]
 * - archive <change-id> [--yes] [--skip-specs] [--no-validate]
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const REPO_ROOT = process.cwd();

function die(message, exitCode = 1) {
  process.stderr.write(`${message}\n`);
  process.exit(exitCode);
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeIfMissing(filePath, content) {
  if (fileExists(filePath)) return false;
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
  return true;
}

function todayISO() {
  const d = new Date();
  const yyyy = String(d.getFullYear()).padStart(4, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseArgs(argv) {
  const args = [];
  const flags = new Map();

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next == null || next.startsWith("--")) {
        flags.set(key, true);
      } else {
        flags.set(key, next);
        i++;
      }
    } else {
      args.push(token);
    }
  }

  return { args, flags };
}

function getTemplates() {
  return {
    proposal: "design/context-dev/templates/openspec/proposal.md.template",
    spec: "design/context-dev/templates/openspec/spec.md.template",
    design: "design/context-dev/templates/openspec/design.md.template",
    tasks: "design/context-dev/templates/openspec/tasks.md.template",
  };
}

function changeDir(changeId) {
  return path.join(REPO_ROOT, "openspec", "changes", changeId);
}

function changePaths(changeId, capability = "<capability>") {
  const base = changeDir(changeId);
  return {
    dir: base,
    proposal: path.join(base, "proposal.md"),
    tasks: path.join(base, "tasks.md"),
    design: path.join(base, "design.md"),
    deltaSpec: path.join(base, "specs", capability, "spec.md"),
  };
}

function findDeltaSpecs(changeId) {
  const base = path.join(changeDir(changeId), "specs");
  if (!fileExists(base)) return [];

  const out = [];
  for (const capability of fs.readdirSync(base, { withFileTypes: true })) {
    if (!capability.isDirectory()) continue;
    const deltaPath = path.join(base, capability.name, "spec.md");
    if (fileExists(deltaPath)) out.push({ capability: capability.name, path: deltaPath });
  }
  return out;
}

function artifactStatus(changeId) {
  const paths = changePaths(changeId);

  const hasProposal = fileExists(paths.proposal) && readText(paths.proposal).trim().length > 0;
  const deltaSpecs = findDeltaSpecs(changeId);
  const hasAnyDelta = deltaSpecs.length > 0;
  const tasksText = fileExists(paths.tasks) ? readText(paths.tasks) : "";
  const hasTasks = tasksText.trim().length > 0;
  const hasDesign = fileExists(paths.design) && readText(paths.design).trim().length > 0;
  const taskStats = getTaskCheckboxStats(tasksText);

  const artifacts = [
    { id: "proposal", required: true, done: hasProposal },
    { id: "specs", required: true, done: hasAnyDelta, detail: deltaSpecs.map((d) => d.capability) },
    { id: "design", required: false, done: hasDesign },
    { id: "tasks", required: true, done: hasTasks },
  ];

  // Determine "ready" artifact: first required artifact not done whose prerequisites are done.
  const requiredOrder = ["proposal", "specs", "tasks"];
  const doneMap = new Map(artifacts.map((a) => [a.id, a.done]));
  let ready = null;
  for (const id of requiredOrder) {
    if (!doneMap.get(id)) {
      ready = id;
      break;
    }
  }

  const isComplete = requiredOrder.every((id) => doneMap.get(id));
  const executionComplete = taskStats.total > 0 && taskStats.unchecked === 0;

  return { changeId, artifacts, ready, isComplete, executionComplete, taskStats };
}

function getTaskCheckboxStats(tasksText) {
  const lines = String(tasksText || "").split(/\r?\n/);
  let total = 0;
  let checked = 0;
  let unchecked = 0;
  for (const line of lines) {
    const m = line.match(/^\s*-\s+\[([ xX\/])\]\s+/);
    if (!m) continue;
    total += 1;
    if (m[1].toLowerCase() === "x") checked += 1;
    else unchecked += 1;
  }
  return { total, checked, unchecked };
}

function hasPlaceholders(text) {
  return /\{\{[^}]+\}\}/.test(text);
}

function splitRequirementBlocks(markdown) {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];

  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^### Requirement:\s*(.+)\s*$/);
    if (m) {
      if (current) blocks.push(current);
      current = { title: m[1].trim(), startLine: i + 1, lines: [line] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) blocks.push(current);
  return blocks;
}

function validateDeltaSpec(specText, { strict }) {
  const issues = [];

  const hasOperationHeader =
    /^##\s+(ADDED|MODIFIED|REMOVED|RENAMED)\s+Requirements\s*$/m.test(specText);
  if (!hasOperationHeader) {
    issues.push({ level: "error", message: "Missing operation header: '## ADDED|MODIFIED|REMOVED|RENAMED Requirements'." });
  }

  if (strict && hasPlaceholders(specText)) {
    issues.push({ level: "error", message: "Spec contains unresolved placeholders like '{{...}}'." });
  }

  const requirementBlocks = splitRequirementBlocks(specText);
  if (requirementBlocks.length === 0) {
    issues.push({ level: "error", message: "No requirements found. Expected at least one '### Requirement:' block." });
    return issues;
  }

  for (const block of requirementBlocks) {
    const blockText = block.lines.join("\n");
    const hasScenario = /^#### Scenario:\s+.+$/m.test(blockText);
    if (!hasScenario) {
      issues.push({
        level: "error",
        message: `Requirement '${block.title}' has no scenario. Expected at least one '#### Scenario:' block.`,
      });
      continue;
    }

    const hasWhen = /^\-\s+\*\*WHEN\*\*\s+.+$/m.test(blockText) || /^\-\s+\*\*GIVEN\*\*\s+.+$/m.test(blockText);
    const hasThen = /^\-\s+\*\*THEN\*\*\s+.+$/m.test(blockText);
    if (!hasWhen || !hasThen) {
      issues.push({
        level: strict ? "error" : "warning",
        message: `Requirement '${block.title}' scenario(s) should include **WHEN** and **THEN** lines.`,
      });
    }
  }

  return issues;
}

function validateProposal(proposalText, { strict }) {
  const issues = [];
  const requiredHeadings = ["## Why", "## What Changes", "## Impact"];
  for (const heading of requiredHeadings) {
    if (!proposalText.includes(heading)) {
      issues.push({ level: "error", message: `proposal.md missing heading: '${heading}'.` });
    }
  }
  if (strict && hasPlaceholders(proposalText)) {
    issues.push({ level: "error", message: "proposal.md contains unresolved placeholders like '{{...}}'." });
  }
  return issues;
}

function validateTasks(tasksText, { strict, changeId }) {
  const issues = [];
  const hasCheckbox = /^\s*-\s+\[[ x\/]\]\s+/m.test(tasksText);
  if (!hasCheckbox) {
    issues.push({ level: "error", message: "tasks.md has no markdown checkboxes. Expected lines like '- [ ] ...'." });
  }
  if (strict && hasPlaceholders(tasksText)) {
    issues.push({ level: "error", message: "tasks.md contains unresolved placeholders like '{{...}}'." });
  }

  // Soft expectation: tasks include validate and archive steps. Accept both openspec and specflow to ease migration.
  const expectsValidate =
    new RegExp(`\\b(openspec\\s+validate|specflow\\s+validate)\\s+${escapeRegExp(changeId)}\\b`).test(tasksText) ||
    /\b(openspec\s+validate|specflow\s+validate)\b/.test(tasksText);
  const expectsArchive =
    new RegExp(`\\b(openspec\\s+archive|specflow\\s+archive)\\s+${escapeRegExp(changeId)}\\b`).test(tasksText) ||
    /\b(openspec\s+archive|specflow\s+archive)\b/.test(tasksText);

  if (!expectsValidate) {
    issues.push({ level: strict ? "warning" : "info", message: "tasks.md does not mention a validate step (openspec/specflow). Consider adding one." });
  }
  if (!expectsArchive) {
    issues.push({ level: strict ? "warning" : "info", message: "tasks.md does not mention an archive step (openspec/specflow). Consider adding one." });
  }

  return issues;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateChange(changeId, { strict }) {
  const base = changeDir(changeId);
  if (!fileExists(base)) {
    return {
      ok: false,
      issues: [{ level: "error", message: `Change directory not found: openspec/changes/${changeId}` }],
    };
  }

  const p = changePaths(changeId);
  const issues = [];

  if (!fileExists(p.proposal)) issues.push({ level: "error", message: "Missing required file: proposal.md" });
  if (!fileExists(p.tasks)) issues.push({ level: "error", message: "Missing required file: tasks.md" });

  const deltaSpecs = findDeltaSpecs(changeId);
  if (deltaSpecs.length === 0) issues.push({ level: "error", message: "Missing delta specs. Expected at least one: openspec/changes/<id>/specs/<capability>/spec.md" });

  if (fileExists(p.proposal)) issues.push(...validateProposal(readText(p.proposal), { strict }));
  if (fileExists(p.tasks)) issues.push(...validateTasks(readText(p.tasks), { strict, changeId }));
  for (const d of deltaSpecs) {
    issues.push(
      ...validateDeltaSpec(readText(d.path), { strict }).map((i) => ({
        ...i,
        file: path.relative(REPO_ROOT, d.path),
      })),
    );
  }

  const ok = issues.every((i) => i.level !== "error");
  return { ok, issues };
}

function getMainSpecPath(capability) {
  return path.join(REPO_ROOT, "openspec", "specs", capability, "spec.md");
}

function ensureMainSpecSkeleton(capability) {
  const mainPath = getMainSpecPath(capability);
  if (fileExists(mainPath)) return;
  const content = `# ${capability} Specification\n\n## Purpose\nTBD\n\n## Requirements\n`;
  writeIfMissing(mainPath, content);
}

function parseDeltaSections(deltaText) {
  // Splits by section headers like "## ADDED Requirements"
  const sections = new Map();
  const lines = deltaText.split(/\r?\n/);
  let current = null;
  let currentLines = [];
  function flush() {
    if (!current) return;
    sections.set(current, currentLines.join("\n").trimEnd() + "\n");
  }
  for (const line of lines) {
    const m = line.match(/^##\s+(ADDED|MODIFIED|REMOVED|RENAMED)\s+Requirements\s*$/);
    if (m) {
      flush();
      current = m[1];
      currentLines = [];
      continue;
    }
    if (current) currentLines.push(line);
  }
  flush();
  return sections;
}

function parseMainRequirements(mainText) {
  // Returns { before, requirementsText, after } around "## Requirements"
  const m = mainText.match(/^##\s+Requirements\s*$/m);
  if (!m) {
    return { before: mainText.trimEnd() + "\n\n", requirementsText: "", after: "" };
  }

  const idx = m.index;
  const before = mainText.slice(0, idx);
  const afterStart = idx + m[0].length;
  const after = mainText.slice(afterStart);
  return { before, requirementsText: after, after: "" };
}

function applyDeltaToMain({ capability, deltaText }) {
  ensureMainSpecSkeleton(capability);
  const mainPath = getMainSpecPath(capability);
  const mainText = readText(mainPath);

  const sections = parseDeltaSections(deltaText);

  const { before, requirementsText } = parseMainRequirements(mainText);
  const existingBlocks = splitRequirementBlocks(requirementsText);
  const existingByTitle = new Map(existingBlocks.map((b) => [b.title, b]));

  function removeRequirement(title) {
    const b = existingByTitle.get(title);
    if (!b) return false;
    existingByTitle.delete(title);
    return true;
  }

  function upsertRequirement(block) {
    existingByTitle.set(block.title, block);
  }

  const summary = [];

  const addedText = sections.get("ADDED") ?? "";
  const modifiedText = sections.get("MODIFIED") ?? "";
  const removedText = sections.get("REMOVED") ?? "";
  const renamedText = sections.get("RENAMED") ?? "";

  for (const block of splitRequirementBlocks(addedText)) {
    const existed = existingByTitle.has(block.title);
    upsertRequirement(block);
    summary.push(`${existed ? "Updated" : "Added"} requirement: ${block.title}`);
  }

  for (const block of splitRequirementBlocks(modifiedText)) {
    const existed = existingByTitle.has(block.title);
    upsertRequirement(block);
    summary.push(`${existed ? "Modified" : "Added (implicit)"} requirement: ${block.title}`);
  }

  for (const block of splitRequirementBlocks(removedText)) {
    const removed = removeRequirement(block.title);
    if (removed) summary.push(`Removed requirement: ${block.title}`);
    else summary.push(`Remove requested but not found: ${block.title}`);
  }

  if (renamedText.trim().length > 0) {
    summary.push("RENAMED section present: manual review recommended (not auto-applied).");
  }

  // Rebuild requirements section in stable order: keep original order if possible, then append new.
  const orderedTitles = [];
  for (const b of existingBlocks) {
    if (existingByTitle.has(b.title) && !orderedTitles.includes(b.title)) orderedTitles.push(b.title);
  }
  for (const title of existingByTitle.keys()) {
    if (!orderedTitles.includes(title)) orderedTitles.push(title);
  }

  const rebuiltReq = orderedTitles
    .map((t) => existingByTitle.get(t).lines.join("\n").trimEnd())
    .join("\n\n") + "\n";

  const rebuilt = `${before.trimEnd()}\n\n## Requirements\n${rebuiltReq}`;
  fs.writeFileSync(mainPath, rebuilt, "utf8");

  return summary;
}

function cmdTemplates({ flags }) {
  const templates = getTemplates();
  const json = !!flags.get("json");
  if (json) {
    process.stdout.write(JSON.stringify({ templates }, null, 2) + "\n");
    return;
  }
  process.stdout.write("=== Specflow Templates ===\n");
  for (const [k, v] of Object.entries(templates)) process.stdout.write(`- ${k}: ${v}\n`);
}

function cmdNew({ args, flags }) {
  const changeId = args[0];
  if (!changeId) die("Usage: specflow new <change-id> [--capability <capability>] [--title <title>]");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(changeId)) die(`Invalid change-id '${changeId}'. Expected kebab-case.`);

  const capability = String(flags.get("capability") || "capability");
  const title = String(flags.get("title") || changeId);

  const templates = getTemplates();
  const p = changePaths(changeId, capability);

  ensureDir(p.dir);
  writeIfMissing(p.proposal, readText(path.join(REPO_ROOT, templates.proposal)).replaceAll("{{CHANGE_TITLE}}", title));
  writeIfMissing(p.tasks, readText(path.join(REPO_ROOT, templates.tasks)).replace("{{DEVELOPMENT_NOTES}}", "TBD"));
  writeIfMissing(p.deltaSpec, readText(path.join(REPO_ROOT, templates.spec)));

  process.stdout.write("=== Specflow New Change ===\n");
  process.stdout.write(`✅ openspec/changes/${changeId}/ (created/ensured)\n`);
  process.stdout.write(`- proposal.md\n- tasks.md\n- specs/${capability}/spec.md\n`);
}

function cmdStatus({ args, flags }) {
  const changeId = args[0];
  if (!changeId) die("Usage: specflow status <change-id> [--json]");
  const status = artifactStatus(changeId);
  const json = !!flags.get("json");
  if (json) {
    process.stdout.write(JSON.stringify(status, null, 2) + "\n");
    return;
  }
  process.stdout.write(`=== Specflow Status: ${changeId} ===\n`);
  for (const a of status.artifacts) {
    const mark = a.done ? "✅" : a.required ? "⬜" : "◻️";
    const extra = a.id === "specs" && a.done ? ` (${(a.detail || []).join(", ")})` : "";
    process.stdout.write(`${mark} ${a.id}${extra}\n`);
  }
  process.stdout.write(`Ready: ${status.ready ?? "none"}\n`);
  process.stdout.write(`ArtifactsComplete: ${status.isComplete ? "yes" : "no"}\n`);
  process.stdout.write(
    `ExecutionComplete: ${status.executionComplete ? "yes" : "no"} (checked ${status.taskStats.checked}/${status.taskStats.total}, unchecked ${status.taskStats.unchecked})\n`,
  );
}

function cmdInstructions({ args, flags }) {
  const artifact = args[0];
  const changeId = flags.get("change");
  if (!artifact || !changeId) die("Usage: specflow instructions <artifact> --change <change-id> [--json]");

  const templates = getTemplates();
  const base = {
    changeId,
    artifact,
    templates,
  };

  let instruction = "";
  let outputPath = "";
  let templatePath = "";
  let dependencies = [];

  if (artifact === "proposal") {
    outputPath = path.relative(REPO_ROOT, changePaths(changeId).proposal);
    templatePath = templates.proposal;
    instruction =
      "Create proposal.md (Why/What Changes/Impact). Keep it high-level; detailed acceptance goes to specs. Avoid unresolved {{...}} placeholders.";
    dependencies = [".context/criterion.md", ".context/openspec/integration.md"];
  } else if (artifact === "specs" || artifact === "spec") {
    outputPath = path.relative(REPO_ROOT, changePaths(changeId, "<capability>").deltaSpec);
    templatePath = templates.spec;
    instruction =
      "Create one delta spec per capability at specs/<capability>/spec.md. Use ADDED/MODIFIED/REMOVED/RENAMED sections; every Requirement needs at least one Scenario with WHEN/THEN.";
    dependencies = [path.relative(REPO_ROOT, changePaths(changeId).proposal)];
  } else if (artifact === "design") {
    outputPath = path.relative(REPO_ROOT, changePaths(changeId).design);
    templatePath = templates.design;
    instruction = "Create design.md only if non-trivial design decisions exist. Keep it concise and actionable.";
    dependencies = [path.relative(REPO_ROOT, changePaths(changeId).proposal)];
  } else if (artifact === "tasks") {
    outputPath = path.relative(REPO_ROOT, changePaths(changeId).tasks);
    templatePath = templates.tasks;
    instruction =
      "Create tasks.md as executable checkboxes. Include verification (specflow validate --strict) and post (specflow archive) steps.";
    dependencies = [
      path.relative(REPO_ROOT, changePaths(changeId).proposal),
      path.relative(REPO_ROOT, changePaths(changeId, "<capability>").deltaSpec),
    ];
  } else {
    die(`Unknown artifact '${artifact}'. Expected proposal|specs|design|tasks.`);
  }

  const json = !!flags.get("json");
  const payload = { ...base, instruction, outputPath, templatePath, dependencies };
  if (json) {
    process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
    return;
  }

  process.stdout.write(`=== Specflow Instructions: ${artifact} (${changeId}) ===\n`);
  process.stdout.write(`Output: ${outputPath}\n`);
  process.stdout.write(`Template: ${templatePath}\n`);
  process.stdout.write(`\n${instruction}\n`);
  if (dependencies.length) {
    process.stdout.write("\nDependencies to read:\n");
    for (const d of dependencies) process.stdout.write(`- ${d}\n`);
  }
}

function cmdValidate({ args, flags }) {
  const changeId = args[0];
  if (!changeId) die("Usage: specflow validate <change-id> [--strict] [--json]");
  const strict = !!flags.get("strict");
  const json = !!flags.get("json");

  const report = validateChange(changeId, { strict });
  if (json) {
    process.stdout.write(JSON.stringify({ changeId, strict, ...report }, null, 2) + "\n");
    process.exit(report.ok ? 0 : 2);
  }

  process.stdout.write(`=== Specflow Validate: ${changeId} (${strict ? "strict" : "loose"}) ===\n`);
  if (report.ok) process.stdout.write("✅ OK\n");
  else process.stdout.write("❌ FAILED\n");
  for (const i of report.issues) {
    const tag = i.level === "error" ? "❌" : i.level === "warning" ? "⚠️" : "ℹ️";
    const loc = i.file ? ` (${i.file})` : "";
    process.stdout.write(`${tag} ${i.message}${loc}\n`);
  }
  process.exit(report.ok ? 0 : 2);
}

function cmdArchive({ args, flags }) {
  const changeId = args[0];
  if (!changeId) die("Usage: specflow archive <change-id> [--yes] [--skip-specs] [--no-validate]");
  const yes = !!flags.get("yes");
  const skipSpecs = !!flags.get("skip-specs");
  const noValidate = !!flags.get("no-validate");

  if (!noValidate) {
    const report = validateChange(changeId, { strict: true });
    if (!report.ok) {
      process.stdout.write(`❌ Refusing to archive: validation failed for ${changeId}\n`);
      process.exit(2);
    }
  }

  const deltaSpecs = findDeltaSpecs(changeId);
  const syncSummary = [];
  if (!skipSpecs) {
    for (const d of deltaSpecs) {
      const deltaText = readText(d.path);
      const s = applyDeltaToMain({ capability: d.capability, deltaText });
      syncSummary.push({ capability: d.capability, summary: s });
    }
  }

  const src = changeDir(changeId);
  const archiveDir = path.join(REPO_ROOT, "openspec", "changes", "archive");
  ensureDir(archiveDir);
  const dstName = `${todayISO()}-${changeId}`;
  const dst = path.join(archiveDir, dstName);

  if (fileExists(dst)) die(`Archive target already exists: openspec/changes/archive/${dstName}`);

  if (!yes) {
    process.stdout.write("Archive will move the change directory and (optionally) sync specs.\n");
    process.stdout.write("Re-run with --yes to proceed.\n");
    process.exit(1);
  }

  fs.renameSync(src, dst);

  process.stdout.write("=== Specflow Archive Complete ===\n");
  process.stdout.write(`✅ Archived to: openspec/changes/archive/${dstName}/\n`);
  process.stdout.write(`Specs sync: ${skipSpecs ? "skipped" : "applied"}\n`);
  if (!skipSpecs) {
    for (const s of syncSummary) {
      process.stdout.write(`- ${s.capability}: ${s.summary.length} change(s)\n`);
    }
  }
}

function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];
  const { args, flags } = parseArgs(argv.slice(1));

  if (!command || command === "-h" || command === "--help") {
    process.stdout.write(
      [
        "specflow (Context-Dev) - OpenSpec-independent workflow",
        "",
        "Usage:",
        "  node design/context-dev/tools/specflow/specflow.mjs <command> [args] [--flags]",
        "",
        "Commands:",
        "  new <change-id> [--capability <cap>] [--title <title>]",
        "  status <change-id> [--json]",
        "  instructions <artifact> --change <change-id> [--json]",
        "  templates [--json]",
        "  validate <change-id> [--strict] [--json]",
        "  archive <change-id> [--yes] [--skip-specs] [--no-validate]",
        "",
      ].join("\n"),
    );
    return;
  }

  try {
    if (command === "templates") return cmdTemplates({ flags });
    if (command === "new") return cmdNew({ args, flags });
    if (command === "status") return cmdStatus({ args, flags });
    if (command === "instructions") return cmdInstructions({ args, flags });
    if (command === "validate") return cmdValidate({ args, flags });
    if (command === "archive") return cmdArchive({ args, flags });
    die(`Unknown command '${command}'. Use --help.`);
  } catch (e) {
    die(e?.stack || String(e));
  }
}

main();
