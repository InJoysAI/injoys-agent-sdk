# AI 工具入口模板

> **用途**: 存储各 AI 编程工具的入口文件模板，用于自动生成项目配置。

## 模板清单

| 模板文件 | 生成文件 | 目标工具 |
|---------|---------|---------| 
| `context-agents.md.template` | `.context/AGENTS.md` | 所有工具 |
| `AGENTS.md.template` | `AGENTS.md` | Antigravity |
| `CLAUDE.md.template` | `CLAUDE.md` | Claude Code |
| `cursorrules.template` | `.cursorrules` | Cursor |
| `windsurfrules.template` | `.windsurfrules` | Windsurf |

## 占位符说明

| 占位符 | 来源 | 说明 |
|--------|------|------|
| `{{project_name}}` | 用户输入 | 项目名称 |
| `{{project_root}}` | 用户输入 | 项目根目录绝对路径 |
| `{{schema_path}}` | criterion.md | Schema 文件路径 (默认 `schema/postgres.hcl`) |
| `{{api_path}}` | criterion.md | API 定义路径 (默认 `api/main.tsp`) |
| `{{proposal_command}}` | criterion.md | 提案命令 (默认 `/context-openspec proposal <change-id> [roadmap-doc]`) |
| `{{tech_stack_constraints}}` | tech_stack.md | 技术栈约束 (MUST/SHOULD) |
| `{{must_not_rules}}` | criterion.md | 禁止规则 |
| `{{constraints}}` | criterion.md | 通用约束 |
| `{{generated_at}}` | 自动填充 | 生成时间戳 (YYYY-MM-DD HH:mm) |
| `{{prd_path}}` | 用户输入 | PRD 文档路径 |
| `{{architecture_path}}` | 用户输入 | 架构文档路径 |

## 使用方式

模板由 `design/context-dev/AGENTS.md` 的 Step 6 自动调用。

## 准则引用与幂等更新

- `.context/criterion.md` 是项目约束的权威来源，入口文件必须引用它以确保运行期必读。
- `/context-init` 生成入口文件时，应当覆盖/更新入口文件中的“准则引用”部分；推荐将入口文件视为可再生文件。
- 若需要在“保留人工内容”的同时更新准则引用，可在入口文件中使用标记块并仅更新标记块内部内容（实现侧策略）：

```markdown
<!-- PROJECT_Criterion:START -->
本项目遵循项目准则，详见：@.context/criterion.md
<!-- PROJECT_Criterion:END -->
```

## 扩展新工具

要添加新 AI 工具支持：
1. 创建 `{工具名}.template` 文件
2. 在 `AGENTS.md` Step 6.2 表格中添加条目
3. 更新 `context-manifest.json` 的 `ai_tool_configs` schema
