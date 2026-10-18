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
