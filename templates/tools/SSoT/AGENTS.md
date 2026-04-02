# SSoT 基础设施初始化指令

> 当被 `design/context-dev/AGENTS.md` 调用时执行此文件。

---

## 🎯 执行指令

依次执行以下步骤：

---

## Phase 0: 检测是否需要 SSoT

> ⛔ **必须首先执行此步骤**

### 0.1 读取架构文档

**读取**：`.context/architecture/source/` 目录下的架构文档

读取优先级（必须遵循）：
1. 优先读取用户确认的“权威架构设计文档”（已归档到 `.context/architecture/source/`）
2. 若存在 `docs/architecture.md`（已归档到 `.context/architecture/source/`）且用户确认其为权威输入 → 优先读取
3. 其余 `.context/architecture/source/*.md` → 作为补充

若不存在，尝试读取：
- `.context/architecture/tech_stack.md`（若已生成）
- `.context/architecture/system_design.md`（若已生成）

### 0.2 关键词检测

**依次检查以下关键词，判断 SSoT 需求**：

| SSoT 类型 | 关键词 | 检测结果 |
|----------|--------|---------|
| **数据层 (Goose SQL)** | SQL, Relational DB, PostgreSQL, 数据库, Schema, 表设计, 迁移, Goose, 数据模型 | 需要 → `SSoT/schema/migrations/` |
| **API 层 (TypeSpec)** | REST API, TypeSpec, OpenAPI, 接口规范, tsp, API First | 需要 → `SSoT/api/` |
| **IPC 层 (TypeSpec JSON Schema)** | Tauri, IPC, Electron, Desktop App, GUI, 桌面端, 浮窗 | 需要 → `SSoT/ipc/` |
| **共享层 (TypeSpec)** | （当 API 层 + IPC 层同时存在时自动触发） | 需要 → `SSoT/shared/` |

### 0.3 遗留项目检测

**检查**：`.context/legacy/legacy_system_analysis.md` 是否存在

若存在，**必须输出警告**：

> ⚠️ **棕地项目提醒**：
> 检测到遗留系统分析文件。SSoT 将按新项目标准初始化。
> - 遗留系统的 Schema/API 对齐请在**改造提案**中处理
> - 使用 `/context-openspec plan` 生成包含改造阶段的路线图
> - 参考 `legacy_system_analysis.md` 了解现有系统约束

### 0.4 输出决策

**必须输出决策结果**：

```
=== SSoT 需求分析 ===
基于架构文档检测结果：

✅ 数据层 (Goose SQL)：需要初始化
   └── 检测到：SQL/Relational DB, 数据模型, Schema

✅ API 层 (TypeSpec)：需要初始化
   └── 检测到：REST API, TypeSpec

✅ IPC 层 (TypeSpec JSON Schema)：需要初始化
   └── 检测到：Tauri, IPC, 桌面端

✅ 共享层 (TypeSpec)：需要初始化
   └── 原因：API 层 + IPC 层同时存在

⏩ 若都不需要：跳过 SSoT 初始化
   └── 原因：架构文档未包含数据库、API 或 IPC 规范

⚠️ 棕地项目：是/否
```

---

## Phase 1: 确认初始化

**仅当 Phase 0 检测到需要时执行**

**向用户确认**：

> "根据架构文档分析，建议初始化以下 SSoT：
> - {{检测到的 SSoT 类型}}
> 
> 是否确认初始化？(y/n)"

**等待用户回复后再继续。**

若用户拒绝 → 返回，报告跳过原因。

---

## Phase 2: Goose 迁移 (数据层)

> ⚠️ **仅当检测到需要数据层时执行**

创建 `{目标项目}/SSoT/schema/migrations/` 目录并生成：

| 文件 | 内容 |
|------|------|
| `SSoT/schema/migrations/00001_init.sql` | Goose 初始化迁移模板 |

`00001_init.sql` 填充规则：
- 从架构文档提取核心数据模型（users, sessions 等）
- 使用 `-- +goose Up` 和 `-- +goose Down` 注解

---

## Phase 3: TypeSpec (API 层)

> ⚠️ **仅当检测到需要 API 层时执行**

创建 `{目标项目}/SSoT/api/` 目录并生成：

| 文件 | 模板 |
|------|------|
| `SSoT/api/tspconfig.yaml` | `@design/context-dev/tools/SSoT/api/tspconfig.yaml` |
| `SSoT/api/main.tsp` | `@design/context-dev/tools/SSoT/api/main.tsp` |
| `SSoT/api/models/` | 空目录 |

`main.tsp` 填充规则：
- 从架构文档提取核心 API 端点
- 包含 health check 示例

---

## Phase 3.5: IPC 层初始化 (TypeSpec JSON Schema)

> ⚠️ **仅当检测到需要 IPC 层时执行**

创建 `{目标项目}/SSoT/ipc/` 目录并生成：

| 文件 | 模板 |
|------|------|
| `SSoT/ipc/tspconfig.yaml` | `@design/context-dev/tools/SSoT/ipc/tspconfig.yaml` |
| `SSoT/ipc/main.tsp` | `@design/context-dev/tools/SSoT/ipc/main.tsp` |

`main.tsp` 填充规则：
- 从架构文档提取客户端本地 IPC 类型（Session、Config、UI 事件等）
- import `../shared/models.tsp` 引用共享模型

---

## Phase 3.6: 共享层初始化 (TypeSpec)

> ⚠️ **仅当 API 层 + IPC 层同时存在时执行**

创建 `{目标项目}/SSoT/shared/` 目录并生成：

| 文件 | 模板 |
|------|------|
| `SSoT/shared/models.tsp` | `@design/context-dev/tools/SSoT/shared/models.tsp` |

`models.tsp` 填充规则：
- 从架构文档提取 API 和 IPC 共用的模型（如状态枚举、共享 DTO）
- API 层和 IPC 层通过 `import "../shared/models.tsp"` 引用

---

## 📋 验证命令

初始化完成后可执行：

```bash
# 验证 Goose 迁移状态
goose -dir SSoT/schema/migrations status

# 编译 TypeSpec (API 层)
tsp compile SSoT/api/main.tsp

# 编译 TypeSpec (IPC 层，若已初始化)
tsp compile SSoT/ipc/main.tsp
```

---

## Phase 4: 更新 Context 核心文件

**⚠️ 重要**: SSoT 初始化后必须同步更新以下文件：

| 文件 | 更新内容 |
|------|---------|
| `.context/criterion.md` | Section 2 三维约束体系（标记已启用层 + 填入工具和路径）、Section 7 SSoT 文件路径（填入实际路径） |
| `.context/AGENTS.md` | 目录结构添加 `SSoT/` 子目录引用（schema/ api/ ipc/ shared/） |

**criterion.md 更新规则**：
- Section 2 三维约束体系：将已初始化的层（数据层/API 层/IPC 层/共享层）替换占位符为实际工具名和路径
- Section 7 SSoT 文件路径：填入实际创建的 SSoT 文件路径（含 IPC/shared）

---

## Phase 5: 更新 Manifest

**执行**: `@design/context-dev/tools/manifest/AGENTS.md` (mode: update)

---

## ✅ 完成后

报告初始化结果：

```
=== SSoT 初始化结果 ===

检测来源: .context/architecture/source/*.md

📊 数据层 (Goose SQL): [已初始化 / 跳过]
   ✅ SSoT/schema/migrations/

🌐 API 层 (TypeSpec): [已初始化 / 跳过]
   ✅ SSoT/api/tspconfig.yaml
   ✅ SSoT/api/main.tsp
   ✅ SSoT/api/models/

📱 IPC 层 (TypeSpec JSON Schema): [已初始化 / 跳过]
   ✅ SSoT/ipc/tspconfig.yaml
   ✅ SSoT/ipc/main.tsp

🔗 共享层 (TypeSpec): [已初始化 / 跳过]
   ✅ SSoT/shared/models.tsp

📝 Context 文件更新:
   🔁 .context/criterion.md (Section 2 SSoT 层已更新)
   🔁 .context/AGENTS.md (目录结构已更新)

🔁 Manifest 已更新
```
