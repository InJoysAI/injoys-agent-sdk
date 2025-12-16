---
description: Update Context assets (add/modify/delete/fix) and keep manifest in sync
---

# Context Update

Supported subcommands:
- `add <source>`: add a supplementary source doc into `.context/` (and update manifest)
- `modify <scope>`: regenerate specific Context outputs after source changes
- `delete <path>`: delete a Context file/dir (mark as deleted in manifest)
- `fix <path>`: fix metadata/links/format only (no business-content change)

If the target project still uses separate commands (`/context-add`, `/context-modify`, ...), this command describes the unified interface you should implement.

## add
1. Require `<source>` (e.g. `@docs/Security.md`). Ask user where it should land (which `.context/**` file to merge into or create).
2. Calculate SHA256 for the new source file and record it in `.context/context-manifest.json`.
3. Update target Context file content + its Metadata `Source`.
4. Update manifest `generated_files` for the touched outputs.

## modify
1. Require `<scope>` (e.g. `prd`, `arch`, `db`, `ui`, or a specific output file path).
2. Recompute source hash and compare with manifest `content_hash`.
3. Regenerate only impacted `.context/**` outputs; keep template structure.
4. Update Metadata timestamps + manifest entries.

## delete
1. Require `<path>` (file or directory under `.context/`).
2. Delete it (or mark it as removed) and set manifest status to `deleted` with reason.

## fix
1. Require `<path>`.
2. Fix only metadata/links/format; do not change business meaning.
3. Update manifest notes if applicable.

$ARGUMENTS

