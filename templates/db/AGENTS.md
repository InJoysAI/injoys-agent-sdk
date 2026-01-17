# DB 总结生成入口

> **用途**: 从数据库设计文档生成结构化的数据库设计总结。  
> **触发**: `/context-openspec db` 或由 `design/context-dev/AGENTS.md` Step 5.2 调用。

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
> 3. **输出边界**: 本命令只能写入 `.context/db/**`（不含 `source/`）。
> 4. **源文档只读**: 不得修改 `source/` 目录中的文件。。

---

## 📋 数据库文档解析规则

优先读取目标项目内的 `docs/PostgreSQL_Design_Guidelines.md`（若存在），否则按以下内置映射解析。

### 语义匹配策略（容错）

| 语义关键词 | 匹配模式 | 输出目标 |
|-----------|---------|---------|
| Schema / 模型 / 表设计 / Entity | 逻辑模型 | `schema_design.md` |
| Index / 索引 / B-Tree / GIN | 索引策略 | `schema_design.md` §索引 |
| Partition / 分区 | 分区策略 | `schema_design.md` §分区 |
| UUID / 主键 / Identity | 主键策略 | `schema_design.md` §主键 |
| JSONB / JSON / 非结构化 | JSONB 使用 | `schema_design.md` §JSONB |
| Migration / 迁移 / Goose / SSoT | 迁移策略 | `migrations_and_ssot.md` |
| Tuning / 调优 / 参数 | 参数配置 | `performance_tuning.md` |
| Storage / 存储 / WAL / Huge Pages | 基础设施 | `performance_tuning.md` §基础设施 |
| Connection / 连接池 / PgBouncer | 连接管理 | `performance_tuning.md` §连接池 |
| HA / 高可用 / Patroni | 高可用 | `ha_and_dr.md` |
| Backup / 备份 / DR / PITR | 灾难恢复 | `ha_and_dr.md` |
| Security / 安全 / TLS / 认证 / pg_hba | 安全加固 | `security_hardening.md` |
| Monitor / 监控 / pg_stat / Vacuum | 可观测性 | `observability.md` |

> **找不到对应内容时**：在输出文件对应小节标注 `N/A – 源文档未提供`。

---

## Phase 0: 分析源文档（动态生成决策）

> ⛔ **必须首先执行此步骤**，在生成任何文件之前完成分析。

### 0.1 读取源文档

**读取**：`.context/db/source/` 目录下的所有文件

### 0.2 关键词分析

**依次检查以下关键词，记录是否存在**：

| 检查项 | 关键词 | 若存在则生成 | 优先级 |
|--------|--------|-------------|--------|
| 安全加固 | Security, TLS, 认证, pg_hba, SCRAM | `security_hardening.md` | 推荐 |
| 可观测性 | Monitor, 监控, pg_stat, Vacuum, 日志 | `observability.md` | 推荐 |
| 高可用/灾备 | HA, 高可用, Patroni, Backup, 备份, DR, PITR | `ha_and_dr.md` | 可选 |

### 0.3 输出生成计划

**必须输出**：

```
=== 生成计划 ===
必须生成：
- schema_design.md（Schema/索引/分区）
- performance_tuning.md（参数/连接池/基础设施）
- migrations_and_ssot.md（Goose 迁移/SSoT 约束）

推荐生成（关键词匹配）：
- security_hardening.md（检测到：TLS, 认证）
- observability.md（检测到：pg_stat, Vacuum）

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

> 模板路径相对于 `design/context-dev/`

## Phase 1: 填充模板

### 1. 填充 `schema_design.md` (必须)

**Prompt**:
```markdown
# Role
你是一位数据库架构师。

# Task
从数据库设计文档生成 Schema 设计规范。

# Requirements（固定小节，缺失标注 N/A）
1. **主键策略** — UUIDv7 vs BIGSERIAL 选择及原因
2. **核心实体 ER 图** — Mermaid ERD
3. **表设计规范** — 命名约定、字段类型
4. **索引策略** — B-Tree/GIN/BRIN 使用场景
5. **分区策略** — 分区条件、pg_partman 配置
6. **JSONB 使用规范** — 何时用、何时提取为独立列
7. **约束规则** — FK/CHECK/EXCLUSION

# Output Format
使用 `schema_design.md` 模板格式输出。
```

### 2. 填充 `performance_tuning.md` (必须)

**Prompt**:
```markdown
# Role
你是一位 PostgreSQL DBA。

# Task
从数据库设计文档生成性能调优指南。

# Requirements（固定小节，缺失标注 N/A）
1. **基础设施前置条件** — 存储分离、文件系统、预读、Huge Pages、CPU/NUMA
2. **内存配置** — shared_buffers, work_mem, maintenance_work_mem
3. **WAL/Checkpoint** — checkpoint_timeout, max_wal_size
4. **Autovacuum** — 触发阈值、执行能力
5. **连接池** — PgBouncer 配置、max_connections

# Output Format
使用 `performance_tuning.md` 模板格式输出。
```

### 3. 填充 `migrations_and_ssot.md` (必须)

**Prompt**:
```markdown
# Role
你是一位数据库 DevOps 工程师。

# Task
生成 Schema 迁移与 SSoT 约束规范。

# Requirements（固定小节，缺失标注 N/A）
1. **SSoT 原则** — `SSoT/schema/migrations/` 为唯一真相源
2. **Goose 工作流** — goose create → goose up → verify
3. **零停机迁移** — 分阶段变更策略（expand-contract）
4. **兼容性规则** — 向后兼容变更类型
5. **禁止操作** — 生产环境禁止的 DDL

# Output Format
使用 `migrations_and_ssot.md` 模板格式输出。
```

### 4. 填充 `security_hardening.md` (推荐)

**Prompt**:
```markdown
# Role
你是一位数据库安全工程师。

# Task
从数据库设计文档生成 PostgreSQL 安全加固指南。

# Requirements（固定小节，缺失标注 N/A）
1. **认证加固** — SCRAM-SHA-256（废弃 MD5）
2. **pg_hba.conf** — 白名单、禁止 trust、强制 hostssl
3. **TLS 配置** — 证书、最低协议版本、mTLS
4. **最小权限** — 角色分离、仅授予必要权限
5. **敏感数据** — 列加密、数据脱敏

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
从数据库设计文档生成 PostgreSQL 可观测性规范。

# Requirements（固定小节，缺失标注 N/A）
1. **关键指标与阈值** — 可用性、性能、复制、风险、存储
2. **Transaction ID 回卷监控** — xid_age > 15 亿极高危
3. **pg_stat_statements** — 配置与慢查询分析
4. **Vacuum 健康检查** — dead_tup、last_autovacuum
5. **日志配置** — log_min_duration_statement
6. **采集与告警** — Prometheus/Grafana 集成建议

# Output Format
使用 `observability.md` 模板格式输出。
```

### 6. 填充 `ha_and_dr.md` (可选)

**Prompt**:
```markdown
# Role
你是一位数据库可靠性工程师。

# Task
从数据库设计文档生成高可用与灾难恢复规范。

# Requirements（固定小节）
1. **HA 架构** — Patroni/流量路由/复制模式
2. **备份策略** — pgBackRest 配置、备份周期
3. **PITR** — 时间点恢复流程
4. **防勒索** — 不可变备份(S3 Object Lock)
5. **RTO/RPO 目标**

# Output Format
使用 `ha_and_dr.md` 模板格式输出。
```

---

## Phase 2: 更新 Manifest

> ⛔ **必须执行此步骤**，Phase 1 完成后立即执行

**执行**: `@design/context-dev/tools/manifest/AGENTS.md` (mode: update)

**更新内容**：
1. 将本次生成的所有文件添加到 `generated_files.db` 数组
2. 确认 `sources.DATABASE` 记录正确

**⚠️ Phase 2 完成后必须执行 ✅ 完成后 报告**

---

## ✅ 完成后

向上级调用者汇报完成状态：
- ✅ 已生成的文件列表
- ⏩ 跳过的文件及原因
- 🔁 Manifest 更新状态

---

## 执行备注

- **缺失内容标注 N/A**：若某小节在源文档中无对应内容，标注 "N/A – 源文档未提供"
- 优先使用表格和 Mermaid 图
- 安全内容同步至 `architecture/security_policy.md`
