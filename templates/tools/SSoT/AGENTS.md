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

若不存在，尝试读取：
- `.context/architecture/tech_stack.md`（若已生成）
- `.context/architecture/system_design.md`（若已生成）

### 0.2 关键词检测

**依次检查以下关键词，判断 SSoT 需求**：

| SSoT 类型 | 关键词 | 检测结果 |
|----------|--------|---------|
| **数据层 (Atlas HCL)** | PostgreSQL, 数据库, Schema, 表设计, Atlas, HCL, 数据模型 | 需要 → `schema/` |
| **API 层 (TypeSpec)** | REST API, TypeSpec, OpenAPI, 接口规范, tsp, API First | 需要 → `api/` |

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

✅ 数据层 (Atlas HCL)：需要初始化
   └── 检测到：PostgreSQL, 数据模型, Schema

✅ API 层 (TypeSpec)：需要初始化
   └── 检测到：REST API, TypeSpec

⏩ 若两者都不需要：跳过 SSoT 初始化
   └── 原因：架构文档未包含数据库或 API 规范

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

## Phase 2: Atlas HCL (数据层)

> ⚠️ **仅当检测到需要数据层时执行**

创建 `{目标项目}/schema/` 目录并生成：

| 文件 | 模板 |
|------|------|
| `schema/atlas.hcl` | `@design/context-dev/tools/SSoT/schema/atlas.hcl` |
| `schema/postgres.hcl` | `@design/context-dev/tools/SSoT/schema/postgres.hcl` |

`postgres.hcl` 填充规则：
- 从架构文档提取核心数据模型（users, sessions 等）
- 包含 RLS 策略模板

---

## Phase 3: TypeSpec (API 层)

> ⚠️ **仅当检测到需要 API 层时执行**

创建 `{目标项目}/api/` 目录并生成：

| 文件 | 模板 |
|------|------|
| `api/tspconfig.yaml` | `@design/context-dev/tools/SSoT/api/tspconfig.yaml` |
| `api/main.tsp` | `@design/context-dev/tools/SSoT/api/main.tsp` |
| `api/models/` | 空目录 |

`main.tsp` 填充规则：
- 从架构文档提取核心 API 端点
- 包含 health check 示例

---

## 📋 验证命令

初始化完成后可执行：

```bash
# 验证 Atlas Schema
atlas schema inspect -u "file://schema/postgres.hcl"

# 编译 TypeSpec
tsp compile api/main.tsp
```

---

## Phase 4: 更新 Context 核心文件

**⚠️ 重要**: SSoT 初始化后必须同步更新以下文件：

| 文件 | 更新内容 |
|------|---------|
| `.context/criterion.md` | Section 1 三维约束体系（标记已启用层）、Section 5 SSoT 文件路径（填入实际路径） |
| `.context/AGENTS.md` | 目录结构添加 `schema/` 和 `api/` 引用 |

**criterion.md 更新规则**：
- Section 1: 将已初始化的层标记为 `✅ 已启用`
- Section 5: 填入实际创建的 SSoT 文件路径

---

## Phase 5: 更新 Manifest

**执行**: `@design/context-dev/tools/manifest/AGENTS.md` (mode: update)

---

## ✅ 完成后

报告初始化结果：

```
=== SSoT 初始化结果 ===

检测来源: .context/architecture/source/*.md

📊 数据层 (Atlas HCL): [已初始化 / 跳过]
   ✅ schema/atlas.hcl
   ✅ schema/postgres.hcl

🌐 API 层 (TypeSpec): [已初始化 / 跳过]
   ✅ api/tspconfig.yaml
   ✅ api/main.tsp
   ✅ api/models/

📝 Context 文件更新:
   🔁 .context/criterion.md (Section 1, 5 已更新)
   🔁 .context/AGENTS.md (目录结构已更新)

🔁 Manifest 已更新
```
