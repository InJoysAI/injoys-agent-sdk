# injoys-agent-sdk Quick Start Guide

> This guide will help you complete the full workflow from installation to your first proposal implementation in 10 minutes.

---

## Prerequisites

- Node.js 18+
- Git
- AI coding tool (Antigravity / Claude Code / Cursor / Windsurf)

---

## Step 1: Install injoys-agent-sdk

```bash
# Run in your project root directory
curl -fsSL https://raw.githubusercontent.com/injoysai/injoys-agent-sdk/main/scripts/install.sh | bash
```

By default, the installer bootstraps only `/context-init` and `/context-check`. After you run `/context-init`, the full command set will be installed/generated (including `/context-openspec`, `/context-start`, etc.).

After installation, you'll see:
- `design/context-dev/` — Context generation framework
- `.agent/workflows/` — AI commands (Antigravity)

---

## Step 2: Initialize Context (`/context-init`)

Prepare your source documents:
- PRD (Product Requirements Document)
- Architecture design document (optional but recommended)

Execute in your AI tool:

```
/context-init
Target project: /path/to/your-project
PRD: @docs/product-overview.md
Architecture: @docs/system-architecture.md
```

**Result**:
- ✅ Creates `.context/` directory
- ✅ Archives source documents
- ✅ Generates `context-manifest.json`

---

## Step 3: Generate Context Summaries (`/context-openspec`)

```
/context-openspec
```

**AI will execute in sequence**:
1. Read PRD → Generate `.context/domain/` summaries
2. Read architecture doc → Generate `.context/architecture/` summaries
3. Fill `.context/criterion.md` (Project Criterion)
4. Initialize OpenSpec → `openspec init`
5. Generate `openspec/project.md` and `openspec/proposal-roadmap.md`

**Step-by-step execution (recommended)**:
```bash
/context-openspec domain        # Process PRD first
/context-openspec architecture  # Then architecture
/context-openspec project       # Generate project.md
/context-openspec plan          # Generate proposal-roadmap.md
```

---

## Step 4: Create Proposal (`/context-openspec proposal <change-id>`)

```
/context-openspec proposal feat-user-login
```

**AI will**:
1. Read `openspec/proposal-roadmap.md` to locate the item
2. Create `openspec/changes/feat-user-login/`
   - `proposal.md` — Scope, boundaries, acceptance criteria
   - `tasks.md` — Task checklist
   - `design.md` — Technical design (if needed)

**Review the proposal**:
```
/context-check proposal feat-user-login
```

---

## Step 5: Implement Proposal (`/context-start`)

```
/context-start feat-user-login
```

### Execution Flow

```
┌─────────────────────────────┐
│ Phase 1: Read proposal      │
│ Phase 2: openspec validate  │
│ Phase 3: Check SSoT needs   │
└─────────────────────────────┘
             ↓
┌─────────────────────────────┐
│ 📋 Tasks to execute:        │
│  1. [ ] Create user table   │
│  2. [ ] Implement login API │
│  3. [ ] Add tests           │
│ Confirm to start? (y/n)     │
└─────────────────────────────┘
             ↓ (user confirms)
┌─────────────────────────────┐
│ Phase 5: Execute tasks      │
│  - SSoT first (if needed)   │
│  - Update tasks.md on each  │
└─────────────────────────────┘
             ↓
┌─────────────────────────────┐
│ Phase 6: Verify             │
│  - openspec validate        │
│  - go test / npm test       │
└─────────────────────────────┘
             ↓
┌─────────────────────────────┐
│ Phase 7: Archive            │
│  openspec archive --yes     │
└─────────────────────────────┘
```

### SSoT-First Principle

If tasks involve database or API changes:

| SSoT Type | Modify First | Then Execute |
|-----------|--------------|--------------|
| PostgreSQL | `schema/postgres.hcl` | `atlas schema apply` |
| REST API | `api/main.tsp` | `tsp compile` → `oapi-codegen` |

### Task Status Markers

| Marker | Status |
|--------|--------|
| `[ ]` | Not started |
| `[/]` | In progress |
| `[x]` | Completed |

### Resume After Interruption

If execution is interrupted, re-run `/context-start feat-user-login`. AI will continue from the first incomplete task.

---

## Step 6: Check Status (`/context-check`)

```bash
# Check environment
/context-check env

# Check task progress
/context-check tasks feat-user-login

# Check proposal completeness
/context-check proposal feat-user-login
```

---

## Full Example: Login Module Development

```plaintext
# 1. Install (one-time)
curl -fsSL https://raw.githubusercontent.com/injoysai/injoys-agent-sdk/main/scripts/install.sh | bash

# 2. Initialize
/context-init
  → PRD: @docs/product-overview.md
  → Architecture: @docs/system-architecture.md

# 3. Generate Context
/context-openspec

# 4. Create proposal
/context-openspec proposal feat-user-login

# 5. Review (human confirms proposal.md)
# ...

# 6. Implement
/context-start feat-user-login
  → Confirm task list (y)
  → AI auto-executes:
     [x] Create user table (schema/postgres.hcl → atlas)
     [x] Implement login API (api/main.tsp → oapi-codegen)
     [x] Add tests
  → Verification passed
  → Auto-archived

# 7. Done!
```

---

## FAQ

### Q: OpenSpec not installed?
```bash
npm install -g @fission-ai/openspec@latest
```

### Q: `.context/` doesn't exist?
Run `/context-init` first.

### Q: Task execution was interrupted?
Re-run `/context-start <proposalId>` to resume from checkpoint.

### Q: How to update Context?
```bash
/context-update modify domain   # Regenerate domain summaries
/context-update add @docs/new-spec.md  # Add new document
```

---
