#!/usr/bin/env node
// 校验协作花名册与待确认台账是否符合 tools/collab/AGENTS.md（协议版本 1）。
// 用法：
//   node check-collab-ledger.mjs [项目根] [--base-file <旧版台账>] [--base-ref <git-ref>] [--actor <工具id|用户>]
// 退出码：0 通过（可有警告）；1 有错误；2 用法错误。
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const SUPPORTED = '1';
const ROLES = ['生成', '规划', '评审', '实现', '工具侧'];
const TYPES = ['问题', '裁决', '移交', '认领'];
const STATES = ['open', 'answered', 'closed'];
const ORDER = { open: 0, answered: 1, closed: 2 };

const args = process.argv.slice(2);
let root = process.cwd();
let baseFile = null, baseRef = null, actor = null;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--base-file') baseFile = args[++i];
  else if (a === '--base-ref') baseRef = args[++i];
  else if (a === '--actor') actor = args[++i];
  else if (a.startsWith('--')) { console.error(`未知参数 ${a}`); process.exit(2); }
  else root = path.resolve(a);
}

const ledgerRel = '.context/history/open-questions.md';
const rosterRel = '.context/collab/team.md';
const errors = [], warns = [];
const err = (m) => errors.push(m), warn = (m) => warns.push(m);

const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ''));
const field = (block, key) => {
  const m = block.match(new RegExp(`^- ${key}[：:]\\s*(.*)$`, 'm'));
  return m ? m[1].trim() : null;
};

function checkVersion(text, file) {
  const m = stripComments(text).match(/^(?:>\s*)?协议版本[：:]\s*(\S+)/m);
  if (!m) warn(`${file}: 缺少「协议版本：${SUPPORTED}」行`);
  else if (m[1] !== SUPPORTED) err(`${file}: 协议版本 ${m[1]} 不受支持（本校验器支持 ${SUPPORTED}）`);
}

function parseRoster(text) {
  checkVersion(text, rosterRel);
  const roster = {};
  for (const line of stripComments(text).split('\n')) {
    const m = line.match(/^\|\s*(生成|规划|评审|实现|工具侧)\s*\|\s*([^|]+?)\s*\|/);
    if (!m) continue;
    roster[m[1]] = m[2].split(/[,，]/).map((x) => x.trim().replace(/[（(].*$/, '').trim()).filter(Boolean);
  }
  for (const r of ROLES) if (!roster[r]) err(`${rosterRel}: 缺少角色行「${r}」`);
  const mode = stripComments(text).match(/^评审方式[：:]\s*(\S+)/m);
  if ((roster['评审'] || []).filter((t) => t !== '未指定' && t !== '用户').length > 1) {
    if (!mode) err(`${rosterRel}: 评审有多个工具，必须有「评审方式：串行|并行」行`);
    else if (!['串行', '并行'].includes(mode[1])) err(`${rosterRel}: 评审方式必须是 串行 或 并行，当前 ${mode[1]}`);
  }
  return roster;
}

function parseLedger(text) {
  const clean = stripComments(text);
  const parts = clean.split(/^### (?=Q-)/m).slice(1);
  return parts.map((p) => {
    const head = p.split('\n')[0];
    const hm = head.match(/^(Q-(\d{3,}))\s*·\s*(.+)$/);
    return { raw: p, head, id: hm ? hm[1] : null, num: hm ? Number(hm[2]) : NaN, title: hm ? hm[3] : null };
  });
}

function validateRecords(recs, roster) {
  const seen = new Set();
  let prev = 0;
  for (const r of recs) {
    if (!r.id) { err(`标题行不合规（应为「### Q-NNN · 标题」）：${r.head}`); continue; }
    if (seen.has(r.id)) err(`${r.id}: 编号重复`);
    seen.add(r.id);
    if (r.num <= prev) err(`${r.id}: 编号必须递增（前一条 Q-${String(prev).padStart(3, '0')}）`);
    else if (prev && r.num !== prev + 1) warn(`${r.id}: 编号不连续（前一条 Q-${String(prev).padStart(3, '0')}）`);
    prev = Math.max(prev, r.num);
    const f = Object.fromEntries(['发起', '收件', '类型', '状态', '内容', '证据', '答复', '提案'].map((k) => [k, field(r.raw, k)]));
    for (const k of ['发起', '收件', '类型', '状态', '内容']) if (!f[k]) err(`${r.id}: 缺少字段「${k}」`);
    r.f = f;
    if (f['发起']) {
      const m = f['发起'].match(/^(\S+?)\s*[（(]([^）)]+)[）)]\s*·\s*(\d{4}-\d{2}-\d{2} \d{2}:\d{2})$/);
      if (!m) err(`${r.id}: 「发起」格式应为「<工具> (<角色>) · YYYY-MM-DD HH:mm」，当前：${f['发起']}`);
      else {
        r.by = m[1];
        if (!ROLES.includes(m[2])) err(`${r.id}: 发起角色「${m[2]}」不是已定义角色`);
      }
    }
    if (f['收件']) {
      const tos = f['收件'].split(/[,，\s]+/).filter(Boolean);
      r.to = tos;
      for (const t of tos) {
        if (!t.startsWith('@')) { err(`${r.id}: 收件项应以 @ 开头：${t}`); continue; }
        const n = t.slice(1);
        const known = n === '用户' || ROLES.includes(n) || Object.values(roster).flat().includes(n);
        if (!known) warn(`${r.id}: 收件 ${t} 不在花名册中`);
      }
    }
    if (f['类型'] && !TYPES.includes(f['类型'])) err(`${r.id}: 类型必须是 ${TYPES.join('/')}，当前 ${f['类型']}`);
    if (f['状态'] && !STATES.includes(f['状态'])) err(`${r.id}: 状态必须是 ${STATES.join('/')}，当前 ${f['状态']}`);
    if (f['类型'] === '认领' && !f['提案']) err(`${r.id}: 认领记录必须有「提案：<id>」字段`);
    if (f['状态'] === 'answered' && !f['答复']) err(`${r.id}: 状态为 answered 但「答复」为空`);
  }
}

// 与旧版比较：只追加；已有记录只允许「答复」「状态」变化；状态只能前进；可选按 actor 校验授权。
function diffAgainst(baseText, recs, roster) {
  const base = parseLedger(baseText);
  const cur = new Map(recs.map((r) => [r.id, r]));
  for (const b of base) {
    const c = cur.get(b.id);
    if (!c) { err(`${b.id}: 记录被删除（协议禁止）`); continue; }
    const strip = (raw) => raw.split('\n').filter((l) => !/^- (答复|状态)[：:]/.test(l)).join('\n').trimEnd();
    // 「答复」可跨多行：把答复块之后到下一个字段前的缩进行也视为答复内容
    const norm = (raw) => strip(raw.replace(/^- 答复[：:][\s\S]*$/m, ''));
    if (norm(b.raw) !== norm(c.raw)) err(`${b.id}: 除「答复」「状态」外的内容被改动（协议禁止）`);
    const bs = field(b.raw, '状态'), cs = field(c.raw, '状态');
    if (bs && cs && bs !== cs) {
      if ((ORDER[cs] ?? -1) < (ORDER[bs] ?? 99)) err(`${b.id}: 状态不得倒退（${bs} → ${cs}）`);
      if (actor) {
        const roles = Object.entries(roster).filter(([, ts]) => ts.includes(actor)).map(([r]) => r);
        const toMe = (c.to || []).some((t) => t === `@${actor}` || roles.some((r) => t === `@${r}`) || (actor === '用户' && t === '@用户'));
        if (cs === 'answered' && !toMe && actor !== '用户') err(`${b.id}: ${actor} 不是收件人，不能答复`);
        if (cs === 'closed' && actor !== '用户' && c.by !== actor) err(`${b.id}: 只有发起人（${c.by}）或用户可以关闭，当前操作者 ${actor}`);
      }
    }
  }
  const baseIds = new Set(base.map((b) => b.id));
  const added = recs.filter((r) => !baseIds.has(r.id));
  const tail = recs.slice(base.length);
  if (added.some((r, i) => tail[i]?.id !== r.id)) err('新记录必须追加在文件末尾');
  const maxBase = Math.max(0, ...base.map((b) => b.num));
  added.forEach((r, i) => { if (r.num !== maxBase + 1 + i) err(`${r.id}: 新记录编号应为 Q-${String(maxBase + 1 + i).padStart(3, '0')}`); });
}

const read = (rel) => { const p = path.join(root, rel); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; };
const rosterText = read(rosterRel), ledgerText = read(ledgerRel);
let roster = {};
if (rosterText == null) warn(`${rosterRel} 不存在（未配置协作花名册）`); else roster = parseRoster(rosterText);
if (ledgerText == null) warn(`${ledgerRel} 不存在`);
else {
  checkVersion(ledgerText, ledgerRel);
  const recs = parseLedger(ledgerText);
  validateRecords(recs, roster);
  let baseText = null;
  if (baseFile) baseText = fs.readFileSync(baseFile, 'utf8');
  else if (baseRef) {
    const r = spawnSync('git', ['show', `${baseRef}:${ledgerRel}`], { cwd: root, encoding: 'utf8' });
    if (r.status !== 0) { console.error(`无法读取 ${baseRef}:${ledgerRel}`); process.exit(2); }
    baseText = r.stdout;
  }
  if (baseText != null) diffAgainst(baseText, recs, roster);
  console.log(`台账记录 ${recs.length} 条（open ${recs.filter((r) => r.f?.['状态'] === 'open').length}）`);
}
for (const w of warns) console.log(`WARN  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
console.log(errors.length ? `未通过：${errors.length} 个错误` : '通过');
process.exit(errors.length ? 1 : 0);
