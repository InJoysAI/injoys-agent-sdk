<p align="center">
  <img src="images/injoysai.png" alt="InJoysAI" width="160" />
</p>

# InJoys Agent SDK

[English](README.md) | [中文](README_zh.md)

**InJoys Agent SDK** 是一个全栈 AI 开发者工具，旨在标准化和自动化 AI 原生软件开发生命周期。

它统一了两项核心能力：
1.  **Context Generation Framework（上下文生成框架）**：根据项目文档（PRD、架构规范）自动为 AI Agent 生成高质量、结构化的上下文资产（`.context/`）。
2.  **AI Programming Standards（AI 编程规范）**：定义"项目准则"和工作流（OpenSpec, Atlas HCL, TypeSpec），确保 AI 生成的代码健壮、安全且合规。

## 功能特性

-   **6 个核心命令**：`/context-init`、`/context-openspec`、`/context-openspec proposal <change-id>`、`/context-start`、`/context-check`、`/context-update`
-   **多 Agent 支持**：开箱即用的命令，支持 **Antigravity**、**Claude Code**、**Cursor**、**Windsurf**、**Codex** 和 **Qoder**。
-   **SSoT 集成**：提供 Schema (Atlas) 和 API (TypeSpec) 的单一数据源（SSoT）集成模板。

## 安装指南

### 方式 1: NPX

> ⚠️ **发布到 npm 后可用** - 请暂时使用方式 2。

```bash
npx @injoysai/agent-sdk init
```

### 方式 2: 一键安装

在你的项目根目录下运行以下命令安装 InJoys Agent SDK 工具和规范：

```bash
curl -fsSL https://raw.githubusercontent.com/injoysai/injoys-agent-sdk/main/scripts/install.sh | bash
```

默认情况下，安装脚本只会 bootstrap `/context-init` 和 `/context-check`。完整命令集会在你运行 `/context-init` 后再安装/生成。

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

3.  **创建提案** (`/context-openspec proposal <change-id>`)：
    基于路线图条目创建变更提案。

4.  **实施变更** (`/context-start <proposalId>`)：
    按 SSoT 优先工作流执行任务。

5.  **检查状态** (`/context-check`)：
    检查环境 (`env`)、任务 (`tasks`) 或提案 (`proposal`)。

6.  **更新上下文** (`/context-update`) *（规划中）*：
    添加、修改、删除或修复上下文资产。

## 文档资源

- [快速开始](docs/QUICK_START_zh.md)

## 开发路线图

详见 [ROADMAP_zh.md](ROADMAP_zh.md)。

**当前版本**: v0.1.0 - 模板化基础架构，支持多 Agent + 初版 Node.js CLI（npm 发布待完成）  
**下一版本**: v0.2.0 - 发布到 npm + 扩展 CLI 与编程接口

## 许可证

MIT
