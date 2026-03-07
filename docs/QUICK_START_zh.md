# injoys-agent-sdk 快速入门指南

> 本指南将帮助你在 10 分钟内完成从安装到第一个提案实施的全流程。

---

## 前置条件

- Node.js 18+
- Git
- AI 编程工具（Antigravity / Claude Code / Cursor / Windsurf）

---

## 第一步：安装 injoys-agent-sdk

```bash
# 在你的项目根目录执行
curl -fsSL https://raw.githubusercontent.com/injoysai/injoys-agent-sdk/main/scripts/install.sh | bash
```

默认情况下，安装脚本只会 bootstrap `/context-init` 和 `/context-check`。完整命令集会在你运行 `/context-init` 后再安装/生成（包括 `/context-openspec`、`/context-start` 等）。

安装完成后，你会看到：
- `design/context-dev/` — 上下文生成框架
- `.agent/workflows/` — AI 命令（Antigravity）

---

## 第二步：初始化上下文 (`/context-init`)

准备你的源文档：
- PRD（产品需求文档）
- 架构设计文档（可选但推荐）

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

---

## 第三步：生成 Context 总结 (`/context-openspec`)

```
/context-openspec
```

**AI 会依次执行**：
1. 读取 PRD → 生成 `.context/domain/` 总结
2. 读取架构文档 → 生成 `.context/architecture/` 总结
3. 填充 `.context/criterion.md`（项目准则）
4. 初始化 OpenSpec → `openspec init`
5. 生成 `openspec/project.md` 和 `openspec/proposal-roadmap.md`

**分步执行（推荐）**：
```bash
/context-openspec domain        # 先处理 PRD
/context-openspec architecture  # 再处理架构
/context-openspec project       # 生成 project.md
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
│  openspec archive --yes     │
└─────────────────────────────┘
```

### SSoT 先行原则

若任务涉及数据库或 API 变更：

| SSoT 类型 | 先修改 | 再执行 |
|-----------|--------|--------|
| PostgreSQL | `schema/postgres.hcl` | `atlas schema apply` |
| REST API | `api/main.tsp` | `tsp compile` → `oapi-codegen` |

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
     [x] 创建用户表 (schema/postgres.hcl → atlas)
     [x] 实现登录 API (api/main.tsp → oapi-codegen)
     [x] 添加测试
  → 验证通过
  → 自动归档

# 7. 完成！
```

---

## 常见问题

### Q: OpenSpec 未安装？
```bash
npm install -g @fission-ai/openspec@latest
```

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

