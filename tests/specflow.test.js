const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const CLI = path.join(ROOT, 'bin', 'cli.js');

function project() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'injoys-specflow-'));
  const res = spawnSync(process.execPath, [CLI, 'init', dir], { encoding: 'utf8' });
  assert.equal(res.status, 0, res.stderr);
  return dir;
}

function specflow(dir, args, cwd = dir) {
  const script = path.join(dir, 'design/context-dev/tools/specflow/specflow.mjs');
  return spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' });
}

const SPEC = (title) =>
  `## ADDED Requirements\n\n### Requirement: ${title}\nSystem MUST do it.\n\n#### Scenario: ok\n- **WHEN** run\n- **THEN** done\n`;

test('new rejects invalid change ids and capabilities (no path traversal)', () => {
  const dir = project();
  assert.equal(specflow(dir, ['new', '../escape']).status, 1);
  assert.equal(specflow(dir, ['new', 'ok-id', '--capability', '../../escape']).status, 1);
  assert.ok(!fs.existsSync(path.join(dir, 'escape')));
  assert.ok(!fs.existsSync(path.join(dir, 'openspec/changes/ok-id')));
});

test('status/validate with an invalid id fails instead of resolving outside openspec/', () => {
  const dir = project();
  assert.equal(specflow(dir, ['status', '../..']).status, 1);
  assert.equal(specflow(dir, ['validate', '..']).status, 1);
});

test('specflow finds the project root from a sub-directory', () => {
  const dir = project();
  assert.equal(specflow(dir, ['new', 'from-root']).status, 0);
  const sub = path.join(dir, 'src', 'deep');
  fs.mkdirSync(sub, { recursive: true });

  const res = specflow(dir, ['status', 'from-root', '--json'], sub);
  assert.equal(res.status, 0, res.stderr);
  const status = JSON.parse(res.stdout);
  assert.equal(status.changeId, 'from-root');
  const proposal = status.artifacts.find((a) => a.id === 'proposal');
  assert.equal(proposal.done, true, 'must read the change created at the project root');
  assert.ok(!fs.existsSync(path.join(sub, 'openspec')), 'must not create openspec/ in the sub-directory');
});

test('archive without --yes changes nothing (no spec sync, no move)', () => {
  const dir = project();
  assert.equal(specflow(dir, ['new', 'add-thing', '--capability', 'thing']).status, 0);
  const change = path.join(dir, 'openspec/changes/add-thing');
  fs.writeFileSync(path.join(change, 'specs/thing/spec.md'), SPEC('Thing works'));

  const res = specflow(dir, ['archive', 'add-thing', '--no-validate']);
  assert.equal(res.status, 1);
  assert.match(res.stdout, /--yes/);
  assert.ok(fs.existsSync(change), 'change must stay in place');
  assert.ok(!fs.existsSync(path.join(dir, 'openspec/specs/thing')), 'main spec must not be written');

  const ok = specflow(dir, ['archive', 'add-thing', '--no-validate', '--yes']);
  assert.equal(ok.status, 0, ok.stderr);
  assert.ok(!fs.existsSync(change));
  assert.match(fs.readFileSync(path.join(dir, 'openspec/specs/thing/spec.md'), 'utf8'), /Thing works/);
});

test('archive of a missing change fails cleanly', () => {
  const dir = project();
  const res = specflow(dir, ['archive', 'nope', '--yes', '--no-validate']);
  assert.equal(res.status, 1);
  assert.match(res.stderr, /not found/);
});

test('context-gen.sh computes SHA-256 without relying on shasum', { skip: process.platform === 'win32' }, () => {
  const dir = project();
  const file = path.join(dir, 'doc.md');
  fs.writeFileSync(file, 'hello');
  const expected = crypto.createHash('sha256').update('hello').digest('hex');

  const script = path.join(dir, 'design/context-dev/scripts/context-gen.sh');
  const res = spawnSync('bash', [script, '-p', dir, file], { encoding: 'utf8' });
  assert.equal(res.status, 0, res.stderr);
  assert.ok(res.stdout.includes(expected), res.stdout);
});

test('bundled specflow regression test passes inside an installed project', () => {
  const dir = project();
  const file = 'design/context-dev/tools/specflow/specflow-empty-capability.test.mjs';
  // `node --test` sets NODE_TEST_CONTEXT for its children; a nested `node --test`
  // would then report through events and its exit code would not reflect failures.
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const res = spawnSync(process.execPath, ['--test', file], { cwd: dir, env, encoding: 'utf8' });
  assert.equal(res.status, 0, res.stdout + res.stderr);
});

// ---- archive / spec sync -------------------------------------------------

const REQ = (title, body = 'System MUST do it.') =>
  `### Requirement: ${title}\n${body}\n\n#### Scenario: ok\n- **WHEN** run\n- **THEN** done\n`;

const MAIN_SPEC = (...reqs) => `# auth Specification\n\n## Purpose\nLogin.\n\n## Requirements\n${reqs.join('\n')}`;

function change(dir, id, deltaSpec, { capability = 'auth', mainSpec } = {}) {
  assert.equal(specflow(dir, ['new', id, '--capability', capability]).status, 0);
  const base = path.join(dir, 'openspec/changes', id);
  fs.writeFileSync(path.join(base, 'proposal.md'), '# x\n## Why\nw\n## What Changes\nc\n## Impact\ni\n');
  fs.writeFileSync(path.join(base, 'tasks.md'), '- [x] done\n- [x] specflow validate\n- [x] specflow archive\n');
  fs.writeFileSync(path.join(base, 'specs', capability, 'spec.md'), deltaSpec);
  if (mainSpec !== undefined) {
    const main = path.join(dir, 'openspec/specs', capability, 'spec.md');
    fs.mkdirSync(path.dirname(main), { recursive: true });
    fs.writeFileSync(main, mainSpec);
  }
  return base;
}

const mainSpecOf = (dir, capability = 'auth') =>
  fs.readFileSync(path.join(dir, 'openspec/specs', capability, 'spec.md'), 'utf8');

test('archive keeps sections after "## Requirements" and inserts new requirements before them', () => {
  const dir = project();
  change(dir, 'add-logout', `## ADDED Requirements\n\n${REQ('Logout')}`, {
    mainSpec: MAIN_SPEC(REQ('Login')) + '\n## Notes\nKeep this section.\n',
  });
  const res = specflow(dir, ['archive', 'add-logout', '--yes']);
  assert.equal(res.status, 0, res.stdout + res.stderr);

  const main = mainSpecOf(dir);
  assert.ok(main.includes('### Requirement: Logout'));
  assert.ok(main.includes('## Notes\nKeep this section.'), 'trailing section must survive');
  assert.ok(
    main.indexOf('### Requirement: Logout') < main.indexOf('## Notes'),
    'new requirement must be placed inside "## Requirements", before "## Notes"',
  );
});

test('archive does not lose a trailing section when the last requirement is removed or modified', () => {
  const dir = project();
  change(
    dir,
    'drop-login',
    `## REMOVED Requirements\n\n${REQ('Login')}\n## MODIFIED Requirements\n\n${REQ('Session', 'System MUST expire sessions.')}`,
    { mainSpec: MAIN_SPEC(REQ('Login'), REQ('Session')) + '\n## Notes\nKeep this section.\n' },
  );
  assert.equal(specflow(dir, ['archive', 'drop-login', '--yes']).status, 0);
  const main = mainSpecOf(dir);
  assert.ok(!main.includes('### Requirement: Login'));
  assert.ok(main.includes('System MUST expire sessions.'));
  assert.ok(main.includes('## Notes\nKeep this section.'));
});

test('RENAMED requirements are validated, applied on archive, and reported', () => {
  const dir = project();
  const renamed = '## RENAMED Requirements\n- FROM: `### Requirement: Login`\n- TO: `### Requirement: Sign in`\n';
  change(dir, 'rename-login', renamed, { mainSpec: MAIN_SPEC(REQ('Login', 'System MUST allow login.')) });

  const validate = specflow(dir, ['validate', 'rename-login', '--strict']);
  assert.equal(validate.status, 0, 'a RENAMED-only delta is a valid change: ' + validate.stdout);

  const res = specflow(dir, ['archive', 'rename-login', '--yes']);
  assert.equal(res.status, 0, res.stdout + res.stderr);
  assert.match(res.stdout, /Renamed requirement: Login -> Sign in/, 'archive must print each applied change');

  const main = mainSpecOf(dir);
  assert.ok(main.includes('### Requirement: Sign in\nSystem MUST allow login.'));
  assert.ok(!main.includes('### Requirement: Login'));
});

test('RENAMED followed by MODIFIED of the new name works', () => {
  const dir = project();
  const delta =
    '## RENAMED Requirements\n- FROM: `### Requirement: Login`\n- TO: `### Requirement: Sign in`\n\n' +
    `## MODIFIED Requirements\n\n${REQ('Sign in', 'System MUST allow sign in with MFA.')}`;
  change(dir, 'rename-modify', delta, { mainSpec: MAIN_SPEC(REQ('Login')) });
  assert.equal(specflow(dir, ['archive', 'rename-modify', '--yes']).status, 0);
  const main = mainSpecOf(dir);
  assert.ok(main.includes('System MUST allow sign in with MFA.'));
  assert.ok(!main.includes('### Requirement: Login'));
  assert.equal((main.match(/### Requirement: Sign in/g) || []).length, 1, 'no duplicate requirement');
});

test('archive refuses an unresolvable RENAMED and leaves everything untouched', () => {
  const dir = project();
  const mainSpec = MAIN_SPEC(REQ('Login'));
  const base = change(
    dir,
    'bad-rename',
    '## RENAMED Requirements\n- FROM: `### Requirement: Does Not Exist`\n- TO: `### Requirement: Other`\n',
    { mainSpec },
  );
  const res = specflow(dir, ['archive', 'bad-rename', '--yes', '--no-validate']);
  assert.notEqual(res.status, 0);
  assert.match(res.stdout + res.stderr, /Does Not Exist/);
  assert.ok(fs.existsSync(base), 'change must not be moved');
  assert.equal(mainSpecOf(dir), mainSpec, 'main spec must not be modified');
});

test('validate rejects a malformed RENAMED section in strict mode', () => {
  const dir = project();
  change(dir, 'bad-shape', `## ADDED Requirements\n\n${REQ('A')}\n## RENAMED Requirements\n- FROM: \`### Requirement: A\`\n`);
  const res = specflow(dir, ['validate', 'bad-shape', '--strict']);
  assert.notEqual(res.status, 0);
  assert.match(res.stdout, /RENAMED/);
});

test('multi-capability archive writes nothing when one capability cannot be applied', () => {
  const dir = project();
  const mainA = MAIN_SPEC(REQ('Login'));
  const base = change(dir, 'two-caps', `## ADDED Requirements\n\n${REQ('Logout')}`, { mainSpec: mainA });
  const capB = path.join(base, 'specs', 'billing');
  fs.mkdirSync(capB, { recursive: true });
  fs.writeFileSync(
    path.join(capB, 'spec.md'),
    '## RENAMED Requirements\n- FROM: `### Requirement: Nope`\n- TO: `### Requirement: Never`\n',
  );
  const res = specflow(dir, ['archive', 'two-caps', '--yes', '--no-validate']);
  assert.notEqual(res.status, 0);
  assert.equal(mainSpecOf(dir), mainA, 'the capability that could be applied must not be written either');
  assert.ok(fs.existsSync(base));
});

test('uppercase [X] checkboxes are accepted by validate and counted by status', () => {
  const dir = project();
  const base = change(dir, 'upper-x', `## ADDED Requirements\n\n${REQ('A')}`);
  fs.writeFileSync(path.join(base, 'tasks.md'), '- [X] only uppercase boxes\n');
  assert.equal(specflow(dir, ['validate', 'upper-x', '--strict']).status, 0);
  const status = JSON.parse(specflow(dir, ['status', 'upper-x', '--json']).stdout);
  assert.deepEqual(status.taskStats, { total: 1, checked: 1, unchecked: 0 });
});

test('validate recognises the documented `node .../specflow.mjs validate|archive <id>` task lines', () => {
  const dir = project();
  assert.equal(specflow(dir, ['new', 'step-lines']).status, 0);
  const tasks = path.join(dir, 'openspec/changes/step-lines/tasks.md');

  const stepWarnings = () => {
    const res = specflow(dir, ['validate', 'step-lines', '--strict', '--json']);
    const report = JSON.parse(res.stdout);
    return report.issues.filter((i) => /validate step|archive step/.test(i.message)).map((i) => i.message);
  };

  fs.writeFileSync(tasks, '- [ ] 实现功能\n');
  assert.equal(stepWarnings().length, 2, 'missing steps are still reported');

  fs.writeFileSync(
    tasks,
    '- [ ] 运行 node design/context-dev/tools/specflow/specflow.mjs validate step-lines --strict\n' +
      '- [ ] 运行 node design/context-dev/tools/specflow/specflow.mjs archive step-lines --yes --no-validate\n'
  );
  assert.deepEqual(stepWarnings(), []);

  fs.writeFileSync(tasks, '- [ ] run specflow validate step-lines --strict\n- [ ] run openspec archive step-lines\n');
  assert.deepEqual(stepWarnings(), [], 'the short forms keep working');
});

test('new --kind selects the tasks template, stamps change_kind and fills the change id', () => {
  const dir = project();
  const tasksOf = (id) => fs.readFileSync(path.join(dir, 'openspec/changes', id, 'tasks.md'), 'utf8');

  const ops = specflow(dir, ['new', 'ops-change', '--kind', 'docs-ops']);
  assert.equal(ops.status, 0, ops.stderr);
  assert.doesNotMatch(ops.stdout, /--kind not given/);
  const opsTasks = tasksOf('ops-change');
  assert.ok(opsTasks.startsWith('<!-- change_kind: docs-ops -->\n'));
  assert.match(opsTasks, /## 5\. 回滚与影响面/);
  assert.doesNotMatch(opsTasks, /单元测试/);
  assert.match(opsTasks, /specflow\.mjs validate ops-change --strict/);
  assert.match(opsTasks, /specflow\.mjs archive ops-change --yes --no-validate/);

  for (const kind of ['code', 'mixed']) {
    const id = `${kind}-change`;
    assert.equal(specflow(dir, ['new', id, '--kind', kind]).status, 0);
    const body = tasksOf(id);
    assert.ok(body.startsWith(`<!-- change_kind: ${kind} -->\n`));
    assert.match(body, /单元测试/);
    assert.match(body, new RegExp(`specflow\\.mjs validate ${id} --strict`));
  }
});

test('new without --kind keeps the code template and says so; an invalid --kind is rejected', () => {
  const dir = project();
  const res = specflow(dir, ['new', 'no-kind']);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /--kind not given/);
  assert.ok(fs.readFileSync(path.join(dir, 'openspec/changes/no-kind/tasks.md'), 'utf8').startsWith('<!-- change_kind: code -->'));

  const bad = specflow(dir, ['new', 'bad-kind', '--kind', 'refactor']);
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /Invalid --kind/);
  assert.ok(!fs.existsSync(path.join(dir, 'openspec/changes/bad-kind')));
});

test('instructions tasks points to the template for the given kind', () => {
  const dir = project();
  const get = (args) => JSON.parse(specflow(dir, ['instructions', 'tasks', '--change', 'x-change', '--json', ...args]).stdout);
  assert.match(get([]).templatePath, /tasks\.md\.template$/);
  assert.match(get(['--kind', 'mixed']).templatePath, /tasks\.md\.template$/);
  const ops = get(['--kind', 'docs-ops']);
  assert.match(ops.templatePath, /tasks-docs-ops\.md\.template$/);
  assert.equal(ops.kind, 'docs-ops');
});

test('a freshly generated tasks.md of every kind fails strict validation until placeholders are filled, with no stray step warnings', () => {
  const dir = project();
  for (const kind of ['code', 'docs-ops', 'mixed']) {
    const id = `fresh-${kind}`;
    assert.equal(specflow(dir, ['new', id, '--kind', kind]).status, 0);
    const res = specflow(dir, ['validate', id, '--strict', '--json']);
    const issues = JSON.parse(res.stdout).issues;
    assert.ok(issues.some((i) => /placeholders/.test(i.message)), `${kind}: placeholders are still reported`);
    assert.ok(!issues.some((i) => /validate step|archive step/.test(i.message)), `${kind}: step lines are recognised`);
  }
});

// ---- tasks.md structure checks (files carrying the change_kind marker) ----

const ROADMAP = (id, kind, tasks) =>
  `# roadmap\n\n### 提案 1: x\n\n**Change ID:** \`${id}\`  \n**优先级:** P0  \n**变更类型（change_kind）:** ${kind}（判定依据：test）\n\n**关键任务**:\n${tasks
    .map((t, i) => `${i + 1}. ${t} (0.3 人日)`)
    .join('\n')}\n\n**里程碑（按需）**:\n- m\n`;

const GOOD_TASKS = (id, kind = 'docs-ops', refs = ['3.1', '3.2', '3.3']) =>
  `<!-- change_kind: ${kind} -->
# 实施任务清单

> notes

## 1. Roadmap 对齐

| # | roadmap 关键任务 | 对应任务 |
|---|------------------|----------|
${refs.map((r, i) => `| ${i + 1} | 任务${i + 1} | ${r} |`).join('\n')}

## 2. SSoT 检查
- [ ] 2.1 确认 SSoT 未更改

## 3. 实施
- [ ] 3.1 a
- [ ] 3.2 b
- [ ] 3.3 c

## 6. 验证与归档
- [ ] 6.3 运行 node design/context-dev/tools/specflow/specflow.mjs validate ${id} --strict
- [ ] 6.4 运行 node design/context-dev/tools/specflow/specflow.mjs archive ${id} --yes --no-validate
`;

function structureCheck(dir, id, { tasks, roadmap, strict = true }) {
  assert.equal(specflow(dir, ['new', id, '--kind', 'docs-ops']).status, 0);
  fs.writeFileSync(path.join(dir, 'openspec/changes', id, 'tasks.md'), tasks);
  const rm = path.join(dir, 'openspec/proposal-roadmap.md');
  if (roadmap) fs.writeFileSync(rm, roadmap);
  else fs.rmSync(rm, { force: true });
  const res = specflow(dir, ['validate', id, ...(strict ? ['--strict'] : []), '--json']);
  return JSON.parse(res.stdout).issues.filter((i) => i.file === 'tasks.md');
}

test('a complete marked tasks.md that matches its roadmap entry passes the structure checks', () => {
  const dir = project();
  const issues = structureCheck(dir, 'ok-change', {
    tasks: GOOD_TASKS('ok-change'),
    roadmap: ROADMAP('ok-change', 'docs-ops', ['一', '二', '三']),
  });
  assert.deepEqual(issues, []);
});

test('missing fixed sections and validate/archive only inside a code block are errors in strict mode', () => {
  const dir = project();
  const tasks = GOOD_TASKS('bad-sections')
    .replace(/## 6\. 验证与归档[\s\S]*$/, '## 6. 收尾\n- [ ] 6.1 done\n\n```\nnode design/context-dev/tools/specflow/specflow.mjs validate bad-sections --strict\nnode design/context-dev/tools/specflow/specflow.mjs archive bad-sections --yes\n```\n')
    .replace(/## 1\. Roadmap 对齐[\s\S]*?## 2\./, '## 2.');
  const issues = structureCheck(dir, 'bad-sections', { tasks });
  const msgs = issues.map((i) => i.message).join('\n');
  assert.ok(issues.every((i) => i.level === 'error'));
  assert.match(msgs, /Roadmap 对齐/);
  assert.match(msgs, /验证与归档/);
  assert.match(msgs, /no checkbox line that runs 'specflow validate'/);
  assert.match(msgs, /no checkbox line that runs 'specflow archive'/);
});

test('mapping rows must reference existing task numbers', () => {
  const dir = project();
  const issues = structureCheck(dir, 'bad-refs', { tasks: GOOD_TASKS('bad-refs', 'docs-ops', ['3.1', '9.9', '到时候再说']) });
  const msgs = issues.map((i) => i.message);
  assert.ok(msgs.some((m) => /references task 9\.9/.test(m)));
  assert.ok(msgs.some((m) => /does not reference any task number/.test(m)));
});

test('the number of mapped key_tasks is checked against the roadmap entry, and so is change_kind', () => {
  const dir = project();
  const few = structureCheck(dir, 'few-rows', {
    tasks: GOOD_TASKS('few-rows', 'docs-ops', ['3.1', '3.2']),
    roadmap: ROADMAP('few-rows', 'docs-ops', ['一', '二', '三']),
  });
  assert.ok(few.some((i) => /lists 3 key_tasks .* maps only 2/.test(i.message)));

  const mismatch = structureCheck(dir, 'kind-mismatch', {
    tasks: GOOD_TASKS('kind-mismatch'),
    roadmap: ROADMAP('kind-mismatch', 'code', ['一', '二', '三']),
  });
  assert.ok(mismatch.some((i) => /differs from the roadmap entry's change_kind 'code'/.test(i.message)));
});

test('structure problems are warnings (not errors) in loose mode', () => {
  const dir = project();
  const issues = structureCheck(dir, 'loose-mode', {
    tasks: GOOD_TASKS('loose-mode', 'docs-ops', ['9.9']),
    strict: false,
  });
  assert.ok(issues.length > 0);
  assert.ok(issues.every((i) => i.level === 'warning'));
});

test('tasks.md without the change_kind marker (legacy / hand-written) skips the structure checks', () => {
  const dir = project();
  assert.equal(specflow(dir, ['new', 'legacy-tasks']).status, 0);
  fs.writeFileSync(path.join(dir, 'openspec/changes/legacy-tasks/tasks.md'), '- [ ] do it\n- [ ] run specflow validate legacy-tasks\n');
  const issues = JSON.parse(specflow(dir, ['validate', 'legacy-tasks', '--strict', '--json']).stdout).issues;
  assert.ok(!issues.some((i) => i.file === 'tasks.md'));
  assert.ok(issues.some((i) => /archive step/.test(i.message)), 'the old hint still applies');
});
