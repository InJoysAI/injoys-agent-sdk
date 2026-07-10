---
description: Implement an OpenSpec change (validate → SSoT → code → test → archive)
---

# Context Start

实施 OpenSpec 变更提案。

**用法**：
```bash
/context-start <提案ID>
```

---

## Pre-flight Checklist

| 检查项 | 通过条件 |
|--------|---------|
| 提案ID | 用户提供或从 `openspec/changes/` 选择 |
| 提案目录 | `openspec/changes/<提案ID>/` 存在 |
| proposal.md | 存在 |
| tasks.md | 存在 |

---

## Execute

**Execute**: `@design/context-dev/start/AGENTS.md`

> 传递 `$ARGUMENTS`：`<提案ID>`

**详细步骤**见 `start/AGENTS.md`，包括：
1. 读取并记住提案内容（proposal.md, design.md）
2. 规范校验（`node design/context-dev/tools/specflow/specflow.mjs validate <提案ID> --strict`）
3. 检查 SSoT 需求（根据 tech_stack.md）
4. 展示任务列表并确认
5. 按顺序执行任务（SSoT 先行）
6. 验证（测试 + `node design/context-dev/tools/specflow/specflow.mjs validate <提案ID> --strict`）
7. 自动生成动态核查 Prompt（根据实际变更填充验收证据、SSoT、边界与风险，无需用户请求）
8. 归档（最终校验和动态核查已通过后，执行 `node design/context-dev/tools/specflow/specflow.mjs archive <提案ID> --yes --no-validate`）

$ARGUMENTS
