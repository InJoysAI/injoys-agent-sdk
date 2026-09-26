# Manifest 操作指令

> 当被其他模块调用时执行此文件。

---

## 🎯 执行指令

根据调用参数执行对应流程：

| 模式 | 参数 | 用途 |
|------|------|------|
| `check` | 默认 | 检查变更，生成执行计划 |
| `update` | 需指定 | 写入/更新 Manifest |

---

## Mode: CHECK

### Phase 1: 定位 Manifest

查找 `{目标项目}/.context/context-manifest.json`

| 条件 | 结果 |
|------|------|
| Manifest 不存在 | `mode: FULL`，全量生成 |
| Manifest 存在 | `mode: INCREMENTAL`，执行变更检测 |

---

### Phase 2: 变更检测

**对比 `sources` 节点中记录的源文件路径与当前实际文件**。

| 对比结果 | 标记 | 处理 |
|---------|------|------|
| 文件相同 | `SKIP` | 跳过 |
| 文件内容变更 | `UPDATE` | 重新生成 |
| Manifest 无此源 | `NEW` | 询问：补充/替换？ |
| 当前无此源 | `ORPHAN` | 询问：保留/删除？ |

---

### Phase 3: 输出执行计划

```
== 执行计划 ==
| 模块 | 源文件 | 状态 |
| domain | PRD.md | SKIP |
| architecture | TDS.md | UPDATE |

确认执行？(y/n)
```

**等待用户确认后再继续。**

---

## Mode: UPDATE

### Phase 1: 读取或创建 Manifest

若不存在则创建初始结构：

```json
{
  "version": "1.0.0",
  "generated_at": "{{TIMESTAMP}}",
  "generator": "Context-Agent v1.0",
  "generation_pipeline": {
    "root_assets": "Context-Dev-Agent v1.0",
    "scoped_assets": "Context-Agent v1.0",
    "manifest_writer": "Context-Agent v1.0"
  },
  "project": {
    "name": "{{PROJECT_NAME}}",
    "path": "{{PROJECT_PATH}}"
  },
  "sources": {},
  "generated_files": {
    "root": [],
    "architecture": [],
    "domain": [],
    "db": [],
    "ui": [],
    "legacy": [],
    "openspec": []
  },
  "pending_generation": {},
  "ssot": {},
  "ai_tools": {},
  "context_sync_history": {
    "path": ".context/history/context-sync.jsonl",
    "format": "jsonl",
    "ordering": "ascending_by_synced_at"
  },
  "last_context_sync": null
}
```

---

### Phase 2: 写入信息

#### generator 与 generation_pipeline

- `generator` 表示当前 Manifest 写入器。
- `generation_pipeline.root_assets` 记录根资产生成器；默认由 docs 流程的 `Context-Dev-Agent v1.0` 生成。
- `generation_pipeline.scoped_assets` 记录 architecture/domain/db/ui/legacy 等分域资产生成器；默认是 `Context-Agent v1.0`。
- 不得为了表面统一而改写资产中真实的 Generator；多阶段链路必须在 Manifest 中显式记录。

#### sources 节点（用户提供的源文件）：

```json
"sources": {
  "PRD": {
    "path": "docs/InJoysAI-Product-Overview.md",
    "archived_to": ".context/domain/source/InJoysAI-Product-Overview.md",
    "type": "product_requirements",
    "status": "archived"
  },
  "ARCHITECTURE": {
    "path": "docs/InJoysAI-System-Architecture-Design.md",
    "archived_to": ".context/architecture/source/InJoysAI-System-Architecture-Design.md",
    "type": "system_architecture",
    "status": "archived"
  },
  "DATABASE": {
    "path": "docs/postgresql-all-in-one.md",
    "archived_to": ".context/db/source/postgresql-all-in-one.md",
    "type": "database_design",
    "status": "archived"
  },
  "UI_SPEC": {
    "path": "docs/UI_Design_Spec.md",
    "archived_to": ".context/ui/source/UI_Design_Spec.md",
    "type": "ui_specification",
    "status": "archived"
  },
  "LEGACY_CODEBASE": {
    "path": "legacy-project/",
    "reference": ".context/legacy/source/_codebase_ref.md",
    "type": "legacy_codebase",
    "status": "referenced"
  }
}
```

| status | 说明 |
|--------|------|
| `archived` | 源文件已复制到 `source/` 目录 |
| `referenced` | 仅记录引用（遗留代码库不复制） |

#### generated_files 节点：

```json
"generated_files": {
  "root": [
    ".context/README.md",
    ".context/AGENTS.md",
    ".context/criterion.md",
    ".context/context-manifest.json"
  ],
  "architecture": [
    ".context/architecture/README.md",
    ".context/architecture/system_design.md",
    ".context/architecture/tech_stack.md",
    ".context/architecture/security_policy.md"
  ],
  "domain": [
    ".context/domain/README.md",
    ".context/domain/business_rules.md",
    ".context/domain/user_journeys.md"
  ],
  "db": [
    ".context/db/README.md",
    ".context/db/schema_design.md"
  ],
  "ui": [
    ".context/ui/README.md",
    ".context/ui/design_system.md"
  ],
  "legacy": [
    ".context/legacy/README.md",
    ".context/legacy/legacy_system_analysis.md"
  ],
  "openspec": []
}
```

> **注意**：每个 scope 的数组包含该 scope 下生成的所有文件路径

#### 同步状态与审计历史

- `last_context_sync` 只保存最近一次同步的当前状态：`source`、可选 `workflow/change_id`、`authority`、`mode`、`synced_at`、`updated_context_files` 与 `history_path`。
- Manifest 中禁止出现 `previous_sync`，禁止保存递归历史链，禁止把详细差异报告或领域决策堆入 `last_context_sync`。
- 完整事件以单行 JSON 追加到 `.context/history/context-sync.jsonl`；每条记录必须是独立对象，并至少包含 `event_type` 与 ISO 8601 `synced_at`。
- 历史日志按 `synced_at` 升序排列。领域决策的权威正文仍写入对应 Context 资产，日志只承担审计追溯。
- 历史日志不登记到 `generated_files`，避免资产读取器把审计历史作为项目上下文全文加载；Manifest 仅通过 `context_sync_history.path` 指向它。
- 写入后必须执行 `bash design/context-dev/scripts/check-context-manifest.sh`。Manifest 超过 32 KiB、JSON/JSONL 非法或出现 `previous_sync` 时视为失败。

#### 刷新 AI 入口目录树

当 `generated_files` 或 `sources` 发生变化时，写入 Manifest 前必须同步刷新 `.context/AGENTS.md` 的“目录结构”区块：

1. 从待写入的 `generated_files` 获取全部生成资产。
2. 从实际文件系统获取 `*/source/*` 文件；不得把待生成 source 写成已存在。
3. 若 `context_sync_history.path` 对应文件实际存在，将它作为审计入口加入目录树，但不得加入 `generated_files`。
4. 生成完整、无幽灵引用的 `.context/` 目录树。
5. 更新 AGENTS Metadata 的 `Updated At`；不得改写原始 `Generated At` 与真实 Generator。
6. 复核目录树与 Manifest/文件系统没有遗漏或多报，然后再写入 Manifest。

---

### Phase 3: 写入文件

写入 `{目标项目}/.context/context-manifest.json`

若本次产生同步或决策事件，同时以扁平记录追加 `{目标项目}/.context/history/context-sync.jsonl`，再更新 `last_context_sync`。禁止在新事件中复制旧事件。

---

## ✅ 完成后

报告更新结果：

```
=== Manifest 更新 ===

[sources]
✅ PRD: docs/PRD.md → .context/domain/source/
✅ ARCHITECTURE: docs/TDS.md → .context/architecture/source/
✅ DATABASE: docs/postgresql.md → .context/db/source/

[generated_files]
architecture: {{N}} 个文件
domain: {{N}} 个文件
db: {{N}} 个文件
ui: {{N}} 个文件
legacy: {{N}} 个文件

🔁 已写入: .context/context-manifest.json
```
