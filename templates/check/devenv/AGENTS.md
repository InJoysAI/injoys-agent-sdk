# DevEnv Check 指令

> ⚠️ **Reference Implementation**: 此文件是环境检查的**参考实现**。
> 框架入口已改为 Provider 机制（查找项目自定义 `Makefile check-env` 或 `scripts/check-env.sh`），
> 不再直接调用此文件。项目可将此目录中的脚本复制到 `scripts/check-env.sh` 作为自定义实现。

> 当 `/context-check env` 被调用时，若项目配置了 provider 则执行 provider；否则可参考此文件。

---

## 🎯 执行指令

使用用户提供的 **目标项目路径** 和 **AI 工具类型**，依次执行以下步骤。

> **⚠️ 全局规则**:  
> 环境检查不生成持久化文件，仅输出检查报告。

---

### Phase 1: 系统工具链检查 (System Toolchain)

#### 1.1 运行工具链检查脚本

**Prompt**:
```markdown
# Role
你是一位 DevOps 工程师。

# Task
检查开发环境是否满足所有技术栈要求（运行时、SSoT、代码生成）。

# Requirements
- 运行脚本并检查以下所有项：
  - **运行时**: Go, Node.js, Python, uv, Docker
  - **SSoT**: Goose, TypeSpec, Specflow
  - **CodeGen**: oapi-codegen, orval, datamodel-codegen
- 输出完整检查报告（✅ / ❌）

# Command
./design/context-dev/check/devenv/check-toolchain.sh
```

---

### Phase 2: MCP 配置检查

#### 2.1 检查 MCP 配置文件

**Prompt**:
```markdown
# Role
你是一位 AI Agent 配置专家。

# Task
检查指定 AI 工具的 MCP 配置文件是否存在且有效。

# Input
用户指定的 AI 工具（可选）：
- `--tool windsurf` → Windsurf
- `--tool cursor` → Cursor
- `--tool claude` → Claude Desktop
- `--tool antigravity` → Antigravity
- 默认检查所有工具

# Config Paths
| 工具 | 配置路径 |
|------|---------|
| Claude Desktop | `~/.config/claude/claude_desktop_config.json` |
| Cursor | `~/.cursor/mcp.json` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |
| Antigravity | `.agent/workflows/` 目录 |

# Command
./design/context-dev/check/devenv/check-mcp.sh --tool <tool_name>

# Output
- ✅ 配置文件存在 + mcpServers 已配置
- ⚠️ 配置文件存在但 mcpServers 未配置
- ❌ 配置文件不存在 + 配置路径提示
```

---

> **💡 MCP 配置参考模板**: `design/context-dev/check/devenv/mcp-config.json`  
> 提醒用户需手动复制并修改占位符，请勿自动覆盖现有配置。

## 📋 工具链依赖清单

| 类别 | 工具 | 最低版本 | 安装命令 |
|------|------|---------|---------|
| **运行时** | Go | 1.22 | https://go.dev/dl/ |
| **运行时** | Node.js | 18 | https://nodejs.org/ |
| **运行时** | Python | 3.11 | https://python.org/ |
| **运行时** | uv | 0.4 | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| **运行时** | Docker | 24 | https://docker.com/ |
| **SSoT** | Goose | 3.0 | `go install github.com/pressly/goose/v3/cmd/goose@latest` |
| **SSoT** | TypeSpec | 0.60 | `npm install -g @typespec/compiler` |
| **SSoT** | Specflow | - | `node design/context-dev/tools/specflow/specflow.mjs --help` |
| **代码生成** | oapi-codegen | 2.0 | `go install github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@latest` |
| **代码生成** | orval | 7.0 | `npm install -g orval` |
| **代码生成** | datamodel-codegen | 0.25 | `uv tool install datamodel-code-generator` |

---

## 🔌 MCP 服务器清单

| 领域 | 服务器 | 用途 | 安装方式 |
|------|--------|------|---------|
| **数据层** | postgres-mcp | 数据库查询与分析 | `pipx install postgres-mcp` (Python) |
| **文件层** | filesystem-mcp | 文件读写 | `npx -y @modelcontextprotocol/server-filesystem` |
| **Git 层** | github-mcp | 代码协作 | `npx -y @modelcontextprotocol/server-github` |
| **思维链** | sequential-thinking | 复杂任务规划 | `npx -y @modelcontextprotocol/server-sequential-thinking` |
| **记忆层** | memory-mcp | 知识图谱记忆 | `npx -y @modelcontextprotocol/server-memory` |
| **前端感知** | context7 | 实时文档知识注入 | `npx -y @upstash/context7-mcp` |
| **前端感知** | tailwindcss-mcp | CSS 转换与文档检索 | `npm install -g tailwindcss-mcp-server` |
| **前端感知** | playwright-mcp | 浏览器自动化测试 | `npx -y @playwright/mcp@latest` |
| **代码语义** | mcp-gopls | Go LSP 驱动分析 | `go install github.com/hloiseaufcms/mcp-gopls/cmd/mcp-gopls@latest` |

> **注意**: basedpyright 和 ruff 是 LSP 工具，应通过 IDE 扩展使用，不作为 MCP 配置。

---

## 📂 MCP 配置路径

| 工具 | 配置路径 (macOS/Linux) |
|------|----------------------|
| **Claude Desktop** | `~/.config/claude/claude_desktop_config.json` |
| **Cursor** | `~/.cursor/mcp.json` |
| **Windsurf** | `~/.codeium/windsurf/mcp_config.json` |

> **模板文件**: `design/context-dev/check/devenv/mcp-config.json`  

---

## ✅ 完成后

输出环境检查报告，格式如下：

```
========================================
  InJoysAI 开发环境检查
========================================

=== 运行时环境 ===
✅ Go: 1.22.x
✅ Node.js: 20.x
✅ Python: 3.11.x + uv 0.5.x
✅ Docker: 24.x

=== SSoT 工具链 ===
✅ Goose: 3.x
✅ TypeSpec: 0.63.x
✅ OpenSpec: 0.1.x

=== 代码生成工具 ===
✅ oapi-codegen: 2.x
✅ orval: 7.x
✅ datamodel-codegen: 0.26.x

=== MCP 配置文件 ===
✅ Windsurf: 已存在
   ✓ MCP 服务器已配置

📋 MCP 配置模板: design/context-dev/check/devenv/mcp-config.json

========================================
✅ 所有工具已安装完成！
========================================
```
