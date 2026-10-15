# AI 工具入口模板

> **用途**: 存储各 AI 编程工具的入口文件模板，用于自动生成项目配置。

## 模板清单

| 模板文件 | 生成文件 | 目标工具 |
|---------|---------|---------| 
| `context-agents.md.template` | `.context/AGENTS.md` | 所有工具 |
| `AGENTS.md.template` | 项目根目录 `AGENTS.md`（init 自动生成/更新标记块） | 所有支持 AGENTS.md 的工具 |
| `CLAUDE.md.template` | `CLAUDE.md` | Claude Code |
| `cursorrules.template` | `.cursorrules` | Cursor |

## 参考模板（不由工作流自动使用）

| 模板文件 | 用途 |
|---------|------|
| `PRD.md.template` / `TAD.md.template` | 自备 PRD / 技术架构文档时的参考结构（`/context-init` 的输入，可选） |
| `module-contract.md.template` / `module-audit.md.template` / `module-check.md.template` | 模块契约/审计/检查的提示词模板，需要时手工复制使用；示例中的 ID 仅为示意 |
| `proposal-roadmap-phase.md.template` | `/context-openspec plan` 在需要分 Phase 细化时使用 |

提案工件模板位于 `design/context-dev/templates/openspec/`（`proposal/spec/design/tasks.md.template`），由 `specflow new` 使用。

## 占位符说明

| 占位符 | 来源 | 说明 |
|--------|------|------|
| `{{project_name}}` | 用户输入 | 项目名称 |
| `{{project_root}}` | 用户输入 | 项目根目录绝对路径 |
| `{{schema_path}}` | criterion.md | Schema 迁移目录 (默认 `SSoT/schema/migrations/`) |
| `{{api_path}}` | criterion.md | API 定义路径 (默认 `SSoT/api/main.tsp`) |
| `{{proposal_command}}` | criterion.md | 提案命令 (默认 `.agent/workflows/context-openspec.md proposal <change-id> [roadmap-doc]`) |
| `{{tech_stack_constraints}}` | tech_stack.md | 技术栈约束 (MUST/SHOULD) |
| `{{must_not_rules}}` | criterion.md | 禁止规则 |
| `{{constraints}}` | criterion.md | 通用约束 |
| `{{generated_at}}` | 自动填充 | 生成时间戳 (YYYY-MM-DD HH:mm) |
| `{{prd_path}}` | 用户输入 | PRD 文档路径 |
| `{{architecture_path}}` | 用户输入 | 架构文档路径 |

## 使用方式

`context-init` 只在**项目根目录**生成/更新一份 `AGENTS.md`（来自 `AGENTS.md.template`），用标记块 `<!-- CONTEXT-DEV:START/END -->` 指引 AI 阅读 `.context/`、`.agent/workflows/` 和 `openspec/`；已有 `AGENTS.md` 时只更新标记块、保留人工内容。

其余模板（`CLAUDE.md.template`、`cursorrules.template`）是**可选**的其他工具入口，init 不会生成，需要时由项目维护者按需复制并替换占位符。

## 准则引用与幂等更新

- `.context/criterion.md` 是项目约束的权威来源，入口文件必须引用它以确保运行期必读。
- `.agent/workflows/context-init.md` 生成入口文件时，应当覆盖/更新入口文件中的“准则引用”部分；推荐将入口文件视为可再生文件。
- 若需要在“保留人工内容”的同时更新准则引用，可在入口文件中使用标记块并仅更新标记块内部内容（实现侧策略）：

```markdown
<!-- PROJECT_Criterion:START -->
本项目遵循项目准则，详见：@.context/criterion.md
<!-- PROJECT_Criterion:END -->
```

## 扩展新工具

增加共享命令安装目标时，更新 `templates/scripts/install-ai-commands.sh` 的工具映射和本文档；Codex prompts 由独立脚本处理。新增入口配置模板时，更新上方模板清单。Manifest 是否需要记录配置取决于对应功能是否已实现，当前初始化流程不会自动生成这些入口文件。
