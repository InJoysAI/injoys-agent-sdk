# Proposal Check 指令

> 当 `/context-check proposal <change-id>` 被调用时执行此文件。

---

## 🎯 执行指令

> ⛔ **必须依次执行所有步骤**，不得跳过或中断。

---

## Phase 0: Artifact 状态（下一步指引）

输出该变更当前工件状态（用于提示下一步应该写哪个 artifact）：

```bash
node design/context-dev/tools/specflow/specflow.mjs status <change-id>
```

> 若 `Ready` 不是 `none`：在报告中明确提示“下一步建议先完成 Ready artifact”。

---

## Phase 1: 文件完整性校验

检查 `openspec/changes/<change-id>/` 目录：

| 文件 | 必需 | 说明 |
|------|:----:|------|
| `proposal.md` | ✅ | 范围/边界/验收标准 |
| `tasks.md` | ✅ | 可执行任务清单 |
| `design.md` | ⚠️ | 复杂变更需要 |
| `specs/<capability>/spec.md` | ✅ | 至少一个 delta |

**结果**：
- ❌ 缺失必需文件 → 失败，列出缺失文件
- ✅ 所有必需文件存在 → 继续

---

## Phase 2: Roadmap 对齐核对（强制）

> ⛔ **必须核对** `openspec/proposal-roadmap.md` 中对应 `<change-id>` 的提案大纲条目，不能只做 Context 资产检查。

### 2.1 提取 roadmap 主条目

从 `openspec/proposal-roadmap.md` 中按 `Change ID: <change-id>` 精确定位条目并提取。

**核心必提取字段（必须）**：
- `business_goal`
- `in_scope` / `out_of_scope`
- `dependencies`
- `acceptance_criteria`
- `key_tasks`
- `risks`

**扩展建议提取字段（若条目存在）**：
- `milestones`
- `coverage_scope`
- `gate_vs_non_gate`
- `change_management`
- `ops_support`
- `kpi`
- `risk_acceptance_policy`

**结果**：
- ❌ 未找到 `<change-id>` 对应条目 → 失败（提示先更新 roadmap 或确认 change-id）
- ✅ 找到条目 → 继续

### 2.2 核对 proposal/tasks/spec 覆盖性

对照 `openspec/changes/<change-id>/` 中工件进行分级核对：

**核心核对（必须通过）**：
1. `proposal.md` 是否覆盖 `business_goal`、`in_scope/out_of_scope`、`dependencies`、`risks`
2. `tasks.md` 是否覆盖 `key_tasks`（可拆分细化，但不得缺失核心任务）
3. `specs/*/spec.md` 的 Scenario 是否覆盖 `acceptance_criteria` 核心验收点

**扩展核对（建议通过）**：
1. `proposal.md`/`tasks.md` 是否体现 `milestones` 与 `coverage_scope`
2. `proposal.md` 是否体现 `gate_vs_non_gate` 与 `change_management`
3. `tasks.md` 是否体现 `ops_support`（例如 CI/日志/运维处置项）
4. 提案文档是否体现 `kpi`（至少有记录或追踪方式）
5. 若 roadmap 条目包含 `risk_acceptance_policy`，提案是否有对应处理说明

**结果**：
- ❌ 任一“核心核对”项缺失或明显偏离 roadmap 条目 → 失败
- ⚠️ “核心核对”通过，但“扩展核对”存在缺失或偏差 → 需要关注
- ✅ 已对齐 → 继续

---

## Phase 3: OpenSpec 规范校验

```bash
node design/context-dev/tools/specflow/specflow.mjs validate <change-id> --strict
```

**结果**：
- ❌ 验证失败 → 失败，输出错误信息
- ✅ 验证通过 → 继续

---

## Phase 4: Context 引用一致性

检查 `proposal.md` 中声明的 Context 引用：

**必读文件**（`proposal.md` 必须引用）：
- `.context/criterion.md` — 项目约束
- `.context/architecture/tech_stack.md` — 技术约束
- `openspec/config.yaml` — 项目概况

**检查方法**：
1. 读取 `proposal.md`
2. 检查 "Context References" 或类似部分
3. 验证必读文件是否被引用

**声明依赖检查**：若 `proposal.md` 声明依赖其他 `.context/**` 文件：
- 文件必须存在
- 路径必须正确

**结果**：
- ❌ 必读文件未引用 → 警告
- ⚠️ 声明的依赖文件不存在 → 警告
- ✅ 所有引用正确 → 继续

---

## Phase 5: Context 内容一致性校验

> ⛔ **必须执行此步骤**，不得跳过。

### 5.1 读取 Context 资产

**执行**: `@design/context-dev/tools/asset-reader/AGENTS.md`

> 该模块会：
> - 从 `context-manifest.json` 的 `generated_files` 节点获取文件列表
> - 按 scope 遍历：architecture, domain, db, ui, legacy
> - 跳过 README.md、openspec/、source/

### 5.2 内容校验

根据 `asset-reader` 读取的资产**动态校验**提案内容：

**必须校验**（若资产存在）：
| 资产 | 校验规则 |
|------|---------|
| `criterion.md` | 提案不得违反 MUST/MUST NOT 约束 |
| `architecture/tech_stack.md` | 提案使用的技术必须在 Tech Stack 中定义 |
| `domain/business_rules.md` | 相关业务规则必须在 specs 中有对应 Scenario |

**条件校验**（若资产存在且提案涉及相关内容）：
| 资产 | 触发条件 | 校验规则 |
|------|---------|---------|
| `architecture/security_policy.md` | 涉及认证、存储、API | 必须符合安全策略 |
| `ui/design_spec.md` | 涉及 UI 变更 | 必须引用设计规范 |
| `db/*.md` | 涉及数据库变更 | 必须符合数据规范 |

**校验方法**：
1. 遍历 `asset-reader` 读取的所有资产
2. 提取每个资产中的约束规则
3. 检查提案是否违反任何规则

**示例**：
- ❌ 提案使用 MongoDB，但 `tech_stack.md` 只允许 PostgreSQL
- ❌ 提案直接调用第三方 API，但 `criterion.md` 要求通过 Proxy
- ⚠️ 提案涉及消息去重，但未包含相关业务规则的 Scenario

---

## Phase 6: SSoT 先行任务检查

**动态读取**：从 `.context/criterion.md` Section 2（三维约束体系）获取已启用的 SSoT 层和工具，从 Section 7（SSoT 文件路径）获取各层的实际文件路径：

1. 读取 `.context/criterion.md` Section 2 确定已启用的 SSoT 层（数据层/API 层/IPC 层/共享层）
2. 读取 `.context/criterion.md` Section 7 获取各层的实际文件路径
3. 验证任务顺序：SSoT 变更任务必须排在业务代码任务之前

| criterion.md 中的 SSoT 层 | `tasks.md` 必须包含 |
|---------------------------|-------------------|
| 数据层（已配置路径） | 该路径下的迁移/Schema 变更任务 |
| API 层（已配置路径） | 该路径下的契约修改 + Codegen 执行任务 |
| IPC 层（已配置路径） | 该路径下的 IPC SSoT 修改 + Codegen 执行任务 |
| 所有项目 | 测试 + 归档任务（`specflow validate --strict` + `specflow archive --yes`） |

> ⚠️ 若 criterion.md 未配置任何 SSoT 层，则仅检查测试和归档任务。

**检查方法**：
1. 根据 criterion.md 中实际配置的 SSoT 工具和路径确定需要检查的任务
2. 在 `tasks.md` 中搜索相关任务（不硬编码工具名，从 criterion.md 读取）
3. 验证任务顺序是否正确（SSoT 先行）

---

## Phase 7: 生成检查报告

输出检查报告（✅/⚠️/❌），并给出最小修复建议：

```
🔍 提案检查报告
提案ID：<change-id>
状态：[🟢 通过 | 🟡 需要关注 | 🔴 失败]

📌 Artifact 状态
   └── node design/context-dev/tools/specflow/specflow.mjs status <change-id> → Ready: <proposal|specs|tasks|none>

✅/⚠️/❌ 文件完整性
   ├── proposal.md [状态]
   ├── tasks.md [状态]
   ├── design.md [状态]
   └── specs/ [状态]

✅/⚠️/❌ Roadmap 对齐（openspec/proposal-roadmap.md）
   ├── change-id 条目存在性 → [状态]
   ├── 核心字段提取（business_goal/in_scope/out_of_scope/dependencies/acceptance_criteria/key_tasks/risks）→ [状态]
   ├── 核心核对：proposal 覆盖目标/范围/依赖/风险 → [状态]
   ├── 核心核对：tasks 覆盖 key_tasks → [状态]
   ├── 核心核对：specs Scenario 覆盖 acceptance_criteria → [状态]
   └── 扩展核对（milestones/coverage_scope/gate_vs_non_gate/change_management/ops_support/kpi/risk_acceptance_policy）→ [状态]

✅/❌ OpenSpec 验证
   └── node design/context-dev/tools/specflow/specflow.mjs validate <change-id> --strict → [结果]

✅/⚠️/❌ Context 引用
   ├── criterion.md → [状态]
   ├── tech_stack.md → [状态]
   └── config.yaml → [状态]

✅/⚠️/❌ Context 内容一致性
   ├── 技术栈 → [状态]
   ├── 约束遵守 → [状态]
   ├── 业务规则 → [状态]
   └── 安全策略 → [状态]

✅/⚠️ SSoT 先行任务
   └── [SSoT 类型] → [状态]

📋 修复建议：
1. [具体修复建议]
2. [具体修复建议]
```
