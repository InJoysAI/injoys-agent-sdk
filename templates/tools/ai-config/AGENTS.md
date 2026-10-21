# Context 命令安装指令

> 当被 `design/context-dev/AGENTS.md` 调用时，只安装项目内的 `.agents/workflows/` 命令。

## 执行步骤

1. 在目标项目根目录执行：

   ```bash
   bash design/context-dev/scripts/install-ai-commands.sh
   ```

   命令源为 `design/context-dev/commands/*.md`。重复执行只同步同名命令文件，不删除 `.agents/workflows/` 中的其他文件。

2. **遗留目录检查**：若目标项目存在旧的 `.agent/workflows/`（本框架曾使用的目录名），**询问用户**是移动到 `.agents/workflows/` 还是保留；不得自动删除。移动后确保只剩一份命令副本。
3. 核对 `.agents/workflows/` 中的 `context-*.md` 与命令源对应；若脚本失败，报告错误，不把本步骤标为完成。
4. 执行 `@design/context-dev/tools/manifest/AGENTS.md`（mode: update），记录本次命令安装结果。

`context-init` **不询问 AI 工具类型**，也不向 `.cursor/commands/`、`.claude/commands/`、`.devin/workflows/`、`.qoder/commands/`、`.grok/commands/` 或全局 Codex prompts 安装命令。各工具专属的安装脚本和 `--tools` 选项已移除，命令只安装到 `.agents/workflows/`。

## 完成后报告

```text
=== Context 命令安装完成 ===
✅ .agents/workflows/: 已同步 6 个 context 命令文件
🔁 Manifest: 已更新 / 未变更
```
