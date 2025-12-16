---
description: Check OpenSpec change status (env/tasks/proposal/plan/project/review)
---

# Context Check

Supported subcommands:
- `env`: toolchain + MCP configuration checks
- `tasks <change-id>`: progress report for `openspec/changes/<change-id>/tasks.md`
- `proposal <change-id>`: proposal quality + Context consistency checks
- `plan`: roadmap quality + Context consistency checks
- `project`: project.md quality + Context consistency checks
- `review [<scope>]`: Context 生成结果质量校验（domain/architecture/db/ui/legacy）

---

## env

**Execute**: `@design/context-dev/check/devenv/AGENTS.md`

> 该模块会：
> - 执行 `check-toolchain.sh` 检查系统工具链
> - 执行 `check-mcp.sh` 检查 MCP 配置

---

## tasks

**Execute**: `@design/context-dev/check/tasks/AGENTS.md`

> 传递 `$ARGUMENTS`：`<change-id>`

**详细步骤**见 `tasks/AGENTS.md`，包括：
1. 确定提案 ID（若未提供则列出选项）
2. 读取 tasks.md
3. 解析 checkbox 状态（`[x]`/`[/]`/`[ ]`）
4. 统计完成率
5. 生成进度报告

---

## proposal

**Execute**: `@design/context-dev/check/proposal/AGENTS.md`

> 传递 `$ARGUMENTS`：`<change-id>`

**详细步骤**见 `proposal/AGENTS.md`，包括：
1. 文件完整性校验
2. OpenSpec 规范校验
3. Context 引用一致性
4. Context 内容一致性校验
5. SSoT 先行任务检查
6. 生成检查报告

---

## plan

**Execute**: `@design/context-dev/check/plan/AGENTS.md`

**详细步骤**见 `plan/AGENTS.md`，包括：
1. 文件存在性校验（`proposal-roadmap.md`）
2. 格式正确性校验（参考模板）
3. Context 内容一致性校验
4. 提案关系与基础设施校验（依赖链、基础设施排序）
5. 生成检查报告

---

## project

**Execute**: `@design/context-dev/check/project/AGENTS.md`

**详细步骤**见 `project/AGENTS.md`，包括：
1. 文件存在性校验（`project.md`）
2. 格式正确性校验（9 个必需章节）
3. Context 内容一致性校验
4. 完整性校验（无残留占位符）
5. 生成检查报告

---

## review

**Execute**: `@design/context-dev/check/review/AGENTS.md`

> 传递 `$ARGUMENTS`：`"<核对事项描述>"`

**开放式核对命令** — 用户描述核对需求，AI 主动读取相关资产并与用户交互确认。

**示例**:
```
/context-check review "检查 api_strategy.md 的错误响应格式"
/context-check review "核对 tech_stack.md 中的版本约束是否最新"
/context-check review "确认 business_rules.md 覆盖了所有 PRD 业务规则"
/context-check review "验证 .context 资产与 openspec/project.md 的一致性"
```

**执行流程**：
1. 解析核对意图（范围、标准、深度）
2. 读取相关 `.context/**` 资产
3. 执行核对（结构/内容/一致性/规范）
4. 展示发现并请求用户确认
5. 根据反馈行动（修复/澄清/深入）

$ARGUMENTS
