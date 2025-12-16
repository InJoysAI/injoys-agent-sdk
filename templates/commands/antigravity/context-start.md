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
2. 规范校验（`openspec validate`）
3. 检查 SSoT 需求（根据 tech_stack.md）
4. 展示任务列表并确认
5. 按顺序执行任务（SSoT 先行）
6. 验证（测试 + openspec validate）
7. 归档（`openspec archive`）

$ARGUMENTS
