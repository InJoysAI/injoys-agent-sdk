---
description: Initialize project Context (move/copy sources + skeleton)
---

# Context Initialization (delegated, archive-only)

## Prerequisites
- Target project path, PRD, and Architecture docs ready

## Execution Steps

1. Read and execute the canonical workflow instructions:
   - `@design/context-dev/AGENTS.md`

2. Provide required inputs when prompted:
   - Target project path
   - PRD document path
   - Architecture document path
   - Source handling: **move (mv, recommended) or copy** — you will be asked; move keeps a single copy under `.context/*/source/` so you never maintain duplicate PRD/TAD/UI/DB docs

3. Optional helper (hash + manifest hint):
```bash
./design/context-dev/scripts/context-gen.sh -i
```

Note: Context summarization + Specflow setup (creating `openspec/` directories + generating config/roadmap/proposals) is handled by `.agents/workflows/context-openspec.md`.
