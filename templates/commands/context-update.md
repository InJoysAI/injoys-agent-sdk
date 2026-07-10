---
description: Update Context assets (sync/add/modify/delete/fix) and keep manifest in sync
---

# Context Update

> ⚠️ 给 AI 的说明：本命令文档同时包含「已落地能力」与「规划中的接口草案」。
>
> - `archive <change-id>`：✅ 已落地（通过 `design/context-dev/tools/specflow/specflow.mjs`）
> - `sync roadmap|proposal`：⚠️ 先按“工作流规范”执行；若仓库尚无独立脚本/AGENTS，可按本文档手工完成同步
> - `add/modify/delete/fix`：⚠️ 目前仍处于初稿/接口设计阶段，可能未在此仓库中完整实现
>
> ⛔ 在执行任何会写入/删除文件的子命令前，必须先确认仓库中存在对应的可执行实现（AGENTS 或脚本）。
> 若未找到实现：**STOP**，向用户说明“该子命令尚未落地”，并询问是否现在要你补齐实现或改为手工操作。

Supported subcommands:
- `sync roadmap [phase-or-file] [--mode review|apply]`: sync `proposal-roadmap*.md` into `.context/**`, related `source/` files, and manifest
- `sync proposal <change-id> [--mode review|apply]`: sync `openspec/changes/<change-id>/` (or `openspec/changes/archive/YYYY-MM-DD-<change-id>/` if archived) into `.context/**`, related `source/` files, and manifest
- `add <source>`: add a supplementary source doc into `.context/` (and update manifest)
- `modify <scope>`: regenerate specific Context outputs after source changes
- `delete <path>`: delete a Context file/dir (mark as deleted in manifest)
- `fix <path>`: fix metadata/links/format only (no business-content change)
- `archive <change-id>`: archive a completed change and (optionally) sync specs (delta → main)

If the target project still uses separate commands (`/context-add`, `/context-modify`, ...), this command describes the unified interface you should implement.

## sync

**Execute**: `@design/context-dev/update/sync/AGENTS.md`

支持：
- `sync roadmap [phase-or-file] [--mode review|apply]`
- `sync proposal <change-id> [--mode review|apply]`

> 该模块负责：
> - 解析 authority / scope / mode
> - 建立 source -> context 映射
> - 分类差异（`missing` / `drift` / `reference` / `metadata` / `conflict`）
> - 在 `apply` 模式下同步 `.context/**`、`source/` 与 `context-manifest.json`

## add
> ⚠️ 若仓库未实现该子命令：STOP（不要“按文档想象实现”直接改文件）。
1. Require `<source>` (e.g. `@docs/Security.md`). Ask user where it should land (which `.context/**` file to merge into or create).
2. Calculate SHA256 for the new source file and record it in `.context/context-manifest.json`.
3. Update target Context file content + its Metadata `Source`.
4. Update manifest `generated_files` for the touched outputs.

## modify
> ⚠️ 若仓库未实现该子命令：STOP（不要“按文档想象实现”直接改文件）。
1. Require `<scope>` (e.g. `prd`, `arch`, `db`, `ui`, or a specific output file path).
2. Recompute source hash and compare with manifest `content_hash`.
3. Regenerate only impacted `.context/**` outputs; keep template structure.
4. Update Metadata timestamps + manifest entries.

## delete
> ⚠️ 若仓库未实现该子命令：STOP（不要“按文档想象实现”直接改文件）。
1. Require `<path>` (file or directory under `.context/`).
2. Delete it (or mark it as removed) and set manifest status to `deleted` with reason.

## fix
> ⚠️ 若仓库未实现该子命令：STOP（不要“按文档想象实现”直接改文件）。
1. Require `<path>`.
2. Fix only metadata/links/format; do not change business meaning.
3. Update manifest notes if applicable.

## archive

> Change-level maintenance: moves `openspec/changes/<change-id>/` into `openspec/changes/archive/YYYY-MM-DD-<change-id>/`
> and (by default) applies delta specs to main specs under `openspec/specs/<capability>/spec.md`.

### Context Sync Gate（必须）

> ⛔ 在归档前，必须确保 **提案内容 + 实现结果** 与 `.context/**` 资产一致；否则归档会把“不一致”永久固化。

执行顺序：

1. 规范校验（严格）：
```bash
node design/context-dev/tools/specflow/specflow.mjs validate <change-id> --strict
```

2. 提案一致性检查（结合 Context 资产）：
```bash
/context-check proposal <change-id>
```

3. 开放式核对（重点核对“实现是否导致 Context 需要更新”）：
```bash
/context-check review "核对提案 <change-id> 的实现与 .context 资产一致性；如不一致，更新对应 .context 文件并同步 manifest"
```

> 若发现不一致：优先用 `/context-update fix <path>`（仅修复 metadata/links/format）；
> 若确需更新业务含义/约束内容：使用 `/context-update modify <scope>` 或直接修改目标 `.context/**` 文件，并在修复后更新 manifest。
>
> ⚠️ 如果本仓库尚未落地 `fix/modify`：请改为 **STOP 并请求用户确认** 是否要现在补齐实现；或由用户指定要更新的具体 `.context/**` 文件与期望改动后再继续。

4. 归档命令
```bash
# Strict (recommended): validate + sync specs + archive
node design/context-dev/tools/specflow/specflow.mjs archive <change-id> --yes

# Archive without syncing specs (infra/tooling/doc-only change)
node design/context-dev/tools/specflow/specflow.mjs archive <change-id> --yes --skip-specs

# Force archive without validation (not recommended)
node design/context-dev/tools/specflow/specflow.mjs archive <change-id> --yes --no-validate
```

$ARGUMENTS
