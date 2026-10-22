# MySQL 参考基线 (Engine Reference: MySQL)

> **用途**: 当数据库设计说明书**明确声明**使用 MySQL（含兼容分支时需说明书写明）时，`db` 模块把本文件作为“参考基线”，帮助判断每个主题该记录什么、常见的取舍点有哪些。
>
> ⚠️ **使用规则（必须遵守）**
> - 本文件是**通用建议，不是项目约定**。只有数据库设计说明书**明文采纳**的内容才能写入 `.context/db/*.md`；说明书没提的，不得因为本文件写了就补进输出，也不得把“推荐值”当成项目配置。
> - 本文件以 **MySQL 8.x + InnoDB** 为默认前提；说明书声明了其他版本或分支（5.7、MariaDB、云托管版本）时，特性以其官方文档为准，涉及版本差异的条目标注“需确认版本”。
> - 命令与参数仅作写法参考，写入输出前需与说明书核对。

---

## 1. Schema 设计 (`schema_design.md`)

### 主键

- InnoDB 表按主键聚簇存储，**每张表都应有主键**；二级索引会携带主键值，所以主键宜短。

| 方案 | 适用 | 注意 |
|------|------|------|
| `BIGINT UNSIGNED AUTO_INCREMENT` | 单库、写入顺序友好 | 分库合并时需规划 ID 空间 |
| 有序 UUID（如应用层 UUIDv7 存 `BINARY(16)`，或 `UUID_TO_BIN(uuid, 1)` 调整字节序） | 分布式生成 | 不要用随机 UUIDv4 做大表主键；`CHAR(36)` 占空间大 |

### 类型与命名

| 数据 | 建议类型 | 备注 |
|------|---------|------|
| 字符集 | `utf8mb4` | 8.0 默认排序规则为 `utf8mb4_0900_ai_ci`，需与说明书的比较/大小写规则一致 |
| 金额 | `DECIMAL(p, s)` | 避免浮点 |
| 时间 | `DATETIME` / `TIMESTAMP` | `TIMESTAMP` 受 2038 年限制并按会话时区转换，选型要明确 |
| 半结构化 | `JSON` | 高频过滤字段用生成列并建索引（或 8.0.13+ 函数索引） |
| 枚举 | 小表/稳定取值用 `ENUM`，否则用关联表或 `TINYINT` + 约束 | `ENUM` 变更需要 DDL |

### 索引

- B-Tree 为主；组合索引遵循最左前缀；覆盖索引减少回表；前缀索引用于长字符串；`FULLTEXT`、空间索引按需。
- 8.0 的**不可见索引**（`INVISIBLE`）可先“隐藏”再删除，用于验证索引是否可去。

### 分区

- 类型：`RANGE`、`LIST`、`HASH`、`KEY`。
- 限制：分区表的主键/唯一键必须包含分区列；InnoDB 分区表**不支持外键**。是否分区需结合这些限制评估。

### 约束

8.0.16 起 `CHECK` 约束才真正生效（更早版本被解析后忽略）；外键依赖 InnoDB。

---

## 2. 迁移 (`migrations_and_ssot.md`)

- 迁移工具以 `.context/criterion.md` 与说明书为准，本文件不指定。
- MySQL 的 DDL **会隐式提交**，不能像 PostgreSQL 那样把多条 DDL 包进一个可回滚的事务；8.0 起单条 DDL 是原子的，但迁移批次整体不可回滚，`Down` 迁移要单独设计。

| 变更 | 常见做法 |
|------|---------|
| 加列 | 8.0.12+ 许多场景支持 `ALGORITHM=INSTANT`；显式写 `ALGORITHM` 与 `LOCK`，不满足条件时让语句失败而不是悄悄锁表 |
| 建/删索引 | 在线 DDL：`ALGORITHM=INPLACE, LOCK=NONE`（按场景确认） |
| 大表改结构 | 评估在线 DDL 的支持情况；不支持时用 gh-ost / pt-online-schema-change 等在线变更工具 |
| 重命名/删除 | expand-contract，兼容期内新旧并存，确认应用不再引用后删除 |

---

## 3. 性能 (`performance_tuning.md`)

| 参数 | 常见起点 | 说明 |
|------|---------|------|
| `innodb_buffer_pool_size` | 专用库约内存的 50%-75% | 最关键的缓存参数 |
| `innodb_redo_log_capacity`（8.0.30+）/ `innodb_log_file_size`（旧版） | 按写入量评估 | 过小导致频繁 checkpoint |
| `innodb_flush_log_at_trx_commit` | `1` 为完全持久 | 调低会换性能但可能丢失最近事务 |
| `sync_binlog` | `1` 为完全持久 | 同上 |
| `innodb_io_capacity` | 按存储能力 | 后台刷脏速率 |
| `max_connections` | 保守设置 | 每连接有独立内存开销，配合连接池 |

- 8.0 已移除查询缓存；不要再规划依赖它。
- 慢查询：开启慢查询日志，`long_query_time` 以业务要求为准；用 `EXPLAIN` / `EXPLAIN ANALYZE` 分析。

---

## 4. 安全 (`security_hardening.md`)

| 主题 | 常见做法 |
|------|---------|
| 认证 | 8.0 默认 `caching_sha2_password`；旧客户端不兼容时才评估降级，并记录原因 |
| 传输加密 | 开启 TLS（`tls_version` 限制为 TLSv1.2 及以上）；需要强制时用 `require_secure_transport = ON` |
| 账号 | 不开放远程 `root`；按应用、迁移、监控、备份拆分账号；`GRANT` 只给必要权限；密码策略可用 `validate_password` 组件 |
| 审计 | 企业版有审计插件；社区版需用社区方案或通用日志/外部审计 |
| 敏感数据 | 密码只存哈希；敏感字段按需应用层加密；分析/客服使用脱敏视图 |

---

## 5. 可观测性 (`observability.md`)

| 对象 | 手段 |
|------|------|
| 慢查询/热点 SQL | 慢查询日志；`performance_schema` 的语句摘要表；`sys` schema 视图 |
| InnoDB 状态 | `SHOW ENGINE INNODB STATUS`；缓冲池命中、行锁等待、死锁（`innodb_print_all_deadlocks` 可把死锁写入错误日志） |
| 连接 | `Threads_connected`、`Threads_running` 占 `max_connections` 的比例 |
| 复制 | 复制线程状态与延迟（`SHOW REPLICA STATUS` 等，8.0 术语已从 slave 改为 replica/source；旧版本用旧命令） |
| 存储 | 数据目录、binlog、redo/undo 空间使用 |
| 采集 | 常见为 mysqld_exporter + Prometheus + Grafana；**指标名以所用 exporter 版本为准** |

---

## 6. 高可用与灾备 (`ha_and_dr.md`)

| 主题 | 常见做法 |
|------|---------|
| 复制 | 异步复制；半同步降低丢数风险；Group Replication / InnoDB Cluster 提供多节点一致性 |
| 故障转移 | 由编排工具（如 MySQL Router + InnoDB Cluster、Orchestrator 等）完成切换；以说明书选型为准 |
| 备份 | 逻辑备份（`mysqldump` / `mysqlpump`）适合小库；物理备份（Percona XtraBackup、MySQL Enterprise Backup）适合大库 |
| PITR | 全量备份 + 连续 binlog 回放到目标时间点 |
| 防勒索 | 备份写入不可变存储，与生产凭证隔离 |
| 演练 | 定期做恢复演练并记录实际 RTO/RPO |
