# injoys-agent-sdk 快速入门指南

> 本指南将帮助你在 10 分钟内完成从安装到第一个提案实施的全流程。

---

## 前置条件

- Node.js 18+
- Git
- AI 编程工具（Antigravity / Claude Code / Cursor / Devin / Codex / Qoder）

---

## 第一步：安装 injoys-agent-sdk

### 方式 1: NPX

```bash
npx @injoysai/agent-sdk init
```

### 方式 2: 一键安装

```bash
# 在你的项目根目录执行
curl -fsSL https://raw.githubusercontent.com/injoysai/injoys-agent-sdk/main/scripts/install.sh | bash
```

默认情况下，安装脚本只会 bootstrap `/context-init` 和 `/context-check`。完整命令集会在你运行 `/context-init` 后再安装/生成（包括 `/context-openspec`、`/context-start` 等）。

安装完成后，你会看到：
- `design/context-dev/` — 上下文生成框架
- 适配当前编辑器或 Agent 的 AI 命令 / 工作流目录

---

## 第二步：初始化上下文 (`/context-init`)

准备你的源文档：
- PRD（产品需求文档）
- 架构设计文档（必需，作为技术约束的权威输入）

在 AI 工具中执行：

```
/context-init
目标项目：/path/to/your-project
PRD：@docs/product-overview.md
架构：@docs/system-architecture.md
```

**结果**：
- ✅ 创建 `.context/` 目录
- ✅ 归档源文档
- ✅ 生成 `context-manifest.json`
- ✅ 生成工程约束权威来源 `.context/criterion.md`
- ✅ 为所选 AI 工具安装共享的完整 `/context-*` 命令集

---

## 第三步：生成 Context 总结 (`/context-openspec`)

```
/context-openspec
```

**AI 会依次执行**：
1. 读取 PRD → 生成 `.context/domain/` 总结
2. 读取架构文档 → 生成 `.context/architecture/` 总结
3. 填充 `.context/criterion.md`（项目准则）
4. 同步 `.context/openspec/integration.md` 和 Context 资产索引
5. 生成派生快照 `openspec/config.yaml` 和 `openspec/proposal-roadmap.md`

`openspec/config.yaml` 从 `.context/` 权威资产派生，不应手工维护；来源指纹变化后使用 `/context-openspec project` 重新生成。

**分步执行（推荐）**：
```bash
/context-openspec domain        # 先处理 PRD
/context-openspec architecture  # 再处理架构
/context-openspec project       # 生成派生的 config.yaml 快照
/context-openspec plan          # 生成 proposal-roadmap.md
```

---

## 第四步：创建提案 (`/context-openspec proposal <change-id> [roadmap-doc]`)

```
/context-openspec proposal feat-user-login
```

**AI 会**：
1. 读取 `openspec/proposal-roadmap.md` 定位条目
2. 如有提供，再读取补充的 `roadmap-doc` 以丰富提案范围或大纲
3. 创建 `openspec/changes/feat-user-login/`
   - `proposal.md` — 范围、边界、验收标准
   - `tasks.md` — 任务清单
   - `design.md` — 技术设计（如需）

**审查提案**：
```
/context-check proposal feat-user-login
```

**可选补充完善**：
```
/context-interview
主题: 用户认证的业务规则
```

---

## 第五步：实施提案 (`/context-start`)

```
/context-start feat-user-login
```

### 执行流程

```
┌─────────────────────────────┐
│ Phase 1: 读取提案内容       │
│ Phase 2: openspec validate  │
│ Phase 3: 检查 SSoT 需求     │
└─────────────────────────────┘
             ↓
┌─────────────────────────────┐
│ 📋 即将执行以下任务：       │
│  1. [ ] 创建用户表          │
│  2. [ ] 实现登录 API        │
│  3. [ ] 添加测试            │
│ 确认开始？(y/n)             │
└─────────────────────────────┘
             ↓ (用户确认)
┌─────────────────────────────┐
│ Phase 5: 按顺序执行任务     │
│  - SSoT 先行（若涉及）      │
│  - 每完成一个更新 tasks.md  │
└─────────────────────────────┘
             ↓
┌─────────────────────────────┐
│ Phase 6: 验证               │
│  - openspec validate        │
│  - go test / npm test       │
└─────────────────────────────┘
             ↓
┌─────────────────────────────┐
│ Phase 7: 归档               │
│  specflow archive           │
│  --yes --no-validate        │
└─────────────────────────────┘
```

### SSoT 先行原则

若任务涉及数据库或 API 变更：

| SSoT 类型 | 先修改 | 再执行 |
|-----------|--------|--------|
| PostgreSQL | `SSoT/schema/migrations/` | 执行项目的 Goose 迁移流程 |
| REST API | `SSoT/api/main.tsp` | `tsp compile` → 项目代码生成 |

### 任务状态标记

| 标记 | 状态 |
|------|------|
| `[ ]` | 待开始 |
| `[/]` | 进行中 |
| `[x]` | 已完成 |

### 中断恢复

若执行中断，重新运行 `/context-start feat-user-login`，AI 会从第一个未完成任务继续。

---

## 第六步：检查状态 (`/context-check`)

```bash
# 检查环境
/context-check env

# 检查任务进度
/context-check tasks feat-user-login

# 检查提案完整性
/context-check proposal feat-user-login

# 检查 OpenSpec 项目上下文快照
/context-check project

# 检查路线图覆盖、排序和依赖
/context-check plan
```

### 可复用文档审查

以下审查是可选、只读的诊断工具。在对应文档边界发生变化时主动执行，不会在提案实施过程中被自动重复调用。

```bash
# PRD ↔ 架构文档双向追溯
/context-check review prd-tad

# Manifest / README / Integration Index / 文件系统四方同步
/context-check review assets

# 核心文档职责和目录引用
/context-check review core

# 单模块生成资产 ↔ 源文档
/context-check review scope domain
/context-check review scope architecture
/context-check review scope db
/context-check review scope ui
```

---

## 完整示例：登录模块开发

```plaintext
# 1. 安装（一次性）
curl -fsSL https://raw.githubusercontent.com/injoysai/injoys-agent-sdk/main/scripts/install.sh | bash

# 2. 初始化
/context-init
  → PRD: @docs/product-overview.md
  → 架构: @docs/system-architecture.md

# 3. 生成 Context
/context-openspec

# 4. 创建提案
/context-openspec proposal feat-user-login [roadmap-doc]

# 5. 审查（人工确认 proposal.md）
# ...

# 6. 实施
/context-start feat-user-login
  → 确认任务列表 (y)
  → AI 自动执行：
     [x] 创建用户表 (SSoT/schema/migrations/ → Goose)
     [x] 实现登录 API (SSoT/api/main.tsp → codegen)
     [x] 添加测试
  → 验证通过
  → 自动归档

# 7. 完成！
```

---

## 常见问题

### Q: 是否需要全局安装 OpenSpec CLI？
```bash
node design/context-dev/tools/specflow/specflow.mjs --help
```
不需要。当前工作流使用仓库内置 Specflow，只要求 Node.js 18+。

### Q: `.context/` 不存在？
先运行 `/context-init`。

### Q: 任务执行中断了？
重新运行 `/context-start <提案ID>`，会自动从断点继续。

### Q: 如何更新 Context？
```bash
/context-update modify domain   # 重新生成 domain 总结
/context-update add @docs/new-spec.md  # 添加新文档
```

---
