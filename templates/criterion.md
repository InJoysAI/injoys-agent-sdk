# 项目准则模板 (Criterion Template)

> **用途**: 定义 AI 代理必须遵守的工程约束和技术规范。  
> **使用方式**: 复制此模板到项目，由 AI 根据架构文档填充占位符。

---

> **Metadata**
> - **Source**: `{{来源文档路径}}`
> - **Generated At**: `{{生成时间 YYYY-MM-DD HH:mm}}`
> - **Agent Version**: `{{生成器版本}}`

---

## 1. 三维约束体系

| 维度 | 工具 | 约束规则 |
|------|------|---------|
| **需求层** | OpenSpec (`openspec/project.md`) | 功能变更必须先创建提案（`/context-openspec proposal <change-id> [roadmap-doc]`），评审通过后再开发 |
| **数据层** | Atlas HCL (`schema/atlas.hcl`, `schema/postgres.hcl`) | Schema 变更必须先修改 HCL，运行 `atlas schema apply` 后再改业务代码 |
| **API 层** | TypeSpec (`api/main.tsp`, `api/tspconfig.yaml`) | API 变更必须先修改契约，编译后再改业务代码 |

---

## 2. 技术栈强制约束

### 2.1 后端

```yaml
Language: {{e.g. Go / Node.js / Python}}
Framework: {{e.g. Gin / Express / FastAPI}}
ORM: {{e.g. GORM / Prisma / SQLAlchemy}}

MUST:
  - {{例：实现 oapi-codegen 生成的接口}}
  - {{例：使用 ORM 查询构建器}}

MUST NOT:
  - {{例：手写 raw SQL}}
  - {{例：硬编码密钥}}
```

### 2.2 前端

```yaml
Framework: {{e.g. React / Vue / Next.js}}
State: {{e.g. TanStack Query / Zustand}}

MUST:
  - {{例：使用生成的 API Hooks}}
  - {{例：遵循 design_system.md 规范}}

MUST NOT:
  - {{例：手写 fetch 请求}}
```

### 2.3 数据库

```yaml
Type: {{e.g. PostgreSQL / MySQL}}
Version: {{e.g. 16+}}

MUST:
  - {{例：所有 Schema 定义在 schema/postgres.hcl}}
  - {{例：启用 RLS}}

MUST NOT:
  - {{例：直接执行 ALTER TABLE}}
```

---

## 3. 安全约束

- **认证方式**: {{e.g. JWT / Session / OAuth}}
- **密钥管理**: {{例：禁止硬编码，通过环境变量注入}}
- **其他**: {{自定义安全规则}}

---

## 4. 变更工作流（SSoT-first）

```
需求变更
    ↓
创建提案：/context-openspec proposal <change-id> [roadmap-doc]
    ↓
验证提案：openspec validate <提案ID>
    ↓
更新数据层：修改 schema/postgres.hcl → atlas schema apply --env <env>
    ↓
更新 API 层：修改 api/main.tsp → tsp compile api/main.tsp --config api/tspconfig.yaml
    ↓
执行 Codegen（oapi-codegen / orval / datamodel-codegen）
    ↓
实现业务逻辑
    ↓
运行测试
    ↓
归档前校验：openspec validate <提案ID>
    ↓
归档：openspec archive <提案ID> --yes
```

---

## 5. SSoT 文件路径

| 层 | 文件 | 用途 |
|----|------|------|
| 数据层 | `schema/atlas.hcl` | Atlas 项目配置（env、连接） |
| 数据层 | `schema/postgres.hcl` | PostgreSQL Schema 定义 |
| API 层 | `api/tspconfig.yaml` | TypeSpec 编译配置 |
| API 层 | `api/main.tsp` | API 契约入口 |
| 需求层 | `openspec/project.md` | 项目信息 |
| 需求层 | `openspec/proposal-roadmap.md` | 提案路线图 |
| 需求层 | `openspec/specs/` | 当前规范（真理源） |
| 需求层 | `openspec/changes/` | 变更提案目录 |

---

## 6. 统一入口

本文件（`.context/criterion.md`）是项目约束的**权威来源**。

> 💡 仅当源文档（PRD/架构等）变化时才需更新 `.context/`；业务代码变更不触发重生成。

---
