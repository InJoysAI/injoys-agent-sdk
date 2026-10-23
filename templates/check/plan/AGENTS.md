# Plan Check 指令

> 当 `.agents/workflows/context-check.md plan` 被调用时执行此文件。
> 遵循 `@design/context-dev/check/AGENTS.md` 通用审查协议。

---

## 🎯 执行指令

> ⛔ **必须依次执行所有步骤**，不得跳过或中断。

---

## Phase 1: 文件存在性校验

检查以下文件是否存在：

| 文件 | 必需 | 说明 |
|------|:----:|------|
| `openspec/proposal-roadmap.md` | ✅ | Roadmap 总规划 |
| `openspec/proposal-roadmap-Phase-<N>.md`（兼容旧名 `Phase<N>`） | 条件必需 | 总纲 Metadata `规划形态` 为 `总纲+分Phase` 时，阶段总览中的每个 Phase 都必须有对应文件 |
| `.context/context-manifest.json` | ✅ | 用于读取 Context 资产 |

先读取总纲 Metadata 的 `规划形态` 与 `判定依据`，决定后续按哪种形态校验；缺少 `规划形态` 时按 `单文件` 处理并给出警告。

**结果**：
- ❌ 缺失必需文件 → 失败，提示先运行 `.agents/workflows/context-openspec.md plan`
- ✅ 所有必需文件存在 → 继续

---

## Phase 2: 格式正确性校验

**参考模板**: `design/context-dev/templates/proposal-roadmap.md.template`

### 2.1 必须包含的节

| 节 | 说明 |
|------|------|
| 项目信息（Metadata） | 项目名称、当前阶段、生成日期、来源文档 |
| 阶段总览（Phase Overview） | 表格列出所有 Phase：阶段、名称、目标、预计周期 |
| 各 Phase 详情 | 每个 Phase 包含多个提案 |
| 依赖关系图 | Mermaid 格式的提案依赖图 |

### 2.2 提案格式校验

每个提案必须包含：
- `Change ID`（格式：`feat-/fix-/chore-/refactor-` 开头）
- `优先级`（P0/P1/P2）
- `状态`（proposed/in-progress/done）
- `范围` 描述

**按形态**：
- `单文件`：以上字段在 `proposal-roadmap.md` 的提案块中；不应存在「提案索引」章节
- `总纲+分Phase`：提案块在各 Phase 文件中（结构见 `proposal-roadmap-phase.md.template`）；总纲**不应**含提案块，须有「提案索引」，并检查：
  - 总览中每个 Phase 都有文件，链接可达，编号与文件名一致
  - 索引 Change ID 集合 = Phase 文件提案块 Change ID 集合（无遗漏、无重复）
  - 索引中的优先级、前置依赖、状态与 Phase 文件逐条一致
- **状态与变更目录一致**：运行 `node design/context-dev/tools/specflow/specflow.mjs roadmap-status --check`。已有 `openspec/changes/<id>/` 但 Roadmap 仍是 `proposed`、已归档但不是 `done`、或同一提案的多处状态不一致，均标 `[DESYNC]`（P2），修复建议为命令输出里的 `fix` 一栏；不自动修改。
- **UI 资产已生成但路线图无 UI 提案**：`generated_files.ui` 非空，而路线图（单文件看总纲；分 Phase 看各 Phase 文件）中没有任何提案的「关联 Context 资产」含 `.context/ui/`、Change ID 也不含 `-ui-`，标 `[DESYNC]` P2，修复建议 `.agents/workflows/context-openspec.md plan add ui [Phase-N 文件]`；不自动修改。例外：总纲「规划口径说明」已写明 UI 能力被阶段边界移出（含依据）时不报。
- **输入基线可达**：提案「关联 Context 资产」中的「（输入基线）」行（`plan add source` 导入的外部文档）路径在磁盘上不存在，标 `[DESYNC]` P2，修复建议恢复该文档或更新引用路径；输入基线文档未登记进 Manifest `sources` 属正常，不报。
- **用户裁决可追溯**：Phase 文件或总纲出现「按 <日期> 用户决定 / 用户确认 / 用户选择」等表述，但对应内容在输入基线文档（或 `.context/**`、`history/context-sync.jsonl`）中查不到，标 `[AMBIGUOUS]` P1，修复建议按 `openspec/plan/add/AGENTS.md` §2.4 回写来源文档后改为引用其编号；不自动修改。
- **来源草案重复**：输入基线文档中仍保留与 Phase 文件重复的提案清单（Change ID 集合重合），标 `[DESYNC]` P2，修复建议按 `plan/add` Phase 4「来源文档去重」处理；路线图引用了来源文档的规划草案章节而非决策编号时，同样标 `[DESYNC]` P2。
- **头部不应有提案状态汇总**：总纲 Metadata 或 Phase 文件头部出现“N 条提案中 X 条已 done、Y 条 proposed”“任务状态”“阶段状态”等派生汇总文字，标 `[DEVIATION]` P2，建议删除（`roadmap-status` 不维护它们，必然过期；状态以「提案索引」为准）；不自动修改。
- 总纲不得残留形态标记标题（`【单文件形态】` / `【总纲+分Phase 形态】`）与模板的“生成规则/使用说明”块，残留标 `[DEVIATION]` P2
- `规划形态` 与 `判定依据` 的数值（提案总数、Phase 数、单 Phase 最多提案数）与实际一致；形态与 `openspec/plan/AGENTS.md` §2.0 的阈值明显不符时给出提示（不判错：用户可指定）

**结果**：
- ❌ 缺失必需节 → 警告
- ⚠️ 提案格式不完整 → 警告
- ✅ 格式正确 → 继续

---

## Phase 3: Context 内容一致性校验

### 3.1 读取 Context 资产

**执行**: `@design/context-dev/tools/asset-reader/AGENTS.md`

> 该模块会：
> - 从 `context-manifest.json` 的 `generated_files` 节点获取文件列表
> - 按 scope 遍历：architecture, domain, db, ui, legacy
> - 跳过 README.md、openspec/、source/

### 3.2 内容校验

根据读取的资产**动态校验** Roadmap 内容：

**必须校验**（若资产存在）：
| 资产 | 校验规则 |
|------|---------|
| `criterion.md` | Roadmap 规划不得违反 MUST/MUST NOT 约束 |
| `architecture/tech_stack.md` | Roadmap 中涉及的技术必须在 Tech Stack 中定义 |
| `domain/business_rules.md` | Context 中定义的核心业务规则应在 Roadmap 中有对应提案 |

**条件校验**（若资产存在）：
| 资产 | 校验规则 |
|------|---------|
| `architecture/security_policy.md` | 涉及安全的功能应有相应提案 |
| `ui/design_system.md` | 涉及 UI 的功能应有相应提案（缺失的兜底检查见 Phase 2 的 `[DESYNC]` 项） |
| `db/*.md` | 涉及数据库的功能应有相应提案 |

**示例**：
- ❌ Roadmap 规划使用 Redis，但 `tech_stack.md` 未定义
- ⚠️ `business_rules.md` 中定义了"消息去重"规则，但 Roadmap 中无对应提案
- ⚠️ `security_policy.md` 中要求"API Key 安全存储"，但 Roadmap 中未明确相关提案

---

## Phase 4: 提案关系与基础设施校验

### 4.1 依赖关系校验

| 校验项 | 校验规则 |
|--------|---------|
| 依赖声明 | 每个提案必须明确标注 `depends_on` 或声明无依赖 |
| 循环依赖 | 依赖关系图中无循环依赖 |
| 依赖可达 | 被依赖的提案必须存在于 Roadmap 中 |

### 4.2 基础设施识别校验

| 校验项 | 校验规则 |
|--------|---------|
| Phase 0/1 包含基础设施 | 若存在 `infra`, `dual-db`, `rls`, `typespec` 等提案，必须在 Phase 0/1 |
| 依赖链正确 | 功能提案不得排在其依赖的基础设施提案之前 |

**基础设施类型检查**：
| 类型 | 关键词 | 校验规则 |
|------|--------|---------|
| 数据层 | `db`, `migration`, `rls` | 所有写数据库的提案必须依赖这些 |
| 认证层 | `auth-register`, `auth-sso` | 需要用户身份的提案必须依赖认证 |
| API 契约 | `typespec`, `api-contract` | API 实现提案必须依赖契约定义 |
| 合规前置（仅当 Context 资产中存在合规前置要求） | `compliance` | 受该要求约束的提案必须依赖合规检查 |

**示例**：
 - ❌ `feat-report-export` 排在 `feat-infra-db` 之前
 - ❌ `feat-auth-register` 无依赖，但应依赖 `feat-infra-db`
 - ⚠️ 基础设施提案 `feat-infra-typespec` 不在 Phase 1

### 4.3 功能覆盖校验

| 校验项 | 校验规则 |
|--------|---------|
| PRD 功能覆盖 | `domain/` 中定义的核心功能应在 Roadmap 中有对应提案（范围限于**当前阶段**；被阶段边界移出的能力见下方「阶段边界」，不算缺失） |
| 架构组件覆盖 | `architecture/system_design.md` 中定义的组件应在 Roadmap 中有初始化提案 |

### 4.4 双向追溯与原子性

| 校验项 | 校验规则 |
|--------|----------|
| Context → Roadmap | 核心业务规则、NFR、安全要求和已知高风险必须映射到提案或明确声明不纳入原因 |
| Roadmap → Context | 每个提案必须能追溯到业务目标、架构决策、风险治理或基础设施依赖，避免无依据建设 |
| 阶段边界 | `criterion.md` / 架构约束资产中有阶段规划条款（如“未到阶段的能力不提前实现”）时：① 路线图中不得出现属于**未到阶段**的能力的提案，否则 `[CONFLICT]` P1；② 总纲「规划口径说明」应列出被移出的能力及依据，缺失标 `[MISSING]` P2；③ 无此类约束时本项不适用，不得要求路线图裁剪范围 |
| 提案原子性 | 单个提案应有单一可验收目标；跨多个独立能力时建议拆分；**预计时间 > 5 人日**的提案必须已拆分或在 `[!NOTE]` 写明不拆理由，否则标记 `[DEVIATION]` P2 |
| 阶段可交付性 | 每个 Phase 结束应形成可验证增量，不只是技术组件堆积 |
| 风险排序 | 高风险和合规前置应早于依赖它们的功能提案 |

---

## Phase 5: 生成检查报告

输出检查报告（✅/⚠️/❌），并给出最小修复建议：

```
🔍 Roadmap 检查报告
文件：openspec/proposal-roadmap.md
状态：[🟢 通过 | 🟡 需要关注 | 🔴 失败]

✅/❌ 文件存在性
   └── proposal-roadmap.md [状态]

✅/⚠️/❌ 格式正确性
   ├── 项目信息 [状态]
   ├── 规划形态 [状态]（单文件 / 总纲+分Phase）
   ├── 阶段总览 [状态]（N 个 Phase）
   ├── 各 Phase 详情 [状态]（N 个提案；分Phase 形态含 Phase 文件与索引一致性）
   └── 依赖关系图 [状态]

✅/⚠️/❌ Context 内容一致性
   ├── 技术栈 → [状态]
   ├── 约束遵守 → [状态]
   ├── 业务规则 → [状态]
   └── 安全策略 → [状态]

✅/⚠️ 提案完整性
   ├── PRD 功能覆盖 → [状态]
   ├── 架构组件覆盖 → [状态]
   └── 依赖合理性 → [状态]

📋 修复建议：
1. [具体修复建议]
2. [具体修复建议]
```
