# UI 总结生成入口

> **用途**: 从 UI 设计规范文档生成结构化的 UI 设计资产（供实现期引用）。  
> **触发**: `.agents/workflows/context-openspec.md ui`，或由 `.agents/workflows/context-openspec.md`（无参数一键模式）按顺序调用。`/context-init` 只归档源文档，不会生成本模块的总结。

---

## 📂 目录结构（混合模式）

> ⚠️ **动态生成**：具体生成哪些文件由 Phase 0 分析决定，以下仅为示例

```
.context/ui/
├── source/                    # 源文档目录（权威）
│   └── *.md                   # 完整 UI 规范文档
├── design_system.md           # 必须生成
├── [atomic_components.md]     # 按需生成（Phase 0 检测）
├── [layout_grid.md]           # 按需生成（Phase 0 检测）
├── [design_tokens.json]       # 按需生成（Phase 0 检测）
├── [interaction_states.md]    # 按需生成（Phase 0 检测）
├── [motion_tokens.md]         # 按需生成（Phase 0 检测）
├── [...]                      # 更多文件见模板引用表
└── README.md                  # 整体说明（快速索引）
```

> 方括号 `[文件名]` 表示该文件根据源文档内容动态决定是否生成

**读取优先级**：
1. 日常任务 → 读取总结文件（快速）
2. 提案检查 → 读取总结 + 设计规范验证
3. 遇到不确定/细节问题 → **回溯 `source/` 目录验证**

> ⚠️ **若总结与源文档冲突，以 `source/` 目录中的源文档为准**

---

## 🎯 执行指令

使用 **源文档**（位于 `.context/ui/source/` 目录），依次执行以下步骤。

> **⚠️ 全局规则**:
> 1. 所有生成的文件都必须在顶部包含 Metadata 区块（Source, Generated At, Generator）。
> 2. 生成结果必须登记到目标项目 `.context/context-manifest.json` 的 `generated_files`（路径相对于 `.context/` 根目录）。
> 3. **输出边界**: 本命令生成的**总结资产**只能写入 `.context/ui/**`（不含 `source/`）。除 §0 Pre-step 的集成资产（`.context/openspec/integration.md`）与本模块的 Manifest 登记（`.context/context-manifest.json`）之外，**不得写入其他目录**，也不得生成其他模块的总结。
> 4. **源文档只读**: 谨慎修改 `source/` 目录中的文件。

---

## ✅ 基于什么生成（输入来源与优先级）

`.agents/workflows/context-openspec.md ui` 的产物**基于 UI 规范类源文档**生成，而不是凭空“设计 UI”。按优先级选择输入：

1. **UI 设计规范文档（首选）**：如 `ui-spec.md` / `design-system.md` / `ui-guidelines.md`  
   - 放置位置：`.context/ui/<file>`（由 `.agents/workflows/context-init.md` 归档）
2. **设计系统资产（可选）**：tokens/组件清单/交互状态/无障碍清单（来自设计稿或设计系统文档）
3. **设计稿/原型（可选）**：Figma 链接 + 导出的说明（如有）
4. **仅有 PRD 时（降级）**：允许从 PRD 推导“最小可实施 UI 约束”，但必须：
   - 在 `design_system.md` 顶部显式标注 `Derived from PRD`（并列出假设/待确认项）
   - **不得**臆造具体色值/字号/tokens；只能写“范围/风格/组件集合/状态要求”等可验证约束

> **注意**：PRD 主要提供页面清单、用户旅程、验收标准与状态需求；真实的视觉 tokens/组件样式以 UI 规范/设计系统为准。

---

## 📋 UI 规范解析规则

从 `.context/ui/source/` 的源文档提取以下要点（项目内是否存在其他 UI 文档，不作为优先输入）：
- 视觉基础：颜色、字体、间距、圆角、阴影
- 布局：栅格/断点/密度
- 组件：按钮、输入框、表单、卡片、导航、表格等
- 交互：hover/pressed/disabled/loading/error/empty 等状态
- 动效：duration/easing/减弱动效
- 无障碍：目标标准、对比度、可聚焦、键盘导航、触控目标
- 交付：设计稿/切图/标注/组件绑定 tokens

> **仅有 PRD 时的处理**:
> - 允许生成 `design_system.md` 的“最小可实施版本”（Metadata 的 Basis 写 `Derived from PRD`，并写出假设与待确认项）
> - 其余文件按“缺失则跳过”策略；具体视觉数值一律 `N/A – 源文档未提供`，不要编造

### 内容归属（避免重复）

| 内容 | 唯一归属 | 其他文件 |
|------|---------|---------|
| Token 数值（颜色/字体/间距/圆角/阴影） | 生成了 `design_tokens.json` 时归它；否则归 `design_system.md` | 只写 Token 名称与用途，不写数值 |
| 断点、栅格、响应规则 | `layout_grid.md` | 引用 |
| 组件状态 | `interaction_states.md` | 引用 |
| 动效时长/缓动 | `motion_tokens.md` | 引用 |
| 组件分层与组成 | `atomic_components.md` | 引用 |

---

## Phase 0: 分析源文档（动态生成决策）

> ⛔ **必须首先执行此步骤**，在生成任何文件之前完成分析。

### 0.1 读取源文档

**读取**：`.context/ui/source/` 目录下的所有文件

### 0.2 确认目标平台

从源文档读取目标平台（Web / iOS / Android / 桌面 / 小程序等，可多个），记录到每个输出文件的 Metadata `Platforms`。源文档没有声明时，写 `N/A – 源文档未提供`，输出保持平台中立，**不要从其他文档或代码猜测**，也不要预设 HTML/CSS 或某个设计工具。

### 0.3 关键词分析

**依次检查以下关键词，记录是否存在**：

| 检查项 | 关键词 | 若存在则生成 | 优先级 |
|--------|--------|-------------|--------|
| 组件库 | 组件, Component, Atom, 原子化 | `atomic_components.md` | 推荐 |
| 栅格系统 | Grid, 栅格, 断点, Breakpoint, 响应式 | `layout_grid.md` | 推荐 |
| 设计 Token | Token, CSS 变量, --color, --spacing | `design_tokens.json` | 推荐 |
| 交互状态 | hover, pressed, disabled, loading, 状态 | `interaction_states.md` | 可选 |
| 动效 | Animation, Motion, Transition, 动画, 过渡 | `motion_tokens.md` | 可选 |
| 无障碍 | Accessibility, A11y, 对比度, 键盘导航 | `accessibility_checklist.md` | 可选 |
| 交付规范 | Handoff, 切图, 标注, Figma | `handoff_checklist.md` | 可选 |
| 多端适配 | iOS, Android, 多端, Platform | `platform_guidelines.md` | 可选 |

### 0.4 输出生成计划

**必须输出**：

```
=== 生成计划 ===
目标平台（来自源文档）：{{平台列表 或 N/A}}
依据：{{Spec / Derived from PRD}}

必须生成：
- design_system.md（核心设计系统 — 内部引用）

推荐生成（关键词匹配）：
- atomic_components.md（检测到：组件, Component）
- layout_grid.md（检测到：Grid, 断点）

跳过（未检测到相关内容）：
- motion_tokens.md
- platform_guidelines.md
```

**确认后继续 Phase 1**。

---

## 模板引用

> 模板路径相对于 `design/context-dev/`

| 输出文件 | 模板路径 | 备注 |
|----------|----------|------|
| `design_system.md` | `templates/ui/design_system.md.template` | 内部设计系统（CSS 变量 + 组件样式） |
| `atomic_components.md` | `templates/ui/atomic_components.md.template` | |
| `layout_grid.md` | `templates/ui/layout_grid.md.template` | |
| `design_tokens.json` | `templates/ui/design_tokens.json.template` | |
| `interaction_states.md` | `templates/ui/interaction_states.md.template` | |
| `motion_tokens.md` | `templates/ui/motion_tokens.md.template` | |
| `accessibility_checklist.md` | `templates/ui/accessibility_checklist.md.template` | |
| `handoff_checklist.md` | `templates/ui/handoff_checklist.md.template` | |
| `platform_guidelines.md` | `templates/ui/platform_guidelines.md.template` | |


---

## Phase 1: 填充模板

> **所有 Prompt 共用规则**：
> - 只记录源文档已写出的内容；具体数值（色值、字号、间距、断点、时长、对比度等）必须来自源文档，否则 `N/A – 源文档未提供`
> - 严格遵守模板内的「使用说明」：分层缺失规则、内容归属、平台中立；生成后删除「使用说明」与「示例」块
> - 只为 Phase 0 确认的平台写实现形式；不预设 HTML/CSS 或设计工具
> - **务必**保留 Metadata（JSON 在 `$extensions.context.meta`）

### 1. 填充 `design_system.md` (必须)

**Prompt**:
```markdown
# Role
你是一位 Design System 设计师。

# Task
阅读 UI 规范，提取设计系统的“可实现约束”，平台：{{Phase 0 确认的平台}}。

# Requirements
- 颜色（含语义色、有主题时的浅/深色）、字体、间距、圆角与阴影
- 关键组件的样式约束，引用 Token 名称
- 生成了 design_tokens.json 时，本文件的值列写“见 design_tokens.json”
- 仅有 PRD 时：Basis 写 Derived from PRD，数值 N/A，并列出假设与待确认项

# Output Format
使用 `design_system.md` 模板格式输出。
```

### 2. 填充 `atomic_components.md` (推荐)

**Prompt**:
```markdown
# Task
基于 UI 规范整理组件分层清单。

# Requirements
- 原子/分子/有机体/模板/页面（源文档用别的分层体系时按它的叫法）
- 分子/有机体写明组成；不写颜色、字号等数值，只引用 Token
- 没有依据的层保留标题 + 一行 N/A

# Output Format
使用 `atomic_components.md` 模板格式输出。
```

### 3. 填充 `layout_grid.md` (推荐)

**Prompt**:
```markdown
# Task
提取响应式布局与栅格规范。

# Requirements
- 断点、栅格（列数/Margin/Gutter）、响应规则
- 非 Web 平台写窗口与最小尺寸
- 间距引用 Token 名，不重复数值

# Output Format
使用 `layout_grid.md` 模板格式输出。
```

### 4. 填充 `design_tokens.json` (推荐)

**Prompt**:
```markdown
# Task
将 UI 规范转换为三层 Token JSON（Global → Alias → Component），采用 Design Tokens 标准写法（`$value` / `$type`）。

# Requirements
- Global：原始值；Alias：语义映射，有多主题时用 `$extensions.mode`；Component：组件覆写，没有依据保持空对象
- 没有依据的 Token **整个删除**，不要写占位值；不得保留模板里的占位结构
- 输出必须是合法 JSON（无注释、无多余逗号）
- 保留 `$extensions.context.meta`

# Output Format
使用 `design_tokens.json` 模板格式输出。
```

### 5. 填充 `interaction_states.md` (可选)

**Prompt**:
```markdown
# Task
定义交互组件的状态规范。

# Requirements
- 状态矩阵只写源文档涉及的组件与状态，不预填；触屏平台没有的状态（如 Hover）不写
- 每个状态给出视觉变化，颜色与间距引用 Token

# Output Format
使用 `interaction_states.md` 模板格式输出。
```

### 6. 填充 `motion_tokens.md` (可选)

**Prompt**:
```markdown
# Task
提取动效规范。

# Requirements
- 时长、缓动、使用规则、减弱动效处理（按平台写，没有要求写 N/A）
- 数值必须来自源文档

# Output Format
使用 `motion_tokens.md` 模板格式输出。
```

### 7. 填充 `accessibility_checklist.md` (可选)

**Prompt**:
```markdown
# Task
提取无障碍要求。

# Requirements
- 目标标准以源文档为准；源文档没写，不默认 AA
- 检查项只保留适用于所声明平台、且有依据的；阈值来自源文档
- 写明验证方式

# Output Format
使用 `accessibility_checklist.md` 模板格式输出。
```

### 8. 填充 `handoff_checklist.md` (可选)

**Prompt**:
```markdown
# Task
提取设计交付要求。

# Requirements
- 交付方式、资产规格以源文档为准，不预设设计工具
- 清单项可检查，并与 Token/状态/栅格文件对应，不重复其内容

# Output Format
使用 `handoff_checklist.md` 模板格式输出。
```

### 9. 填充 `platform_guidelines.md` (可选)

**Prompt**:
```markdown
# Task
提取多端平台差异。

# Requirements
- 只为声明的平台建列，平台名按项目实际；单平台不生成
- 只写源文档明确要求的差异与统一策略

# Output Format
使用 `platform_guidelines.md` 模板格式输出。
```

### 10. 自检（Phase 1 完成后、Phase 2 之前）

- [ ] 生成的文件中没有“使用说明”“示例”块，没有残留 `{{...}}`
- [ ] 每个文件 Metadata 的 Platforms、Basis 与 Phase 0 一致
- [ ] 所有具体数值都能在源文档中找到；仅有 PRD 时没有出现任何具体色值/字号/间距
- [ ] Token 数值只出现在归属文件，其他文件只引用名称
- [ ] `design_tokens.json` 是合法 JSON，且没有占位 Token 残留
- [ ] 没有预设 HTML/CSS、设计工具或未声明的平台
- [ ] 缺失内容按分层规则处理，没有逐格 N/A 或 TODO

---

## Phase 2: 更新 Manifest

> ⛔ **必须执行此步骤**，Phase 1 完成后立即执行

**执行**: `@design/context-dev/tools/manifest/AGENTS.md` (mode: update)

**更新内容**：
1. 将本次生成的所有文件添加到 `generated_files.ui` 数组（该键不存在时先创建，不要预置空数组）
2. 确认 `sources.UI_SPEC` 记录正确
3. 将已生成的条目从 `pending_generation.ui` 移除；数组清空后删除 `ui` 键（`pending_generation` 为空对象时保留空对象即可）

**生成后同步（⛔ 必须执行，因为 §0 Pre-step 的索引刷新发生在本模块生成之前，此时已过期）**：
1. 执行 `@design/context-dev/tools/integration/AGENTS.md` Phase 2，重新刷新 `.context/openspec/integration.md` 的 `CONTEXT_ASSET_INDEX`（UI 行应反映新生成的文件）
2. 按 `@design/context-dev/tools/manifest/AGENTS.md` 的目录树规则刷新 `.context/AGENTS.md` 中的 `ui/` 目录树（仅列真实存在的文件）

**⚠️ Phase 2 完成后必须执行 ✅ 完成后 报告**

---

## ✅ 完成后

向调用方（`@design/context-dev/openspec/AGENTS.md` 路由层）汇报完成状态，**然后停止**：
> ⛔ 本模块完成后**不得自行继续执行其他模块**。子命令模式下路由层直接结束；一键模式下由路由层决定下一步。（`.context/AGENTS.md` 是索引文档，不是调用方。）

汇报内容：
- ✅ 已生成的文件列表
- ⏩ 跳过的文件及原因（源文档缺失/未覆盖）
- 🔁 Manifest 更新状态（含 `pending_generation.ui` 清理、索引与目录树同步）
- ➡️ 下一步：如需把 UI 工作纳入提案路线图，运行 `.agents/workflows/context-openspec.md plan add ui`
