# Context Generation Templates

> **用途**: 作为 Context/Agent 的"模板源"，安装到目标项目 `design/context-dev/`。  
> **安装**: `./scripts/install.sh <目标项目路径>` 或远程 `curl` 安装。

---

## 目录结构

```
templates/
├── README.md              # 本文件
├── AGENTS.md              # Context 生成器入口
├── criterion.md        # 项目准则模板
├── architecture/
│   └── AGENTS.md          # 架构总结生成（MVP）
├── domain/
│   └── AGENTS.md          # 领域总结生成（MVP）
├── db/
│   └── AGENTS.md          # 数据库设计总结
├── ui/
│   └── AGENTS.md          # UI 总结生成（可选）
├── openspec/
│   └── AGENTS.md          # OpenSpec 增强规范
├── devenv/                    # (reference implementation)
│   ├── AGENTS.md          # 环境检查参考实现
│   ├── check-toolchain.sh # 工具链检查脚本（示例）
│   ├── check-mcp.sh       # MCP 配置检查脚本（示例）
│   └── mcp-config.json    # MCP 配置模板 (tool-agnostic)
├── scripts/
│   ├── context-gen.sh             # Hash/引导脚本
│   ├── install-ai-commands.sh     # 安装完整 /context-* 命令集
│   └── install-codex-prompts.sh   # 安装 Codex prompts 到 ~/.codex/prompts
└── templates/             # AI 工具入口文件模板
    ├── README.md          # 占位符说明
    ├── AGENTS.md.template
    ├── CLAUDE.md.template
    ├── cursorrules.template
    ├── windsurfrules.template
    ├── context-agents.md.template
```

---

## 核心命令（7 个）

| 命令 | 阶段 | 用途 |
|------|------|------|
| `/context-init` | 初始化 | 确认目标 + 可选环境检查 + 创建目录 + 归档源文档 |
| `/context-openspec` | 集成 | 生成文档总结 + 填充 config.yaml + 生成路线图 |
| `/context-openspec proposal <change-id> [roadmap-doc]` | 设计 | 基于路线图/大纲创建提案 → 生成 tasks.md |
| `/context-interview` | 设计 | 深度访谈完善技术规格或用户指定文档 |
| `/context-start` | 实施 | validate → SSoT-first → codegen → code → archive |
| `/context-check` | 检查 | 子命令: `env` / `tasks` / `proposal` |
| `/context-update` | 维护 | 子命令: `add` / `modify` / `delete` / `fix` |

---

## 占位符约定

模板使用 `{{占位符}}` 语法，AI 自动替换为实际值：

| 占位符 | 说明 |
|--------|------|
| `{{project_name}}` | 项目名称 |
| `{{project_root}}` | 项目根目录绝对路径 |
| `{{schema_path}}` | Schema 迁移目录 (默认 `SSoT/schema/migrations/`) |
| `{{api_path}}` | API 定义路径 (默认 `SSoT/api/main.tsp`) |
| `{{generated_at}}` | 生成时间戳 |

详见 `templates/templates/README.md`。

---

## 🚀 快速演示 (E2E)

### 1. 安装到目标项目

```bash
# 本地模式
./scripts/install.sh /path/to/your-project

# 远程模式
curl -fsSL https://raw.githubusercontent.com/injoysai/injoys-agent-sdk/main/scripts/install.sh | bash -s /path/to/your-project
```

### 2. 初始化 Context

```
/context-init
目标项目：/path/to/your-project
PRD：@docs/product-overview.md
架构：@docs/system-architecture.md
```

### 3. 初始化 OpenSpec (幂等增强)

```
/context-openspec
```

- 创建 `openspec/` 目录结构
- 确保 `openspec/` 目录结构存在
- 生成 `openspec/config.yaml` + `openspec/proposal-roadmap.md`

### 4. 创建提案

```
/context-openspec proposal feat-user-login
```

- 读取 `openspec/proposal-roadmap.md` 定位条目
- 创建 `openspec/changes/<提案ID>/`（proposal.md, design.md, tasks.md）

也可以显式指定“提案大纲文档”（例如某个 Phase 文件）：

```
/context-openspec proposal feat-user-login openspec/proposal-roadmap-Phase3.md
```

### 5. 开始实施

```
/context-start <提案ID>
```

执行流程：
1. `node design/context-dev/tools/specflow/specflow.mjs validate <提案ID> --strict`
2. 展示任务列表，等待确认
3. SSoT-first：按 `.context/criterion.md` 已启用层执行（数据层迁移 → 共享模型 → API 契约 → IPC 契约 → Codegen）
4. 实现业务代码 + 测试
5. `node design/context-dev/tools/specflow/specflow.mjs archive <提案ID> --yes`

### 6. 检查状态

```bash
# 检查任务进度
/context-check tasks <提案ID>

# 检查提案完整性
/context-check proposal <提案ID>

# 检查环境
/context-check env
```

---

## SSoT 路径约定

| 层 | 文件路径 | 用途 |
|----|---------|------|
| 需求层 | `openspec/config.yaml` | 项目信息 |
| 需求层 | `openspec/proposal-roadmap.md` | 提案路线图 |
| 需求层 | `openspec/changes/` | 变更提案目录 |
| 需求层 | `openspec/specs/` | 当前规范 (真理源) |
| 数据层 | `SSoT/schema/migrations/` | Goose SQL 迁移文件目录 |
| 共享层（可选） | `SSoT/shared/models.tsp` | API + IPC 共用模型 |
| API 层 | `SSoT/api/main.tsp` | API 契约入口 |
| API 层 | `SSoT/api/tspconfig.yaml` | TypeSpec 配置（OpenAPI3 + JSON Schema） |
| IPC 层（可选） | `SSoT/ipc/main.tsp` | IPC 契约入口 |
| IPC 层（可选） | `SSoT/ipc/tspconfig.yaml` | TypeSpec 配置（JSON Schema + bundleId） |

---
