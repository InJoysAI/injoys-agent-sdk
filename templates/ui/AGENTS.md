# UI 总结生成入口

> **用途**: 从 UI 设计规范文档生成结构化的 UI 设计资产（供实现期引用）。  
> **触发**: `/context-openspec ui` 或由 `design/context-dev/AGENTS.md` Step 5.2 调用。

---

## 📂 目录结构（混合模式）

> ⚠️ **动态生成**：具体生成哪些文件由 Phase 0 分析决定，以下仅为示例

```
.context/ui/
├── source/                    # 源文档目录（权威）
│   └── *.md                   # 完整 UI 规范文档
├── design_system.md           # 必须生成
├── stitch_prompts.md          # 必须生成
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
> 3. **输出边界**: 本命令只能写入 `.context/ui/**`（不含 `source/`），不可直接写入其他目录。
> 4. **源文档只读**: 不得修改 `source/` 目录中的文件。。

---

## ✅ 基于什么生成（输入来源与优先级）

`/context-openspec ui` 的产物**基于 UI 规范类源文档**生成，而不是凭空“设计 UI”。按优先级选择输入：

1. **UI 设计规范文档（首选）**：如 `ui-spec.md` / `design-system.md` / `ui-guidelines.md`  
   - 放置位置：`.context/ui/<file>`（由 `/context-init` 归档）
2. **设计系统资产（可选）**：tokens/组件清单/交互状态/无障碍清单（来自设计稿或设计系统文档）
3. **设计稿/原型（可选）**：Figma 链接 + 导出的说明（如有）
4. **仅有 PRD 时（降级）**：允许从 PRD 推导“最小可实施 UI 约束”，但必须：
   - 在 `design_system.md` 顶部显式标注 `Derived from PRD`（并列出假设/待确认项）
   - **不得**臆造具体色值/字号/tokens；只能写“范围/风格/组件集合/状态要求”等可验证约束

> **注意**：PRD 主要提供页面清单、用户旅程、验收标准与状态需求；真实的视觉 tokens/组件样式以 UI 规范/设计系统为准。

---

## 📋 UI 规范解析规则

优先读取目标项目内的 `docs/UX_UI_Design_Guidelines.md`（若存在），否则按以下内置要点提取：
- 视觉基础：颜色、字体、间距、圆角、阴影
- 布局：栅格/断点/密度
- 组件：按钮、输入框、表单、卡片、导航、表格等
- 交互：hover/pressed/disabled/loading/error/empty 等状态
- 动效：duration/easing/motion-reduced
- 无障碍：对比度、可聚焦、键盘导航、触控目标
- 交付：Figma/切图/标注/组件绑定 tokens

> **仅有 PRD 时的处理**:
> - 允许生成 `design_system.md` 的“最小可实施版本”（明确标注为 *Derived from PRD*，包含假设与待确认项）
> - 其余文件按“缺失则跳过”策略，不要编造具体视觉 token

---

## Phase 0: 分析源文档（动态生成决策）

> ⛔ **必须首先执行此步骤**，在生成任何文件之前完成分析。

### 0.1 读取源文档

**读取**：`.context/ui/source/` 目录下的所有文件

### 0.2 关键词分析

**依次检查以下关键词，记录是否存在**：

| 检查项 | 关键词 | 若存在则生成 | 优先级 |
|--------|--------|-------------|--------|
| Stitch | Stitch, AI 设计 | `stitch_prompts.md` | 重要 |
| 组件库 | 组件, Component, Atom, 原子化 | `atomic_components.md` | 推荐 |
| 栅格系统 | Grid, 栅格, 断点, Breakpoint, 响应式 | `layout_grid.md` | 推荐 |
| 设计 Token | Token, CSS 变量, --color, --spacing | `design_tokens.json` | 推荐 |
| 交互状态 | hover, pressed, disabled, loading, 状态 | `interaction_states.md` | 可选 |
| 动效 | Animation, Motion, Transition, 动画, 过渡 | `motion_tokens.md` | 可选 |
| 无障碍 | Accessibility, A11y, 对比度, 键盘导航 | `accessibility_checklist.md` | 可选 |
| 交付规范 | Handoff, 切图, 标注, Figma | `handoff_checklist.md` | 可选 |
| 多端适配 | iOS, Android, 多端, Platform | `platform_guidelines.md` | 可选 |

### 0.3 输出生成计划

**必须输出**：

```
=== 生成计划 ===
必须生成：
- design_system.md（核心设计系统）

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

| 输出文件 | 模板路径 |
|----------|----------|
| `design_system.md` | `templates/ui/design_system.md.template` |
| `stitch_prompts.md` | `templates/ui/stitch_prompts.md.template` |
| `atomic_components.md` | `templates/ui/atomic_components.md.template` |
| `layout_grid.md` | `templates/ui/layout_grid.md.template` |
| `design_tokens.json` | `templates/ui/design_tokens.json.template` |
| `interaction_states.md` | `templates/ui/interaction_states.md.template` |
| `motion_tokens.md` | `templates/ui/motion_tokens.md.template` |
| `accessibility_checklist.md` | `templates/ui/accessibility_checklist.md.template` |
| `handoff_checklist.md` | `templates/ui/handoff_checklist.md.template` |
| `platform_guidelines.md` | `templates/ui/platform_guidelines.md.template` |


---

## Phase 1: 填充模板

### 1. 填充 `design_system.md` (必须)

**Prompt**:
```markdown
# Role
你是一位 Design System 设计师。

# Task
阅读 UI 设计规范，提取设计系统的“可实现约束”。

# Requirements
- 提取 Token（颜色、字体、间距、圆角）并给出 CSS 变量示例
- 提取关键组件的样式约束（Button/Input 等）
- 仅在源文档明确给出时才写具体色值/字号；否则写为待确认项（TODO）
- **务必**添加 Metadata 区块到文件顶部

# Output Format
使用 `design_system.md` 模板格式输出。
```

### 2. 填充 `atomic_components.md` (推荐)

**Prompt**:
```markdown
# Task
基于 UI 规范整理原子化设计组件分层清单。

# Requirements
- 原子/分子/有机体/模板/页面五层
- 对每个分子/有机体指出组成原子
- 提供可实现的 HTML 结构示例
- **务必**添加 Metadata 区块到文件顶部

# Output Format
使用 `atomic_components.md` 模板格式输出。
```

### 3. 填充 `layout_grid.md` (推荐)

**Prompt**:
```markdown
# Task
提取响应式布局与栅格规范。

# Requirements
- 定义断点（Mobile/Tablet/Desktop）
- 定义栅格配置（列数/Margin/Gutter）
- 提供 CSS 变量或设计 Token 映射
- **务必**添加 Metadata 区块到文件顶部

# Output Format
使用 `layout_grid.md` 模板格式输出。
```

### 4. 填充 `design_tokens.json` (推荐)

**Prompt**:
```markdown
# Task
将 UI 规范转换为三层 Token 结构 JSON（Global → Alias → Component）。

# Requirements
- Global: 原始值（无语义）
- Alias: 语义映射（可含 Light/Dark）
- Component: 组件级覆写
- 仅在源文档明确给出时才写具体值；否则保留占位符或 TODO
- **务必**在文件顶部或 _meta 中保留来源信息

# Output Format
使用 `design_tokens.json` 模板格式输出。
```

### 5. 填充 `interaction_states.md` (可选)

**Prompt**:
```markdown
# Task
定义交互组件的状态规范（hover/pressed/disabled/loading/error/empty 等）。

# Requirements
- 状态矩阵（组件 × 状态）
- 每个状态给出视觉描述与实现建议（CSS/类名/组件 props）
- **务必**添加 Metadata 区块到文件顶部

# Output Format
使用 `interaction_states.md` 模板格式输出。
```

---

## Phase 2: 更新 Manifest

> ⛔ **必须执行此步骤**，Phase 1 完成后立即执行

**执行**: `@design/context-dev/tools/manifest/AGENTS.md` (mode: update)

**更新内容**：
1. 将本次生成的所有文件添加到 `generated_files.ui` 数组
2. 确认 `sources.UI_SPEC` 记录正确

**⚠️ Phase 2 完成后必须执行 ✅ 完成后 报告**

---

## ✅ 完成后

向上级调用者（`.context/AGENTS.md` 或用户）汇报：
- ✅ 已生成的文件列表
- ⏩ 跳过的文件及原因（源文档缺失/未覆盖）
- 🔁 Manifest 更新状态
