# PostgreSQL 参考基线 (Engine Reference: PostgreSQL)

> **用途**: 当数据库设计说明书**明确声明**使用 PostgreSQL 时，`db` 模块把本文件作为“参考基线”，帮助判断每个主题该记录什么、常见的取舍点有哪些。
>
> ⚠️ **使用规则（必须遵守）**
> - 本文件是**通用建议，不是项目约定**。只有数据库设计说明书**明文采纳**的内容才能写入 `.context/db/*.md`；说明书没提的，不得因为本文件写了就补进输出，也不得把“推荐值”当成项目配置。
> - 版本相关的特性以说明书声明的版本为准；说明书没有声明版本时，涉及新版本特性的条目要标注“需确认版本”。
> - 命令与参数仅作写法参考，写入输出前需与说明书核对。

---

## 1. Schema 设计 (`schema_design.md`)

### 主键

| 方案 | 适用 | 注意 |
|------|------|------|
| `BIGINT GENERATED ALWAYS AS IDENTITY` | 单库、需要紧凑和顺序 | 分库/合并数据时需另行规划 ID 空间 |
| UUIDv7（时间有序） | 分布式生成、对外暴露 ID | 内置 `uuidv7()` 在 **PostgreSQL 18** 起提供；更早版本需应用层或扩展生成 |
| UUIDv4（随机） | 不要求顺序、小表 | 大表 B-Tree 随机写入，易造成页分裂和缓存命中下降 |

- 分区表的主键/唯一约束**必须包含分区键列**。

### 类型与命名

| 数据 | 建议类型 | 备注 |
|------|---------|------|
| 时间 | `timestamptz` | 避免无时区时间戳 |
| 金额 | `numeric(p, s)` | 避免浮点 |
| 枚举 | `text` + `CHECK`，或 `CREATE TYPE ... AS ENUM` | 枚举类型新增值容易、删除困难 |
| 半结构化 | `jsonb` | 高频过滤字段提取为生成列并建索引 |
| 长文本 | `text` | 无需 `varchar(n)`，需要长度约束时用 `CHECK` |

### 索引

| 类型 | 适用 |
|------|------|
| B-Tree | 等值/范围/排序/唯一约束（默认） |
| GIN | 数组、`jsonb` 包含查询、全文检索 |
| BRIN | 物理顺序与键相关的超大表（如按时间追加的日志） |
| GiST | 范围类型、几何、排他约束 |

- 组合索引把区分度高且常用于等值过滤的列放前面；条件索引（`WHERE`）可缩小索引体积。
- 在线建索引用 `CREATE INDEX CONCURRENTLY`；失败会留下 INVALID 索引，需要清理。
- 排他约束对标量列使用 `=` 时需要 `btree_gist` 扩展。

### 分区

- 常见触发条件：表很大（以数据量与查询模式判断）、需要按时间批量清理旧数据。
- 类型：`RANGE`（时间序列）、`LIST`（离散值）、`HASH`（均匀打散）。
- 分区自动化可用 pg_partman，其函数签名随主版本变化，使用前核对版本文档。

### 约束

`PRIMARY KEY`、`NOT NULL`、`UNIQUE`、`FOREIGN KEY` 为基础；业务规则用 `CHECK`；时间段不重叠等用排他约束。

---

## 2. 迁移 (`migrations_and_ssot.md`)

- 迁移工具以 `.context/criterion.md` 与说明书为准（如 Goose / Flyway / Alembic / Prisma 等），本文件不指定。
- PostgreSQL 的 DDL 是**事务性**的，迁移可放在事务内；但 `CREATE INDEX CONCURRENTLY` 不能在事务块内执行。

| 变更 | 风险 | 常见做法 |
|------|------|---------|
| 加可空列 / 带常量默认值的列 | 低（PG 11+ 常量默认值不重写表） | 直接添加 |
| 加外键 | 校验时持锁扫描 | `ADD CONSTRAINT ... NOT VALID` 后 `VALIDATE CONSTRAINT` |
| 建索引 | 阻塞写入 | `CREATE INDEX CONCURRENTLY` |
| 改列类型 | 可能重写全表、持排他锁 | 新增列 + 回填 + 切换（expand-contract） |
| 重命名列/表 | 与旧版本应用不兼容 | expand-contract，兼容期内新旧并存 |
| 删除列/表 | 不可逆 | 应用不再引用后再删；必要时先保留一个周期 |

- 建议在迁移里设置 `lock_timeout`，避免长时间排队阻塞业务。

---

## 3. 性能 (`performance_tuning.md`)

### 起点参数（需按负载和内存实测调整）

| 参数 | 常见起点 | 说明 |
|------|---------|------|
| `shared_buffers` | 内存的 25% 左右 | 数据缓存 |
| `effective_cache_size` | 内存的 50%-75% | 仅供优化器估算 |
| `work_mem` | 按并发评估 | **每个操作**分配，复杂查询可能多份；高并发慎调大 |
| `maintenance_work_mem` | 数百 MB 至数 GB | VACUUM、建索引 |
| `checkpoint_timeout` / `max_wal_size` | 分钟级 / 数 GB 起 | 平滑 checkpoint I/O |
| `checkpoint_completion_target` | 0.9 | 在间隔内均匀写入 |
| `wal_compression` | on | 以 CPU 换 WAL 体积 |
| `huge_pages` | try / on | 大内存实例可减少页表开销，需系统预留 |

### 维护与连接

- Autovacuum 默认阈值对大表偏保守，可对大表单独调低 `autovacuum_vacuum_scale_factor`（表级参数），并按 I/O 能力调整 cost 参数与 worker 数。
- 连接：`max_connections` 保守设置，用连接池（如 PgBouncer）承接大量客户端；事务级池化（transaction mode）下不能依赖会话级状态（会话变量、`LISTEN` 等），预编译语句的支持取决于池版本与配置。

---

## 4. 安全 (`security_hardening.md`)

| 主题 | 常见做法 |
|------|---------|
| 密码认证 | `password_encryption = scram-sha-256`（PG 14 起为默认）；不再使用 md5 |
| 访问控制 | `pg_hba.conf` 白名单；远程连接使用 `hostssl`；不使用 `trust`；末尾显式 reject |
| TLS | `ssl = on`；`ssl_min_protocol_version = 'TLSv1.2'`（或更高）；密码套件通常保持默认，不额外加入弱算法 |
| 权限 | 应用、迁移、监控、备份使用不同角色；只授予必要权限；收回 `PUBLIC` 在 `public` schema 的默认权限 |
| 审计 | `log_connections`、`log_disconnections`、`log_statement = 'ddl'`；强合规场景可用 pgAudit |
| 敏感数据 | 密码只存哈希；敏感字段按需应用层加密；分析/客服使用脱敏视图 |

---

## 5. 可观测性 (`observability.md`)

| 对象 | 手段 |
|------|------|
| 慢查询/热点 SQL | `pg_stat_statements`（需 `shared_preload_libraries`）；`log_min_duration_statement` |
| 事务 ID 回卷 | 监控 `age(datfrozenxid)`；上限约 21 亿，告警阈值应远低于上限并留出处理时间（阈值以说明书为准） |
| Vacuum 健康 | `pg_stat_user_tables`（`n_dead_tup`、`last_autovacuum`）、`pg_stat_progress_vacuum` |
| 复制 | `pg_stat_replication`、`pg_stat_wal_receiver`；复制延迟（字节与时间） |
| 连接与锁 | `pg_stat_activity`、`pg_locks`；连接数占 `max_connections` 的比例 |
| 存储 | 数据盘与 WAL 目录使用率 |
| 采集 | 常见为 postgres_exporter + Prometheus + Grafana；**指标名以所用 exporter 版本为准** |

- `postgresql.conf` 中注释使用 `#`。

---

## 6. 高可用与灾备 (`ha_and_dr.md`)

| 主题 | 常见做法 |
|------|---------|
| 复制 | 流复制；同步/异步取决于 RPO 要求（`synchronous_commit` 各级别对应不同的丢失窗口） |
| 故障转移 | 由 HA 管理器（如 Patroni）+ 分布式一致性存储完成选主；流量由代理/VIP 按角色路由 |
| 备份 | 物理备份 + WAL 归档（如 pgBackRest、Barman）；逻辑备份（`pg_dump`）用于迁移与小库 |
| PITR | 基础备份 + 连续 WAL 归档，恢复到指定时间点或 LSN |
| 防勒索 | 备份写入不可变存储（如对象存储的保留锁），与生产凭证隔离 |
| 演练 | 定期做恢复演练并记录实际 RTO/RPO |
