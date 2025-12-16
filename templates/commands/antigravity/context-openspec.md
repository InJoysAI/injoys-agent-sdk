---
description: Initialize and enhance OpenSpec with Context assets (generate `project.md` + `proposal-roadmap.md`)
---

# Context OpenSpec Integration

---

## ⛔ 第 1 步：Pre-flight Checklist（必须首先完成）

> **❌ 禁止跳过** — 在执行任何子命令之前，必须逐项检查以下条件。

### 检查 1: Context Check

```bash
ls -la .context/criterion.md
```

- ✅ 若存在 → 继续检查 2
- ❌ 若不存在 → **⛔ STOP**，告知用户：`先运行 /context-init`

### 检查 2: CLI Check

```bash
openspec --version
```

- ✅ 若成功 → 继续检查 3
- ❌ 若失败 → **⛔ STOP**，告知用户：`请执行 npm install -g @fission-ai/openspec@latest`

### 检查 3: Init Check

```bash
ls -la openspec/
```

- ✅ 若目录存在 → 继续第 2 步
- ❌ 若目录不存在 → **⛔ 必须 STOP**，向用户询问：

> "请选择 OpenSpec 要配置的 AI 工具（可多选，逗号分隔）：
> 1. Antigravity  2. Claude  3. Codex  4. Cursor  5. Qoder  6. Windsurf  7. 全部"

**等待用户回复后**，执行：

```bash
openspec init --tools {用户选择}
```

> ⚠️ **保护规则**: 不得覆盖项目根 `AGENTS.md`。

---

## 第 2 步：执行子命令

> ⛔ **只有第 1 步全部通过后才能执行此步骤**

**执行**: `@design/context-dev/openspec/AGENTS.md`

> 传递 `$ARGUMENTS`：无参数 = 一键模式；有参数 = 子命令模式

$ARGUMENTS
