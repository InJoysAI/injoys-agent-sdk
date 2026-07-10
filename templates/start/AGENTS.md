# Context Start 指令

> 当 `/context-start <提案ID>` 被调用时执行此文件。

---

## 🧠 编码核心准则

> ⛔ **在执行任何编码任务前及过程中，AI 必须始终在底层严格遵循以下四大核心原则：**

1. **Think Before Coding（编码前先思考）**
   - 明确陈述你的假设。如果不确定，主动提问。
   - 如果存在多种理解方式，明确列出它们，不要默默做出选择。
   - 如果有更简单的方法，主动提出来，在必要时推回（Push back）不合理的要求。
   - 遇到困惑立刻停止，明确指出哪里不清楚并提问。

2. **Simplicity First（简单优先）**
   - **用最少的代码解决问题**。绝不进行推测性开发。
   - 坚决不增加未被要求的“灵活性”、功能或过度抽象。
   - 不为一次性代码建立抽象，不处理不可能发生场景的错误。
   - 始终反思：“资深工程师会认为这太复杂了吗？”如果是，立刻简化。

3. **Surgical Changes（外科手术式修改）**
   - **精准修改，只动必须动的地方**。
   - 绝不“顺手改进”附近的代码、注释或格式，不重构没有坏的代码。
   - 严格保持现有代码风格。发现不相关的无用代码可以指出，但**不要删除**。
   - 只有当你自己的修改导致了代码孤儿（无用导入/变量）时，才负责清理。每一行变更都必须能直接追溯到任务要求。

4. **Goal-Driven Execution（目标驱动执行）**
   - 定义可验证的成功标准。把任务转换成“验证驱动”的目标。
   - 多步骤任务必须先陈述简短计划（如 `1. [步骤] → 验证: [检查]`）。
   - 让强测试和明确的验证条件驱动你的执行循环。

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

> ⛔ **必须在 Phase 6 验证全部通过后自动执行，不需要用户显式请求**。
> 必须根据本次实际新增、修改、删除内容生成针对当前提案的专属核查 Prompt，不得保留任何 `<...>` 占位符或模板文字。
> 本 Phase 只生成核查 Prompt，不重复执行 Specflow、测试或文档校验。

### 7.1 执行前数据汇总

按顺序读取并提取：

| 步骤 | 读取来源 | 提取内容 | 用途 |
|------|----------|----------|------|
| ① | `openspec/changes/<提案ID>/proposal.md` | `# Change:` 标题 | 提案标题 |
| ② | `proposal.md` → 验收标准章节 | 每条验收项原文 | 验收标准完成矩阵 |
| ③ | `proposal.md` → 涉及代码章节 | 预期新增/修改文件 | 与实际变更对照 |
| ④ | `proposal.md` → 风险与注意事项章节 | 全部风险条目 | 边界与风险核查 |
| ⑤ | `openspec/changes/<提案ID>/tasks.md` | 所有 checkbox 及状态 | 存在非 `[x]` 实施任务时停止生成 |
| ⑥ | Phase 5 的实际文件变更 | 实际新增、修改、删除文件 | 生成真实变更摘要 |
| ⑦ | Phase 6 的命令与结果 | validate、测试、codegen/SSoT 检查证据 | 验收项可复现证据 |

### 7.2 动态生成核查 Prompt

输出以下结构的**完全填充版本**，供用户在独立核查对话中执行：

~~~markdown
```
# 提案核查：<实际提案ID>
**提案标题**：<实际标题>

## 变更摘要

### 新增文件
- `<实际路径>` — <实际用途>

### 修改文件
- `<实际路径>` — <实际变更>

### 删除文件
- `<实际路径>` — <删除原因；无删除则写“无”>

## 验收标准完成矩阵

| 验收项（proposal.md 原文） | 实际执行及证据 | 结论 |
|----------------------------|----------------|------|
| <实际验收项> | <真实命令/操作及结果摘要> | ✅/❌ |

## 核查指令

请对 `<实际提案ID>` 的完成质量进行三层核查：

### 层 1：SSoT 完整性
<仅当提案涉及 SSoT 时保留本层，否则删除>
- 核对 `<实际 SSoT 路径>` 与 `.context/criterion.md` 中对应层约束的一致性。
- 确认业务实现消费生成产物，未绕过 SSoT 手写重复 Schema、DTO 或契约。

### 层 2：验收标准可复现性
- 逐条核对验收矩阵中的证据是否真实、完整且可复现。
- 核对 `tasks.md` 的完成状态与实际文件、测试结果是否一致。
- 缺少证据或验证失败的项目必须列为缺陷，不得仅依据 `[x]` 判定通过。

### 层 3：边界与风险合规
- 核对实际变更是否超出 proposal.md 的 In/Out 边界。
- 核对 proposal.md 的每条风险是否有已完成的缓解任务或验证证据。
- 核对实际变更是否违反 `.context/criterion.md` 的相关 MUST/MUST NOT。

请输出：【核查通过】或【核查不通过：缺陷列表】。每条缺陷必须包含文件路径、证据、影响和修复建议。
```
~~~

### 7.3 Prompt 输出质量检查

- [ ] 提案 ID、标题、文件路径均为实际值
- [ ] 验收矩阵逐条覆盖 proposal.md 的全部验收项
- [ ] 每条验收项包含 Phase 6 的真实执行证据，不使用预期结果代替
- [ ] 变更摘要来自实际工作区变更，不照抄 proposal.md 的预估列表
- [ ] SSoT 层仅在提案实际涉及时保留，且路径为真实路径
- [ ] 风险核查逐条覆盖 proposal.md 的全部风险
- [ ] Prompt 中不存在 `<...>`、示例值、伪路径或待填字段

输出 Prompt 后，等待用户在独立核查对话中返回【核查通过】再归档；若核查不通过，回到 Phase 5 修复并重新执行 Phase 6，然后重新生成 Prompt。

---

## Phase 8: 归档

> ⛔ **必须在 Phase 6 最终校验和测试通过、Phase 7 Prompt 已输出且用户返回【核查通过】后方可执行**。
> 已完成最终校验，因此归档使用 `--no-validate` 避免重复解析同一份文档。

```bash
node design/context-dev/tools/specflow/specflow.mjs archive <提案ID> --yes --no-validate
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
✅ 动态核查 Prompt 已根据实际变更生成，用户确认【核查通过】
✅ 已归档（Phase 8）

变更摘要：
- 新增：X 个文件
- 修改：Y 个文件
- 删除：Z 个文件
```
