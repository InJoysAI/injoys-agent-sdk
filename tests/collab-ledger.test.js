const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SCRIPT = path.join(__dirname, '..', 'templates', 'scripts', 'check-collab-ledger.mjs');

const ROSTER = `协议版本：1

| 角色 | 负责工具 | 对应命令 |
|------|----------|----------|
| 生成 | claude-code | x |
| 规划 | claude-code | x |
| 评审 | codex, cursor | x |
| 实现 | claude-code | x |
| 工具侧 | 用户 | x |

评审方式：串行
`;

const rec = (n, extra = {}) => {
  const f = { 发起: 'codex (评审) · 2026-10-17 10:00', 收件: '@用户', 类型: '问题', 状态: 'open', 内容: '确认口径', 证据: '`a.md:1`', ...extra };
  const lines = [`### Q-${String(n).padStart(3, '0')} · 标题${n}`];
  for (const k of ['发起', '收件', '类型', '提案', '状态', '内容', '证据']) if (f[k] != null) lines.push(`- ${k}：${f[k]}`);
  lines.push(`- 答复：${f.答复 ?? ''}`);
  return lines.join('\n') + '\n';
};
const ledger = (...recs) => `协议版本：1\n\n# 待确认台账\n\n<!-- 示例\n### Q-000 · 示例\n-->\n\n${recs.join('\n')}`;

function project(ledgerText, roster = ROSTER) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'collab-'));
  fs.mkdirSync(path.join(dir, '.context/collab'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.context/history'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.context/collab/team.md'), roster);
  fs.writeFileSync(path.join(dir, '.context/history/open-questions.md'), ledgerText);
  return dir;
}
const run = (dir, ...a) => spawnSync(process.execPath, [SCRIPT, dir, ...a], { encoding: 'utf8' });
const withBase = (dir, baseText) => {
  const f = path.join(dir, 'base.md');
  fs.writeFileSync(f, baseText);
  return ['--base-file', f];
};

test('valid roster and ledger pass; the commented example is ignored', () => {
  const r = run(project(ledger(rec(1), rec(2))));
  assert.equal(r.status, 0, r.stdout);
});

test('missing fields, bad type/state and duplicate ids are errors', () => {
  const bad = ledger(rec(1, { 类型: '随便' }), rec(1, { 状态: 'done' }));
  const r = run(project(bad));
  assert.equal(r.status, 1);
  assert.match(r.stdout, /类型必须是/);
  assert.match(r.stdout, /状态必须是/);
  assert.match(r.stdout, /编号重复/);
});

test('认领 requires 提案; answered requires 答复', () => {
  const r = run(project(ledger(rec(1, { 类型: '认领' }), rec(2, { 状态: 'answered' }))));
  assert.equal(r.status, 1);
  assert.match(r.stdout, /认领记录必须有「提案/);
  assert.match(r.stdout, /answered 但「答复」为空/);
  assert.equal(run(project(ledger(rec(1, { 类型: '认领', 提案: 'add-x' })))).status, 0);
});

test('multiple reviewers require a 评审方式 line', () => {
  const r = run(project(ledger(rec(1)), ROSTER.replace('评审方式：串行\n', '')));
  assert.equal(r.status, 1);
  assert.match(r.stdout, /评审方式/);
});

test('unsupported protocol version fails loudly', () => {
  const r = run(project(ledger(rec(1)).replace('协议版本：1', '协议版本：2')));
  assert.equal(r.status, 1);
  assert.match(r.stdout, /不受支持/);
});

test('diff: append-only, no deletion, no edits outside 答复/状态', () => {
  const base = ledger(rec(1), rec(2));
  const dir = project(ledger(rec(1)));
  assert.match(run(dir, ...withBase(dir, base)).stdout, /Q-002: 记录被删除/);

  const dir2 = project(ledger(rec(1, { 内容: '被改写' }), rec(2)));
  assert.match(run(dir2, ...withBase(dir2, base)).stdout, /Q-001: 除「答复」「状态」外/);

  const dir3 = project(ledger(rec(1), rec(2), rec(3)));
  assert.equal(run(dir3, ...withBase(dir3, base)).status, 0);
  const dir4 = project(ledger(rec(1), rec(2), rec(5)));
  assert.match(run(dir4, ...withBase(dir4, base)).stdout, /Q-005: 新记录编号应为 Q-003/);
});

test('diff: state may only move forward; answering and closing are authorized', () => {
  const base = ledger(rec(1, { 收件: '@cursor' }));
  const dir = project(ledger(rec(1, { 收件: '@cursor', 状态: 'answered', 答复: '好' })));
  assert.equal(run(dir, ...withBase(dir, base), '--actor', 'cursor').status, 0);
  assert.match(run(dir, ...withBase(dir, base), '--actor', 'claude-code').stdout, /不是收件人/);

  const closed = project(ledger(rec(1, { 收件: '@cursor', 状态: 'closed', 答复: '好' })));
  assert.match(run(closed, ...withBase(closed, base), '--actor', 'cursor').stdout, /只有发起人/);
  assert.equal(run(closed, ...withBase(closed, base), '--actor', 'codex').status, 0);
  assert.equal(run(closed, ...withBase(closed, base), '--actor', '用户').status, 0);

  const back = ledger(rec(1, { 收件: '@cursor', 状态: 'open' }));
  const dir2 = project(back);
  const answeredBase = ledger(rec(1, { 收件: '@cursor', 状态: 'answered', 答复: '好' }));
  assert.match(run(dir2, ...withBase(dir2, answeredBase)).stdout, /状态不得倒退/);
});
