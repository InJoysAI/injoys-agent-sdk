# Context Start 指令

> 当 `/context-start <提案ID>` 被调用时执行此文件。

---

## 🎯 执行指令

> ⛔ **必须依次执行所有步骤**，不得跳过或中断。

> ⛔ **中断恢复规则**：执行前必须先检查 `openspec/changes/<提案ID>/tasks.md` 中的任务状态：
> - 若存在 `[x]` 或 `[/]` 标记 → **重新执行 Phase 0–3**（幂等读取，确保约束加载），**跳过 Phase 4**，从第一个 `[ ]` 或 `[/]` 任务直接进入 Phase 5
> - 若全部为 `[ ]` → 从头开始执行（Phase 0 起）

---

## Phase 0: 读取项目约束

> ⛔ **必须首先读取以下文件**，确保实施不违反项目约束

| 文件 | 必需 | 说明 |
|------|:----:|------|
| `.context/criterion.md` | ✅ | 项目准则 — MUST/MUST NOT 约束 |
| `.context/openspec/integration.md` | ✅ | Context 读取规范 — 如何使用 Context 资产 |

> ⚠️ **在整个实施过程中，必须遵守 criterion.md 中的约束**

---

## Phase 1: 读取并记住提案内容

> ⛔ **在整个实施过程中，你必须始终遵循 proposal.md 和 design.md 的约定**

读取以下文件（路径均相对项目根目录）：

| 文件 | 必需 | 说明 |
|------|:----:|------|
| `openspec/changes/<提案ID>/proposal.md` | ✅ | 范围、边界、验收标准（**必须持续参考**） |
| `openspec/changes/<提案ID>/tasks.md` | ✅ | 任务清单 |
| `openspec/changes/<提案ID>/design.md` | ⚠️ | 技术设计（若存在，**必须持续参考**） |
| `openspec/changes/<提案ID>/specs/` | ⚠️ | Spec deltas（若存在） |

---

## Phase 2: 规范校验

```bash
node design/context-dev/tools/specflow/specflow.mjs validate <提案ID> --strict
```

**结果**：
- ❌ 验证失败 → 停止，提示先修复提案
- ✅ 验证通过 → 继续

---

## Phase 3: 检查 SSoT 需求

**动态读取**：从 `.context/criterion.md` Section 2（三维约束体系）和 Section 7（SSoT 文件路径）获取已启用的 SSoT 层：

1. 读取 `.context/criterion.md` Section 2 确定已启用的 SSoT 层
2. 读取 Section 7 获取各层的实际文件路径
3. 对每个已启用层，确认对应 SSoT 文件存在

| criterion.md 中的 SSoT 层 | SSoT-first 执行顺序 |
|---------------------------|-------------------|
| 数据层（已配置路径） | 创建迁移/Schema 变更 |
| 共享层（已配置路径） | 修改 `SSoT/shared/` 共享模型 |
| API 层（已配置路径） | 修改 API 契约 → Codegen |
| IPC 层（已配置路径） | 修改 IPC SSoT → Codegen |

> ⚠️ 若 criterion.md 未配置任何 SSoT 层，则跳过 SSoT-first 步骤，直接进入业务代码。

**输出识别结果**（必须向用户报告）：

```
🏗️ SSoT 层识别结果：
  - 数据层：[已启用，路径: xxx] 或 [未配置]
  - 共享层：[已启用，路径: xxx] 或 [未配置]
  - API 层：[已启用，路径: xxx] 或 [未配置]
  - IPC 层：[已启用，路径: xxx] 或 [未配置]
```

---

## Phase 4: 展示任务列表并确认

展示 `tasks.md` 中的任务列表，等待用户确认：

```
📋 即将执行以下任务：
  1. [ ] 任务A
  2. [ ] 任务B
  3. [ ] 任务C

确认开始？(y/n)
```

**若用户取消** → 停止执行

---

## Phase 5: 按顺序执行任务

> ⛔ **每个任务前你必须再次阅读 `openspec/changes/<提案ID>/proposal.md` 和 `openspec/changes/<提案ID>/design.md`**

### 5.1 执行规则

- 按 `tasks.md` 中的顺序执行
- 若涉及 SSoT → 先改 SSoT 文件 → Codegen → 业务代码
- 若涉及 API 契约（如 `SSoT/api/main.tsp`）→ **必须优先使用 SSoT 代码生成产物**
  - 服务端接口层（controller/handler/route）与服务层应优先消费 generated types/models
  - 禁止在业务代码中重复手写与契约等价的 DTO（除非有明确注释说明“非契约扩展字段”）
  - 具体生成目录与接入位置按项目技术栈确定（例如 TS/Go/Rust 等）
- 确保代码符合 `proposal.md` 中的验收标准

### 5.2 任务状态更新

每完成一个任务，更新 `tasks.md` 状态：

| 标记 | 状态 |
|------|------|
| `[ ]` | 待开始 |
| `[/]` | 进行中 |
| `[x]` | 已完成 |

---

## Phase 6: 验证

所有任务完成后执行验证：

```bash
# Specflow 验证
node design/context-dev/tools/specflow/specflow.mjs validate <提案ID> --strict

# SSoT 生成产物使用检查（API 契约相关提案必须执行）
# 目标：确保接口层/服务层已消费 generated artifacts，而非手写重复 DTO
# 注：检查命令与路径按项目语言和目录结构调整（不限 TypeScript）

# 相关测试（根据项目类型）
go test ./...          # Go
npm test               # Node.js
cargo test             # Rust
```

**结果**：
- ❌ 若 API 契约相关提案中未检出 generated artifacts 使用 → 视为未完成，回到 Phase 5 修复
- ❌ 若测试失败 → 修复后重新执行本 Phase
- ✅ 全部通过 → 继续 Phase 7

---

## Phase 7: 动态生成核查 Prompt

> ⛔ **必须在 Phase 6 验证全部通过后执行**。
> ⛔ **输出的 Prompt 必须是针对本提案完全填充的专属内容，不得出现任何 `<...>` 占位符或模板文字**。

### 7.1 执行前数据汇总（读取顺序）

在生成 Prompt 前，AI 必须依次读取以下文件并提取数据：

| 步骤 | 读取来源 | 提取内容 | 用途 |
|------|----------|----------|------|
| ① | `openspec/changes/<提案ID>/proposal.md` | `# Change:` 标题行 | 填入"提案标题" |
| ② | `openspec/changes/<提案ID>/proposal.md` → `### 验收标准` | 每条 `✅` 验收项 | 填入"验收标准完成矩阵"逐行 |
| ③ | `openspec/changes/<提案ID>/proposal.md` → `### 涉及的代码` | 新增/修改文件列表 | 填入"变更摘要" |
| ④ | `openspec/changes/<提案ID>/proposal.md` → `### 风险与注意事项` | 风险条目 | 填入"层 3 — 风险核查" |
| ⑤ | `openspec/changes/<提案ID>/tasks.md` | 所有任务项及其 `[x]/[ ]` 状态 | **若存在任何非 `[x]` 项 → 停止，提示先完成所有任务** |
| ⑥ | Phase 5 实施过程中实际操作的文件 | 本次新增/修改的完整文件列表 | 补充③未覆盖的实际操作文件 |

### 7.2 Prompt 输出格式

完成数据汇总后，AI 输出以下格式的**完全填充 Prompt**（以 markdown 代码块包裹，便于用户复制）：

~~~markdown
```
# 提案核查：<实际提案ID>
**提案标题**：<proposal.md 第一行 # Change: 后的实际标题>

---

## 变更摘要

### 新增文件
- `路径/文件名` — 说明这个文件的作用

### 修改文件
- `路径/文件名` — 说明关键变更内容

---

## 验收标准完成矩阵

| 验收项（原文） | 实际执行 | 结论 |
|----------------|----------|------|
| <proposal.md 验收项 1 原文> | <实际执行的命令或操作，含输出结果摘要> | ✅ |
| <proposal.md 验收项 2 原文> | <实际执行的命令或操作> | ✅ |
| （每条 proposal.md 验收项均列出） | ... | ... |

---

## 核查指令

请对 `<实际提案ID>` 提案的完成质量进行三层核查：

**层 1 — SSoT 完整性**（⚠️ 仅当本提案涉及 SSoT 时输出此层，否则删除整个层 1 块）
- 请确认 `<proposal.md 中涉及的 SSoT 文件实际路径>` 的变更内容是否与 `.context/criterion.md` §2 的数据层约束一致
- 请确认未绕过 SSoT 直接修改业务代码

**层 2 — 验收标准可复现性**
- 请对上方矩阵中每条 ✅ 项提问：其验证过程是否有可复现的执行证据（命令输出/日志/截图）？
- 如有 ❌ 项，列出具体缺陷

**层 3 — 边界与风险合规**
- 请确认本次实施未超出 proposal.md 的 In/Out 边界
- 请确认 proposal.md 中列出的风险，在 tasks.md 中均有对应缓解任务且标记为 `[x]`

请输出：【核查通过】或【核查不通过 — 缺陷列表：...】
```

### 7.3 输出质量检查（生成后自检）

AI 在输出 Prompt 前必须完成以下自检，确认**全部通过**再输出：

- [ ] 提案 ID 和标题是实际值，非占位符
- [ ] 验收矩阵行数 = `proposal.md` 中 `✅` 验收项数量，无遗漏
- [ ] 每条验收矩阵行的"实际执行"列包含本次实施中真实运行的命令或操作描述
- [ ] 变更摘要中的文件列表来自本次实际操作，非 proposal.md 预估列表
- [ ] 层 1 核查：若本提案涉及 SSoT，确认已输出且 SSoT 文件路径为 proposal.md `### 涉及的代码` 中的实际路径；若不涉及 SSoT，确认层 1 已整体删除
- [ ] 层 3 核查中已逐条列出 proposal.md `### 风险与注意事项` 中的全部风险条目
- [ ] Prompt 全文无任何 `<...>` 占位符、模板文字、`示例`、`请填入` 等提示性文字
- [ ] Prompt 全文无伪占位符（所有 ID、路径均为本次提案的真实值）

> ⏸️ **等待用户确认**：将上方 Prompt 复制至新对话进行核查，收到用户【核查通过】后继续 Phase 8。
> ⛔ **未收到用户【核查通过】确认前不得继续执行**。

---

## Phase 8: 归档

> ⛔ **必须在用户确认【核查通过】后方可执行**。
> 归档由用户执行；AI 提供命令，用户确认后运行。

```bash
node design/context-dev/tools/specflow/specflow.mjs archive <提案ID> --yes
```

**结果**：
- ❌ 归档失败 → 检查 specflow 错误输出，修复后重试
- ✅ 归档成功 → 继续"✅ 完成后"汇报

---

## ✅ 完成后

```
=== 提案实施完成 ===
提案ID：<提案ID>

✅ 所有任务已完成（N/N）
✅ node design/context-dev/tools/specflow/specflow.mjs validate <提案ID> --strict 通过
✅ 测试通过
✅ 核查 Prompt 已输出（见上方 Phase 7），用户确认【核查通过】
✅ 已归档（Phase 8）

变更摘要：
- 新增：X 个文件
- 修改：Y 个文件
- 删除：Z 个文件
```
