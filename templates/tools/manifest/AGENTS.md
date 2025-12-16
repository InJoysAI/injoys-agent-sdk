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
  "ai_tools": {}
}
```

---

### Phase 2: 写入信息

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

---

### Phase 3: 写入文件

写入 `{目标项目}/.context/context-manifest.json`

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
