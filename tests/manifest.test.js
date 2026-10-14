const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const CLI = path.join(ROOT, 'bin', 'cli.js');
const HAS_JQ = spawnSync('jq', ['--version']).status === 0;
const opts = { skip: !HAS_JQ && 'jq is not installed' };

const SHA = 'a'.repeat(64);

function project(manifestPatch = {}, history) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'injoys-manifest-'));
  assert.equal(spawnSync(process.execPath, [CLI, 'init', dir], { encoding: 'utf8' }).status, 0);

  // The initial manifest exactly as design/context-dev/tools/manifest/AGENTS.md prescribes it.
  const manifest = {
    version: '1.0.0',
    generated_at: '2026-10-14T00:00:00Z',
    generator: 'Context-Agent v1.0',
    project: { name: 'demo', path: '.' },
    sources: {},
    generated_files: { root: [], architecture: [], domain: [], db: [], ui: [], legacy: [], openspec: [] },
    context_sync_history: { path: '.context/history/context-sync.jsonl', format: 'jsonl', ordering: 'ascending_by_synced_at' },
    last_context_sync: null,
    ...manifestPatch,
  };
  fs.mkdirSync(path.join(dir, '.context'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.context/context-manifest.json'), JSON.stringify(manifest, null, 2));

  if (history !== undefined) {
    fs.mkdirSync(path.join(dir, '.context/history'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.context/history/context-sync.jsonl'), history);
  }
  return dir;
}

function check(dir) {
  const script = path.join(dir, 'design/context-dev/scripts/check-context-manifest.sh');
  return spawnSync('bash', [script, dir], { encoding: 'utf8' });
}

const EVENT = (at, extra = {}) => JSON.stringify({ event_type: 'context_sync', source: 'roadmap', synced_at: at, ...extra }) + '\n';

test('a freshly initialised project (no sync event yet) passes', opts, () => {
  const res = check(project());
  assert.equal(res.status, 0, res.stdout + res.stderr);
});

test('an empty history file is fine while last_context_sync is null', opts, () => {
  assert.equal(check(project({}, '')).status, 0);
});

test('last_context_sync without any history is an error', opts, () => {
  const dir = project({ last_context_sync: { synced_at: '2026-10-14T01:00:00Z' } });
  const res = check(dir);
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /history/i);
});

test('manifest and history agree after a sync', opts, () => {
  const at = '2026-10-14T01:00:00Z';
  const dir = project({ last_context_sync: { synced_at: at } }, EVENT(at));
  const res = check(dir);
  assert.equal(res.status, 0, res.stdout + res.stderr);
});

test('mismatch between last_context_sync and the latest history event is an error', opts, () => {
  const dir = project({ last_context_sync: { synced_at: '2026-10-14T02:00:00Z' } }, EVENT('2026-10-14T01:00:00Z'));
  assert.notEqual(check(dir).status, 0);
});

test('nested objects in history events and previous_sync stay forbidden', opts, () => {
  const at = '2026-10-14T01:00:00Z';
  assert.notEqual(check(project({}, EVENT(at, { nested: { a: 1 } }))).status, 0);
  assert.notEqual(check(project({ last_context_sync: { synced_at: at, previous_sync: {} } }, EVENT(at))).status, 0);
});

test('sources[].content_hash must be a 64-char lowercase hex SHA-256 when present', opts, () => {
  const source = (hash) => ({ PRD: { path: 'docs/PRD.md', archived_to: '.context/domain/source/PRD.md', type: 'product_requirements', status: 'archived', ...hash } });
  assert.equal(check(project({ sources: source({ content_hash: SHA }) })).status, 0);
  assert.equal(check(project({ sources: source({}) })).status, 0, 'older manifests without a hash stay valid');
  const bad = check(project({ sources: source({ content_hash: 'not-a-hash' }) }));
  assert.notEqual(bad.status, 0);
  assert.match(bad.stderr, /content_hash/);
});
