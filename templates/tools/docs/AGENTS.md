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

> ⛔ **不要创建 `.context/openspec/`**：该目录只放 `integration.md`，由 `/context-openspec` 的 integration 模块在需要时创建；init 不为它建目录、不写占位 README、不在 Manifest 的 `generated_files.openspec` 中登记。
>
> ⛔ **只为用户实际提供了文档的类别创建目录**。没有 DB / UI / 遗留文档时，**不要**创建对应的 `.context/db/`、`.context/ui/`、`.context/legacy/`（含 `source/`），不要为它们写“未提供”的占位 README，也不要在 Manifest 的 `generated_files` / `pending_generation` 中登记。需要时（补充文档后）由 `context-update` 创建。

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

> ⚠️ **遗留代码库（如 `legacy-service/`）不进行文件复制**

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

复制每个源文档时同时计算其 SHA-256，由 Manifest 更新流程写入 `sources.<KEY>.content_hash`（见 `@design/context-dev/tools/manifest/AGENTS.md`），用于之后判断源文件是否变更。

> ⚠️ **源文档只读**: `source/` 目录中的文件为权威来源，谨慎修改。

每个**已创建**的子目录生成 `README.md` 说明（作为快速索引）；未创建的类别不生成。

---

### Phase 4: 生成根目录文件

| 文件 | 操作 |
|------|------|
| `README.md` | 生成目录说明 |
| `criterion.md` | 读取 `@design/context-dev/criterion.md` 模板并填充占位符 |
| `AGENTS.md` | 使用 `templates/context-agents.md.template` |
| `{项目根目录}/AGENTS.md` | 使用 `templates/AGENTS.md.template`，见下文“项目根目录 AGENTS.md” |

**criterion.md 填充规则**：
- 从架构文档**提取技术栈约束**填入 `{{...}}` 占位符
- **保留模板结构**，不删除任何 Section
- 顶部添加 Metadata

**AGENTS.md 填充规则**：
- 将 `{{context_directory_tree}}` 替换为生成当时实际存在及本次计划生成的 `.context/` 目录树
- 目录树必须包含根资产、已存在的分域资产、OpenSpec Context 资产及实际 `source/` 文件
- **只列实际存在的目录和文件**：未创建的类别、空的 `source/` 目录都不要写进目录树（git 不跟踪空目录）
- 后续 Manifest 的 `generated_files` 发生变化时，由 Manifest 更新流程同步刷新目录树

**项目根目录 AGENTS.md 规则**（init 生成的 AI 入口文件只有 `AGENTS.md`，外加下面一个只做导入的 `CLAUDE.md`；不生成 `.cursorrules` 等其他工具的入口文件）：
- 使用 `templates/AGENTS.md.template`；需要替换的占位符：`{{project_name}}`、`{{proposal_command}}`、`{{must_not_summary}}`
- 文件不存在 → 新建
- 文件已存在 → **只替换 `<!-- CONTEXT-DEV:START -->` 与 `<!-- CONTEXT-DEV:END -->` 之间的内容**；没有标记块则把标记块插入到文件开头的一级标题之后；标记块之外的人工内容一律保留
- 该文件位于 `.context/` 之外，**不登记**到 Manifest 的 `generated_files`

**`{{must_not_summary}}`（关键禁止项摘要）生成规则**：

*提取范围*
- **只从 `.context/criterion.md` 提取**：各章节中的 `MUST NOT` 条目，以及“安全约束”等章节里写明“禁止 / 严禁 / 铁律”的条款；不得加入 criterion.md 中不存在的规则

*措辞（逐条对应，不改写）*
- **一条摘要 = criterion.md 中的一句禁止性表述**。直接使用原文；只允许做三件事：① 去掉括号里的出处/示例说明；② 补上被省略的主语（如“客户端”“宿主侧”），让这一条脱离上下文也能读懂；③ 句末标注来源，如 `（criterion §4）`
- 一个 bullet 里用分号并列了多项要求时（如“禁止硬编码；令牌仅允许来自……；日志必须脱敏”），**只取其中属于禁止的那一句原文**，不要把同一 bullet 里的其他要求并进来
- **不得糅合**：不同条款不能合并成一条，也不能把一条拆开后和别的条款拼接
- **不得添加原文没有的词句**：不加“不得触发或越过……”这类补充解释，不加原文没有的限定或例外；原文的引号、书名号、代码标记原样保留，**不新增引号**
- **只合并真正重复的条款**：同一条规则在多个章节重复出现（如 §3.2 和 §4 都写了“不得自动发布”）时，保留表述更完整的一条，来源写全，如 `（criterion §3.2、§4）`

*条数与排序*
- **上限 15 条**。criterion.md 的禁止条款（去重后）不超过 15 条时**全部列出**，不得自行挑选
- 超过 15 条时按优先级保留：安全、不可逆、会造成数据/资金损失的条款在前；其余按 criterion.md 中的出现顺序
- **被截断时必须说明**：列表最后加一行 `另有 N 条禁止项未在此列出，见 criterion §x、§y、…`（N 为实际未列出的条数，章节为这些条款所在位置），不得让读者以为列表就是全部
- criterion.md 没有任何此类条款时，写：`（criterion.md 暂未定义禁止项）`

*性质*
- 这是 criterion.md 的**派生内容**：criterion.md 变更后必须同步刷新（见下），冲突时以 criterion.md 为准

**项目根目录 CLAUDE.md 规则**（让 Claude Code 也能读到同一份入口；Claude Code 只读 `CLAUDE.md`，不读 `AGENTS.md`）：
- 使用 `templates/CLAUDE.md.template`，内容只有一行 `@AGENTS.md`（导入），**不放任何其他内容**，避免两份入口各写一套
- 文件不存在 → 新建
- 文件已存在且已导入 `@AGENTS.md`（标记块内或任意位置）→ 不改动
- 文件已存在但没有导入 → 在文件开头插入标记块（`<!-- CONTEXT-DEV:START -->` … `<!-- CONTEXT-DEV:END -->`），其余人工内容一律保留
- 不登记到 Manifest

**何时刷新根目录 AGENTS.md 的标记块**：`/context-init` 结束时，以及此后任何修改 `.context/criterion.md` 的流程（SSoT 选型写入、`context-update`）完成后，都要按上述规则重新生成 `{{must_not_summary}}` 并替换标记块内容。

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

**时间戳语义**：
- 只写 `Generated At`（首次生成时间，之后不得改写），**不写 `Updated At`**。同一个字段无法可靠表达“内容何时变过”，还会在每次同步后与 Manifest 产生歧义。
- 文件何时、因何变更，以 git 历史、Manifest 的 `last_context_sync` 和 `.context/history/context-sync.jsonl` 为准。

---

### Phase 5: 更新 Manifest

**执行**: `@design/context-dev/tools/manifest/AGENTS.md` (mode: update)

---

## ✅ 完成后

报告结果（示例，要依据真实情况）：

```
=== 源文档归档 ===
✅ PRD.md → .context/domain/source/PRD.md (复制)
✅ TDS.md → .context/architecture/source/TDS.md (复制)
⏩ DB: 跳过（未提供）

=== 根目录文件 ===
✅ .context/README.md (生成)
✅ .context/criterion.md (生成)
✅ .context/AGENTS.md (生成)

🔁 Manifest 已更新
```
