---
description: Initialize project Context (archive sources + skeleton)
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

3. Optional helper (hash + manifest hint):
```bash
./design/context-dev/scripts/context-gen.sh -i
```

Note: Context summarization + OpenSpec initialization/enhancement is handled by `/context-openspec`.
