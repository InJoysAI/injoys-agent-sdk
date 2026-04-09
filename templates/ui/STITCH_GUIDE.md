# Stitch 2.0 使用指南

> **适用范围**: 本指南面向使用 `stitch_design_system.md` 和 `stitch_prompts.md` 模板，在 Google Stitch 2.0 中生成高保真 UI 设计稿的团队成员。
>
> **前置要求**: 已通过 `/context-openspec ui` 生成了 `stitch_design_system.md` 和 `stitch_prompts.md`。

---

## 1. 两个文件的关系

```
stitch_design_system.md          stitch_prompts.md
(DESIGN.md — 设计系统 SSoT)       (Flow Prompts — PTCF 格式)
         │                                │
         │  ① 导入到 Stitch 项目           │  ② 逐条输入到 Stitch
         │     (一次性加载)                 │     (按 Flow 生成)
         ▼                                ▼
   ┌─────────────────────────────────────────┐
   │           Google Stitch 2.0 Canvas       │
   │                                         │
   │  DESIGN.md 自动生效于所有生成/编辑操作     │
   │  Flow Prompts 驱动多屏用户旅程生成         │
   └─────────────────────────────────────────┘
```

| 文件 | 加载方式 | 频率 | 作用 |
|------|---------|------|------|
| `stitch_design_system.md` | 导入到 Stitch 项目 workspace | **一次性**（每个项目） | AI 自动读取，确保所有屏幕视觉一致 |
| `stitch_prompts.md` | 逐条粘贴 prompt 到 Stitch 输入框 | **每个 Flow 一次** | 驱动 AI 生成具体的用户旅程/屏幕 |

---

## 2. 完整工作流程

### Step 1: 加载设计系统 (一次性)

1. 打开 [Google Stitch](https://stitch.withgoogle.com/)，创建或打开项目
2. 进入 **Design System Picker**（界面左上方下拉菜单）
3. 选择 **"Create / Import"**
4. 将 `stitch_design_system.md` 的内容粘贴（或上传文件）
5. 确认加载成功 — 此后所有生成操作会自动遵循此设计系统

> **💡 提示**: 如果你已有线上产品，也可以用 "Extract from URL" 功能从已有网站自动提取设计系统，然后与 `stitch_design_system.md` 对比合并。

### Step 2: 概念探索 — Ideate 模式

1. 切换到 **Ideate 模式**
2. 将 `stitch_prompts.md` 中 **Flow F.0** 的 prompt 粘贴到 Stitch
3. 与 AI 讨论设计方向，确定视觉风格
4. **不会生成屏幕** — 这一步只是建立共识

### Step 3: Flow 生成 — Generate 模式

1. 切换到 **Generate 模式**
2. 按顺序粘贴 Flow prompts（F.1, F.2, F.3...）
3. 每个 Flow 会生成 **多个屏幕**（通常 3-8 屏）
4. 屏幕会自动出现在无限画布上

> **⚠️ 注意**: 不要在 prompt 中重复粘贴设计 token！Stitch 2.0 会自动从已加载的 DESIGN.md 读取。

### Step 4: 细节打磨 — Edit 模式

1. 切换到 **Edit 模式**
2. 使用 `stitch_prompts.md` 中的 **Edit prompts (E.x)** 进行微调
3. 可以选中单个元素或整个屏幕进行修改
4. 支持跨屏批量修改（Multi-select 后输入指令）

**常用 Edit 指令示例**:
```
"把所有屏幕的导航栏高度统一为 64px"
"在 Dashboard 页面的表格上方添加搜索栏"
"将所有卡片的阴影从 shadow-sm 改为 shadow-md"
"为这个表单增加 error state 变体"
```

### Step 5: 状态补全 — Edit 模式

1. 使用 **E.3 (State Variations)** prompt 为关键屏幕生成状态变体
2. 每个状态变体会作为独立 frame 出现在画布上
3. 确保覆盖: default / loading / empty / error

### Step 6: 原型连接 — Prototype 模式

1. 切换到 **Prototype 模式**
2. 使用 **Prototype prompts (P.x)** 或手动连接屏幕
3. 定义触发条件（按钮点击、滑动等）和转场动画
4. 点击 **Play** 预览交互流程

### Step 7: 导出与交付

Stitch 2.0 支持多种导出方式：

| 导出方式 | 用途 | 操作 |
|----------|------|------|
| **Copy to Figma** | 交给设计师精修 | 保留图层和组件结构 |
| **Export Code** | 前端开发参考 | React / TypeScript / Tailwind CSS |
| **Export Image** | 评审展示 | PNG / SVG |
| **Share Prototype** | 利益相关者预览 | 生成可分享链接 |

---

## 3. PTCF Prompt 框架速查

每个 Flow prompt 的标准结构：

```
**PERSONA**: 角色设定 — AI 应该以什么身份思考
  例: "You are a senior product designer specializing in SaaS admin panels"

**TASK**: 任务目标 — 要生成什么
  例: "Design a 5-screen store management flow"

**CONTEXT**: 背景信息 — 产品、用户、约束
  例: "Cross-border e-commerce platform for store operators"

**FORMAT**: 输出要求 — 布局、数据、响应式
  例: "Responsive desktop+mobile, realistic sample data, cover all states"
```

### 写好 Prompt 的要点

| ✅ 做 | ❌ 不做 |
|-------|---------|
| 描述**用户旅程**（从哪到哪） | 孤立描述单个屏幕 |
| 指定每个屏幕的**核心组件和主操作** | 只说 "设计一个表格页面" |
| 列出需要覆盖的**状态** | 只生成 default 状态 |
| 提供**真实的业务约束** | 用泛泛的描述 |
| 引用 "Use DESIGN.md" | 在 prompt 里内联重复 token |

---

## 4. Prompt 类型速查

| 类型 | 编号格式 | Stitch 模式 | 用途 |
|------|---------|------------|------|
| Ideation | F.0 | Ideate | 与 AI 探索设计方向 |
| Flow | F.1, F.2... | Generate | 生成多屏用户旅程 |
| Edit | E.1, E.2... | Edit | 微调已有屏幕 |
| Redesign | R.1, R.2... | Redesign | 对已有屏幕做风格迭代 |
| Prototype | P.1, P.2... | Prototype | 连接屏幕为交互原型 |

---

## 5. 常见问题

### Q: 生成的屏幕风格不一致？

**A**: 检查以下几点：
1. Design System Picker 是否正确选中了你的 DESIGN.md
2. 是否有 prompt 中意外覆盖了 token（如写了具体色值）
3. 运行 **E.1 (Cross-Screen Consistency Check)** prompt 让 AI 自动修复

### Q: DESIGN.md 里改了 token，已有屏幕没更新？

**A**: DESIGN.md 更新后，需要在 Edit 模式中对已有屏幕执行：
```
"Refresh all screens to use the updated DESIGN.md tokens. 
Specifically, update [changed token name] across all screens."
```

### Q: 一个 Flow prompt 生成的屏幕太少/太多？

**A**: 
- **太少**: 在 prompt 的 SCREENS 列表中明确列出每个屏幕及其用途
- **太多**: 缩小 Flow 范围，将大旅程拆分为多个小 Flow

### Q: 如何处理 DESIGN.md 中的 TBD 值？

**A**: TBD 表示源 UI 规范未提供具体值。有两种方式：
1. **推荐**: 回到 UI 规范文档补充后重新生成 DESIGN.md
2. **临时**: 在 Stitch 中让 AI 自动推导，但事后必须确认并回填到 DESIGN.md

### Q: 怎么在 team 中同步设计系统？

**A**: 
1. `stitch_design_system.md` 已纳入 Git 版本控制
2. 设计变更时更新文件并提交
3. 团队成员拉取最新版本后重新导入 Stitch

---

## 6. 文件变更记录

| 日期 | 变更 | 说明 |
|------|------|------|
| {{YYYY-MM-DD}} | 初始版本 | Stitch 1.0 → 2.0 升级，拆分为 DESIGN.md + Flow Prompts |
