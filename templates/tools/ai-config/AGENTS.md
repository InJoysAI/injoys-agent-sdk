# AI 工具配置指令

> 当被 `design/context-dev/AGENTS.md` 调用时执行此文件。

---

## 🎯 执行指令

依次执行以下步骤：

---

### Phase 1: 确认 AI 工具

**⛔ STOP - 必须询问用户**

向用户询问：

> "请选择需要配置的 AI 工具（可多选，逗号分隔）：
> 1. Antigravity
> 2. Cursor
> 3. Claude
> 4. Windsurf
> 5. Codex
> 6. Qoder
> 7. 全部"

**❌ 禁止**: 未经用户确认直接执行 Phase 2

**等待用户回复后再继续。**

---

### Phase 2: 安装命令文件

根据用户选择，执行安装脚本：

```bash
# 如果用户选择 "全部" 或 "7"
bash design/context-dev/scripts/install-ai-commands.sh --tools all

# 如果用户选择特定工具，用逗号分隔
bash design/context-dev/scripts/install-ai-commands.sh --tools antigravity,cursor
```

---

## 📂 工具目录映射

| AI 工具 | 命令目录 |
|---------|---------|
| Antigravity | `.agent/workflows/` |
| Claude | `.claude/commands/` |
| Cursor | `.cursor/commands/` |
| Windsurf | `.windsurf/workflows/` |
| Codex | `~/.codex/prompts/` |
| Qoder | `.qoder/commands/` |

---

## 📋 命令集

每个工具目录包含以下命令文件：

| 命令 | 用途 |
|------|------|
| `/context-init` | 初始化 `.context/` 目录 |
| `/context-openspec` | 生成 context 总结 + OpenSpec 集成 |
| `/context-openspec proposal <change-id>` | 生成提案 |
| `/context-start` | 基于提案开始开发 |
| `/context-check` | 环境检查 |
| `/context-update` | 增量更新 context |

---

### Phase 3: 更新 Manifest

**执行**: `@design/context-dev/tools/manifest/AGENTS.md` (mode: update)

---

## ✅ 完成后

报告安装结果：

```
=== 已安装命令 ===
✅ Antigravity: .agent/workflows/ (6 files)
✅ Cursor: .cursor/commands/ (6 files)
...

🔁 Manifest 已更新
```
