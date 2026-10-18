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

**对比 `sources` 节点中记录的源文件与当前实际文件**。

内容是否变化按以下顺序判断（仅针对 `status: archived` 的源）：

1. 计算 `path` 指向的当前文件的 SHA-256，与 `content_hash` 比较。
2. 旧版 Manifest 没有 `content_hash`：改为逐字节比较 `path` 与 `archived_to` 的归档副本。
3. 归档副本也不存在：视为已变更（`UPDATE`）。

`status: referenced` 的源（如遗留代码库）不跟踪内容，只检查 `path` 是否仍然存在。

| 对比结果 | 标记 | 处理 |
|---------|------|------|
| 内容相同 | `SKIP` | 跳过 |
| 内容变更 | `UPDATE` | 重新生成，并刷新 `content_hash` |
| 当前提供了、Manifest 里没有的源 | `NEW` | 询问：补充/替换？ |
| Manifest 里有、`path` 已不存在的源 | `ORPHAN` | 询问：保留/删除？ |

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

> **登记规则**：
> - 只为用户实际提供了源文档的类别在 `generated_files` / `pending_generation` 中建立条目；没有 DB / UI / 遗留文档的类别不登记。
> - `project.path` 记录相对路径 `.`，**不要写本机绝对路径**（Manifest 会被提交，绝对路径对其他人和 CI 无意义且暴露本机用户名）。
> - SSoT 的选型/跳过决策不记录在 Manifest，见 `.context/criterion.md` §7.3。

若不存在则创建初始结构（`generated_files` 只含 `root` / `architecture` / `domain` / `openspec`；`db` / `ui` / `legacy` **不预置空键**，由对应模块首次生成并登记时再创建，见上方登记规则）：

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
    "path": "."
  },
  "sources": {},
  "generated_files": {
    "root": [],
    "architecture": [],
    "domain": [],
    "openspec": []
  },
  "pending_generation": {},
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

> **`path` 与 `archived_to` 可以相同**：当用户的源文档本来就放在 `.context/*/source/` 下（或在 init 之后被迁入）时，归档副本即源文档本身，两者填同一路径是合法状态，不需要另造一份副本。此时 `content_hash` 仍按该路径计算，该文件被改动即视为源变更，走 `context-update`；旧版“逐字节比较 `path` 与 `archived_to`”在这种情况下恒为相等，应只依赖 `content_hash`。

```json
"sources": {
  "PRD": {
    "path": "docs/Product-Overview.md",
    "archived_to": ".context/domain/source/Product-Overview.md",
    "type": "product_requirements",
    "content_hash": "<源文件的 SHA-256，64 位小写 hex>",
    "status": "archived"
  },
  "ARCHITECTURE": {
    "path": "docs/System-Architecture-Design.md",
    "archived_to": ".context/architecture/source/System-Architecture-Design.md",
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
| `archived` | 源文件已移动或复制到 `source/` 目录（移动时 `path == archived_to`），并记录 `content_hash` |
| `referenced` | 仅记录引用（遗留代码库不复制），没有 `content_hash` |

**`content_hash`**：被归档源文件原始字节的 SHA-256（64 位小写 hex），在复制归档时写入，源文件被重新归档（`UPDATE`）时刷新。
计算方式任选其一：`sha256sum <file>`、`shasum -a 256 <file>`、`bash design/context-dev/scripts/context-gen.sh <file>`（输出中的 `SHA256`）。
该字段可选（旧版 Manifest 没有），但存在时必须是合法的 SHA-256，`check-context-manifest.sh` 会校验格式。

#### pending_generation 节点（init 之后、尚待 `/context-openspec` 生成的资产）：

固定写法，避免每次初始化各写各的：

```json
"pending_generation": {
  "architecture": [".context/architecture/system_design.md", ".context/architecture/tech_stack.md"],
  "domain": [".context/domain/business_rules.md"],
  "db": [".context/db/schema_design.md", ".context/db/performance_tuning.md", ".context/db/migrations_and_ssot.md"],
  "ui": [".context/ui/design_system.md"],
  "openspec": ["openspec/config.yaml", "openspec/proposal-roadmap.md"]
}
```

- 键为类别，值为**该类别下“必须生成”的基础文件**（architecture：`system_design.md`、`tech_stack.md`；domain：`business_rules.md`；db：`schema_design.md`、`performance_tuning.md`、`migrations_and_ssot.md`；ui：`design_system.md`）。路径中带 `.context/` 前缀的相对项目根，`openspec` 下的两项是项目根目录的 `openspec/` 文件。
- **不登记按需生成的文件**（如 `security_policy.md`、`user_journeys.md`、`testing_strategy.md`）：是否生成由各生成模块的 Phase 0 动态决定。
- **只写已创建的类别**：没有 DB / UI / 遗留文档就没有 `db` / `ui` / `legacy` 键（不写空数组）；读取方（integration 索引、`plan` 的棕地检测、check）一律把“键不存在”视同“空”；`openspec` 键始终存在（提案流程据此判断项目级集成是否已生成）。
- 某个文件被生成并登记进 `generated_files` 后，必须从 `pending_generation` 中移除；整个类别清空后删除该键，`openspec` 两项都生成后可置为 `{}` 或移除该键。

#### `generated_files.openspec` 的登记口径（唯一定义，其他规范以此为准）

该键登记 **openspec 相关的全部生成物**，路径带各自的真实前缀，一眼可分：

| 生成方 | 登记的路径 | 说明 |
|--------|-----------|------|
| integration 模块（`context-openspec` 的 Pre-step） | `.context/openspec/integration.md` | 位于 `.context/` 内 |
| `project` | `openspec/config.yaml` | 位于**项目根**；是 `.context/` 的派生快照 |
| `plan` | `openspec/proposal-roadmap.md`，以及总纲+分Phase 形态下的每个 `openspec/proposal-roadmap-Phase-<N>.md` | 位于**项目根** |

- **各写各的**：每个模块只登记、更新自己的产出，**不得覆盖或删除其他模块已登记的条目**；去重，重复执行不产生重复项
- **不登记**：`openspec/changes/**`、`openspec/specs/**`（它们由 specflow 管理，不是 Context 生成物）
- 登记的条目必须真实存在于磁盘；条目对应文件已不存在时，先在报告中说明，再移除条目（本工具不自动删除磁盘文件）
- 根目录的 `openspec/**` 产物是**派生产物**：登记在这里只表示“已生成”，**不代表它们是 Context 输入**（`asset-reader` 仍按路径排除，避免循环引用）

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

- 尚未发生过任何同步（刚 `/context-init` 之后）时，`last_context_sync` 为 `null`，历史文件可以不存在或为空；校验脚本此时通过。首次 `context-update sync` 会创建历史文件，此后 `last_context_sync` 必须与最新的 `context_sync` 事件一致。
- `last_context_sync` 只保存最近一次同步的当前状态：`source`、可选 `workflow/change_id`、`authority`、`mode`、`synced_at`、`updated_context_files` 与 `history_path`。
- Manifest 中禁止出现 `previous_sync`，禁止保存递归历史链，禁止把详细差异报告或领域决策堆入 `last_context_sync`。
- 完整事件以单行 JSON 追加到 `.context/history/context-sync.jsonl`；每条记录必须是独立对象，并至少包含 `event_type` 与 ISO 8601 `synced_at`。
- 历史日志按 `synced_at` 升序排列。领域决策的权威正文仍写入对应 Context 资产，日志只承担审计追溯。

#### last_openspec_project（可选，首次 `context-openspec project` 之后才出现）

记录最近一次生成 `openspec/config.yaml` 的状态，供幂等守卫与 `context-check project` 使用。只保存当前状态，不保存历史：

| 字段 | 说明 |
|------|------|
| `path` | 固定 `openspec/config.yaml` |
| `context_sha256` | 生成时的来源组合指纹（算法见 `openspec/project/AGENTS.md`「Context-SHA256 算法」），与 `config.yaml` 头部一致 |
| `config_sha256` | 生成完成后 `config.yaml` 磁盘原始字节的 sha256（64 位小写 hex）；用于发现“生成之后被改动”。**可选**，旧 Manifest 没有时按未记录处理 |
| `generated_at` | ISO 8601 |
| `workflow` | 固定 `.agents/workflows/context-openspec.md project` |

只有生成流程可以写这些字段；其他流程不得自造同级字段。
- 历史日志不登记到 `generated_files`，避免资产读取器把审计历史作为项目上下文全文加载；Manifest 仅通过 `context_sync_history.path` 指向它。
- 写入后必须执行 `bash design/context-dev/scripts/check-context-manifest.sh`。Manifest 超过 32 KiB、JSON/JSONL 非法或出现 `previous_sync` 时视为失败。

#### 刷新 AI 入口目录树

当 `generated_files` 或 `sources` 发生变化时，写入 Manifest 前必须同步刷新 `.context/AGENTS.md` 的“目录结构”区块：

1. 从待写入的 `generated_files` 获取全部生成资产。
2. 从实际文件系统获取 `*/source/*` 文件；不得把待生成 source 写成已存在。
3. 若 `context_sync_history.path` 对应文件实际存在，将它作为审计入口加入目录树，但不得加入 `generated_files`。
4. 生成完整、无幽灵引用的 `.context/` 目录树。
5. 不得改写 AGENTS Metadata 的原始 `Generated At` 与真实 Generator；不写、不刷新 `Updated At`（见 `tools/docs/AGENTS.md`“时间戳语义”）。
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
