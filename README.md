<p align="center">
  <img src="images/injoysai.png" alt="InJoysAI" width="160" />
</p>

# InJoys Agent SDK

[English](README.md) | [中文](README_zh.md)

**InJoys Agent SDK** is a comprehensive AI Developer Tool designed to standardize and automate the AI-native software development lifecycle.

It unifies two core capabilities:
1.  **Context Generation Framework**: Automatically generates high-quality, structured context (`.context/`) for AI agents from project documentation (PRDs, Architecture specs).
2.  **AI Programming Standards**: Defines "Project Criterion" and workflows (OpenSpec, Goose, TypeSpec) to ensure AI-generated code is robust, secure, and compliant.

## Features

- **Six command files**: `/context-init`, `/context-openspec` (including the proposal subcommand), `/context-interview`, `/context-start`, `/context-check`, and `/context-update`.
- **Shared command source**: Commands are installed to the tool-agnostic project directory `.agents/workflows/` only. Tool-specific command directories and global prompt directories (Claude Code, Cursor, Devin, Qoder, Grok, Codex) are not managed; copy the commands there yourself if your tool needs them.
- **SSoT Integration**: Templates for integrating Single Source of Truth (SSoT) definitions for Schema (Goose SQL migrations) and API (TypeSpec).

## Installation

### Method 1: NPX

```bash
npx @injoysai/agent-sdk init
```

`init` installs the same layout as Method 2 (`design/context-dev/` plus the `/context-init` and `/context-check` commands in `.agents/workflows/`). Existing files are kept unless you pass `--force`.

**Upgrading**: run `scripts/upgrade.sh` (or `npx @injoysai/agent-sdk init --force`). For an already-initialized project (`.context/context-manifest.json` exists) this also refreshes every command copy in `.agents/workflows/`, so new subcommands reach the copies your AI runs; fresh projects still get only `/context-init` and `/context-check`. Without `--force`, `init` leaves the command copies untouched and prints how to refresh them. Check drift any time with `.agents/workflows/context-check.md commands`.

| Option | Description |
| --- | --- |
| `--force` | Overwrite files that already exist |
| `--dry-run` | Show what would be written without changing anything |

`npx @injoysai/agent-sdk check-env` runs the project's own provider (`make check-env` or `scripts/check-env.sh`) and falls back to a basic toolchain report.

### Method 2: One-Click Install

Run the following command in your project root to install InJoys Agent SDK tools and standards:

```bash
curl -fsSL https://raw.githubusercontent.com/injoysai/injoys-agent-sdk/main/scripts/install.sh | bash
```

The installer bootstraps `/context-init` and `/context-check` into the project's `.agents/workflows/` only; it creates no other tool directories and writes nothing outside the project. After `/context-init`, the full command set is synchronized to `.agents/workflows/`, and a root `AGENTS.md` (with a summary of the key MUST NOT rules) plus a one-line `CLAUDE.md` that imports it are generated to point the AI at `.context/`, `.agents/` and `openspec/`. Re-sync the command copies any time with `design/context-dev/scripts/install-ai-commands.sh`. The `--tools` option and the Codex prompt installer were removed.

### Method 3: Manual Installation (For Development)

If you want to contribute to InJoys Agent SDK or install from a specific local version:

```bash
git clone https://github.com/injoysai/injoys-agent-sdk.git
cd injoys-agent-sdk
./scripts/install.sh /path/to/your-project
```

## Quick Start

1.  **Initialize Context** (`/context-init`):
    Archive source documents into `.context/` and create manifest.

2.  **Generate Summaries** (`/context-openspec`):
    Generate structured summaries from docs and integrate with OpenSpec.

3.  **Create Proposal** (`/context-openspec proposal <change-id> [roadmap-doc]`):
    Create and validate a change proposal from the matching roadmap item, then automatically generate a proposal-specific three-layer review prompt.

4.  **Implement Changes** (`/context-start <proposalId>`):
    Execute tasks following SSoT-first workflow.

5.  **Check Status** (`/context-check`):
    Check environment and OpenSpec status, or run reusable document reviews such as `review prd-tad`, `review assets`, and `review scope domain`.

6.  **Maintain Context** (`/context-update`):
    `sync roadmap` and `sync proposal` have workflow instructions. `add`, `modify`, `delete`, and `fix` remain interface drafts; first confirm that the target project implements the requested operation.

## Documentation

- [Quick Start](docs/QUICK_START.md)

## Roadmap

See [ROADMAP.md](ROADMAP.md) for our development plan.

**Package version**: See [package.json](package.json). This repository provides Context/OpenSpec workflow templates; check the actual package and scripts for CLI capabilities and publication status.

## License

MIT
