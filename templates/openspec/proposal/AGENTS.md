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
8. 如果涉及自定义错误码，必须遵循本项目的错误码 SSoT 流程（详见下方 §2.1.1）

### 2.1.1 错误码（当提案涉及新错误场景时）

> 若 roadmap 条目的 `key_tasks` / `acceptance_criteria` 或提案业务分析中涉及可失败操作（新增 IPC 命令、API 端点、文件读写等可能返回"不存在"、"格式无效"、"操作失败"等错误的场景），则必须定义对应错误码。否则跳过本节，在交付物清单注明"不涉及新错误码"。

**格式**：遵循 `.context/architecture/source/errcode_guidelines.md` 的 `MMTXXX` 6 位数字码（`MM`=模块 `T`=类型 `XXX`=序号）。已分配模块编号见 `tools/errcodes/shared/` 下的 `*-error-codes.yaml` 头部注释；新模块顺序分配下一个可用编号。

**SSoT 三步**：

1. **定义** — 在 `tools/errcodes/shared/*-error-codes.yaml` 中新增条目（`code`/`key`/`http`/`message_zh`/`message_en`/`module`）
2. **生成** — 运行 `make errcode-gen`，自动产出各语言常量文件（⛔ 生成文件禁止手动编辑；具体输出路径见 `Makefile` 中 `errcode-gen` target）
3. **验证** — `make errcode-gen` 无报错，生成的代码通过编译检查

**代码使用** — 必须通过生成的常量引用错误码，禁止硬编码字符串。示例：

```rust
// Rust — 通过 codes:: 常量 + get_error_message() 构造错误
use crate::error::{codes, get_error_message};
return Err(AppError::new(codes::SessionNotFound, get_error_message(codes::SessionNotFound, "zh")));
```

> 其他语言（Go 等）同理：导入生成的常量包，通过常量名引用。各语言的生成产物路径与 API 见 `Makefile` 和 `tools/errcodes/README.md`。

**提案体现**：

| 文件 | 需要补充的内容 |
|------|--------------|
| `design.md` | Decision：模块编号分配与使用方式 |
| `spec.md` | "错误响应格式"Requirement + 错误码表；错误 Scenario 引用具体错误码 |
| `tasks.md` | "错误码定义（SSoT）"任务：YAML → `make errcode-gen` → 常量引用 |
| `proposal.md` | 验证标准含 `make errcode-gen` 通过 |

### 2.2 必须输出交付物清单（Deliverables）

> ⛔ **必须在创建完成后输出下列清单并逐项打勾**；任何一项缺失：⛔ **STOP**

- [ ] `openspec/changes/<change-id>/proposal.md`
- [ ] `openspec/changes/<change-id>/tasks.md`
- [ ] `openspec/changes/<change-id>/specs/<capability>/spec.md`（至少 1 个 capability delta；多 capability 则多文件）
- [ ] `openspec/changes/<change-id>/design.md`（仅当 `node design/context-dev/tools/specflow/specflow.mjs instructions design --change <change-id>` 要求/建议且确有设计决策需要记录；否则明确写“未创建 design.md 的原因”）
- [ ] 如涉及接口：`.context/architecture/api_strategy.md`（已补充请求/响应示例；否则写明“不涉及接口设计”）
- [ ] 如涉及错误码：`tools/errcodes/shared/*-error-codes.yaml` 已新增对应模块错误码，`make errcode-gen` 通过（否则写明"不涉及新错误码"）
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
- [ ] 若提案涉及新错误场景：已在 `tools/errcodes/shared/*-error-codes.yaml` 定义错误码，`make errcode-gen` 通过，`spec.md` 错误 Scenario 引用了具体错误码（否则已注明“不涉及新错误码”）
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

**结果**：
- ❌ 验证失败 → 根据常见错误提示修复，重新验证；修复前不得宣称完成
- ✅ 验证通过 → 继续 Phase 5

**常见错误**：
- "Change must have at least one delta" → 检查 `specs/` 目录
- "Requirement must have at least one scenario" → 使用 `#### Scenario:` 格式

---

## Phase 5: 动态生成评审 Prompt

> ⛔ **必须在 Phase 4 验证通过后执行**。
> ⛔ **输出的 Prompt 必须完整填入实际的 change-id 和 Phase 编号，不得保留任何 `<...>` 占位符**。

### 5.1 执行前数据汇总

在生成 Prompt 前，AI 必须从前序步骤提取以下信息：

| 步骤 | 读取来源 | 提取内容 | 用途 |
|------|----------|----------|------|
| ① | Phase 1.2.1 Roadmap 提案快照 | `change_id`、`phase`（如 Phase-0 / Phase-1） | 填入 Prompt 的提案 ID 与大纲所在 Phase |
| ② | `openspec/changes/<change-id>/` 目录实际结构 | 存在的文件（proposal.md / tasks.md / specs/ / design.md） | 确保 Prompt 中提案路径表述准确 |
| ③ | `openspec/changes/<change-id>/proposal.md` → `### 关联 Context 资产` | 关联资产列表 | 供评审者按需加载 |

### 5.2 Prompt 输出格式

完成数据汇总后，AI 输出以下**完全填充的 Prompt**（以 markdown 代码块包裹，便于用户复制至新对话运行）：

~~~markdown
```
/context-check review 对 change-id 为 `<实际change-id>` 的提案进行三层联合评审，评审对象包括：
- 大纲（Outline）：`openspec/proposal-roadmap-Phase-<N>.md` 中该提案的大纲条目
- 提案内容（Proposal）：`openspec/changes/<实际change-id>/`（包含 proposal.md / tasks.md / specs/<实际capability>/spec.md，以及可能的 design.md）
- 业务资产（Context）：`.context/` 目录下的权威文档

---

## 阶段一：大纲与资产一致性评审（Outline ↔ .context）

验证大纲中描述的目标、范围、约束与验收口径是否与 `.context/` 权威资产对齐，识别大纲存在的遗漏、冲突或表述不准确之处。

**权威对照源**：
- `criterion.md`（工程约束 SSoT）
- `domain/business_rules.md` + `domain/domain_model.md` + `domain/user_journeys.md`（业务规则、领域模型与用户旅程）
- `domain/edge_cases.md`（边界场景，校验 In/Out 是否遗漏已知边缘情况）
- `architecture/risks_and_debt.md` + `domain/risks_and_debt.md`（风险对照）
- `architecture/security_policy.md`（安全约束）
- `legacy/legacy_system_analysis.md`（遗留系统约束，Phase-0 提案必须参考）

**评审项**：
1. **业务目标对齐** — 大纲"业务目标"中的每条目标是否能在 `business_rules.md` 或 `user_journeys.md` 中找到对应的业务需求依据？是否有与 .context 冲突的目标？
2. **关联资产覆盖度** — 大纲"关联 Context 资产"表格是否引用了该提案所涉及的全部 .context 文档？对照 `.context/` 实际目录，列出缺失引用和多余引用。
3. **In/Out 边界与 .context 对齐** — 大纲的 In 范围是否与 .context 所定义的功能边界和业务规则一致？Out 范围是否遗漏了 `edge_cases.md` 中已知的需要明确排除的边缘场景？
4. **验收标准与约束对齐** — 大纲的验收标准是否覆盖了 `criterion.md` 中相关的 MUST/MUST NOT 要求？是否有可操作的验证方式（日志/指标值/API 响应）？标注主观模糊或缺失量化指标的条目。
5. **风险覆盖完整度** — 对照 `risks_and_debt.md` 中的 RISK-xxx 列表，大纲风险表是否覆盖了所有与该提案相关的风险？标注遗漏的 RISK-xxx 及其严重程度。

**输出**：
- 大纲与 .context 一致性评级（高 / 中 / 低）及核心发现
- 业务目标对照表（| 大纲目标 | .context 依据 | 对齐状态 ✅/⚠️/❌ |）
- 缺失 / 多余的资产引用列表
- In/Out 边界问题清单（遗漏的边缘场景、与 .context 冲突的范围定义）
- 验收标准问题列表（触发 MUST/MUST NOT 遗漏或缺失量化指标的条目）
- 遗漏 RISK-xxx 列表（含风险等级）

---

## 阶段二：大纲与提案内容一致性校验（Outline ↔ Proposal）

逐项核对提案内容是否忠实还原并完整展开了大纲的意图，识别边界漂移、缺口与偏差。

**评审项**：
1. **目标映射** — 大纲"业务目标"中的每条目标是否在 proposal.md 中均有对应说明？标注未覆盖项。
2. **范围边界落地** — 大纲 In/Out 范围是否完整体现在 proposal.md 的范围章节中？是否有边界漂移（提案比大纲多做或少做了什么）？
3. **关键任务还原** — 大纲"关键任务"列表是否在 tasks.md 中被拆解为可执行的原子任务？检查是否有大纲任务未在 tasks.md 出现。
4. **验收标准传递** — 大纲的验收条目是否在 spec.md 或 tasks.md 的验收部分中被完整继承？是否有弱化或丢失。
5. **依赖关系对齐** — 大纲声明的前置依赖和被依赖提案是否在 proposal.md 的依赖章节中完整体现？

**输出**：
- 一致性总评（完全一致 / 部分一致 / 不一致）
- 目标覆盖对照表（| 大纲目标 | 提案对应章节 | 覆盖状态 |）
- 边界漂移清单（多做/少做的具体内容）
- 任务映射缺口列表
- 依赖声明差异列表

---

## 阶段三：提案内容合规评审（Proposal → .context）

判断提案内容是否满足 `.context/` 定义的系统业务要求与约束，并验证其在路线图中的定位合理性。

**权威对照源**（按提案涉及模块选择性加载，全量列举以供对照）：
| 评审维度 | 权威来源文件 |
|---------|------------|
| 业务规则 / 用户旅程 | `.context/domain/business_rules.md` + `.context/domain/user_journeys.md` + `.context/domain/domain_model.md` + `.context/domain/ubiquitous_language.md` |
| 边界与边缘场景 | `.context/domain/edge_cases.md` |
| 非功能要求（安全/合规/性能） | `.context/criterion.md` §3-§4 + `.context/architecture/security_policy.md` + `.context/db/security_hardening.md` |
| 可观测性 / 运维 / 部署 | `.context/architecture/cross_cutting_concepts.md` + `.context/architecture/runtime_view.md` + `.context/architecture/deployment_view.md` |
| 数据层（如涉及 DB 变更） | `.context/db/schema_design.md` + `.context/db/migrations_and_ssot.md` + `.context/db/performance_tuning.md` |
| 遗留系统兼容 / 迁移路径 | `.context/legacy/legacy_system_analysis.md` + `.context/architecture/migration_architecture.md` |
| 测试与验收 | `.context/domain/testing_strategy.md` + `.context/domain/data_strategy.md` |
| UI / 交互（如涉及前端） | `.context/ui/design_system.md` + `.context/ui/interaction_states.md` + `.context/ui/stitch_prompts.md` |
| API 契约 | `.context/architecture/api_strategy.md` |
| 路线图定位与依赖 | `openspec/proposal-roadmap.md` + `openspec/proposal-roadmap-Phase-<N>.md` |

**审查维度**：
1. MUST/MUST NOT 合规矩阵（逐条扫描 criterion.md §3-§4，不可跳过）
2. 业务规则核对（BR-xxx 逐条映射，标注满足/不满足/缺失证据）
3. 路线图定位（依赖完整性、冲突点、重叠建设风险）
4. 接口契约分析（上下游耦合、破坏性变更影响范围）
5. 技术与交付风险（触发条件 + 影响 + 缓解 + 责任归属）
6. 待澄清问题（P0 阻塞 / P1 重要 / P2 建议）
7. 可执行修改建议（M-n 编号 + 修改位置 + 验收口径 + 监控指标）

**输出报告**：
1. **综合结论**（PASS / PASS (Conditional) / MODIFY / FAIL）及各阶段小结
2. MUST/MUST NOT 合规矩阵（| 规则（criterion.md 位置）| 提案证据 | 状态 ✅/⚠️/❌ |）
3. 业务契合度表（| BR-xxx | 满足/不满足/缺失 | 提案引用位置 |）
4. 大纲↔提案一致性对照表（| 大纲章节 | 提案对应位置 | 一致性 | 差异说明 |）
5. 路线图关联分析（依赖图核对、冲突点、整合建议）
6. 风险清单（| 风险ID | 触发条件 | 影响 | 缓解方案 | 责任归属 |）
7. 待澄清问题列表（按 P0/P1/P2 排序）
8. 修改建议（M-n 编号 + 涉及层（大纲/提案/两者）+ 修改位置 + 具体内容 + 验收口径）

**质量要求**：
- 所有结论必须引用具体文件路径 + 章节/行号，禁止泛泛而谈
- MUST/MUST NOT 必须逐条扫描，BR-xxx 必须逐条映射，不可合并或跳过
- 修改建议须明确指出应改"大纲"还是"提案内容"或"两者均需同步"
- 输出使用中文，文件引用使用相对路径（相对项目根目录）
```
~~~

### 5.3 输出质量检查（生成后自检）

AI 在输出 Prompt 前必须完成以下自检，确认**全部通过**再输出：

- [ ] `change-id` 是实际值，非 `<CHANGE_ID>` 占位符（Prompt 中所有出现位置均已替换）
- [ ] Phase 编号是实际值（如 `Phase-0`、`Phase-1`），非 `<N>` 占位符（Prompt 中所有出现位置均已替换）
- [ ] 大纲路径引用了正确的 `openspec/proposal-roadmap-Phase-<N>.md` 文件（N 与快照一致）
- [ ] `specs/<capability>/spec.md` 中的 `<capability>` 已替换为实际目录名
- [ ] Prompt 全文无任何 `<...>` 占位符

> ⏸️ **将上方 Prompt 复制至新对话运行评审**；建议在评审结论为 PASS 或 PASS (Conditional) 后，再继续实施（`/context-start <change-id>`）。

---

## ✅ 完成后

> ⛔ **只有 `node design/context-dev/tools/specflow/specflow.mjs validate <change-id> --strict` 通过后才能报告完成**
> ⚠️ 下方模板中的 `<...>` 均为待填充字段，**输出时必须替换为实际值**。

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
- .context/domain/business_rules.md（必含）
- <proposal.md 关联 Context 资产表中的其他文件>

Roadmap 对齐:
- source_primary: openspec/proposal-roadmap.md
- source_supplement: <roadmap-doc 实际路径，或 N/A>
- phase: <Phase-0 / Phase-1 / ...（实际值）>
- matched change: <实际 change-id>
- alignment: Why/What/Impact/tasks/specs 已逐项对齐（如有偏差已说明）

✅ 评审 Prompt 已输出（见上方 Phase 5）

下一步:
- 复制 Phase 5 Prompt 至新对话运行三阶段评审
- 评审通过后开始实施: /context-start <实际 change-id>
```
