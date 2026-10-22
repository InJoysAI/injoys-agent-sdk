# Architecture 总结生成入口

> **用途**: 从架构设计文档生成结构化的架构总结。  
> **触发**: `.agents/workflows/context-openspec.md architecture`，或由 `.agents/workflows/context-openspec.md`（无参数一键模式）按顺序调用。`/context-init` 只归档源文档，不会生成本模块的总结。

---

## 📂 目录结构（混合模式）

> ⚠️ **动态生成**：具体生成哪些文件由 Phase 0 分析决定，以下仅为示例

```
.context/architecture/
├── source/                    # 源文档目录（权威）
│   └── *.md                   # 完整架构文档
├── system_design.md           # 必须生成
├── tech_stack.md              # 必须生成
├── [security_policy.md]       # 按需生成（Phase 0 检测）
├── [risks_and_debt.md]        # 按需生成（Phase 0 检测）
├── [api_strategy.md]          # 按需生成（Phase 0 检测）
├── [deployment_view.md]       # 按需生成（Phase 0 检测）
├── [...]                      # 更多文件见模板引用表
└── README.md                  # 整体说明（快速索引）
```

> 方括号 `[文件名]` 表示该文件根据源文档内容动态决定是否生成

**读取优先级**：
1. 日常任务 → 读取总结文件（快速）
2. 提案检查 → 读取总结 + 约束验证
3. 遇到不确定/细节问题 → **回溯 `source/` 目录验证**

> ⚠️ **若总结与源文档冲突，以 `source/` 目录中的源文档为准**

---


## 🎯 执行指令

使用 **源文档**（位于 `.context/architecture/source/` 目录），依次执行以下步骤。

> **⚠️ 全局规则**:  
> 1. 所有生成的文件都必须在顶部包含 Metadata 区块（Source, Generated At, Generator）；ADR 文件使用 `adr_template` 自带的头部（状态、日期、决策者），不要求 Metadata。
> 2. 生成结果必须登记到目标项目 `.context/context-manifest.json` 的 `generated_files`（路径相对于 `.context/` 根目录）。
> 3. **输出边界**: 本命令生成的**总结资产**只能写入 `.context/architecture/**`（不含 `source/`）。除 §0 Pre-step 的集成资产（`.context/openspec/integration.md`）与本模块的 Manifest 登记（`.context/context-manifest.json`）之外，**不得写入其他目录**，也不得生成其他模块的总结。
> 4. **源文档只读**: 谨慎修改 `source/` 目录中的文件。

---

## 📋 架构文档解析规则

### 语义匹配策略（容错）

> **⚠️ 实际项目未必严格按 arc42 编号组织**。采用关键词/语义定位：

| 语义关键词 | 匹配模式 | 输出目标 |
|-----------|---------|---------|
| Goals / 目标 / Quality / 质量 | 介绍与目标 | `system_design.md` §系统概述（摘要）；`introduction_and_goals.md`（详细，若生成） |
| Constraints / 约束 / 限制 | 约束条件 | `constraints.md`（若生成），摘要入 `system_design.md` |
| Context / 上下文 / Boundary / 边界 | 上下文与范围 | `context_view.md`（若生成），摘要入 `system_design.md` §系统边界 |
| Stack / 技术栈 / Technology | 解决方案策略 | `tech_stack.md` |
| Container / 容器 / Component / 组件 | 构建块视图 | `system_design.md` §核心组件；`container_component_view.md`（详细，若生成） |
| Runtime / 运行时 / Sequence / 流程 | 运行时视图 | `runtime_view.md`（若生成），场景列表入 `system_design.md` |
| Deployment / 部署 / Infra / 基础设施 | 部署视图 | `deployment_view.md`（若生成），摘要入 `system_design.md` §部署拓扑 |
| Security / 安全 / Auth / 认证 | 跨切面概念 | `security_policy.md` |
| Risk / 风险 / Debt / 债务 | 风险与债务 | `risks_and_debt.md` |

> **找不到对应内容时（分层处理，避免到处写 N/A）**：
> - **字段未知** → 该单元格写 `N/A – 源文档未提供`
> - **整行/整个条目没有依据** → **删除该行**，不要写“未声明 XX”
> - **整节没有依据** → 保留标题，下面只写一行 `N/A – 源文档未提供`；模板标注“可选”的章节可以直接删除
> - 模板里没有任何预设事实：技术、策略、数值、法规、环境、流程都必须来自源文档，不得保留或套用示例内容

---

## Phase 0: 分析源文档（动态生成决策）

> ⛔ **必须首先执行此步骤**，在生成任何文件之前完成分析。

### 0.1 读取源文档

**读取**：`.context/architecture/source/` 目录下的所有文件

读取优先级（必须遵循）：
1. 优先读取用户确认的“权威架构设计文档”（已归档到 `.context/architecture/source/`）
2. 若存在 `docs/architecture.md`（已归档到 `.context/architecture/source/`）且用户确认其为权威输入 → 优先读取
3. 其余 `.context/architecture/source/*.md` → 作为补充

### 0.2 关键词分析

**依次检查以下关键词，记录是否存在**：

| 检查项 | 关键词 | 若存在则生成 | 优先级 |
|--------|--------|-------------|--------|
| 安全策略 | Security, Auth, 安全, 认证, 授权, OAuth, JWT | `security_policy.md` | 推荐 |
| 风险分析 | Risk, Debt, 风险, 债务, 技术债, 隐患 | `risks_and_debt.md` | 推荐 |
| API 设计 | API, 接口, RESTful, GraphQL, Endpoint | `api_strategy.md` | 可选 |
| 部署架构 | Deployment, 部署, Infra, K8s, Docker | `deployment_view.md` | 可选 |
| 数据模型 | Schema, 数据模型, ERD, 实体 | `data_architecture.md` | 可选 |
| 运行时流程 | Runtime, 流程, Sequence, 状态机 | `runtime_view.md` | 可选 |
| 跨切面 | 日志, 监控, 缓存, 错误处理, Logging | `cross_cutting_concepts.md` | 可选 |
| 介绍与目标 | Goals, 目标, 质量目标, Quality Goals, 利益相关方 | `introduction_and_goals.md` | 可选 |
| 约束 | Constraints, 约束, 限制, 合规, 组织约束 | `constraints.md` | 可选 |
| 上下文与边界 | Context, 上下文, Boundary, 边界, 外部系统 | `context_view.md` | 可选 |
| 构建块视图 | Container, 容器, Component, 组件, 模块划分 | `container_component_view.md` | 可选 |
| 架构决策 | ADR, 决策记录, Decision, 选型理由 | `adr_template.md`（按每条决策实例化为 `adr_<编号>_<主题>.md`） | 可选 |

### 0.3 输出生成计划

**必须输出**：

```
=== 生成计划 ===
必须生成：
- system_design.md（架构总览）
- tech_stack.md（技术栈约束）

推荐生成（关键词匹配）：
- security_policy.md（检测到：Security, OAuth, JWT）
- api_strategy.md（检测到：API, RESTful）

跳过（未检测到相关内容）：
- risks_and_debt.md
- deployment_view.md
```

**确认后继续 Phase 1**。

---

## 模板引用

| 输出文件 | 模板路径 |
|----------|----------|
| `system_design.md` | `templates/architecture/system_design.md.template` |
| `tech_stack.md` | `templates/architecture/tech_stack.md.template` |
| `security_policy.md` | `templates/architecture/security_policy.md.template` |
| `risks_and_debt.md` | `templates/architecture/risks_and_debt.md.template` |
| `api_strategy.md` | `templates/architecture/api_strategy.md.template` |
| `deployment_view.md` | `templates/architecture/deployment_view.md.template` |
| `data_architecture.md` | `templates/architecture/data_architecture.md.template` |
| `runtime_view.md` | `templates/architecture/runtime_view.md.template` |
| `cross_cutting_concepts.md` | `templates/architecture/cross_cutting_concepts.md.template` |
| `context_view.md` | `templates/architecture/context_view.md.template` |
| `container_component_view.md` | `templates/architecture/container_component_view.md.template` |
| `constraints.md` | `templates/architecture/constraints.md.template` |
| `introduction_and_goals.md` | `templates/architecture/introduction_and_goals.md.template` |
| `adr_template.md` | `templates/architecture/adr_template.md.template` |

> 模板路径相对于 `design/context-dev/`

## Phase 1: 填充模板

### 1. 填充 `system_design.md` (必须)

**Prompt**:
```markdown
# Role
你是一位系统架构师。

# Task
从架构设计文档生成系统设计总览。

# Requirements（固定小节；`system_design.md` 是总览，详细内容归属各详细文件）
1. **系统概述** — 一句话描述
2. **质量目标** — 一行摘要，指向 `introduction_and_goals.md`
3. **系统边界** — C4 L1 图或摘要，指向 `context_view.md`（外部依赖在该文件）
4. **核心组件** — 主要模块及职责（**必须保留此表**，路线图检查据此核对组件覆盖）
5. **数据存储** — 摘要，指向 `data_architecture.md`
6. **关键接口/集成点** — 名称与类型，指向 `api_strategy.md`
7. **NFR/SLO** — 只写源文档明文给出的指标
8. **部署拓扑** — 摘要，指向 `deployment_view.md`
9. **关键运行时场景** — 场景列表，指向 `runtime_view.md`

# Notes
- 对应详细文件**没有生成**时，才在本文件展开该节；生成了就只放摘要和链接，不重复
- 缺失内容按「找不到对应内容时」的分层规则处理，不要逐格写 N/A；不得套用通用的网关/服务/数据库/队列结构或编造 SLA、QPS
- **务必**添加 Metadata 区块到文件顶部

# Output Format
使用 `system_design.md` 模板格式输出。
```

### 2. 填充 `tech_stack.md` (必须)

**Prompt**:
```markdown
# Role
你是一位技术架构师。

# Task
从架构设计文档提取技术栈选型。

# Requirements
- 按层级分类：后端、前端、数据库、基础设施、DevOps
- 标注强制等级：MUST（必须）/ SHOULD（推荐）/ MUST NOT（禁止）
- 包含版本要求
- **务必**添加 Metadata 区块到文件顶部

# Semantic Keywords
Stack, Technology, 技术栈, 框架, 工具链

# Output Format
使用 `tech_stack.md` 模板格式输出。
```

### 3. 填充 `security_policy.md` (推荐)

**Prompt**:
```markdown
# Role
你是一位安全架构师。

# Task
从架构设计文档提取安全策略。

# Requirements
- 认证方案（OAuth2、OIDC、JWT）
- 授权模型（RBAC/ABAC）
- 数据加密（传输层/存储层）
- 敏感数据处理规则
- 合规性要求（GDPR、PCI-DSS）
- **务必**添加 Metadata 区块到文件顶部

# NFR/Security 权威说明
> 架构文档为安全策略的**权威来源**。若 PRD 也包含安全/NFR 内容，仅作为补充引用，不覆盖架构决策。

# Semantic Keywords
Security, Auth, 安全, 认证, 授权, 加密, 合规

# Output Format
使用 `security_policy.md` 模板格式输出。
```

### 4. 填充 `risks_and_debt.md` (推荐)

**Prompt**:
```markdown
# Role
你是一位风险分析师。

# Task
从架构设计文档提取技术风险与技术债务。

# Requirements
- 风险：可能性/影响程度/负责人/缓解措施
- 技术债：类型/严重性/目标解决时间
- **务必**添加 Metadata 区块到文件顶部

# Semantic Keywords
Risk, Debt, 风险, 债务, 技术债, 隐患

# Output Format
使用 `risks_and_debt.md` 模板格式输出。
```

### 5. 填充其余按需文件（Phase 0 命中才生成）

对 Phase 0 命中的 `api_strategy.md`、`deployment_view.md`、`data_architecture.md`、`runtime_view.md`、`cross_cutting_concepts.md`、`introduction_and_goals.md`、`constraints.md`、`context_view.md`、`container_component_view.md`、ADR：

- 以「模板引用」表中的对应模板为结构，只填充源文档有依据的内容；无依据的内容按「找不到对应内容时」的分层规则处理（删行 / 整节一行 N/A / 可选章节直接删除）
- 不得为了凑齐文件而生成空壳；未命中的文件不生成
- **内容归属（只在归属文件写，其他文件引用）**：质量目标与质量场景 → `introduction_and_goals.md`；系统边界/外部系统/范围 → `context_view.md`；容器与组件 → `container_component_view.md`；数据存储与一致性 → `data_architecture.md`；部署/环境/IaC/CI-CD → `deployment_view.md`；运行时场景 → `runtime_view.md`；认证/授权/加密/合规 → `security_policy.md`；`system_design.md` 只放摘要和链接（核心组件表除外）
- 每个文件顶部添加 Metadata 区块

### 6. 生成 `architecture/README.md`

为 architecture 目录生成 `README.md` 快速索引：列出本次实际生成的文件（一行说明用途）、`source/` 中的源文档，以及“总结与源文档冲突时以 `source/` 为准”的提示。README 同样登记到 Manifest（`generated_files.architecture`）。

---

## Phase 2: 更新 Manifest

> ⛔ **必须执行此步骤**，Phase 1 完成后立即执行

**执行**: `@design/context-dev/tools/manifest/AGENTS.md` (mode: update)

**更新内容**：
1. 将本次生成的所有文件添加到 `generated_files.architecture` 数组
2. 确认 `sources.ARCHITECTURE` 记录正确

**示例**：
```json
"generated_files": {
  "architecture": [
    ".context/architecture/README.md",
    ".context/architecture/system_design.md",
    ".context/architecture/tech_stack.md",
    // ... 本次生成的其他文件
  ]
}
```

**⚠️ Phase 2 完成后必须执行 ✅ 完成后 报告**

---

## ✅ 完成后

向调用方（`@design/context-dev/openspec/AGENTS.md` 路由层）汇报完成状态，**然后停止**：
> ⛔ 本模块完成后**不得自行继续执行其他模块**。子命令模式下路由层直接结束；一键模式下由路由层决定下一步。（`.context/AGENTS.md` 是索引文档，不是调用方。）

汇报内容：
- ✅ 已生成的文件列表
- ⏩ 跳过的文件及原因（标注 N/A 的小节）
- 🔁 Manifest 更新状态

---

## 执行备注

- 输出保持简洁；优先使用表格和 Mermaid 图
- **缺失内容分层处理**：字段未知写 "N/A – 源文档未提供"；整行无依据删行；整节无依据保留标题加一行 N/A（可选章节直接删除）；不要逐格写 N/A，也不要写“未声明 XX”
- 填充完成后检查各视图间的一致性
- **模板残留自检（必须）**：每个生成文件不得残留 `{{...}}`、「使用说明（生成后删除本块）」块、「示例（仅演示写法，生成时删除）」块、HTML 注释里的格式提示；示例内容（示例实体、示例参数、示例工具）不得出现在输出里
- **重复自检**：同一内容只在归属文件出现；`system_design.md` 里不得再展开已有详细文件的内容
- 风险/债务看板不得带“更新日期”列
