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
openspec validate <提案ID>
```

**结果**：
- ❌ 验证失败 → 停止，提示先修复提案
- ✅ 验证通过 → 继续

---

## Phase 3: 检查 SSoT 需求

读取 `.context/architecture/tech_stack.md` 判断项目 SSoT 类型：

| Tech Stack | SSoT 需求 |
|------------|----------|
| PostgreSQL | 需要 `schema/postgres.hcl` |
| REST API (Go) | 需要 `api/main.tsp` |
| Tauri/Rust | 无 SSoT 约束 |

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
# OpenSpec 验证
openspec validate <提案ID>

# 相关测试（根据项目类型）
go test ./...          # Go
npm test               # Node.js
cargo test             # Rust
```

---

## Phase 7: 归档

验证通过后，归档变更：

```bash
openspec archive <提案ID> --yes
```

---

## ✅ 完成后

```
=== 提案实施完成 ===
提案ID：<提案ID>

✅ 所有任务已完成（N/N）
✅ openspec validate 通过
✅ 测试通过
✅ 已归档

变更摘要：
- 新增：X 个文件
- 修改：Y 个文件
- 删除：Z 个文件
```
