# UI Templates

本目录用于从 **UI 设计规范** 生成 `.context/ui/` 目录下的结构化 UI 资产，供实现阶段（/context-start）引用。

---

## 文件清单

| 文件 | 用途 |
|------|------|
| `AGENTS.md` | `/context-openspec ui` 的执行规则与 Prompt |
| `stitch_prompts.md` | 设计生成工具 Prompt（核心） |
| `design_system.md` | 设计系统（颜色/字体/间距/组件约束） |
| `design_tokens.json` | Design Tokens（Global/Alias/Component） |
| `layout_grid.md` | 栅格与响应式断点 |
| `atomic_components.md` | 原子化组件分层清单 |
| `interaction_states.md` | 交互状态矩阵 |
| `motion_tokens.md` | 动效 token 与 reduced-motion |
| `accessibility_checklist.md` | 无障碍检查清单 |
| `handoff_checklist.md` | 交付/标注检查清单 |
| `platform_guidelines.md` | 多端差异与策略 |

---

## 输入要求

- 推荐输入：UI 设计规范文档（如 `docs/ui-spec.md` 或设计系统说明）
- 仅有 PRD 时：允许生成最小 `design_system.md`（必须显式标注假设与待确认项），不要臆造具体视觉 token

