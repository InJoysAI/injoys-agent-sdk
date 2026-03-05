# Context Proposal 指令

> 当 `/context-openspec proposal` 被调用时执行此文件。
> 本指令增强 OpenSpec 标准提案流程，集成 Context 资产读取。

---

## 🎯 执行指令

> ⛔ **必须依次执行所有步骤**，遵循 OpenSpec 规范。

---

## Pre-flight Checklist

> ⚠️ **Proposal 特定检查**

| 检查项 | 通过条件 | 失败处理 |
|--------|---------|---------|
| config.yaml | `openspec/config.yaml` 存在 | ⛔ STOP，先运行 `/context-openspec project` |
| proposal-roadmap.md | `openspec/proposal-roadmap.md` 存在 | ⛔ STOP，先运行 `/context-openspec plan` |
| proposal-roadmap-Phase*.md（可选） | `openspec/proposal-roadmap-Phase*.md` 或 `openspec/proposal-roadmap-Phase-*.md` 存在 | 若存在，则作为补充规划文档一并读取 |
| roadmap 条目匹配结果 | 能在 `openspec/proposal-roadmap.md` 中精确定位到目标 `<change-id>` 条目（或经用户确认按“新建提案”处理） | ⛔ STOP，先确认是“新建提案”还是“使用既有 roadmap 条目” |

**命令参数**：
- `/context-openspec proposal <change-id>`：创建提案时，必须携带 `openspec/proposal-roadmap.md` 中该 `<change-id>` 的条目内容
- `/context-openspec proposal <change-id> <roadmap-doc>`：在上条基础上，额外读取 `<roadmap-doc>` 作为补充信息（不能替代 `openspec/proposal-roadmap.md` 的主条目）
  - `roadmap-doc` 期望是一个**具体文件路径**（不建议传 `*` 通配符；若用户传了通配符，需先让用户确认要读取哪些具体文件）


---

## Phase 1: 读取 Context 规范

### 1.1 读取 Context 资产

**执行**: `@design/context-dev/tools/asset-reader/AGENTS.md`

> 该模块会从 `context-manifest.json` 筛选并读取所有生成的 Context 文件。

**额外读取**（proposal 专用）：
- `.context/openspec/integration.md` — Context 读取规范
- `openspec/config.yaml` — 项目整体情况（OPSX 注入上下文）
- `openspec/proposal-roadmap.md` — 规划文档（索引/总览，且必须提取 `<change-id>` 对应条目正文）
- `openspec/proposal-roadmap-Phase*.md` / `openspec/proposal-roadmap-Phase-*.md` — 分 Phase 规划（若存在，视为更细粒度计划）

### 1.2 匹配提案（强制）

根据命令参数 `<change-id>` 执行“先精确后模糊”匹配：
- 匹配范围：
  - 第一步（必做）：在 `openspec/proposal-roadmap.md` 中按 `<change-id>` 精确匹配目标条目
  - 第二步（可选补充）：若用户提供了 `roadmap-doc`，再在该文件中匹配同 `<change-id>` 或同主题条目用于补充
  - 第三步（可选补充）：若存在 `openspec/proposal-roadmap-Phase*.md`/`openspec/proposal-roadmap-Phase-*.md`，补充匹配
- 匹配规则：
  - 主规则（必须）：`Change ID` 精确匹配 `<change-id>`
  - 补救规则（仅在精确匹配失败时）：名称关键词模糊匹配，并向用户确认是否接受该映射
- 若仍无法匹配 → 向用户确认是新建提案还是选择已有提案；在确认前 ⛔ STOP

### 1.2.1 生成「Roadmap 提案快照」（强制）

> ⛔ 本步骤是 proposal 输入的一部分，不是可选说明。
> 没有快照或快照字段不完整，禁止进入 Phase 2。

从匹配到的 roadmap 条目中抽取并输出以下信息（缺失字段用 `N/A` 标注，并提示用户确认）：

**核心必提取字段（必须）**：
- `roadmap_source_primary`（固定为 `openspec/proposal-roadmap.md`）
- `roadmap_source_supplement`（若无补充文件则 `N/A`）
- `phase`（如 Phase 0 / 1 / 2）
- `change_id`
- `title`
- `business_goal`
- `in_scope` / `out_of_scope`
- `dependencies`
- `acceptance_criteria`
- `key_tasks`
- `risks`
- `related_context_assets`

**扩展建议提取字段（若条目存在）**：
- `milestones`
- `coverage_scope`
- `gate_vs_non_gate`
- `change_management`
- `ops_support`
- `kpi`
- `risk_acceptance_policy`

输出格式（建议）：

```markdown
### Roadmap 提案快照（必须对齐）
| 字段 | 内容 |
|------|------|
| roadmap_source_primary | openspec/proposal-roadmap.md |
| roadmap_source_supplement | ... |
| phase | ... |
| change_id | ... |
| title | ... |
| business_goal | ... |
| in_scope | ... |
| out_of_scope | ... |
| dependencies | ... |
| acceptance_criteria | ... |
| key_tasks | ... |
| risks | ... |
| related_context_assets | ... |
| milestones | ... |
| coverage_scope | ... |
| gate_vs_non_gate | ... |
| change_management | ... |
| ops_support | ... |
| kpi | ... |
| risk_acceptance_policy | ... |
```

### 1.2.2 生成「提案输入上下文包」（强制）

> ⛔ 创建提案前，必须输出并使用该上下文包；否则禁止进入 Phase 2。

上下文包必须包含两部分：
1. `Context Assets Payload`：来自 `.context/*` 与 `openspec/config.yaml` 的关键信息摘要
2. `Roadmap Entry Payload`：来自 `openspec/proposal-roadmap.md` 的 `<change-id>` 条目要点（核心必含：`business_goal`、`in_scope/out_of_scope`、`dependencies`、`acceptance_criteria`、`key_tasks`、`risks`；若条目存在扩展字段也应携带）

若提供了 `<roadmap-doc>`，可在 `Roadmap Entry Payload` 中追加补充字段，但不得覆盖主来源结论。

### 1.3 检查现有变更

```bash
ls openspec/changes/       # 已有的 changes
ls openspec/specs/         # 已有的 specs（capabilities）
```

检查相关代码或文档（如涉及的模块）

---

## Phase 2: 创建提案

> ⛔ **执行 OpenSpec 官方提案创建流程**

### 2.0 推荐：优先使用 OPSX 的 artifact 流程生成提案骨架

> 目标：避免漏文件/漏顺序；让“提案创建”与新版 OpenSpec/OPSX 的工作流保持一致。

**优先流程**（若项目启用了 OPSX 命令）：
1. 使用 `/opsx:new` 创建/选择变更目录（确保 `openspec/changes/<change-id>/` 存在且被 OpenSpec 识别）
2. 使用 `/opsx:continue` 按 artifact 顺序生成提案所需文件（proposal/tasks/specs/...）
3. 回到本指令继续执行下面的 **2.1 强约束** 与后续自检/验证

**fallback**（若无法使用 OPSX 命令）：继续执行下方的手工创建流程（创建目录结构与交付物）。

### 2.0.1 将 roadmap 快照绑定到提案内容（强制）

> ⛔ 必须把 **1.2.1 Roadmap 提案快照** 映射到提案工件；禁止只“读取不落地”。

映射规则：
1. `proposal.md > Why` 必须覆盖 `business_goal`
2. `proposal.md > What Changes` 必须覆盖 `in_scope`，并明确排除 `out_of_scope`
3. `proposal.md > Impact` 必须包含依赖关系（`dependencies`）与风险（`risks`）
4. `tasks.md` 必须包含对 `key_tasks` 的可执行拆解（允许细化，不允许偏离）
5. 若 roadmap 条目存在扩展字段，`proposal.md`/`tasks.md` 应尽量体现：`milestones`、`coverage_scope`、`gate_vs_non_gate`、`change_management`、`ops_support`、`kpi`、`risk_acceptance_policy`
6. `tasks.md` 中的 validate/archive 必须以普通 checkbox 文本行出现（不能仅放在代码块）
7. `specs/*/spec.md` 的 Scenario 必须可追溯到 `acceptance_criteria`

若映射冲突（roadmap 与用户新要求冲突）：先向用户确认取舍，确认前 ⛔ STOP。

### 2.0.2 输出“工件写作指引”（proposal/specs/tasks）

> ⛔ 当用户准备开始编写 `proposal.md` / `specs/*/spec.md` / `tasks.md` 时，必须先输出对应的 instructions，避免漏文件/漏顺序/漏规则。

依次执行并输出结果（在对话中原样展示关键字段：Output、Template、Dependencies）：

```bash
node design/context-dev/tools/specflow/specflow.mjs status <change-id>
node design/context-dev/tools/specflow/specflow.mjs instructions proposal --change <change-id>
node design/context-dev/tools/specflow/specflow.mjs instructions specs --change <change-id>
node design/context-dev/tools/specflow/specflow.mjs instructions tasks --change <change-id>
node design/context-dev/tools/specflow/specflow.mjs templates
```

### 2.1 强约束：必须先读取 Specflow 指令（不依赖 OpenSpec CLI）

> ⛔ **必须实际获取并遵循 Specflow 的 artifact 指令**（以本仓库 `design/context-dev/tools/specflow/` 为准）：
>
> - `node design/context-dev/tools/specflow/specflow.mjs status <change-id>`
> - `node design/context-dev/tools/specflow/specflow.mjs instructions proposal --change <change-id>`
> - `node design/context-dev/tools/specflow/specflow.mjs instructions specs --change <change-id>`
> - `node design/context-dev/tools/specflow/specflow.mjs instructions design --change <change-id>`
> - `node design/context-dev/tools/specflow/specflow.mjs instructions tasks --change <change-id>`

在继续之前，你必须在输出中给出 **“读取确认”**（缺一不可）：
1. ✅ 已读取 `node design/context-dev/tools/specflow/specflow.mjs instructions proposal --change <change-id>`（以及本变更需要的其他 artifact instructions）
2. ✅ 将遵循 delta 结构：`## ADDED|MODIFIED|REMOVED|RENAMED Requirements`
3. ✅ 每条 `### Requirement:` 至少包含 1 个 `#### Scenario:`
4. ✅ 将运行并通过：`node design/context-dev/tools/specflow/specflow.mjs validate <change-id> --strict`

> 若无法读取/无法遵循上述任意一条：⛔ **STOP**（解释原因并提示用户补齐条件）

**执行步骤**：
1. 选择唯一的 `change-id`（kebab-case, verb-led）
2. 创建目录结构：`openspec/changes/<change-id>/`
3. 编写 `openspec/changes/<change-id>/proposal.md`、`openspec/changes/<change-id>/tasks.md`
4. 创建 `openspec/changes/<change-id>/specs/<capability>/spec.md` delta 文件
5. 若需要技术设计/架构决策，创建 `openspec/changes/<change-id>/design.md`（以 `node design/context-dev/tools/specflow/specflow.mjs instructions design --change <change-id>` 的要求为准）
6. 增加以 SSoT 为首的步骤：验证是否需要更改 schema/API 合约；如果不需要，则添加明确的“SSoT 未更改”检查，以及 `node design/context-dev/tools/specflow/specflow.mjs validate <change-id> --strict` + `node design/context-dev/tools/specflow/specflow.mjs archive <change-id> --yes` 的任务；如果需要，则包括创建 Goose 迁移 (`SSoT/schema/migrations/`) 和 `SSoT/api/main.tsp` 的更新以及相应的代码生成（codegen）。
7. 如果涉及接口方面的设计，需要同步更新`.context/architecture/api_strategy.md`,添加对应的请求响应示例

### 2.2 必须输出交付物清单（Deliverables）

> ⛔ **必须在创建完成后输出下列清单并逐项打勾**；任何一项缺失：⛔ **STOP**

- [ ] `openspec/changes/<change-id>/proposal.md`
- [ ] `openspec/changes/<change-id>/tasks.md`
- [ ] `openspec/changes/<change-id>/specs/<capability>/spec.md`（至少 1 个 capability delta；多 capability 则多文件）
- [ ] `openspec/changes/<change-id>/design.md`（仅当 `node design/context-dev/tools/specflow/specflow.mjs instructions design --change <change-id>` 要求/建议且确有设计决策需要记录；否则明确写“未创建 design.md 的原因”）
- [ ] 如涉及接口：`.context/architecture/api_strategy.md`（已补充请求/响应示例；否则写明“不涉及接口设计”）
- [ ] SSoT 相关（按需）：`SSoT/schema/migrations/`、`SSoT/api/main.tsp`、以及 codegen 产物（或写明 “SSoT 未更改”）
- [ ] Roadmap 对齐证明：输出 `Roadmap 提案快照`，并给出 proposal/tasks/specs 的字段映射说明

### 2.3 逐项自检（Self-check）+ 不通过则 STOP

> ⛔ **必须逐项自检并在失败时立即 STOP**（不要“先继续后补”）

- [ ] `change-id` 唯一且 verb-led（必要时用 `ls openspec/changes/` 检查；冲突则换名）
- [ ] 目录结构完整：`openspec/changes/<change-id>/` + `specs/<capability>/`
- [ ] `proposal.md` 至少包含：`## Why`、`## What Changes`、`## Impact`（且 Impact 里包含 “关联 Context 资产” 表）
- [ ] `tasks.md` 包含：SSoT 检查/变更（或“SSoT 未更改”）、`node design/context-dev/tools/specflow/specflow.mjs validate <change-id> --strict`、以及 `node design/context-dev/tools/specflow/specflow.mjs archive <change-id> --yes`（作为后续任务）
- [ ] 每个 delta spec 文件至少包含 1 个 operation header（`## ADDED|MODIFIED|REMOVED|RENAMED Requirements`）
- [ ] 每条 `### Requirement:` 至少 1 个 `#### Scenario:`（严格 4 个 `#`；否则将导致解析失败）
- [ ] 已输出 `Roadmap 提案快照`（来源文件、phase、目标、范围、依赖、验收、关键任务、风险、关联资产）
- [ ] 已输出 `提案输入上下文包`，且包含 `Context Assets Payload` + `Roadmap Entry Payload`
- [ ] `Roadmap Entry Payload` 明确来自 `openspec/proposal-roadmap.md` 的 `<change-id>` 条目（`roadmap-doc` 仅补充不替代）
- [ ] `Roadmap Entry Payload` 已覆盖核心必提取字段；若 roadmap 条目存在扩展字段，已在 payload 中体现或标注 `N/A`
- [ ] `tasks.md` 的 validate/archive 为普通 checkbox 文本行（非仅代码块），可被 specflow 检测
- [ ] `proposal.md` 的 Why/What Changes/Impact 与 `Roadmap 提案快照` 对齐（若有偏差，已写明偏差原因并获用户确认）
- [ ] `tasks.md` 至少覆盖 roadmap 的全部 `key_tasks`（可细化拆分，不得缺失）
- [ ] `specs/*/spec.md` 的 Scenario 至少覆盖 roadmap `acceptance_criteria` 的核心验收点
- [ ] 若 roadmap 条目存在扩展字段（milestones/coverage_scope/gate_vs_non_gate/change_management/ops_support/kpi/risk_acceptance_policy），proposal/tasks 已体现或已说明暂不纳入原因
- [ ] 已运行并通过：`node design/context-dev/tools/specflow/specflow.mjs validate <change-id> --strict`
- [ ] 若 `Roadmap Entry Payload` 与 proposal/tasks/specs 任一项不一致，已获得用户明确确认；未确认则 ⛔ STOP

> 若 `node design/context-dev/tools/specflow/specflow.mjs validate <change-id> --strict` 失败：先修复提案/格式/缺失项，再重新验证；在验证通过前不得宣称完成。

### 2.4 固定模板（减少重复的写法约束 + 可直接复制）

> 目标：**proposal 只写“为什么/改什么/影响”**；**spec delta 写“行为与验收”**；**tasks 只写“实现步骤”**。避免在多个文件重复同一段长描述。

> ✅ 本仓库模板路径（权威来源）：
> - `design/context-dev/templates/openspec/proposal.md.template`
> - `design/context-dev/templates/openspec/spec.md.template`
> - `design/context-dev/templates/openspec/design.md.template`
> - `design/context-dev/templates/openspec/tasks.md.template`

#### Template: `openspec/changes/<change-id>/proposal.md`
**SSoT 模板**：`design/context-dev/templates/openspec/proposal.md.template`  
**输出路径**：`openspec/changes/<change-id>/proposal.md`

**硬约束**：
- 必须包含 `## Why` / `## What Changes` / `## Impact`
- `Impact` 必须包含 “关联 Context 资产” 表（至少包含 `.context/criterion.md`）
- 必须新增 `### 提案大纲对齐（Roadmap Alignment）` 小节，最少包含：`roadmap_source_primary`、`roadmap_source_supplement`、`phase`、`business_goal`、`dependencies`、`acceptance_criteria`
- 禁止残留任何 `{{...}}` 占位符（写入文件前必须全部替换为实际内容）

#### Template: `openspec/changes/<change-id>/tasks.md`
**SSoT 模板**：`design/context-dev/templates/openspec/tasks.md.template`  
**输出路径**：`openspec/changes/<change-id>/tasks.md`

**硬约束**：
- 必须是可执行的 Markdown checkbox 列表（`- [ ] ...`）
- 必须包含验证步骤：`- [ ] 运行 node design/context-dev/tools/specflow/specflow.mjs validate <change-id> --strict`（普通 checkbox 文本行，不可仅放在代码块）
- 必须包含归档步骤：`- [ ] 运行 node design/context-dev/tools/specflow/specflow.mjs archive <change-id> --yes`（普通 checkbox 文本行，不可仅放在代码块）
- 必须包含 `Roadmap 对齐任务`（对应 roadmap 的 `key_tasks`；可以拆分为更细粒度子任务）
- 禁止残留任何 `{{...}}` 占位符（写入文件前必须全部替换为实际内容）

#### Template: `openspec/changes/<change-id>/specs/<capability>/spec.md`（delta）
**SSoT 模板**：`design/context-dev/templates/openspec/spec.md.template`  
**输出路径**：`openspec/changes/<change-id>/specs/<capability>/spec.md`

**硬约束**：
- 必须至少包含 1 个 operation header：`## ADDED|MODIFIED|REMOVED|RENAMED Requirements`
- 每条 `### Requirement:` 必须至少包含 1 个 `#### Scenario:`
- Scenario 建议包含 `**WHEN**` 与 `**THEN**`（严格模式下缺失会报错/警告，取决于规则）
- Scenario 必须能追溯到 roadmap 的 `acceptance_criteria`（在 Requirement 或 Scenario 文本中体现该验收语义）
- 禁止残留任何 `{{...}}` 占位符（写入文件前必须全部替换为实际内容）

#### Template: `openspec/changes/<change-id>/design.md`（仅当需要）
**SSoT 模板**：`design/context-dev/templates/openspec/design.md.template`  
**输出路径**：`openspec/changes/<change-id>/design.md`

**硬约束**：
- 仅在确有“需要记录的设计决策/取舍/迁移方案”时创建；否则不要创建，并在交付物清单说明原因
- 禁止残留任何 `{{...}}` 占位符（写入文件前必须全部替换为实际内容）

**Context 增强**（在 OpenSpec 标准基础上添加）：

在 `proposal.md` 的 **Impact** 章节，必须关联相关 Context 资产：

```markdown
## Impact
- Affected specs: [list capabilities]
- Affected code: [key files/systems]

### 关联 Context 资产
| Scope | 资产路径 | 关联说明 |
|-------|---------|---------|
| criterion | `.context/criterion.md` | 必须遵守的约束 |
| <SCOPE> | `<ASSET_PATH>` | <RELATION_DESC> |
```

---

## Phase 3: SSoT 先行检查

> ⚠️ **仅当项目使用 SSoT 架构时执行**

读取 `.context/architecture/tech_stack.md` 判断项目 SSoT 类型：

| Tech Stack | SSoT 文件 | 检查项 |
|------------|----------|--------|
| SQL/Relational DB（e.g. PostgreSQL） | `SSoT/schema/migrations/` | 数据库相关变更 |
| REST API | `SSoT/api/main.tsp` | API 相关变更 |
| 无 REST API | N/A | 无 SSoT 约束 |

**若存在 SSoT 约束**，`tasks.md` 必须遵循顺序：
1. 修改 SSoT 文件（schema/api）
2. 运行 Codegen
3. 实现业务代码
4. 编写测试

---

## Phase 4: 验证提案

```bash
node design/context-dev/tools/specflow/specflow.mjs validate <change-id> --strict
```

> ⛔ **必须解决所有验证错误后才能提交提案**

**常见错误**：
- "Change must have at least one delta" → 检查 `specs/` 目录
- "Requirement must have at least one scenario" → 使用 `#### Scenario:` 格式

---

## ✅ 完成后

> ⛔ **只有 `node design/context-dev/tools/specflow/specflow.mjs validate <change-id> --strict` 通过后才能报告完成**

报告结果：

```
=== 提案创建完成 ===
✅ openspec/changes/<change-id>/proposal.md
✅ openspec/changes/<change-id>/tasks.md
✅ openspec/changes/<change-id>/specs/<capability>/spec.md

验证结果:
$ node design/context-dev/tools/specflow/specflow.mjs validate <change-id> --strict
✅ All checks passed

关联的 Context 资产:
- .context/domain/business_rules.md
- .context/architecture/security_policy.md

Roadmap 对齐:
- source_primary: openspec/proposal-roadmap.md
- source_supplement: <roadmap-doc or N/A>
- phase: <phase>
- matched change: <change-id>
- alignment: Why/What/Impact/tasks/specs 已逐项对齐（如有偏差已说明）

下一步:
- 开始实现: /context-start <change-id>
- 或者 审阅提案: /context-check  proposal <change-id>
```
