<p align="center">
  <img src="images/injoysai.png" alt="InJoysAI" width="160" />
</p>

# InJoys Agent SDK

[English](README.md) | [中文](README_zh.md)

**InJoys Agent SDK** is a comprehensive AI Developer Tool designed to standardize and automate the AI-native software development lifecycle.

It unifies two core capabilities:
1.  **Context Generation Framework**: Automatically generates high-quality, structured context (`.context/`) for AI agents from project documentation (PRDs, Architecture specs).
2.  **AI Programming Standards**: Defines "Project Criterion" and workflows (OpenSpec, Atlas HCL, TypeSpec) to ensure AI-generated code is robust, secure, and compliant.

## Features

- **7 Core Commands**: `/context-init`, `/context-openspec`, `/context-openspec proposal <change-id> [roadmap-doc]`, `/context-interview`, `/context-start`, `/context-check`, `/context-update`
- **Multi-Agent Support**: Ready-to-use commands for **Antigravity**, **Claude Code**, **Cursor**, **Devin**, **Codex**, and **Qoder**.
- **Single Command Source**: All supported AI tools install from one shared command set to prevent drift.
- **SSoT Integration**: Templates for integrating Single Source of Truth (SSoT) definitions for Schema (Atlas) and API (TypeSpec).

## Installation

### Method 1: NPX

> ⚠️ **Available after publishing to npm** - Use Method 2 for now.

```bash
npx @injoysai/agent-sdk init
```

### Method 2: One-Click Install

Run the following command in your project root to install InJoys Agent SDK tools and standards:

```bash
curl -fsSL https://raw.githubusercontent.com/injoysai/injoys-agent-sdk/main/scripts/install.sh | bash
```

By default, the installer bootstraps only `/context-init` and `/context-check`. The full command set is installed/generated after you run `/context-init`.

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

6.  **Update Context** (`/context-update`) *(planned)*:
    Add, modify, delete, or fix context assets.

## Documentation

- [Quick Start](docs/QUICK_START.md)

## Roadmap

See [ROADMAP.md](ROADMAP.md) for our development plan.

**Current**: v0.2.0 - Published to npm with `injoys` CLI distribution and initial programmatic API  
**Next**: v0.3.0 - Interactive CLI wizard with AI tool auto-detection and context file selection

## License

MIT
