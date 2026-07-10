---
description: Check OpenSpec change status (env/tasks/proposal/plan/project/review)
---

# Context Check

Supported subcommands:
- `env`: project environment checks (provider-based, optional)
- `tasks <change-id>`: progress report for `openspec/changes/<change-id>/tasks.md`
- `proposal <change-id>`: proposal quality + Context consistency checks
- `plan`: roadmap quality + Context consistency checks
- `project`: config.yaml quality + Context consistency checks
- `review prd-tad [prd-path] [tad-path]`: PRD ↔ TAD 双向追溯
- `review assets`: 全量生成资产四方同步与跨模块一致性
- `review core`: README / AGENTS / criterion / Manifest 核对
- `review scope <domain|architecture|db|ui|legacy>`: 单模块生成资产 ↔ 源文档核对
- `review "<description>"`: 自由文本专项核对

---

## env

**Provider 查找**（在项目根目录）：

1. `Makefile` 中存在 `check-env` target → 执行 `make check-env`
2. `scripts/check-env.sh` 存在 → 执行 `bash scripts/check-env.sh`
3. 均不存在 → 跳过，输出提示

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
1. 文件存在性校验（`config.yaml`）
2. 格式正确性校验（参考模板）
3. Context 内容一致性校验
4. 完整性校验（无残留占位符）
5. 生成检查报告

---

## review

**Execute**: `@design/context-dev/check/review/AGENTS.md`

> 传递 `$ARGUMENTS`：`<profile> [arguments]` 或 `"<核对事项描述>"`

**画像化核对命令** — 常见深度审查无需重复粘贴长 Prompt；仍支持自由文本专项检查。

**示例**:
```
/context-check review prd-tad
/context-check review assets
/context-check review core
/context-check review scope db
/context-check review "检查 api_strategy.md 的错误响应格式"
```

**执行流程**：
1. 解析画像、范围、权威来源和排除项
2. 按需读取证据，避免无关资产全量加载
3. 执行双向追溯、同步或专项核对
4. 按统一标签和 P0/P1/P2 输出证据化报告
5. 默认只读；仅在用户明确要求后修复并更新 Manifest

$ARGUMENTS
