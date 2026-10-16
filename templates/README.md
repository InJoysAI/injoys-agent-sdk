# Context Generation Templates

> **用途**: 作为 Context/Agent 的模板源，安装到目标项目 `design/context-dev/`。
> **安装**: 在本仓库运行 `./scripts/install.sh <目标项目路径>`，或使用 README 中的远程安装命令。

---

## 目录结构

```
templates/
├── README.md              # 本文件
├── AGENTS.md              # /context-init 入口（归档源文档 + 根文件 + SSoT，共 Step 1–6）
├── criterion.md           # 项目准则模板（工程约束 SSoT）
├── architecture/          # 架构总结生成（由 /context-openspec 调用）
├── domain/                # 领域总结生成（由 /context-openspec 调用）
├── db/                    # 数据库设计总结（可选）
├── ui/                    # UI 总结生成（可选）
├── legacy/                # 遗留系统分析（可选）
├── openspec/
│   ├── AGENTS.md          # /context-openspec 路由与一键模式
│   ├── project/           # 生成 openspec/config.yaml
│   ├── plan/              # 生成 openspec/proposal-roadmap.md
│   └── proposal/          # 创建并校验提案
├── start/                 # /context-start 实施流程
├── check/                 # /context-check 各子检查
├── update/                # /context-update（sync roadmap|proposal）
├── tools/                 # 内部模块：docs / manifest / SSoT / ai-config / asset-reader / integration / specflow
├── commands/              # 工具无关的唯一 /context-* 命令源
├── scripts/
│   ├── context-gen.sh             # Hash/引导脚本
│   ├── install-ai-commands.sh     # 安装 /context-* 命令（初始化仅选 antigravity）
│   ├── install-codex-prompts.sh   # 可选手动安装 Codex prompts
│   └── check-context-manifest.sh  # Manifest 校验（需要 jq）
└── templates/             # 各类文档/入口文件模板（PRD、TAD、roadmap、AI 工具入口等）
    └── README.md          # 占位符说明
```

---

## 流水线总览

```
需求文档 + 架构文档（自备）
   │  /context-init          归档到 .context/*/source/，生成 criterion/README/AGENTS，初始化 SSoT
   ▼
.context 源文档归档
   │  /context-openspec      生成 domain/architecture/db/ui 总结 → config.yaml → proposal-roadmap.md
   ▼
.context 资产 + openspec/config.yaml + proposal-roadmap.md
   │  /context-openspec proposal <id>    创建并校验提案
   ▼
openspec/changes/<id>/  →  /context-start <id> 实施并归档
```

> `/context-init` **只归档，不生成总结**；总结、`config.yaml`、`proposal-roadmap.md` 都由 `/context-openspec` 生成。

---

## 命令（6 个）

| 命令 | 阶段 | 用途 |
|------|------|------|
| `commands/context-init.md` | 初始化 | 调用生成入口，收集源文档并安装项目内工作流 |
| `commands/context-openspec.md` | 集成/设计 | 生成 Context/OpenSpec 项目资产，或创建提案 |
| `commands/context-interview.md` | 设计 | 访谈并完善技术规格或用户指定文档 |
| `commands/context-start.md` | 实施 | 校验提案、按 SSoT-first 流程实施并归档 |
| `commands/context-check.md` | 检查 | 子命令: `env` / `manifest` / `commands` / `tasks` / `proposal` / `plan` / `project` / `review` |
| `commands/context-update.md` | 维护 | `sync roadmap|proposal` 有工作流；`add` / `modify` / `delete` / `fix` 为接口草案 |

安装脚本首次只 bootstrap `context-init` 和 `context-check` 到项目级工具目录，并尝试安装 Codex 全局 prompts。初始化流程随后只将完整命令同步到 `.agent/workflows/`。若要为其他工具安装完整命令，运行 `design/context-dev/scripts/install-ai-commands.sh --tools antigravity,claude,cursor,devin,qoder,grok`；Codex 使用独立的 `install-codex-prompts.sh`。

---

## 占位符约定

模板使用 `{{占位符}}` 语法，AI 自动替换为实际值：

| 占位符 | 说明 |
|--------|------|
| `{{project_name}}` | 项目名称 |
| `{{project_root}}` | 项目根目录绝对路径 |
| `{{schema_path}}` | Schema 迁移目录 (默认 `SSoT/schema/migrations/`) |
| `{{api_path}}` | API 契约路径 (默认 `SSoT/api/main.tsp`，以 criterion.md §7.1 为准) |
| `{{generated_at}}` | 生成时间戳 |

详见 `design/context-dev/templates/README.md`。

---

## 🚀 快速演示 (E2E)

### 1. 安装到目标项目

```bash
# 本地模式
./scripts/install.sh /path/to/your-project

# 远程模式
curl -fsSL https://raw.githubusercontent.com/injoysai/injoys-agent-sdk/main/scripts/install.sh | bash -s /path/to/your-project
```

### 2. 初始化 Context（归档源文档）

先自备 PRD 与架构设计文档（`design/context-dev/templates/PRD.md.template`、`TAD.md.template` 可作参考，非必需；总结生成按章节语义解析，不依赖固定编号）。

```
.agent/workflows/context-init.md
目标项目：/path/to/your-project
PRD：@docs/product-overview.md
架构：@docs/system-architecture.md
```

产出：`.context/{domain,architecture,...}/source/` 源文档归档、`criterion.md`、`README.md`、`AGENTS.md`、Manifest，并按架构文档判断是否初始化 `SSoT/`。此步**不生成** domain / architecture 等总结。

安装脚本会先 bootstrap 命令到若干工具目录；初始化流程自身不会询问 AI 工具类型，只会将完整命令同步到目标项目的 `.agent/workflows/`。需要其他工具的完整命令时，按上文单独运行安装脚本。

### 3. 生成 Context 总结与 OpenSpec 资产（幂等）

```
.agent/workflows/context-openspec.md
```

一键模式按顺序执行：
- 生成 `.context/domain/`、`architecture/` 总结（存在 `db/`、`ui/` 源文档时同样生成）
- 确保 `openspec/` 目录结构存在
- 生成 `openspec/config.yaml` 与 `openspec/proposal-roadmap.md`

也可单独运行子命令：`domain` / `architecture` / `db` / `ui` / `legacy` / `project` / `plan`。**带参数 = 只运行命中的那一个模块，完成后立即结束**，不会继续执行其他步骤；无法识别的参数会停下来询问，不会回退为一键模式。

### 4. 创建提案

```
.agent/workflows/context-openspec.md proposal feat-user-login
```

- 读取 `openspec/proposal-roadmap.md` 定位条目
- 创建 `openspec/changes/<提案ID>/`（proposal.md, design.md, tasks.md）
- 严格校验通过后根据实际 Roadmap、提案工件和 Context 资产动态生成三层评审 Prompt，并由专用画像生成、复核 `check-report.md`

也可以显式指定“提案大纲文档”（例如某个 Phase 文件）：

```
.agent/workflows/context-openspec.md proposal feat-user-login openspec/proposal-roadmap-Phase3.md
```

### 5. 开始实施

```
.agent/workflows/context-start.md <提案ID>
```

执行流程：
1. `node design/context-dev/tools/specflow/specflow.mjs validate <提案ID> --strict`
2. 展示任务列表，等待确认
3. SSoT-first：按 `.context/criterion.md` 已启用层执行（数据层迁移 → 共享模型 → API 契约 → IPC 契约 → Codegen）
4. 实现业务代码 + 测试
5. `node design/context-dev/tools/specflow/specflow.mjs archive <提案ID> --yes --no-validate`

### 6. 检查状态

```bash
# 检查任务进度
.agent/workflows/context-check.md tasks <提案ID>

# 检查提案完整性
.agent/workflows/context-check.md proposal <提案ID>

# 检查环境
.agent/workflows/context-check.md env

# PRD 与架构双向追溯（路径可由 Manifest 自动解析）
.agent/workflows/context-check.md review prd-tad

# 全量生成资产、Manifest、README、Integration Index 四方同步
.agent/workflows/context-check.md review assets

# 单模块生成资产与源文档核对
.agent/workflows/context-check.md review scope domain

# Manifest 当前状态与扁平审计历史校验
.agent/workflows/context-check.md manifest
```

`context-manifest.json` 只保存当前源文件、生成资产和最近同步状态。完整同步/决策历史使用 `.context/history/context-sync.jsonl`，禁止通过 `previous_sync` 递归嵌套进 Manifest。

---

## SSoT 路径与工具

SSoT 的**工具不绑定具体语言**：`/context-init` 会根据架构文档为每一层选型（数据迁移、API 契约、IPC 契约、共享模型，以及各自的校验命令与 Codegen），并把结果写入 `.context/criterion.md` §7（路径见 §7.1，工具链与生成命令见 §7.2）。架构文档未指定时才使用默认：Goose（数据层）、TypeSpec → OpenAPI3（API 层）。

| 层 | 默认路径（可被选型覆盖） | 默认工具 |
|----|------------------------|---------|
| 需求层 | `openspec/config.yaml`、`openspec/proposal-roadmap.md`、`openspec/changes/`、`openspec/specs/` | specflow |
| 数据层 | `SSoT/schema/migrations/` | Goose |
| 共享层（可选） | `SSoT/shared/` | TypeSpec |
| API 层 | `SSoT/api/` | TypeSpec → OpenAPI3 |
| IPC 层（可选） | `SSoT/ipc/` | TypeSpec → JSON Schema |

----|---------|------|
| 需求层 | `openspec/config.yaml` | 从 `.context/` 生成的 OpenSpec 上下文快照（禁止手工维护） |
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
