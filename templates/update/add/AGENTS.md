# Context Add 指令

> 当 `.agents/workflows/context-update.md add ...` 被调用时执行此文件。

---

## 🎯 执行指令

用途：init 之后补充一份**新增类别**的源文档，把它归档进 `.context/*/source/` 并登记 Manifest。**只归档、不生成总结**（和 `context-init` 一致）：总结由 `context-openspec` 对应子命令生成。

当前**只支持 `ui`**：

```bash
.agents/workflows/context-update.md add ui docs/UI_Design_Spec.md
.agents/workflows/context-update.md add docs/UI_Design_Spec.md      # 未写类别：先问，且只接受 ui
```

> ⛔ 其他类别（`db`、`legacy`、补充文档等）**尚未落地**：STOP，告诉用户“目前 `add` 只支持 `ui`”，不得按 UI 的流程自行推广。

> ⛔ **必须依次执行所有 Phase**，任何一步失败都不得报告完成。

---

## Phase 0: 前置检查（任一不满足就 STOP）

| 检查 | 不满足时 |
|------|---------|
| `.context/context-manifest.json` 存在（项目已 init） | STOP：提示先运行 `.agents/workflows/context-init.md` |
| 源文档路径存在且是文件 | STOP：报告路径，请用户确认 |
| 类别为 `ui` | STOP：见上，“目前 `add` 只支持 `ui`” |
| Manifest 的 `sources` 中**没有** `UI_SPEC` | 已有时见下表 |

**`sources.UI_SPEC` 已存在时**，向用户说明现状并询问，不得自行判断：

| 用户的意图 | 处理 |
|-----------|------|
| 这是已归档那份 UI 文档的**新版本** | STOP：这属于 `modify ui`，不是 `add` |
| 这是**另一份**补充 UI 文档 | 继续，Manifest 键用 `UI_SPEC_2`、`UI_SPEC_3`…（按已有键顺延） |

---

## Phase 1: 询问处置方式（移动 / 复制）

**执行** `@design/context-dev/tools/docs/AGENTS.md` 的 “Phase 3: 归档源文档” 中的 Step 3.1（询问）和 Step 3.2（按选择执行）及其中“移动 / 复制 / 两种情况都适用”的全部规则，**只针对这一份文档**，不另写一套。要点：必须询问、不默认复制；移动时 `git mv` 或 `mv`、先记哈希再校验、项目外文件二次确认、列出对原路径的引用并询问是否更新；目标已存在且内容不同时停下询问。

用户已在命令里给出 `mode: move|copy` 时可跳过询问，未给出必须问。

---

## Phase 2: 创建目录并归档

1. 仅在这时创建 `.context/ui/` 与 `.context/ui/source/`（init 阶段没有 UI 文档时这些目录不存在，**不要**为 `ui/` 写占位 README，README 由 `context-openspec ui` 生成）。
2. 按 Phase 1 的选择把文档归档到 `.context/ui/source/`（保留原文件名）。
3. 复核：归档文件存在，SHA-256 与记录一致。

---

## Phase 3: 登记 Manifest 与目录树

**执行** `@design/context-dev/tools/manifest/AGENTS.md`（mode: update），本次只写：

- `sources.UI_SPEC`（或 `UI_SPEC_<N>`）：`path`、`archived_to`（移动时两者相同）、`type: "ui_specification"`、`content_hash`、`status: "archived"`。
- `pending_generation.ui`：`[".context/ui/design_system.md"]`（已存在 `ui` 键时不重复添加）。
- **不要**创建 `generated_files.ui`：此时还没有生成任何 UI 资产，键等 `context-openspec ui` 生成并登记时再创建。
- 刷新 `.context/AGENTS.md` 的“目录结构”区块：只加入实际存在的 `ui/source/<文档>`，**不得**列出尚未生成的 `design_system.md` 等文件。
- 把本次事件作为一条扁平 JSON 追加到 `.context/history/context-sync.jsonl`（字段规则见 `@design/context-dev/update/sync/AGENTS.md` “Manifest/历史写入规则”）：`event_type: "context_sync"`、`source: "context-update add ui"`、`workflow: ".agents/workflows/context-update.md add ui <path>"`（完整命令行，与 sync 记录一致）、`authority: "user-provided source"`、`mode: "apply"`、`updated_context_files`（实际归档的路径）；再更新 `last_context_sync`。
- 不向 `.context/README.md`、`.context/AGENTS.md`、根 `AGENTS.md` 写入带日期的说明或状态（结构性的目录树更新除外）。
- 执行 `bash design/context-dev/scripts/check-context-manifest.sh`，失败则不得报告完成。

---

## ✅ 完成后

> ⛔ 本模块只归档与登记。完成后向调用方报告并**停止**，不得自行运行 `context-openspec ui`。

```
=== Context Add (ui) ===
✅ docs/UI_Design_Spec.md → .context/ui/source/UI_Design_Spec.md（移动 / 复制）
   [复制时] ⚠️ 原位置仍有一份，后续修改请以哪份为准需自行约定
   [移动时] 仍引用原路径的位置：<清单，或“无”>（已询问是否更新）

🔁 Manifest: sources.UI_SPEC 已登记；pending_generation.ui 已添加
📂 .context/AGENTS.md 目录树已更新
🧾 context-sync.jsonl 已追加 1 条记录

➡️ 下一步: 运行 `.agents/workflows/context-openspec.md ui` 生成 UI 总结
```
