# Context Start 指令

> 当 `/context-start <提案ID>` 被调用时执行此文件。

---

## 🎯 执行指令

> ⛔ **必须依次执行所有步骤**，不得跳过或中断。

> ⛔ **中断恢复规则**：执行前必须先检查 `tasks.md` 中的任务状态：
> - 若存在 `[x]` 或 `[/]` 标记 → 从第一个 `[ ]` 或 `[/]` 任务继续
> - 若全部为 `[ ]` → 从头开始执行

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

读取以下文件：

| 文件 | 必需 | 说明 |
|------|:----:|------|
| `proposal.md` | ✅ | 范围、边界、验收标准（**必须持续参考**） |
| `tasks.md` | ✅ | 任务清单 |
| `design.md` | ⚠️ | 技术设计（若存在，**必须持续参考**） |
| `specs/` | ⚠️ | Spec deltas（若存在） |

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

> ⛔ **每个任务前你必须再次阅读 proposal.md 和 design.md**

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
- 若 API 契约相关提案中未检出 generated artifacts 使用 → 视为未完成，回到 Phase 5 修复

---

## Phase 7: 归档

验证通过后，归档变更：

```bash
node design/context-dev/tools/specflow/specflow.mjs archive <提案ID> --yes
```

---

## ✅ 完成后

```
=== 提案实施完成 ===
提案ID：<提案ID>

✅ 所有任务已完成（N/N）
✅ node design/context-dev/tools/specflow/specflow.mjs validate <提案ID> --strict 通过
✅ 测试通过
✅ 已归档

变更摘要：
- 新增：X 个文件
- 修改：Y 个文件
- 删除：Z 个文件
```
