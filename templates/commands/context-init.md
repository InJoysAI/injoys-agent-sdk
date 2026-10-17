---
description: Initialize project Context (archive sources + skeleton)
---

# Context Initialization (delegated, archive-only)

## 协作协议（先执行）

先读 `@design/context-dev/tools/collab/AGENTS.md`，然后：第一行输出身份行（本命令角色：**生成**）→ 读花名册与待确认台账，处理发给自己的 `open` 记录 → 再执行下面的主任务 → 结束报告末尾追加「待确认」。

## Prerequisites
- Target project path, PRD, and Architecture docs ready

## Execution Steps

1. Read and execute the canonical workflow instructions:
   - `@design/context-dev/AGENTS.md`

2. Provide required inputs when prompted:
   - Target project path
   - PRD document path
   - Architecture document path

3. Optional helper (hash + manifest hint):
```bash
./design/context-dev/scripts/context-gen.sh -i
```

4. Optional final step — multi-AI collaboration setup（可选）：
   - 询问用户是否要配置多 AI 工具协作（花名册与待确认台账）；选“是”则按 `@design/context-dev/tools/collab/AGENTS.md` 的 **§7 初始化** 执行（与 `.agent/workflows/context-collab.md setup` 是同一份流程）；选“否”则跳过，之后可随时运行 `.agent/workflows/context-collab.md setup`。
   - 该步骤只写 `.context/collab/team.md` 与 `.context/history/open-questions.md`，不登记到 Manifest。

Note: Context summarization + Specflow setup (creating `openspec/` directories + generating config/roadmap/proposals) is handled by `.agent/workflows/context-openspec.md`.
