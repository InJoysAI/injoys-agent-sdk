<p align="center">
  <img src="images/injoysai.png" alt="InJoysAI" width="160" />
</p>

# InJoys Agent SDK

[English](README.md) | [中文](README_zh.md)

**InJoys Agent SDK** 是一个全栈 AI 开发者工具，旨在标准化和自动化 AI 原生软件开发生命周期。

它统一了两项核心能力：
1.  **Context Generation Framework（上下文生成框架）**：根据项目文档（PRD、架构规范）自动为 AI Agent 生成高质量、结构化的上下文资产（`.context/`）。
2.  **AI Programming Standards（AI 编程规范）**：定义"项目准则"和工作流（OpenSpec, Goose, TypeSpec），确保 AI 生成的代码健壮、安全且合规。

## 功能特性

-   **6 个命令文件**：`/context-init`、`/context-openspec`（含 proposal 子命令）、`/context-interview`、`/context-start`、`/context-check`、`/context-update`。
-   **共享命令源**：命令可安装到 Antigravity、Claude Code、Cursor、Devin、Qoder 和 Grok；Codex prompts 通过独立脚本安装。
-   **SSoT 集成**：提供 Schema (Goose SQL 迁移) 和 API (TypeSpec) 的单一数据源（SSoT）集成模板。

## 安装指南

### 方式 1: NPX

```bash
npx @injoysai/agent-sdk init
```

`init` 与方式 2 安装的布局一致（`design/context-dev/`，并在 `.agent/workflows/` 中 bootstrap `/context-init` 和 `/context-check`）。已存在的文件默认保留，传入 `--force` 才会覆盖。

| 选项 | 说明 |
| --- | --- |
| `--tools <list>` | 在 `.agent/workflows` 之外，额外为指定工具 bootstrap 命令（`antigravity,claude,cursor,devin,qoder,all`；默认仅 `.agent/workflows`） |
| `--force` | 覆盖已存在的文件 |
| `--dry-run` | 只显示将要写入的内容，不做任何修改 |

`npx @injoysai/agent-sdk check-env` 会优先运行项目自己的 provider（`make check-env` 或 `scripts/check-env.sh`），没有时输出基础工具链报告。

### 方式 2: 一键安装

在你的项目根目录下运行以下命令安装 InJoys Agent SDK 工具和规范：

```bash
curl -fsSL https://raw.githubusercontent.com/injoysai/injoys-agent-sdk/main/scripts/install.sh | bash
```

安装脚本只会把 `/context-init` 和 `/context-check` bootstrap 到项目的 `.agent/workflows/`，不创建其他工具目录，也不写入项目之外的位置。运行 `/context-init` 后，完整命令集同步到 `.agent/workflows/`，并在项目根目录生成 `AGENTS.md`（含关键禁止项摘要）和只有一行导入的 `CLAUDE.md`，指引 AI 阅读 `.context/`、`.agent/` 和 `openspec/`。其他工具可用 `design/context-dev/scripts/install-ai-commands.sh --tools <工具列表>` 手动安装；Codex 可运行 `design/context-dev/scripts/install-codex-prompts.sh`。

### 方式 3: 手动安装（用于开发）

如果你想向 InJoys Agent SDK 贡献代码，或安装特定的本地版本：

```bash
git clone https://github.com/injoysai/injoys-agent-sdk.git
cd injoys-agent-sdk
./scripts/install.sh /path/to/your-project
```

## 快速开始

1.  **初始化上下文** (`/context-init`)：
    归档源文档到 `.context/` 并创建清单文件。

2.  **生成总结** (`/context-openspec`)：
    从文档生成结构化总结并集成 OpenSpec。

3.  **创建提案** (`/context-openspec proposal <change-id> [roadmap-doc]`)：
    基于匹配到的路线图条目创建变更提案，并可额外传入补充路线图或提案大纲文档。

4.  **实施变更** (`/context-start <proposalId>`)：
    按 SSoT 优先工作流执行任务。

5.  **检查状态** (`/context-check`)：
    检查环境 (`env`)、任务 (`tasks`) 或提案 (`proposal`)。

6.  **维护上下文** (`/context-update`)：
    `sync roadmap` 和 `sync proposal` 有对应工作流；`add`、`modify`、`delete`、`fix` 仍是接口草案，需先确认目标项目已实现对应能力。

## 文档资源

- [快速开始](docs/QUICK_START_zh.md)

## 开发路线图

详见 [ROADMAP_zh.md](ROADMAP_zh.md)。

**包版本**：以 [package.json](package.json) 为准。仓库模板提供 Context/OpenSpec 工作流；CLI 能力及发布状态请以实际包和脚本为准。

## 许可证

MIT
