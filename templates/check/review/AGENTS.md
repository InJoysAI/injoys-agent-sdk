# Context Review 核对指令

> 当 `/context-check review "<核对事项>"` 被调用时执行此文件。

---

## 🎯 执行指令

> ⛔ **必须依次执行所有步骤**，不得跳过或中断。

**输入**: `$ARGUMENTS` = 用户描述的核对事项（自由文本）

---

## Phase 1: 解析核对意图

从用户描述中识别：

| 识别项 | 说明 | 示例 |
|--------|------|------|
| **范围** | 涉及哪些 `.context/**` 文件 | "api_strategy.md" → `.context/architecture/api_strategy.md` |
| **参照物** | 核对的标准来源 | "与代码一致" → 需要读取代码文件 |
| **深度** | 结构/内容/一致性 | "格式" → 结构校验；"内容" → 内容校验 |

> 若核对事项涉及 OpenSpec（如 `openspec/project.md`、`openspec/proposal-roadmap*.md`、`openspec/changes/<change-id>/*`），也应纳入“范围”。

**若描述模糊**：
- 主动列出可能的检查项
- 询问用户想重点关注哪些方面

---

## Phase 2: 读取 Context 资产

**执行**: `@design/context-dev/tools/asset-reader/AGENTS.md`

> 该模块会：
> - 从 `context-manifest.json` 的 `generated_files` 节点获取文件列表
> - 按 scope 遍历：architecture, domain, db, ui, legacy
> - 跳过 README.md、openspec/、source/

根据 Phase 1 识别的范围，额外读取：
- 对应的 AGENTS.md 规范（`design/context-dev/<scope>/AGENTS.md`）
- 用户提及的参照物（源文档、代码文件等）

若核对事项涉及 OpenSpec 路线图/提案大纲：
- `openspec/proposal-roadmap.md`（索引/总览）
- `openspec/proposal-roadmap-Phase*.md` / `openspec/proposal-roadmap-Phase-*.md`（分 Phase 大纲，若存在）

---

## Phase 3: 执行核对

根据用户意图执行对应类型的校验：

### 3.1 结构校验

检查文件/章节是否存在：

| 检查项 | 规则来源 |
|--------|----------|
| 必需文件存在 | `<scope>/AGENTS.md` 的"动态生成条件"表 |
| 必需章节存在 | `<scope>/AGENTS.md` 的"Phase 1: 填充模板" |
| Metadata 区块 | 全局规则：Source, Generated At, Generator |

### 3.2 内容校验

检查内容是否准确、完整：

| 检查项 | 方法 |
|--------|------|
| 小节非空 | 不得为空或仅占位符 |
| 无残留占位符 | 不得包含 `{{...}}` |
| 格式正确 | 表格、代码块、Mermaid 语法正确 |

### 3.3 一致性校验

检查与参照物是否一致：

| 参照物类型 | 校验方法 |
|------------|----------|
| 源文档 | 内容是否覆盖源文档关键信息 |
| 代码文件 | 描述是否与代码实现一致 |
| 其他 Context 资产 | 交叉引用是否正确 |

---

## Phase 4: 展示发现并请求确认

输出核对结果，格式如下：

```
🔍 核对结果

**核对事项**: <用户描述>
**涉及文件**: 
- <file1>
- <file2>

## 发现的问题

1. ⚠️ [问题描述]
   - 当前内容: `...`
   - 期望内容: `...`
   - 建议修复: ...

2. ❓ [需要确认的项]
   - 问题: ...
   - 请确认: 是否需要修复？

## ✅ 已通过的检查

- [检查项 1] ✓
- [检查项 2] ✓

---

请确认以上发现，或提供更多信息。
```

---

## Phase 5: 根据用户反馈行动

| 用户回复 | 执行动作 |
|----------|----------|
| 确认问题 | 执行修复，更新文件 |
| 否认问题 | 请求用户说明原因，更新理解 |
| 补充信息 | 根据新信息重新核对 |
| 请求修复 | 直接执行修复并更新 Manifest |

修复完成后：
- **执行**: `@design/context-dev/tools/manifest/AGENTS.md` (mode: update)

---

## 📚 规范文件索引

执行核对时，根据涉及的 scope 读取对应 AGENTS.md：

| Scope | 规范文件 |
|-------|----------|
| domain | `design/context-dev/domain/AGENTS.md` |
| architecture | `design/context-dev/architecture/AGENTS.md` |
| db | `design/context-dev/db/AGENTS.md` |
| ui | `design/context-dev/ui/AGENTS.md` |
| legacy | `design/context-dev/legacy/AGENTS.md` |
| openspec | `design/context-dev/openspec/AGENTS.md`（以及按需读取 `design/context-dev/openspec/proposal/AGENTS.md` / `design/context-dev/openspec/plan/AGENTS.md`） |

$ARGUMENTS
