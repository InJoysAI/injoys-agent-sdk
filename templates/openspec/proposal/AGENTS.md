# Context Proposal 指令

> 当 `/context-openspec proposal` 被调用时执行此文件。
> 本指令增强 OpenSpec 标准提案流程，集成 Context 资产读取。

---

## 🎯 执行指令

> ⛔ **必须依次执行所有步骤**，遵循 OpenSpec 规范。

---

## Pre-flight Checklist

> ⚠️ **Proposal 特定检查**

| 检查项 | 通过条件 | 失败处理 |
|--------|---------|---------|
| project.md | `openspec/project.md` 存在 | ⛔ STOP，先运行 `/context-openspec project` |
| proposal-roadmap.md | `openspec/proposal-roadmap.md` 存在 | ⛔ STOP，先运行 `/context-openspec plan` |
| proposal-roadmap-Phase*.md（可选） | `openspec/proposal-roadmap-Phase*.md` 或 `openspec/proposal-roadmap-Phase-*.md` 存在 | 若存在，则作为补充规划文档一并读取 |

**命令参数**：
- `/context-openspec proposal <change-id>`：默认使用 `openspec/proposal-roadmap.md`（并补充读取 Phase 文件，若存在）
- `/context-openspec proposal <change-id> <roadmap-doc>`：显式指定“提案大纲文档”，如 `openspec/proposal-roadmap-Phase3.md` 或 `openspec/proposal-roadmap-Phase-0.5.md`
  - `roadmap-doc` 期望是一个**具体文件路径**（不建议传 `*` 通配符；若用户传了通配符，需先让用户确认要读取哪些具体文件）


---

## Phase 1: 读取 Context 规范

### 1.1 读取 Context 资产

**执行**: `@design/context-dev/tools/asset-reader/AGENTS.md`

> 该模块会从 `context-manifest.json` 筛选并读取所有生成的 Context 文件。

**额外读取**（proposal 专用）：
- `.context/openspec/integration.md` — Context 读取规范
- `openspec/project.md` — 项目整体情况
- `openspec/proposal-roadmap.md` — 规划文档（索引/总览）
- `openspec/proposal-roadmap-Phase*.md` / `openspec/proposal-roadmap-Phase-*.md` — 分 Phase 规划（若存在，视为更细粒度计划）

### 1.2 匹配提案

根据用户输入（如 "用户登录模块"）**模糊匹配**对应的提案条目：
- 匹配范围：
  - 若用户提供了 `roadmap-doc` 参数 → **优先在该文件中匹配**
  - 否则先在 `openspec/proposal-roadmap.md` 匹配；若存在 `openspec/proposal-roadmap-Phase*.md`/`openspec/proposal-roadmap-Phase-*.md`，再在这些文档中补充匹配
- 匹配规则：名称包含关键词 OR Change ID 匹配
- 若无法匹配 → 向用户确认是新建提案还是选择已有提案

### 1.3 检查现有变更

```bash
openspec list              # 已有的 changes
openspec list --specs      # 已有的 specs
```

检查相关代码或文档（如涉及的模块）

---

## Phase 2: 创建提案

> ⛔ **执行 OpenSpec 官方提案创建流程**

**参考执行**: `@openspec/AGENTS.md` → "## Creating Change Proposals" 章节

**执行步骤**：
1. 选择唯一的 `change-id`（kebab-case, verb-led）
2. 创建目录结构：`openspec/changes/<change-id>/`
3. 编写 `openspec/changes/<change-id>/proposal.md`、`openspec/changes/<change-id>/tasks.md`
4. 创建 `openspec/changes/<change-id>/specs/<capability>/spec.md` delta 文件
5. 若需技术设计，创建 `openspec/changes/<change-id>/design.md`（参考 openspec/AGENTS.md 中的条件）
6. 增加以 SSoT 为首的步骤：验证是否需要更改 schema/API 合约；如果不需要，则添加明确的“SSoT 未更改”检查，以及 openspec validate 和 openspec archive 任务；如果需要，则包括 schema/postgres.hcl 和 api/main.tsp 的更新以及相应的代码生成（codegen）。
7. 如果涉及接口方面的设计，需要同步更新`.context/architecture/api_strategy.md`,添加对应的请求响应示例

**Context 增强**（在 OpenSpec 标准基础上添加）：

在 `proposal.md` 的 **Impact** 章节，必须关联相关 Context 资产：

```markdown
## Impact
- Affected specs: [list capabilities]
- Affected code: [key files/systems]

### 关联 Context 资产
| Scope | 资产路径 | 关联说明 |
|-------|---------|---------|
| criterion | `.context/criterion.md` | 必须遵守的约束 |
| {{SCOPE}} | `{{ASSET_PATH}}` | {{RELATION_DESC}} |
```

---

## Phase 3: SSoT 先行检查

> ⚠️ **仅当项目使用 SSoT 架构时执行**

读取 `.context/architecture/tech_stack.md` 判断项目 SSoT 类型：

| Tech Stack | SSoT 文件 | 检查项 |
|------------|----------|--------|
| PostgreSQL | `schema/postgres.hcl` | 数据库相关变更 |
| REST API (Go) | `api/main.tsp` | API 相关变更 |
| Tauri/Rust | N/A | 无 SSoT 约束 |

**若存在 SSoT 约束**，`tasks.md` 必须遵循顺序：
1. 修改 SSoT 文件（schema/api）
2. 运行 Codegen
3. 实现业务代码
4. 编写测试

---

## Phase 4: 验证提案

```bash
openspec validate <change-id> --strict
```

> ⛔ **必须解决所有验证错误后才能提交提案**

**常见错误**：
- "Change must have at least one delta" → 检查 `specs/` 目录
- "Requirement must have at least one scenario" → 使用 `#### Scenario:` 格式

---

## ✅ 完成后

> ⛔ **只有 openspec validate 通过后才能报告完成**

报告结果：

```
=== 提案创建完成 ===
✅ openspec/changes/<change-id>/proposal.md
✅ openspec/changes/<change-id>/tasks.md
✅ openspec/changes/<change-id>/specs/<capability>/spec.md

验证结果:
$ openspec validate <change-id> --strict
✅ All checks passed

关联的 Context 资产:
- .context/domain/business_rules.md
- .context/architecture/security_policy.md

下一步:
- 开始实现: /context-start <change-id>
- 或者 审阅提案: /context-check  proposal <change-id>
```
