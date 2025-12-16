# Legacy 模板填充指令

> 当被 `.context/AGENTS.md` 调用时执行此文件。

---

## 📂 目录结构（混合模式）

```
.context/legacy/
├── source/                    # 源文档目录（权威）
│   └── *.md                   # 遗留系统文档
├── legacy_system_analysis.md  # 总结
└── README.md                  # 整体说明（快速索引）
```

**读取优先级**：
1. 日常任务 → 读取总结文件（快速）
2. 提案检查 → 读取总结 + 遗留约束验证
3. 遇到不确定/细节问题 → **回溯 `source/` 目录验证**

> ⚠️ **若总结与源文档冲突，以 `source/` 目录中的源文档为准**

---

## 🎯 执行指令

使用 **源文档**（位于 `.context/legacy/source/` 目录），执行以下步骤。

> **⚠️ 全局规则**:  
> 1. 所有生成的文件都必须在顶部包含 Metadata 区块（Source, Generated At, Generator）。
> 2. **输出边界**: 本命令只能写入 `.context/legacy/**`（不含 `source/`）。
> 3. **源文档只读**: 不得修改 `source/` 目录中的文件。

---

## Phase 0: 分析源文档（动态生成决策）

> ⛔ **必须首先执行此步骤**，在生成任何文件之前完成分析。

### 0.1 读取源文档

**读取**：`.context/legacy/source/` 目录下的所有文件

### 0.2 分析内容

评估遗留代码库/文档的复杂度：
- 项目结构（目录深度、模块数量）
- 代码风格约定
- 关键依赖和约束
- 禁止修改的文件

### 0.3 输出生成计划

**必须输出**：

```
=== 生成计划 ===
必须生成：
- legacy_system_analysis.md（核心分析文件）

可选生成（根据复杂度）：
- [其他分析文件]
```

**确认后继续 Phase 1**。

---

## 模板引用

| 输出文件 | 模板路径 |
|----------|----------|
| `legacy_system_analysis.md` | `templates/legacy/legacy_system_analysis.md.template` |

> 模板路径相对于 `design/context-dev/`

---

## Phase 1: 填充模板

### 1. 填充 `legacy_system_analysis.md`

**Prompt**:
```markdown
# Role
你是一位代码考古学家。

# Task
分析遗留代码库，提取模式、约束和典型代码模板。

# Requirements
- 描述项目结构、模块职责、代码风格约定。
- 标注禁止修改的文件。
- **务必**添加 Metadata 区块到文件顶部。

# Output Format
使用模板格式输出。
```

---

## Phase 2: 生成说明文档

### 2. 生成 `legacy/README.md`

**Prompt**:
```markdown
# Task
为 legacy 目录生成一份 README 说明文档。

# Content
1. 目录用途：存储遗留系统分析资产。
2. 文件列表：列出本目录下已生成的文件。
3. Metadata：在顶部包含元数据。

# Output
README.md 内容。
```

---

## ⚠️ 可选执行

此目录仅适用于**棕地项目**。如果用户未提供遗留代码库，请**跳过**此步骤并直接汇报 "Skipped (No Legacy Source)".

---

## Phase 3: 更新 Manifest

> ⛔ **必须执行此步骤**（若 Phase 1/2 已执行）

**执行**: `@design/context-dev/tools/manifest/AGENTS.md` (mode: update)

**更新内容**：
1. 将本次生成的所有文件添加到 `generated_files.legacy` 数组
2. 确认 `sources.LEGACY_CODEBASE` 记录正确

**⚠️ Phase 3 完成后必须执行 ✅ 完成后 报告**

---

## ✅ 完成后

向上级 `.context/AGENTS.md` 汇报完成状态。
