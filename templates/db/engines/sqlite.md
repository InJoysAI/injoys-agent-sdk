# SQLite 参考基线 (Engine Reference: SQLite)

> **用途**: 当数据库设计说明书**明确声明**使用 SQLite 时，`db` 模块把本文件作为“参考基线”，帮助判断每个主题该记录什么、常见的取舍点有哪些。
>
> ⚠️ **使用规则（必须遵守）**
> - 本文件是**通用建议，不是项目约定**。只有数据库设计说明书**明文采纳**的内容才能写入 `.context/db/*.md`；说明书没提的，不得因为本文件写了就补进输出，也不得把“推荐值”当成项目配置。
> - SQLite 是**嵌入式、单文件、进程内**数据库：没有服务端、网络认证、内置复制和分区。模板里这类主题在 SQLite 下通常整节写一行 N/A（并说明原因），不要套用服务端数据库的做法。
> - 特性依赖 SQLite 版本；说明书没有声明版本（或没有声明所用的驱动/运行时内置版本）时，涉及新版本特性的条目标注“需确认版本”。

---

## 1. Schema 设计 (`schema_design.md`)

### 主键与类型

| 主题 | 常见做法 | 注意 |
|------|---------|------|
| 主键 | `INTEGER PRIMARY KEY`（成为 rowid 别名，自增高效） | `AUTOINCREMENT` 只在“ID 不得复用”时才需要，有额外开销 |
| 非整数主键 | 有序 UUID 存 `TEXT` 或 `BLOB` | 大表考虑 `WITHOUT ROWID` |
| 类型系统 | **类型亲和**，列类型不强制 | 需要严格类型时使用 `STRICT` 表（3.37+） |
| 时间 | `TEXT`（ISO-8601）或 `INTEGER`（Unix 时间） | 没有原生时间类型，需统一一种 |
| 金额 | `INTEGER`（最小货币单位） | 避免浮点 |
| JSON | 以 `TEXT` 存储，用内置 JSON 函数（3.38+ 默认内置）查询 | 高频过滤字段用生成列或表达式索引 |

### 外键与约束

- **外键默认关闭**：每个连接都要执行 `PRAGMA foreign_keys = ON`。
- 支持 `CHECK`、`UNIQUE`、`NOT NULL`；部分索引、表达式索引可用。

### 索引与分区

- 只有 B-Tree 类索引（含部分索引、表达式索引）；用 `EXPLAIN QUERY PLAN` 验证；`ANALYZE` / `PRAGMA optimize` 维护统计。
- **没有表分区**；数据量增长的应对方式（归档、按库文件拆分、`ATTACH`）需由说明书决定。

---

## 2. 迁移 (`migrations_and_ssot.md`)

- 迁移工具以 `.context/criterion.md` 与说明书为准，本文件不指定。
- SQLite 的 DDL 是事务性的；常用 `PRAGMA user_version` 记录 schema 版本。
- `ALTER TABLE` 能力有限：`ADD COLUMN`、`RENAME COLUMN`（3.25+）、`DROP COLUMN`（3.35+，有限制）；其余变更通常用“新建表 → 复制数据 → 删除旧表 → 重命名”的重建流程，并在重建期间处理好外键开关。
- 应用升级时需要处理**用户本地已存在的数据库文件**：迁移必须可从任意历史版本向前升级，并在升级前备份文件。

---

## 3. 性能 (`performance_tuning.md`)

| 设置 | 常见做法 | 说明 |
|------|---------|------|
| `PRAGMA journal_mode = WAL` | 读写并发更好 | 不适用于网络文件系统；会产生 `-wal` / `-shm` 文件 |
| `PRAGMA synchronous` | WAL 下常用 `NORMAL`；要最大持久性用 `FULL` | 取舍在于断电时可能丢失的最近事务 |
| `PRAGMA busy_timeout` | 设置等待时长 | 避免并发写入立即报 `SQLITE_BUSY` |
| `PRAGMA cache_size` / `mmap_size` / `temp_store` | 按内存与数据量评估 | |
| `PRAGMA page_size` | 须在建库前设置 | |

- **单写者模型**：同一时刻只有一个写事务；保持写事务短小，必要时用 `BEGIN IMMEDIATE` 提前获取写锁。
- 并发连接数、连接池规模应按单写者模型规划。

---

## 4. 安全 (`security_hardening.md`)

| 主题 | 常见做法 |
|------|---------|
| 访问控制 | 无内置用户/权限；靠**文件权限**与进程隔离 |
| 静态加密 | 内置不支持；需要时用 SQLCipher 或 SEE 等方案（以说明书为准） |
| 注入 | 使用参数化查询；不拼接 SQL |
| 扩展加载 | 不启用不必要的 `load_extension` |
| 备份与残留 | 备份文件与 `-wal` 文件同样含数据；删除数据后残留可用 `secure_delete` / `VACUUM` 处理 |

---

## 5. 可观测性 (`observability.md`)

| 对象 | 手段 |
|------|------|
| 完整性 | `PRAGMA integrity_check` / `quick_check` |
| 查询计划 | `EXPLAIN QUERY PLAN`；统计表 `sqlite_stat1` |
| WAL | `PRAGMA wal_checkpoint`；监控 `-wal` 文件大小，防止无限增长 |
| 空间 | 数据库文件与碎片情况（`freelist_count`） |
| 日志/指标 | 无内置服务端日志与指标，需由应用层记录慢操作与错误 |

---

## 6. 高可用与灾备 (`ha_and_dr.md`)

- **没有内置复制或故障转移**；“高可用”章节通常写一行 N/A，说明由应用或宿主环境负责。

| 主题 | 常见做法 |
|------|---------|
| 备份 | 在线备份 API（`.backup`）或 `VACUUM INTO`；**不要在写入期间直接复制数据库文件**（WAL 模式下需同时包含 `-wal`） |
| 持续复制 | 可选外部方案（如 Litestream 把 WAL 复制到对象存储），以说明书选型为准 |
| 恢复 | 用备份文件替换，并校验 `integrity_check`；记录实际恢复步骤与时间 |
| 演练 | 定期做恢复演练 |
