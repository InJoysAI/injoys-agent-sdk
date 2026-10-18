# SSoT 基础设施初始化指令

> 当被 `design/context-dev/AGENTS.md` 调用时执行此文件。
>
> **原则**：SSoT 的**工具由架构文档决定**，不与具体语言/框架绑定。本目录下的 Goose / TypeSpec 文件只是“选用默认工具时的现成模板”，不是强制选型。

---

## 🎯 执行指令

依次执行以下步骤：

---

## Phase 0: 检测需要哪些 SSoT 层

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

### 0.2 关键词检测（只判断“需要哪些层”，不决定工具）

| SSoT 层 | 关键词（示例，非限定） | 目录 |
|--------|---------------------|------|
| **数据层** | SQL, 关系型数据库, PostgreSQL, MySQL, SQLite, 数据库, Schema, 表设计, 迁移, Migration, ORM | `SSoT/schema/` |
| **API 层** | REST, OpenAPI, Swagger, gRPC, Protobuf, GraphQL, 接口规范, API First, 前后端接口 | `SSoT/api/` |
| **IPC 层** | IPC, 进程间通信, Tauri, Electron, Desktop App, GUI, 桌面端, 浮窗, Native Bridge, JSON-RPC | `SSoT/ipc/` |
| **共享层** | API 层与 IPC 层存在可复用的同一类型（状态枚举、共享 DTO 等） | `SSoT/shared/` |

### 0.3 遗留项目检测

**检查**：`.context/legacy/legacy_system_analysis.md` 是否存在

若存在，**必须输出警告**：

> ⚠️ **棕地项目提醒**：
> 检测到遗留系统分析文件。SSoT 将按新项目标准初始化。
> - 遗留系统的 Schema/API 对齐请在**改造提案**中处理
> - 使用 `.agents/workflows/context-openspec.md plan` 生成包含改造阶段的路线图
> - 参考 `legacy_system_analysis.md` 了解现有系统约束

---

## Phase 0.5: 工具选型（核心步骤）

> ⛔ **每个需要的层都必须完成选型**，不得直接套用默认工具。

### 0.5.1 选型优先级

对每个已识别的层，依次判断：

1. **架构文档明确指定** → 直接采用，来源标注“架构文档（章节/原文）”。
2. **架构文档未指定，但技术栈明确**（语言、框架、运行时）→ 从下方“参考选型表”或你对该技术栈主流做法的判断中选择，**必须写明选择依据**，来源标注“推断”。
3. **无法判断** → 使用默认（数据层 Goose；API 层 TypeSpec → OpenAPI3），来源标注“默认”。
4. **存在多个合理候选或文档内部冲突** → 在 Phase 1 向用户提问，**不得自行裁决**。

> 架构文档与默认工具冲突时，**以架构文档为准**。

### 0.5.1.1 “未启用”与“启用（手写契约）”要分清

判断一层是否启用，看的是**这一层有没有契约**，而不是有没有契约工具：

| 情况 | 判定 | 记录方式 |
|------|------|---------|
| 该层存在需要约束的接口/数据结构，且已有（或应有）**手写的契约文件**（如 TypeScript 类型 + RPC 方法清单、手写 OpenAPI、代码内 schema） | **启用，工具 = 手写** | 契约路径填实际文件；生成命令可以是“无（原因）”；校验命令填类型检查/测试等 |
| 该层根本不存在（无数据库、无对外接口、无 IPC 边界） | **未启用** | 契约路径“未启用”，在 §7.3 写明依据 |

> 后续提案/实施/检查把“已配置路径”的层视为启用：**启用（手写）的层仍然必须“先改契约文件，再改实现”**，只是没有 Codegen 这一步。不要因为没有生成工具就把整层记为“未启用”，否则契约先行的约束会被整体跳过。

### 0.5.2 每层必须确定的 5 项

| 项 | 说明 |
|----|------|
| 契约工具 | 用什么写契约（迁移文件 / OpenAPI / Protobuf / GraphQL SDL / JSON Schema / 代码内类型…） |
| 契约路径 | 契约文件所在目录或入口文件 |
| 校验命令 | 如何验证契约本身合法（编译 / lint / status），工具未安装时在报告中如实写“未验证” |
| 生成命令（Codegen） | 契约 → 代码/类型的命令，以及**生成给谁用**（后端 / 前端 / 桌面端 / 各语言） |
| 生成产物 | 产物目录；是否提交到仓库（供没有该工具链的开发者直接使用的契约产物通常应提交） |

> **Codegen 不得留空**：若该层确实没有合适的生成工具，必须明确写“无生成”，并写明手工同步规则与校验方式（例如“契约改动后由 X 测试校验实现一致”）。

### 0.5.3 参考选型表（示例，非限定；以技术栈为准）

| 层 | 常见选择 | 适用线索 |
|----|---------|---------|
| 数据层 | Goose（纯 SQL，多数据库） | Go 或无特定偏好（默认） |
| | Flyway / Liquibase | JVM 技术栈 |
| | Alembic | Python / SQLAlchemy |
| | Prisma Migrate / Drizzle Kit | TypeScript 全栈 |
| | Diesel / SQLx migrations | Rust |
| | EF Core Migrations | .NET |
| API 层 | OpenAPI 3（用 TypeSpec 或手写 YAML 描述） | REST，前后端分离（默认：TypeSpec） |
| | Protobuf + buf | gRPC / 多语言服务间调用 |
| | GraphQL SDL | GraphQL |
| | 代码内契约（如 zod / tRPC） | 前后端同为 TypeScript 的全栈项目 |
| API 的 Codegen | oapi-codegen | Go 服务端 |
| | openapi-typescript / orval | TypeScript 前端客户端 |
| | openapi-generator | 多语言通用 |
| | buf generate / protoc 系 | Protobuf |
| IPC 层 | JSON Schema（可由 TypeSpec 生成） + 各端生成器 | 跨语言桌面端（如 Tauri：Rust ↔ TypeScript） |
| | 共享 TypeScript 类型 / zod | Electron 等同为 TS 的桌面端 |
| | 以 Rust 类型为源 + 导出 TS 类型 | Tauri 且希望以 Rust 为契约源 |

### 0.5.4 IPC 层的契约范围

IPC 契约的核心不只是“数据结构”，还包括**命令与事件**：有哪些命令、各自入参/返回/错误、有哪些事件、方向（谁调谁）。选型时必须同时确定：

- 命令与事件的清单写在哪里、用什么形式表达（所选工具不能表达时，约定一种统一的结构化写法，并写入 criterion.md）；
- 前端侧与原生/核心侧分别用什么生成类型。

---

## Phase 1: 展示选型并确认

**仅当 Phase 0 检测到需要时执行**

**必须输出选型表并等待用户确认**：

```
=== SSoT 选型 ===
基于架构文档：.context/architecture/source/<文件>

| 层 | 契约工具 | 契约路径 | 校验命令 | 生成命令 → 消费方 | 产物（是否提交） | 来源 |
|----|---------|---------|---------|------------------|-----------------|------|
| 数据层 | Goose | SSoT/schema/migrations/ | goose -dir … status | 无（SQL 即契约） | - | 架构文档 §x / 推断 / 默认 |
| API 层 | OpenAPI（TypeSpec） | SSoT/api/main.tsp | tsp compile SSoT/api | oapi-codegen → 后端；orval → 前端 | 是 | … |
| IPC 层 | … | … | … | … | … | … |
| 共享层 | … | … | … | … | … | … |

⏩ 未启用的层及原因：…
⚠️ 需要你决定的点：…（有多个候选或文档冲突时列出）
⚠️ 棕地项目：是/否
```

> "以上选型是否确认？(y/n，或告诉我要改的地方)"

**等待用户回复后再继续。** 用户拒绝 → 返回，报告跳过原因。

---

## Phase 2: 生成骨架

> 只生成**最小可用骨架**：不得虚构业务内容；无法从架构文档得出的部分留注释占位。

### 2.1 通用规则

- **所选工具有本目录模板**（Goose、TypeSpec）→ 使用下方对应小节。
- **所选工具没有现成模板** → 按该工具官方约定，在契约路径下生成最小可运行的骨架（含一个 health check 级别的示例或空迁移），并把用到的配置文件一并生成。
- 项目名称、服务名等必须使用实际项目值（`{{project_name}}`），**不得保留框架自带的示例名称**。
- 生成后运行“校验命令”；工具未安装或无法运行时，**在报告中如实标注“未验证”**，不得声称通过。

### 2.2 默认模板：Goose（数据层）

创建 `{目标项目}/SSoT/schema/migrations/`：

| 文件 | 内容 |
|------|------|
| `SSoT/schema/migrations/00001_init.sql` | 来自 `@design/context-dev/tools/SSoT/schema/migrations/00001_init.sql` |

填充规则：
- 从架构文档提取核心数据模型（users, sessions 等）
- 使用 `-- +goose Up` 和 `-- +goose Down` 注解
- 模板中的 `gen_random_uuid()` 为 PostgreSQL 函数；其他数据库按实际数据库改写

### 2.3 默认模板：TypeSpec → OpenAPI3（API 层）

创建 `{目标项目}/SSoT/api/`：

| 文件 | 模板 |
|------|------|
| `SSoT/api/tspconfig.yaml` | `@design/context-dev/tools/SSoT/api/tspconfig.yaml` |
| `SSoT/api/main.tsp` | `@design/context-dev/tools/SSoT/api/main.tsp` |

填充规则：
- 将 `main.tsp` 中的 `{{project_name}}` 占位符替换为实际项目名（服务标题、命名空间）
- 从架构文档提取核心 API 端点，保留 health check 示例
- `criterion.md` §5 的统一响应/错误结构**必须在契约中定义**（参见 `main.tsp` 中的示例），不得只存在于文档里
- 生成命令与消费方按 Phase 0.5 的选型填写（模板本身只产出 OpenAPI 文件）

### 2.4 默认模板：TypeSpec → JSON Schema（IPC 层）

创建 `{目标项目}/SSoT/ipc/`：

| 文件 | 模板 |
|------|------|
| `SSoT/ipc/tspconfig.yaml` | `@design/context-dev/tools/SSoT/ipc/tspconfig.yaml` |
| `SSoT/ipc/main.tsp` | `@design/context-dev/tools/SSoT/ipc/main.tsp` |

填充规则：
- 从架构文档提取客户端本地 IPC 类型与**命令/事件**（见 0.5.4）
- 模板里 `import "../shared/models.tsp";` 默认是注释状态；**仅当共享层已初始化时**取消注释。纯桌面应用（没有服务端 API）没有共享层，保持注释，否则编译会找不到文件

### 2.5 默认模板：TypeSpec 共享层

> 仅当 API 层与 IPC 层都启用，且确有可复用类型时执行

创建 `{目标项目}/SSoT/shared/models.tsp`（来自 `@design/context-dev/tools/SSoT/shared/models.tsp`），并让 API / IPC 两层 `import "../shared/models.tsp"`。

> 若共享层所用工具与 API/IPC 的契约工具不是同一体系，在选型表中写明共享方式（例如共同引用同一个 JSON Schema）。

---

## Phase 3: 记录选型到 Context 核心文件

**⚠️ 重要**：后续的提案、实施、检查都**只读取 criterion.md 的记录**，因此选型必须写进去。

| 文件 | 更新内容 |
|------|---------|
| `.context/criterion.md` | §2 三维约束体系：已启用层填入实际工具与规则；**§7.1 文件路径**、**§7.2 工具链与 Codegen 表**：填入 Phase 1 确认的选型（含校验命令、生成命令、产物目录、是否提交、选型依据） |
| `.context/AGENTS.md` | 目录结构添加 `SSoT/` 子目录引用 |
| 项目根目录 `AGENTS.md` | criterion.md 已更新，按 `tools/docs/AGENTS.md` 的规则刷新标记块中的“关键禁止项”摘要 |

**决策记录的唯一位置**：SSoT 选型与“跳过/未启用”的决策依据只写在 `.context/criterion.md`（§7.3），**不要**在 Manifest 里另建 `ssot` 字段重复记录。整体跳过 SSoT（没有任何层需要）时，也要在 §7.3 写明各层不启用的原因。

**criterion.md 更新规则**：
- 未启用的层保留占位符的“未启用”说明，不删除 Section
- §7.2 的每个已启用层（含“启用，工具=手写”）都必须填写“生成命令”（无生成则写“无”并说明原因）；“未启用”的层 §7.2 各列写“—”即可，不要为它填校验命令
- 选型依据写明来源：架构文档（章节）/ 推断（线索）/ 默认

---

## Phase 4: 更新 Manifest

**执行**: `@design/context-dev/tools/manifest/AGENTS.md` (mode: update)

---

## ✅ 完成后

报告初始化结果：

```
=== SSoT 初始化结果 ===

检测来源: .context/architecture/source/*.md

| 层 | 状态 | 工具 | 路径 | 校验 |
|----|------|------|------|------|
| 数据层 | 已初始化 / 跳过 | … | … | 通过 / 未验证（原因） |
| API 层 | … | … | … | … |
| IPC 层 | … | … | … | … |
| 共享层 | … | … | … | … |

📝 Context 文件更新:
   🔁 .context/criterion.md (§2、§7.1、§7.2 已写入选型)
   🔁 .context/AGENTS.md (目录结构已更新)

🔁 Manifest 已更新
```
