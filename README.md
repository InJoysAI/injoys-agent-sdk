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
- **Shared command source**: Commands can be installed for Antigravity, Claude Code, Cursor, Devin, Qoder, and Grok. Codex prompts use a separate installer.
- **SSoT Integration**: Templates for integrating Single Source of Truth (SSoT) definitions for Schema (Goose SQL migrations) and API (TypeSpec).

## Installation

### Method 1: NPX

```bash
npx @injoysai/agent-sdk init
```

`init` installs the same layout as Method 2 (`design/context-dev/` plus the `/context-init` and `/context-check` commands). Existing files are kept unless you pass `--force`.

| Option | Description |
| --- | --- |
| `--tools <list>` | Only bootstrap commands for the given tools (`antigravity,claude,cursor,devin,qoder`; default: all) |
| `--force` | Overwrite files that already exist |
| `--dry-run` | Show what would be written without changing anything |

`npx @injoysai/agent-sdk check-env` runs the project's own provider (`make check-env` or `scripts/check-env.sh`) and falls back to a basic toolchain report.

### Method 2: One-Click Install

Run the following command in your project root to install InJoys Agent SDK tools and standards:

```bash
curl -fsSL https://raw.githubusercontent.com/injoysai/injoys-agent-sdk/main/scripts/install.sh | bash
```

The installer bootstraps `/context-init` and `/context-check` for Antigravity, Claude Code, Cursor, Devin, and Qoder, and attempts to install the same prompts into Codex's global prompts directory. After `/context-init`, the full command set is synchronized only to the target project's `.agent/workflows/`. Install commands for other tools with `design/context-dev/scripts/install-ai-commands.sh --tools <tool-list>`; install Codex prompts with `design/context-dev/scripts/install-codex-prompts.sh`.

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
