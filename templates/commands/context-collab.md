---
description: Set up multi-AI collaboration (team roster for Codex / Claude Code / Cursor … and the open-questions ledger)
---

# Context Collab

交互式配置多 AI 工具协作：根据本机实际环境，确定**哪些 AI 工具参与、各角色由谁负责**，生成花名册 `.context/collab/team.md` 并确保待确认台账存在。

**用法**：
```bash
.agent/workflows/context-collab.md setup     # 初始化或重新配置（默认）
.agent/workflows/context-collab.md show      # 只读：显示花名册与台账中 open 的事项
```

---

## Execute

**Execute**: `@design/context-dev/tools/collab/AGENTS.md`，按其中 **§7 初始化（setup）** 执行；`show` 仅输出花名册和 open 记录，不修改任何文件。

> 本命令角色：**生成**（仅可写 `.context/collab/`、`.context/history/open-questions.md`）。

$ARGUMENTS
