# Project 生成指令

> 当 `.agent/workflows/context-openspec.md project` 被调用时执行此文件。

---

## 🎯 执行指令

> ⛔ **本命令只生成 `openspec/config.yaml`，不能触发其他文件生成**

依次执行以下步骤：

---

### Phase 1: 读取 Context 资产

**执行**: `@design/context-dev/tools/asset-reader/AGENTS.md`

> 该模块会：
> - 从 `context-manifest.json` 的 `generated_files` 节点获取文件列表
> - 按 scope 遍历：architecture, domain, db, ui, legacy
> - 跳过 README.md（目录说明）
> - 跳过 openspec/（避免循环引用）
> - 跳过 source/（按需回溯）

---

### Phase 2: 生成 config.yaml

生成/更新 `openspec/config.yaml`，用于向提案创建注入项目规划上下文。该文件是 `.context/` 权威资产的**只读派生快照**，不得引入来源资产中不存在的新约束，也不得手工维护。

生成前，对本次实际读取的 `.context` 文件计算 **Context-SHA256** 组合指纹；将来源列表与指纹写入 YAML 顶部注释。**幂等守卫**：满足以下**全部**条件才可跳过重写——
1. 来源指纹与现有 `config.yaml` 头部 `Context-SHA256` 一致；
2. Manifest `last_openspec_project.config_sha256` 存在时，`config.yaml` 当前内容摘要与之相符（不存在则只看条件 1）。

**强制重生成**（跳过守卫，指纹不变也要重写）：用户明确要求重生成，或 `.agent/workflows/context-check.md project` 报告了内容缺陷 / `[DESYNC]` 时。指纹只能证明“来源没变”，不能证明“快照内容正确”，所以内容有误时必须能绕过守卫。

#### Context-SHA256 算法（规范性 · 生成与 `.agent/workflows/context-check.md project` 必须一致）

输入集合 = Phase 1 实际读取的资产路径（已跳过 `README.md` / `openspec/` / `source/`；**包含** `.context/criterion.md`）。

1. 路径规范：仓库相对路径、POSIX 正斜杠 `/`（例如 `.context/criterion.md`）。
2. 对每个文件计算单文件摘要（UTF-8 路径字节 + 单字节 `0x0A` + **磁盘原始文件字节**，不做换行归一化）：
   ```text
   file_digest = hex(sha256( utf8(relative_path) || 0x0A || file_bytes ))
   ```
3. 按 `relative_path` 字典序升序排序上述 `file_digest`（排序键为路径，不是 digest）。
4. 将排序后的 hex 串以换行符 `\n` 拼接；**末条之后不加**尾随换行：
   ```text
   joined = file_digest_1 || 0x0A || file_digest_2 || ... || file_digest_n
   Context-SHA256 = hex(sha256(utf8(joined)))
   ```
5. 写入 `openspec/config.yaml` 顶部 `# Context-SHA256: <64-hex>`。
6. 文件写完后，把 `openspec/config.yaml` 登记进 Manifest `generated_files.openspec`（去重；不覆盖其他模块已登记的条目；口径见 `tools/manifest/AGENTS.md`），并从 `pending_generation.openspec` 移除该项
7. 更新 Manifest `last_openspec_project`（字段见 `tools/manifest/AGENTS.md`）：`context_sha256`（即上面的组合指纹）与 `config_sha256`（= `hex(sha256(config.yaml 的磁盘原始字节))`，在文件最终写入后计算）。

> 参考实现（Python 3）：
> ```python
> import hashlib
> from pathlib import Path
> paths = sorted(relative_paths)  # e.g. [".context/criterion.md", ...]
> digests = []
> for p in paths:
>     b = p.replace("\\", "/").encode("utf-8") + b"\n" + Path(p).read_bytes()
>     digests.append(hashlib.sha256(b).hexdigest())
> context_sha256 = hashlib.sha256("\n".join(digests).encode("utf-8")).hexdigest()
> ```

**格式要求（必须遵循）**：

```yaml
# Generated from: .context/context-manifest.json + listed Context assets
# Context-SHA256: <sha256>
# Context-SHA256-Algo: path-nl-content-then-join-hex  # optional marker; algorithm defined in design/context-dev/openspec/project/AGENTS.md
# DO NOT EDIT: regenerate with .agent/workflows/context-openspec.md project
schema: spec-driven

context: |
  ...

rules:
  proposal:
    - ...
  specs:
    - ...
  design:
    - ...
  tasks:
    - ...
```

**填充要求**：
- `schema`: 使用 `spec-driven`
- 顶部注释必须包含生成来源、`Context-SHA256` 和禁止手工编辑声明
- `context`: 必须覆盖以下所有内容（内容需精炼，避免冗长）：

| 章节 | 来源 | 必须 |
|------|------|:----:|
| Purpose | domain/business_rules.md 的业务背景/目标；其次 `.context/README.md` | ✅ |
| Tech Stack | tech_stack.md | ✅ |
| Code Style | criterion.md / tech_stack.md | ✅ |
| Architecture Patterns | system_design.md | ✅ |
| Testing Strategy | testing_strategy.md（domain） | ⚠️ 若存在 |
| Git Workflow | criterion.md 中若有分支/提交约定 | ⚠️ 若存在 |
| Domain Context | business_rules.md + user_journeys.md | ✅ |
| Important Constraints | criterion.md (MUST/MUST NOT) | ✅ |
| External Dependencies | system_design.md / tech_stack.md | ✅ |
| UI Guidelines | ui/design_system.md | ⚠️ 若存在 |
| Database Design | db/schema_design.md | ⚠️ 若存在 |

**缺失来源处理**：标记“必须”的章节若所列来源资产均未提供对应内容，写 `N/A – 来源资产未提供`；标记“若存在”的章节（Testing Strategy、Git Workflow、UI Guidelines、Database Design）来源不存在时**整节省略**，检查方（`check/project`）同样按“若存在”处理，不会因缺这些章节告警。**不得**为填满章节而编造来源资产中没有的内容或约定。

`rules` 建议最少包含：
- `tasks`: 任务拆分粒度、SSoT-first、验证/归档要求
- `specs`: Given/When/Then 或 WHEN/THEN 场景格式（与团队验收习惯一致）

**权威边界**：
- 项目强制约束以 `.context/criterion.md` 为准
- 架构和领域事实以对应 `.context/architecture/`、`.context/domain/` 资产为准
- `config.yaml` 只做精炼和格式转换，不复制长段原文

**体积预算**（`config.yaml` 会被注入每次提案创建，过大会拉低信息密度、增加 token 成本）：
- 目标 ≤ **20 KiB**；**软上限 32 KiB**（超过只告警，不失败）
- 接近或超过目标时按以下优先级裁剪：① `MUST` / `MUST NOT` 约束（**不得删减**，最多合并重复表述）→ ② 业务规则与核心流程 → ③ 架构与技术栈 → ④ UI / DB → ⑤ 背景叙述
- 优先做法：合并重复、去掉修饰、对长段落改为“摘要 + 来源路径（如 `见 .context/domain/business_rules.md BR-0xx`）”，而不是复制原文
- 任何裁剪都不得引入来源中不存在的内容
- 发现来源冲突时停止生成并报告，不在 `config.yaml` 内自行裁决

**输出**: `openspec/config.yaml`

---

## ✅ 完成后

> ⛔ 本模块只生成 `openspec/config.yaml`。完成后向调用方（`@design/context-dev/openspec/AGENTS.md` 路由层）报告并**停止**，不得自行继续执行 `plan` 等其他模块。子命令模式下路由层直接结束；一键模式下由路由层决定下一步。（`.context/AGENTS.md` 是索引文档，不是调用方。）

报告结果：

```
=== OpenSpec Project ===
✅ openspec/config.yaml (生成/更新)

从 Manifest 筛选并读取的资产:
- .context/criterion.md
- .context/domain/business_rules.md
- .context/domain/user_journeys.md
- ...（列出实际读取的文件）

跳过的文件:
- .context/domain/source/PRD.md (copied)
- .context/architecture/source/TDS.md (copied)
- .context/README.md (template)
```
