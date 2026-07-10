# injoys-agent-sdk Quick Start Guide

> This guide will help you complete the full workflow from installation to your first proposal implementation in 10 minutes.

---

## Prerequisites

- Node.js 18+
- Git
- AI coding tool (Antigravity / Claude Code / Cursor / Devin / Codex / Qoder)

---

## Step 1: Install injoys-agent-sdk

### Method 1: NPX

```bash
npx @injoysai/agent-sdk init
```

### Method 2: One-Click Install

```bash
# Run in your project root directory
curl -fsSL https://raw.githubusercontent.com/injoysai/injoys-agent-sdk/main/scripts/install.sh | bash
```

By default, the installer bootstraps only `/context-init` and `/context-check`. After you run `/context-init`, the full command set will be installed/generated (including `/context-openspec`, `/context-start`, etc.).

After installation, you'll see:
- `design/context-dev/` — Context generation framework
- AI tool command/workflow directories for your supported editor or agent

---

## Step 2: Initialize Context (`/context-init`)

Prepare your source documents:
- PRD (Product Requirements Document)
- Architecture design document (required; it is the authoritative input for technical constraints)

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
- ✅ Generates `.context/criterion.md` as the engineering-constraint source of truth
- ✅ Installs the full shared `/context-*` command set for the selected AI tools

---

## Step 3: Generate Context Summaries (`/context-openspec`)

```
/context-openspec
```

**AI will execute in sequence**:
1. Read PRD → Generate `.context/domain/` summaries
2. Read architecture doc → Generate `.context/architecture/` summaries
3. Fill `.context/criterion.md` (Project Criterion)
4. Ensure `.context/openspec/integration.md` and the Context asset index are synchronized
5. Generate the derived `openspec/config.yaml` snapshot and `openspec/proposal-roadmap.md`

`openspec/config.yaml` is generated from authoritative `.context/` assets. Do not maintain it manually; regenerate it with `/context-openspec project` when its source fingerprint changes.

**Step-by-step execution (recommended)**:
```bash
/context-openspec domain        # Process PRD first
/context-openspec architecture  # Then architecture
/context-openspec project       # Generate the derived config.yaml snapshot
/context-openspec plan          # Generate proposal-roadmap.md
```

---

## Step 4: Create Proposal (`/context-openspec proposal <change-id> [roadmap-doc]`)

```
/context-openspec proposal feat-user-login
```

**AI will**:
1. Read `openspec/proposal-roadmap.md` to locate the item
2. Optionally read the supplemental `roadmap-doc` to enrich the proposal scope or outline
3. Create `openspec/changes/feat-user-login/`
   - `proposal.md` — Scope, boundaries, acceptance criteria
   - `tasks.md` — Task checklist
   - `design.md` — Technical design (if needed)
4. Run strict Specflow validation
5. Automatically generate a fully populated three-layer review prompt covering Outline ↔ Context, Outline ↔ Proposal, and Proposal ↔ Context

Run the generated prompt in a separate review conversation. For a shorter structural check, you can also run:
```
/context-check proposal feat-user-login
```

**Optional refinement**:
```
/context-interview
Topic: business rules for user authentication
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
│ Phase 7: Generate dynamic   │
│ review prompt automatically │
└─────────────────────────────┘
             ↓
┌─────────────────────────────┐
│ Phase 8: Archive            │
│  specflow archive           │
│  --yes --no-validate        │
└─────────────────────────────┘
```

### SSoT-First Principle

If tasks involve database or API changes:

| SSoT Type | Modify First | Then Execute |
|-----------|--------------|--------------|
| PostgreSQL | `SSoT/schema/migrations/` | Apply the project Goose migration workflow |
| REST API | `SSoT/api/main.tsp` | `tsp compile` → project code generation |

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

# Check the generated OpenSpec project snapshot
/context-check project

# Check roadmap coverage, sequencing, and dependencies
/context-check plan
```

### Reusable Document Reviews

These document reviews are optional, read-only diagnostics for Context assets. They are separate from the implementation-specific dynamic review prompt that `/context-start` always generates in Phase 7.

```bash
# PRD ↔ architecture bidirectional traceability
/context-check review prd-tad

# Manifest / README / Integration Index / filesystem synchronization
/context-check review assets

# Core document ownership and directory references
/context-check review core

# Generated assets ↔ source documents for one scope
/context-check review scope domain
/context-check review scope architecture
/context-check review scope db
/context-check review scope ui
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
/context-openspec proposal feat-user-login [roadmap-doc]

# 5. Review (human confirms proposal.md)
# Run the automatically generated Phase 5 review prompt
# Continue after PASS or PASS (Conditional)

# 6. Implement
/context-start feat-user-login
  → Confirm task list (y)
  → AI auto-executes:
     [x] Create user table (SSoT/schema/migrations/ → Goose)
     [x] Implement login API (SSoT/api/main.tsp → codegen)
     [x] Add tests
  → Verification passed
  → Auto-archived

# 7. Done!
```

---

## FAQ

### Q: Is a global OpenSpec CLI required?
```bash
node design/context-dev/tools/specflow/specflow.mjs --help
```
No. The workflow uses the bundled Specflow tool. Node.js 18+ is required.

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
