# Context 命令安装指令

> 当被 `design/context-dev/AGENTS.md` 调用时，只安装项目内的 `.agent/workflows/` 命令。

## 执行步骤

1. 在目标项目根目录执行：

   ```bash
   bash design/context-dev/scripts/install-ai-commands.sh --tools antigravity
   ```

   命令源为 `design/context-dev/commands/*.md`。重复执行只同步同名命令文件，不删除 `.agent/workflows/` 中的其他文件。

2. 核对 `.agent/workflows/` 中的 `context-*.md` 与命令源对应；若脚本失败，报告错误，不把本步骤标为完成。
3. 执行 `@design/context-dev/tools/manifest/AGENTS.md`（mode: update），记录本次命令安装结果。

`context-init` **不询问 AI 工具类型**，也不向 `.cursor/commands/`、`.claude/commands/`、`.devin/workflows/`、`.qoder/commands/`、`.grok/commands/` 或全局 Codex prompts 安装命令。其他工具的手动安装脚本保留，但不属于初始化流程。

## 完成后报告

```text
=== Context 命令安装完成 ===
✅ .agent/workflows/: 已同步 6 个 context 命令文件
🔁 Manifest: 已更新 / 未变更
```
