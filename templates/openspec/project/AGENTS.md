# Project 生成指令

> 当 `/context-openspec project` 被调用时执行此文件。

---

## 🎯 执行指令

> ⛔ **本命令只生成 `project.md`，不能触发其他文件生成**

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

### Phase 3: 生成 project.md

根据 `openspec/project.md` 的现有结构进行填充，**必须涵盖以下所有内容**：

| 章节 | 来源 | 必须 |
|------|------|:----:|
| Purpose | criterion.md | ✅ |
| Tech Stack | tech_stack.md | ✅ |
| Code Style | criterion.md / tech_stack.md | ✅ |
| Architecture Patterns | system_design.md | ✅ |
| Testing Strategy | testing_strategy.md | ✅ |
| **Git Workflow** | criterion.md / 项目约定 | ✅ |
| Domain Context | business_rules.md + user_journeys.md | ✅ |
| Important Constraints | criterion.md (MUST/MUST NOT) | ✅ |
| External Dependencies | system_design.md / tech_stack.md | ✅ |
| UI Guidelines | design_spec.md | ⚠️ 若存在 |
| Database Design | schema_design.md | ⚠️ 若存在 |

**输出**: `openspec/project.md`

---

## ✅ 完成后

报告结果：

```
=== OpenSpec Project ===
✅ openspec/project.md (生成/更新)

从 Manifest 筛选并读取的资产:
- .context/criterion.md
- .context/domain/business_rules.md
- .context/domain/user_journeys.md
- ...（列出实际读取的文件）

跳过的文件:
- .context/domain/PRD.md (copied)
- .context/architecture/TDS.md (copied)
- .context/README.md (template)
```
