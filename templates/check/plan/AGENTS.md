# Plan Check 指令

> 当 `/context-check plan` 被调用时执行此文件。

---

## 🎯 执行指令

> ⛔ **必须依次执行所有步骤**，不得跳过或中断。

---

## Phase 1: 文件存在性校验

检查以下文件是否存在：

| 文件 | 必需 | 说明 |
|------|:----:|------|
| `openspec/proposal-roadmap.md` | ✅ | Roadmap 文件 |
| `.context/context-manifest.json` | ✅ | 用于读取 Context 资产 |

**结果**：
- ❌ 缺失必需文件 → 失败，提示先运行 `/context-openspec plan`
- ✅ 所有必需文件存在 → 继续

---

## Phase 2: 格式正确性校验

**参考模板**: `design/context-dev/templates/proposal-roadmap.md.template`

### 2.1 必须包含的节

| 节 | 说明 |
|------|------|
| 项目信息（Metadata） | 项目名称、当前阶段、生成日期、来源文档 |
| 阶段总览（Phase Overview） | 表格列出所有 Phase：阶段、名称、目标、预计周期 |
| 各 Phase 详情 | 每个 Phase 包含多个提案 |
| 依赖关系图 | Mermaid 格式的提案依赖图 |

### 2.2 提案格式校验

每个提案必须包含：
- `Change ID`（格式：`feat-/fix-/chore-/refactor-` 开头）
- `优先级`（P0/P1/P2）
- `状态`（proposed/in-progress/done）
- `范围` 描述

**结果**：
- ❌ 缺失必需节 → 警告
- ⚠️ 提案格式不完整 → 警告
- ✅ 格式正确 → 继续

---

## Phase 3: Context 内容一致性校验

### 3.1 读取 Context 资产

**执行**: `@design/context-dev/tools/asset-reader/AGENTS.md`

> 该模块会：
> - 从 `context-manifest.json` 的 `generated_files` 节点获取文件列表
> - 按 scope 遍历：architecture, domain, db, ui, legacy
> - 跳过 README.md、openspec/、source/

### 3.2 内容校验

根据读取的资产**动态校验** Roadmap 内容：

**必须校验**（若资产存在）：
| 资产 | 校验规则 |
|------|---------|
| `criterion.md` | Roadmap 规划不得违反 MUST/MUST NOT 约束 |
| `architecture/tech_stack.md` | Roadmap 中涉及的技术必须在 Tech Stack 中定义 |
| `domain/business_rules.md` | Context 中定义的核心业务规则应在 Roadmap 中有对应提案 |

**条件校验**（若资产存在）：
| 资产 | 校验规则 |
|------|---------|
| `architecture/security_policy.md` | 涉及安全的功能应有相应提案 |
| `ui/design_spec.md` | 涉及 UI 的功能应有相应提案 |
| `db/*.md` | 涉及数据库的功能应有相应提案 |

**示例**：
- ❌ Roadmap 规划使用 Redis，但 `tech_stack.md` 未定义
- ⚠️ `business_rules.md` 中定义了"消息去重"规则，但 Roadmap 中无对应提案
- ⚠️ `security_policy.md` 中要求"API Key 安全存储"，但 Roadmap 中未明确相关提案

---

## Phase 4: 提案关系与基础设施校验

### 4.1 依赖关系校验

| 校验项 | 校验规则 |
|--------|---------|
| 依赖声明 | 每个提案必须明确标注 `depends_on` 或声明无依赖 |
| 循环依赖 | 依赖关系图中无循环依赖 |
| 依赖可达 | 被依赖的提案必须存在于 Roadmap 中 |

### 4.2 基础设施识别校验

| 校验项 | 校验规则 |
|--------|---------|
| Phase 0/1 包含基础设施 | 若存在 `infra`, `dual-db`, `rls`, `typespec` 等提案，必须在 Phase 0/1 |
| 依赖链正确 | 功能提案不得排在其依赖的基础设施提案之前 |

**基础设施类型检查**：
| 类型 | 关键词 | 校验规则 |
|------|--------|---------|
| 数据层 | `dual-db`, `rls`, `migration` | 所有写数据库的提案必须依赖这些 |
| 认证层 | `auth-register`, `auth-sso` | 需要用户身份的提案必须依赖认证 |
| API 契约 | `typespec`, `api-contract` | API 实现提案必须依赖契约定义 |
| 合规前置 | `age-gate`, `geoblock` | 认证提案必须依赖合规检查 |

**示例**：
 - ❌ `feat-lesson-eprp-session` 排在 `feat-infra-rls` 之前
 - ❌ `feat-auth-register` 无依赖，但应依赖 `feat-infra-dual-db`
 - ⚠️ 基础设施提案 `feat-infra-typespec` 不在 Phase 1

### 4.3 功能覆盖校验

| 校验项 | 校验规则 |
|--------|---------|
| PRD 功能覆盖 | `domain/` 中定义的核心功能应在 Roadmap 中有对应提案 |
| 架构组件覆盖 | `architecture/system_design.md` 中定义的组件应在 Roadmap 中有初始化提案 |

---

## Phase 5: 生成检查报告

输出检查报告（✅/⚠️/❌），并给出最小修复建议：

```
🔍 Roadmap 检查报告
文件：openspec/proposal-roadmap.md
状态：[🟢 通过 | 🟡 需要关注 | 🔴 失败]

✅/❌ 文件存在性
   └── proposal-roadmap.md [状态]

✅/⚠️/❌ 格式正确性
   ├── 项目信息 [状态]
   ├── 阶段总览 [状态]（N 个 Phase）
   ├── 各 Phase 详情 [状态]（N 个提案）
   └── 依赖关系图 [状态]

✅/⚠️/❌ Context 内容一致性
   ├── 技术栈 → [状态]
   ├── 约束遵守 → [状态]
   ├── 业务规则 → [状态]
   └── 安全策略 → [状态]

✅/⚠️ 提案完整性
   ├── PRD 功能覆盖 → [状态]
   ├── 架构组件覆盖 → [状态]
   └── 依赖合理性 → [状态]

📋 修复建议：
1. [具体修复建议]
2. [具体修复建议]
```
