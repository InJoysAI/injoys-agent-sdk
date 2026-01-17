# 项目准则模板 (Criterion Template)

> **用途**: 定义 AI 代理必须遵守的工程约束和技术规范。  
> **使用方式**: 复制此模板到目标项目的 `.context/criterion.md`，由 AI 根据 PRD/架构文档填充占位符并删去不适用部分。  
> **原则**: 模板保持通用，不绑定特定业务域/技术栈；用 `{{...}}` 占位符表达可变项。

---

> **Metadata**
> - **Source**: `{{PRD路径}}`, `{{架构文档路径}}`{{可选：`, {{错误码规范路径}}`}}
> - **Generated At**: `{{生成时间 YYYY-MM-DD HH:mm}}`
> - **Generator**: `{{生成器版本}}`

---

## 1. 仓库结构约束

```text
{{repo_name}}/
├── {{client_app_path}}/         # 客户端（如桌面端/移动端/Web 前端）
├── {{server_path}}/             # 服务端（如 API 服务/网关/转发服务/Worker）
└── docs/                        # 需求/架构/规范文档
```

---

## 2. 三维约束体系

| 维度 | 工具 | 约束规则 |
|------|------|---------|
| **需求层** | OpenSpec (`openspec/project.md`) | 功能变更必须先创建提案（`/context-openspec proposal <change-id> [roadmap-doc]`），评审通过后再开发 |
| **数据层** | {{数据层真理源}} | {{数据层变更规则（如：通过 config 模块/通过 HCL/通过迁移脚本）}} |
| **API 层** | {{API 契约/服务}} | API 变更必须先更新服务端接口（或契约），客户端仅调用 |

---

## 3. 技术栈强制约束

### 3.1 客户端（桌面/移动/Web，按需保留）

```yaml
Type: {{e.g. Tauri Desktop / Web SPA / Mobile}}
Language: {{e.g. Rust + TypeScript}}
Framework: {{e.g. Tauri (React + Vite) / Next.js}}
Location: {{e.g. magic-crayon-app/}}

MUST:
  - {{例：前端仅负责 UI 渲染与交互，不承载核心业务规则}}
  - {{例：统一通过 IPC/SDK/HTTP Client 调用核心层或服务端}}
  - {{例：对外调用必须集中在单一封装入口（request client / invoke client）}}

MUST NOT:
  - {{例：硬编码密钥/令牌/敏感配置}}
  - {{例：绕过统一调用封装直连外部服务}}
```

### 3.2 客户端核心层（如 Rust Core / Native Core）

```yaml
Structure:
  - {{commands_path}}: {{入口层职责（入参校验、编排、返回）}}
  - {{api_path}}: {{服务端调用层职责}}
  - {{config_path}}: {{本地配置职责}}

MUST:
  - {{例：统一错误类型与用户可读错误映射}}
  - {{例：请求头注入 Authorization: {{auth_scheme}} {{auth_token_placeholder}}}}

MUST NOT:
  - {{例：内置全局通用 Master Key}}
  - {{例：将服务端策略/黑盒逻辑下发到客户端}}
```

### 3.3 前端工程约束（如 React）

```yaml
Framework: {{e.g. React + Vite}}
Location: {{e.g. {{client_app_path}}/src/}}
State: {{e.g. appState + userConfig}}
Styling: {{e.g. TailwindCSS}}

MUST:
  - {{例：只调用统一封装（IPC invoke / request client），不直连外部服务}}
  - {{例：约定状态域与字段命名（如 loading/error/data）}}
  - {{例：遵循产品文案规范（例如：避免技术术语直出给用户）}}

MUST NOT:
  - {{例：手写 fetch 请求}}
  - {{例：包含业务黑盒逻辑}}
```

### 3.4 服务端（按需保留）

```yaml
Language: {{e.g. Go}}
Framework: {{e.g. Gin}}
Location: {{e.g. services/new-api/}}

MUST:
  - {{例：鉴权/计费/权限策略在服务端完成}}
  - {{例：业务规则以服务端为准（客户端仅做展示与编排）}}
  - {{例：接口与错误码必须向后兼容或按版本演进}}

MUST NOT:
  - {{例：将敏感策略/密钥下发到客户端}}
  - {{例：允许客户端绕过业务接口直连受控资源}}
```

### 3.5 数据持久化（按需保留）

```yaml
Type: {{e.g. JSON 文件存储 / PostgreSQL}}
Path: {{e.g. Windows/MacOS 路径 或 DB 连接名}}
Structure: {{e.g. license_key/last_style/save_path 或 Schema}}

MUST:
  - {{例：通过 config 模块读写配置}}
  - {{例：支持配置迁移}}

MUST NOT:
  - {{例：直接操作配置文件}}
```

---

## 4. 安全约束

- **认证方式**: {{e.g. Authorization header / Cookie Session / Signed URL}}
- **密钥管理**: {{例：禁止硬编码；仅允许 env/凭据库/用户输入；日志必须脱敏}}
- **网络要求**: {{例：HTTPS 强制；证书校验；超时/重试策略}}
- **最小权限**: {{例：客户端最小 allowlist；禁用 shell/cmd；服务端最小 RBAC}}
- **审计与风控（可选）**: {{例：敏感操作记录 requestId/userId/ip；内容安全策略}}

---

## 5. 接口契约（最小依赖）

> 建议将“业务接口”与“兼容/代理接口”区分：
> - 业务接口：优先使用统一响应结构（便于前端稳定处理、国际化、错误码映射）
> - 兼容/代理接口：保持第三方协议返回结构（必要时把业务错误码放到其允许的字段中）

### 5.1 认证方式
- Header: `Authorization: {{auth_scheme}} {{auth_token_placeholder}}`

### 5.2 统一成功响应（建议）

```json
{
  "code": "000001",
  "message": "Success",
  "data": {},
  "requestId": "req-uuid"
}
```

### 5.3 统一错误响应（建议）

```json
{
  "code": "{{MMTXXX}}",
  "message": "{{用户可读错误信息}}",
  "err": "{{可选：内部/开发调试信息}}",
  "requestId": "req-uuid"
}
```

### 5.4 关键接口（示例，占位符）

- **校验/鉴权**: `{{GET /.../auth/check}}`（或 `{{POST /.../auth/verify}}`）
- **核心业务**: `{{POST /.../<resource>}}`
- **文件/媒体**（可选）: `{{POST /.../upload}}` / `{{GET /.../download}}`

### 5.5 错误码规范（可选）
- 遵循 `{{错误码规范路径}}`（如 `docs/errcode_guidelines.md`）
- 6 位错误码格式: `MMTXXX`
- 错误响应建议包含：`code`, `message`, `err`(可选), `requestId`

---

## 6. 变更工作流（SSoT-first）

```
需求变更
    ↓
创建提案：/context-openspec proposal <change-id> [roadmap-doc]
    ↓
验证提案：openspec validate <提案ID>
    ↓
更新服务端/契约（如有）
    ↓
实现业务逻辑（客户端/服务端）
    ↓
运行测试
    ↓
归档：openspec archive <提案ID> --yes
```

---

## 7. SSoT 文件路径

| 层 | 文件 | 用途 |
|----|------|------|
| 数据层 | `SSoT/schema/migrations/` | Goose SQL 迁移文件目录 |
| API 层 | `SSoT/api/tspconfig.yaml` | TypeSpec 编译配置 |
| API 层 | `SSoT/api/main.tsp` | API 契约入口 |
| 需求层 | `openspec/project.md` | 项目信息 |
| 需求层 | `openspec/proposal-roadmap.md` | 提案路线图 |
| 需求层 | `openspec/specs/` | 当前规范（真理源） |
| 需求层 | `openspec/changes/` | 变更提案目录 |

---

## 8. 统一入口

本文件（`.context/criterion.md`）是项目约束的**权威来源**。

> 💡 仅当源文档（PRD/架构等）变化时才需更新 `.context/`；业务代码变更不触发重生成。

---
