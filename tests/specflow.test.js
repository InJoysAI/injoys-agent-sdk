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
