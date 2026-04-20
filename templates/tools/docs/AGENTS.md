# 文档收集与归档指令

> 当被 `design/context-dev/AGENTS.md` 调用时执行此文件。

---

## 🎯 执行指令

依次执行以下步骤：

---

### Phase 1: 收集源文件

**⚠️ 必须执行**: 向用户询问：

> "请提供以下源文件（可拖拽或粘贴路径）：
> 
> **必需文件**:
> - PRD 产品需求文档（多个时请指定主 PRD）
> - 架构设计文档（由你指定；用于技术栈/工具选择的权威输入）
> 
> **可选文件**:
> - DB Schema 设计文档
> - UI 设计规范
> - 遗留代码库/文档
> - 其他补充文档（安全白皮书、合规要求等）"

**等待用户回复后再继续。**

**额外检查（必须执行）**：
若已知目标项目根目录，检查 `{目标项目}/docs/architecture.md` 是否存在（常见默认位置）：
- 若存在且用户未提供架构设计文档：向用户确认是否使用该文件作为“架构设计文档”的权威输入，并归档到 `.context/architecture/source/`
- 若存在且用户已提供架构设计文档：向用户确认哪一个是“权威输入”（也可两者都归档，但必须明确权威来源）
- 若不存在：继续使用用户提供的架构设计文档

---

## 📂 源文件归档映射

| 文件类型 | 必需 | 归档目录 | 缺失处理 |
|---------|:----:|---------|---------|
| PRD 产品需求文档 | ✅ | `.context/domain/` | 多个时指定主 PRD |
| 架构设计文档 | ✅ | `.context/architecture/` | 由用户指定；若存在 `docs/architecture.md` 且用户未提供/或同时存在多个候选，需向用户确认权威来源 |
| DB Schema 设计文档 | ⚠️ | `.context/db/` | 跳过 `db/` |
| UI 设计规范 | ⚠️ | `.context/ui/` | 跳过 `ui/` |
| 遗留代码库/文档 | ⚠️ | `.context/legacy/` | 跳过 `legacy/` |
| 其他补充文档 | ⚠️ | 按内容归档到对应目录 | 跳过 |

---

### Phase 2: 创建目录结构

创建以下目录（若不存在）：
- `.context/`
- `.context/architecture/`
- `.context/architecture/source/`
- `.context/domain/`
- `.context/domain/source/`
- `.context/db/` （若有 DB 文档）
- `.context/db/source/`
- `.context/ui/` （若有 UI 文档）
- `.context/ui/source/`
- `.context/openspec/`
- `.context/legacy/` （若有遗留文档）
- `.context/legacy/source/`

---

### Phase 3: 复制源文档

将用户提供的源文档**原样复制**到对应的 `source/` 子目录（保留原文件名）：

| 源文档类型 | 归档目录 | 操作 |
|------------|---------|------|
| PRD | `.context/domain/source/` | 复制 |
| 架构设计 | `.context/architecture/source/` | 复制 |
| DB Schema | `.context/db/source/` | 复制 |
| UI 规范 | `.context/ui/source/` | 复制 |
| 遗留**文档** | `.context/legacy/source/` | 复制 |
| 遗留**代码库** | - | ⚠️ **不复制**，见下文 |
| 补充文档 | 按内容归档到对应 `source/` | 复制 |

### 遗留代码库特殊处理

> ⚠️ **遗留代码库（如 `golang-auth-api/`）不进行文件复制**

**处理方式**：
1. **记录路径引用** — 在 Manifest 的 `sources` 中记录代码库路径
2. **生成引用文件** — 在 `.context/legacy/source/` 创建 `_codebase_ref.md`：

```markdown
# 遗留代码库引用

> 此文件为引用指针，实际代码库未复制到 .context/ 目录

**代码库路径**: `{{CODEBASE_PATH}}`
**记录时间**: `{{TIMESTAMP}}`

## 说明
遗留代码库体积较大，不适合复制到 Context 目录。
分析时请直接读取原始路径。
```

3. **执行分析** — 执行 `@design/context-dev/legacy/AGENTS.md` 直接读取原始路径生成 `legacy_system_analysis.md`

> ⚠️ **源文档只读**: `source/` 目录中的文件为权威来源，谨慎修改。

每个子目录生成 `README.md` 说明（作为快速索引）。

---

### Phase 4: 生成根目录文件

| 文件 | 操作 |
|------|------|
| `README.md` | 生成目录说明 |
| `criterion.md` | 读取 `@design/context-dev/criterion.md` 模板并填充占位符 |
| `AGENTS.md` | 使用 `templates/context-agents.md.template` |

**criterion.md 填充规则**：
- 从架构文档**提取技术栈约束**填入 `{{...}}` 占位符
- **保留模板结构**，不删除任何 Section
- 顶部添加 Metadata

> 💡 criterion.md 是唯一需要解析源文档的文件，用于提取技术约束。

---

## 📋 全局元数据格式

仅 `.context/` 根目录生成文件顶部添加：

```markdown
> **Metadata**
> - **Source**: `[源文件路径]`
> - **Generated At**: `YYYY-MM-DD HH:mm`
> - **Generator**: `Context-Dev-Agent v1.0`
```

---

### Phase 5: 更新 Manifest

**执行**: `@design/context-dev/tools/manifest/AGENTS.md` (mode: update)

---

## ✅ 完成后

报告结果（示例，要依据真实情况）：

```
=== 源文档归档 ===
✅ PRD.md → .context/domain/PRD.md (复制)
✅ TDS.md → .context/architecture/TDS.md (复制)
⏩ DB: 跳过（未提供）

=== 根目录文件 ===
✅ .context/README.md (生成)
✅ .context/criterion.md (生成)
✅ .context/AGENTS.md (生成)

🔁 Manifest 已更新
```
