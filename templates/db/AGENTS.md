# DB 总结生成入口

> **用途**: 从数据库设计文档生成结构化的数据库设计总结。  
> **数据库引擎**: 必须由数据库设计说明书**明确声明**（一种或多种）；参考基线见 `design/context-dev/db/engines/`（内置 PostgreSQL / MySQL / SQLite）。  
> **迁移工具**: 以 `.context/criterion.md` §7 与说明书为准，模板不预设工具或路径。  
> **触发**: `.agents/workflows/context-openspec.md db`，或由 `.agents/workflows/context-openspec.md`（无参数一键模式）按顺序调用。`/context-init` 只归档源文档，不会生成本模块的总结。

---

## 📂 目录结构（混合模式）

> ⚠️ **动态生成**：具体生成哪些文件由 Phase 0 分析决定，以下仅为示例

```
.context/db/
├── source/                    # 源文档目录（权威）
│   └── *.md                   # 完整 DB 设计文档
├── schema_design.md           # 必须生成
├── performance_tuning.md      # 必须生成
├── migrations_and_ssot.md     # 必须生成
├── [security_hardening.md]    # 按需生成（Phase 0 检测）
├── [observability.md]         # 按需生成（Phase 0 检测）
├── [ha_and_dr.md]             # 按需生成（Phase 0 检测）
└── README.md                  # 整体说明（快速索引）
```

> 方括号 `[文件名]` 表示该文件根据源文档内容动态决定是否生成

**读取优先级**：
1. 日常任务 → 读取总结文件（快速）
2. 提案检查 → 读取总结 + Schema 验证
3. 遇到不确定/细节问题 → **回溯 `source/` 目录验证**

> ⚠️ **若总结与源文档冲突，以 `source/` 目录中的源文档为准**

---

## 🎯 执行指令

使用 **源文档**（位于 `.context/db/source/` 目录），依次执行以下步骤。

> **⚠️ 全局规则**:  
> 1. 所有生成的文件都必须在顶部包含 Metadata 区块（Source, Generated At, Generator）。
> 2. 生成结果必须登记到目标项目 `.context/context-manifest.json` 的 `generated_files`（路径相对于 `.context/` 根目录）。
> 3. **输出边界**: 本命令生成的**总结资产**只能写入 `.context/db/**`（不含 `source/`）。除 §0 Pre-step 的集成资产（`.context/openspec/integration.md`）与本模块的 Manifest 登记（`.context/context-manifest.json`）之外，**不得写入其他目录**，也不得生成其他模块的总结。
> 4. **源文档只读**: 谨慎修改 `source/` 目录中的文件。

---

## 📋 数据库文档解析规则

### 语义匹配策略（容错，引擎无关）

| 语义关键词 | 匹配模式 | 输出目标 |
|-----------|---------|---------|
| Schema / 模型 / 表设计 / Entity | 逻辑模型 | `schema_design.md` |
| Index / 索引 | 索引策略 | `schema_design.md` §索引 |
| Partition / 分区 / 分表 | 分区策略 | `schema_design.md` §分区 |
| 主键 / ID / Identity / UUID | 主键策略 | `schema_design.md` §主键 |
| JSON / 半结构化 | 半结构化数据 | `schema_design.md` §半结构化 |
| Migration / 迁移 / SSoT | 迁移策略 | `migrations_and_ssot.md` |
| Tuning / 调优 / 参数 / 缓存 / 连接池 | 参数配置 | `performance_tuning.md` |
| Storage / 存储 / 持久化 / 内存 | 基础设施 | `performance_tuning.md` §基础设施 |
| HA / 高可用 / 复制 / 故障切换 | 高可用 | `ha_and_dr.md` |
| Backup / 备份 / DR / PITR / 恢复 | 灾难恢复 | `ha_and_dr.md` |
| Security / 安全 / TLS / 认证 / 权限 / 加密 | 安全加固 | `security_hardening.md` |
| Monitor / 监控 / 慢查询 / 告警 / 日志 | 可观测性 | `observability.md` |

> **找不到对应内容时**：按模板的分层规则处理（字段未知 → `N/A – 源文档未提供`；整行无依据 → 删除；整节无依据 → 保留标题 + 一行 N/A）。

### 引擎参考基线

`design/context-dev/db/engines/<引擎>.md` 只是“该记录什么”的**参考基线**：
- 只有说明书**明文采纳**的内容才能写进输出；说明书没写的不补，也不得套用其他引擎的内容
- 基线里与版本相关的项，说明书没写版本就标“需确认版本”
- 基线中的“常见起点/示例”不是项目配置

---

## Phase 0: 分析源文档（动态生成决策）

> ⛔ **必须首先执行此步骤**，在生成任何文件之前完成分析。

### 0.1 读取源文档

**读取**：`.context/db/source/` 目录下的所有文件

### 0.2 确认数据库引擎（必须）

数据库设计说明书**必须明确声明**所用数据库引擎，可以是一种或多种（例如“主库 PostgreSQL，本地缓存 SQLite”）。

| 情况 | 处理 |
|------|------|
| 说明书明确声明了引擎 | 记录每个引擎及其角色（主库 / 缓存 / 测试 / 本地存储等），继续 |
| **没有声明任何引擎** | ⛔ **停止**，请用户在说明书中补充声明（或直接告知）；**不要**从其他文档、代码或关键词猜测 |
| 声明了内置基线之外的引擎（如 Oracle） | 告知用户该引擎没有参考基线，询问是否仅用通用骨架生成（只记录说明书内容）；用户确认前不继续 |
| 声明了多个引擎 | 通用约定写正文，引擎特有内容分别写入各文件的「引擎专项」小节，并标明角色 |

对声明的内置引擎，读取 `@design/context-dev/db/engines/<引擎>.md`（`postgresql` / `mysql` / `sqlite`），作为参考基线（规则见上）。

### 0.3 关键词分析

**依次检查以下关键词，记录是否存在**：

| 检查项 | 关键词 | 若存在则生成 | 优先级 |
|--------|--------|-------------|--------|
| 安全加固 | Security, TLS, 认证, 权限, 加密 | `security_hardening.md` | 推荐 |
| 可观测性 | Monitor, 监控, 慢查询, 告警, 日志 | `observability.md` | 推荐 |
| 高可用/灾备 | HA, 高可用, 复制, Backup, 备份, DR, PITR | `ha_and_dr.md` | 可选 |

### 0.4 输出生成计划

**必须输出**：

```
=== 生成计划 ===
数据库引擎（来自说明书）：
- {{引擎 1}}（{{角色}}）
- {{引擎 2}}（{{角色}}）  # 若有

必须生成：
- schema_design.md（Schema/索引/分区）
- performance_tuning.md（参数/连接/基础设施）
- migrations_and_ssot.md（迁移工具以 criterion §7 / 说明书为准）

推荐生成（关键词匹配）：
- security_hardening.md（检测到：{{关键词}}）
- observability.md（检测到：{{关键词}}）

跳过（未检测到相关内容）：
- ha_and_dr.md
```

**确认后继续 Phase 1**。

---

## 模板引用

| 输出文件 | 模板路径 |
|----------|----------|
| `schema_design.md` | `templates/db/schema_design.md.template` |
| `performance_tuning.md` | `templates/db/performance_tuning.md.template` |
| `migrations_and_ssot.md` | `templates/db/migrations_and_ssot.md.template` |
| `security_hardening.md` | `templates/db/security_hardening.md.template` |
| `observability.md` | `templates/db/observability.md.template` |
| `ha_and_dr.md` | `templates/db/ha_and_dr.md.template` |

> 模板路径相对于 `design/context-dev/`。模板为引擎无关骨架，引擎差异写在各文件的「引擎专项」小节（每个声明的引擎一节）。

## Phase 1: 填充模板

> **所有 Prompt 共用规则**：
> - 只记录说明书已写出的内容；引擎只限 Phase 0 确认的引擎
> - 参考基线仅用于判断“该记录什么”，不得把基线内容当作项目约定
> - 命令、示例中不得出现真实账号、密码、IP、连接串
> - 严格遵守模板内的「使用说明」与分层缺失规则；生成后删除「使用说明」与「示例」块

### 1. 填充 `schema_design.md` (必须)

**Prompt**:
```markdown
# Role
你是一位数据库架构师。

# Task
从数据库设计文档生成 Schema 设计规范，引擎为：{{Phase 0 确认的引擎及角色}}。

# Requirements
1. **主键策略** — 方案与原因
2. **核心实体 ER 图** — Mermaid ERD
3. **表设计规范** — 命名约定、字段类型
4. **索引策略** — 类型、适用场景、维护
5. **分区/分表策略** — 引擎不支持或说明书没有时整节 N/A
6. **半结构化数据** — 何时用、何时提取为独立列
7. **约束规则**
8. **引擎专项** — 每个声明的引擎一个小节，只写说明书采纳的引擎特有约定

# Output Format
使用 `schema_design.md` 模板格式输出。
```

### 2. 填充 `performance_tuning.md` (必须)

**Prompt**:
```markdown
# Role
你是一位数据库性能工程师。

# Task
从数据库设计文档生成性能调优指南，引擎为：{{Phase 0 确认的引擎及角色}}。

# Requirements
1. **基础设施前置条件** — 存储、内存、运行环境
2. **内存与缓存**、**写入与持久化**
3. **维护作业** — 清理/统计信息/碎片整理
4. **连接管理** — 连接池、并发限制
5. **查询优化约定**
6. **引擎专项** — 每个声明的引擎一个小节

参数值必须来自说明书。监控指标、告警阈值、慢查询分析**不写在本文件**，留给 `observability.md`。

# Output Format
使用 `performance_tuning.md` 模板格式输出。
```

### 3. 填充 `migrations_and_ssot.md` (必须)

**Prompt**:
```markdown
# Role
你是一位数据库 DevOps 工程师。

# Task
生成 Schema 迁移与 SSoT 约束规范，引擎为：{{Phase 0 确认的引擎及角色}}。

# Requirements
1. **SSoT 原则** — 迁移文件目录为唯一真相源（目录与工具以 `.context/criterion.md` §7 与说明书为准；两者不一致时标记待确认，不自行裁决）
2. **迁移工作流** — 工具、标准流程、命令
3. **零停机迁移** — expand-contract（说明书没有要求时整节 N/A）
4. **兼容性规则**
5. **禁止/需审批操作** — 不得与“允许”的做法自相矛盾
6. **引擎专项** — 如 DDL 事务性、在线变更方式

# Output Format
使用 `migrations_and_ssot.md` 模板格式输出。
```

### 4. 填充 `security_hardening.md` (推荐)

**Prompt**:
```markdown
# Role
你是一位数据库安全工程师。

# Task
从数据库设计文档生成安全加固指南，引擎为：{{Phase 0 确认的引擎及角色}}。

# Requirements
1. **认证**、**网络与访问控制**、**传输与存储加密**
2. **角色与权限** — 最小权限、账号分离
3. **数据保护** — 敏感字段
4. **审计要求** — 只写“审计什么”，采集与告警归 `observability.md`
5. **引擎专项** — 每个声明的引擎一个小节（无服务端的引擎通常只有文件权限与加密）

# Authority Note
> 本文件为 DB 视角安全约束。最终权威归档于 `architecture/security_policy.md`。

# Output Format
使用 `security_hardening.md` 模板格式输出。
```

### 5. 填充 `observability.md` (推荐)

**Prompt**:
```markdown
# Role
你是一位数据库可靠性工程师。

# Task
从数据库设计文档生成可观测性规范，引擎为：{{Phase 0 确认的引擎及角色}}。

# Requirements
1. **关键指标与告警阈值**（本文件独占）
2. **采集与展示**
3. **慢查询**、**日志约定**
4. **告警分级与响应**
5. **引擎专项** — 引擎特有高危指标；指标名随版本变化，说明书没写版本就标“需确认版本”

# Output Format
使用 `observability.md` 模板格式输出。
```

### 6. 填充 `ha_and_dr.md` (可选)

**Prompt**:
```markdown
# Role
你是一位数据库可靠性工程师。

# Task
从数据库设计文档生成高可用与灾难恢复规范，引擎为：{{Phase 0 确认的引擎及角色}}。

# Requirements
1. **RPO/RTO 目标**
2. **高可用架构与故障切换**（单机/嵌入式整节 N/A）
3. **复制**
4. **备份与恢复**（含 PITR 是否支持）
5. **演练**
6. **引擎专项** — 每个声明的引擎一个小节

监控与告警不在本文件重复，引用 `observability.md`。

# Output Format
使用 `ha_and_dr.md` 模板格式输出。
```

### 7. 自检（Phase 1 完成后、Phase 2 之前）

- [ ] 生成的文件中没有“使用说明”“示例”块，没有残留 `{{...}}`
- [ ] 每个文件 Metadata 的 Engines 与说明书声明一致；没有为未声明的引擎建小节，也没有套用其他引擎的内容
- [ ] 所有具体参数值、阈值都能在说明书中找到；基线里的“常见起点”没有被当作项目配置
- [ ] 监控/阈值/慢查询只出现在 `observability.md`；其他文件只引用，不重复
- [ ] 迁移工具与目录与 criterion §7 / 说明书一致，未预设工具
- [ ] 示例与正文中没有真实账号、密码、IP、连接串
- [ ] 缺失内容按分层规则处理，没有逐格 N/A

---

## Phase 2: 更新 Manifest

> ⛔ **必须执行此步骤**，Phase 1 完成后立即执行

**执行**: `@design/context-dev/tools/manifest/AGENTS.md` (mode: update)

**更新内容**：
1. 将本次生成的所有文件添加到 `generated_files.db` 数组（该键不存在时先创建，不要预置空数组）
2. 确认 `sources.DATABASE` 记录正确

**⚠️ Phase 2 完成后必须执行 ✅ 完成后 报告**

---

## ✅ 完成后

向调用方（`@design/context-dev/openspec/AGENTS.md` 路由层）汇报完成状态，**然后停止**：
> ⛔ 本模块完成后**不得自行继续执行其他模块**。子命令模式下路由层直接结束；一键模式下由路由层决定下一步。（`.context/AGENTS.md` 是索引文档，不是调用方。）

汇报内容：
- ✅ 已生成的文件列表
- ⏩ 跳过的文件及原因
- 🔁 Manifest 更新状态

---

## 执行备注

- **缺失内容分层处理**：字段未知 → `N/A – 源文档未提供`；整行无依据 → 删除；整节无依据 → 保留标题 + 一行 N/A
- 优先使用表格和 Mermaid 图
- 安全内容的最终权威在 `architecture/security_policy.md`，本模块只写 DB 视角
- 已生成的 `.context/db` 不会自动更新；需要按新模板重新执行 `context-openspec db`
