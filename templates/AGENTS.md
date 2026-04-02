# Context 生成入口

> **用途**: 读取此文件后，在**目标项目目录**生成 `.context/` 资产  
> **触发**: `@design/context-dev/AGENTS.md` 或 `/context-init`

---

## 执行指令

> ⛔ **必须严格按顺序执行所有 Step**，不得跳过或提前结束。

---

### Step 1: 确认目标项目

**检查用户是否已提供参数**（如 `/context-init PRD: xx; 架构: xx; 项目路径: xx`）：

| 参数 | 必需 | 缺失时询问 |
|------|:----:|-----------|
| 项目路径 | ✅ | "请提供目标项目的根目录路径（绝对路径）" |
| PRD | ✅ | 在 Step 3 由 docs 模块询问 |
| 架构文档 | ✅ | 在 Step 3 由 docs 模块询问 |

> 若用户已提供全部参数，**跳过询问直接执行**。

**⚠️ Step 1 完成后必须继续 Step 2**

---

### Step 2: 环境检查（可选，Provider 机制）

> 在 Step 1 确定的**目标项目根目录**中查找 env-check provider。
> 若无 provider，**不阻断**，输出提示后继续 Step 3。

**查找优先级**：

1. 项目根目录存在 `Makefile` 且包含 `check-env` target → 执行 `make check-env`
2. 项目根目录存在 `scripts/check-env.sh` → 执行 `bash scripts/check-env.sh`
3. 均不存在 → 输出提示并继续：

```
ℹ️ 未找到环境检查入口，继续初始化。
   可创建 Makefile check-env 或 scripts/check-env.sh 配置项目环境检查。
```

> 💡 **参考实现**: 如需环境检查示例，参见 `design/context-dev/check/devenv/`（含工具链和 MCP 检查脚本）。

**⚠️ Step 2 完成后必须继续 Step 3**

---

### Step 3: 收集文档并生成 Context

**执行**: `@design/context-dev/tools/docs/AGENTS.md`

> 该模块会：
> - 收集用户提供的源文档
> - 创建 `.context/` 目录结构
> - 生成根目录文件（README.md, criterion.md, AGENTS.md）
> - 更新 Manifest

**⚠️ Step 3 完成后必须继续 Step 4**

---

### Step 4: AI 工具配置

> ⛔ **必须执行**，不得跳过

**执行**: `@design/context-dev/tools/ai-config/AGENTS.md`

> 该模块会：
> - 询问用户选择的 AI 工具
> - 生成对应的配置文件

**⚠️ Step 4 完成后必须继续 Step 5**

---

### Step 5: SSoT 初始化

> ⛔ **必须执行决策判断**，不得跳过

**执行**: `@design/context-dev/tools/SSoT/AGENTS.md`

> 该模块会：
> - 检查项目是否需要 SSoT（主要基于架构文档）
> - 若需要，执行初始化
> - 若不需要，明确报告跳过原因

**⚠️ Step 5 完成后必须执行 Step 6**

---

### Step 6: 汇报结果

> ⛔ **必须执行**，这是最终步骤

**必须向用户输出以下报告**：

```
=== Context 初始化完成 ===

📁 目标项目: [项目路径]

✅ 已生成的文件:
- .context/README.md
- .context/criterion.md
- .context/AGENTS.md
- .context/domain/source/[PRD文件]
- .context/architecture/source/[架构文件]
- ...

⏩ 跳过的模块:
- [模块名] (原因: ...)

🔁 Manifest: [已更新 / 未变更]

🤖 AI 工具配置:
- [工具名]: [已配置 / 跳过]

🏗️ SSoT 状态: [已初始化 / 跳过 (原因)]
```

---

## 模块索引

| 模块 | 路径 | 用途 |
|------|------|------|
| 环境检查 (Provider) | 项目自定义 `Makefile check-env` 或 `scripts/check-env.sh` | 项目级环境检查（可选） |
| 环境检查 (参考实现) | `@design/context-dev/check/devenv/` | 工具链 + MCP 检查示例 |
| 文档收集与生成 | `@design/context-dev/tools/docs/AGENTS.md` | 收集源文件并生成 .context/ |
| Manifest | `@design/context-dev/tools/manifest/AGENTS.md` | 记录文件变化 |
| AI 配置 | `@design/context-dev/tools/ai-config/AGENTS.md` | 配置 AI 工具 |
| SSoT | `@design/context-dev/tools/SSoT/AGENTS.md` | 初始化 SSoT |
