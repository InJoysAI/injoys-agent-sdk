---
description: Initialize and enhance OpenSpec with Context assets (generate `config.yaml` + `proposal-roadmap.md`)
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
node design/context-dev/tools/specflow/specflow.mjs --help
```

- ✅ 若成功 → 继续检查 3
- ❌ 若失败 → **⛔ STOP**，告知用户：`缺少 Node.js 工具未安装在仓库中`

### 检查 3: Init Check

```bash
ls -la openspec/
```

- ✅ 若目录存在 → 继续第 2 步
- ❌ 若目录不存在 → 直接创建：

```bash
mkdir -p openspec/changes openspec/specs openspec/changes/archive
```

---

## 第 2 步：执行子命令

> ⛔ **只有第 1 步全部通过后才能执行此步骤**

**执行**: `@design/context-dev/openspec/AGENTS.md`

> 传递 `$ARGUMENTS`：无参数 = 一键模式；有参数 = 子命令模式

$ARGUMENTS
