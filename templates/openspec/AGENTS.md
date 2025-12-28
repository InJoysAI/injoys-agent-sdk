# OpenSpec Integration

> `/context-openspec` 的权威执行流程

---

## 0. 幂等增强（Pre-step）

> ⛔ **必须首先执行此步骤**，在任何子命令之前执行

**执行**: `@design/context-dev/tools/integration/AGENTS.md`

> 该模块会：
> - 确保 `.context/openspec/integration.md` 存在
> - 刷新 `CONTEXT_ASSET_INDEX` 区块（从 Manifest 动态获取资产列表）

**⚠️ Pre-step 完成后必须继续执行步骤 1 或 2**

---

## 1. 子命令路由

| 子命令 | 执行模块 | 说明 |
|--------|---------|------|
| `domain` | `@design/context-dev/domain/AGENTS.md` | 生成 domain 总结 |
| `architecture` | `@design/context-dev/architecture/AGENTS.md` | 生成 architecture 总结 |
| `db` | `@design/context-dev/db/AGENTS.md` | 生成 db 总结 |
| `ui` | `@design/context-dev/ui/AGENTS.md` | 生成 ui 总结 |
| `legacy` | `@design/context-dev/legacy/AGENTS.md` | 生成 legacy 分析 |
| `project` | `@design/context-dev/openspec/project/AGENTS.md` | 生成 project.md |
| `plan` | `@design/context-dev/openspec/plan/AGENTS.md` | 生成 proposal-roadmap.md（索引/总览；可选存在 proposal-roadmap-Phase*.md 作为分 Phase 细化） |
| `proposal <change-id> [roadmap-doc]` | `@design/context-dev/openspec/proposal/AGENTS.md` | 创建提案（可显式指定提案大纲/路线图文件） |

---

## 2. 一键模式（无参数）

> ⚠️ **必须完整执行以下顺序**：

1. **执行**: `@design/context-dev/domain/AGENTS.md`
2. **执行**: `@design/context-dev/architecture/AGENTS.md`
3. **执行**: `@design/context-dev/db/AGENTS.md` （若 `.context/db/` 存在）
4. **执行**: `@design/context-dev/ui/AGENTS.md` （若 `.context/ui/` 存在）
5. **执行**: `@design/context-dev/openspec/project/AGENTS.md`
6. **执行**: `@design/context-dev/openspec/plan/AGENTS.md`
7. **输出验收报告**（见下文）

---

## 3. 验收报告

> ⛔ **必须执行**，子命令完成后向用户报告

必须向用户报告：
- ✅ 各总结生成情况（及 Manifest 状态）
- ✅ `criterion.md` 填充情况
- ✅ `openspec/project.md` 更新情况
- ✅ `openspec/proposal-roadmap.md` 更新情况
- ⚠️ 任何跳过的步骤及原因
