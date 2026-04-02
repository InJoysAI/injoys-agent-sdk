# Context Sync 指令

> 当 `/context-update sync ...` 被调用时执行此文件。

---

## 🎯 执行指令

> ⛔ **必须依次执行所有步骤**，不得跳过或中断。

当前建议先落地 **最小可用版本**：
- 只支持 `roadmap` 与 `proposal` 两个入口
- 只支持 `review` 与 `apply` 两种模式

支持形式：

```bash
/context-update sync roadmap
/context-update sync roadmap phase3
/context-update sync roadmap openspec/proposal-roadmap-Phase3.md
/context-update sync proposal <change-id>
```

---

## Phase 1: 解析同步意图

识别：

| 识别项 | 说明 | 示例 |
|--------|------|------|
| source | `roadmap` 或 `proposal` | `sync proposal feat-video-submit` |
| target | 默认 `.context/**` | roadmap/proposal → context |
| scope | 全量 / 单个 phase / 单个文件 / 单个 change | `phase3` / `proposal-roadmap-Phase3.md` |
| mode | `review` / `apply` | `--mode apply` |

默认规则：

1. **必须先识别 authority（权威来源）**
   - `sync roadmap ...` → 以 `proposal-roadmap*.md` 为准
   - `sync proposal <change-id>` → 以 `openspec/changes/<change-id>/` 为准（若已归档，则为 `openspec/changes/archive/YYYY-MM-DD-<change-id>/`）
   - 若发现 `.context/**` 与来源存在双向冲突、且无法自动判断优先级：**STOP**

2. **必须先识别 mode**
   - `--mode review`：只输出差异与同步计划，不改文件
   - `--mode apply`：执行最小修改，并同步 `source/` 与 `context-manifest.json`
   - 若未显式指定 mode：默认 `review`

3. **必须把以下内容视为同步目标整体**
   - `.context/**`
   - `.context/**/source/**`
   - `.context/context-manifest.json`

4. **禁止把“检查、计划、实际写入”混在一起**
   - 先建映射
   - 再列差异
   - 最后决定是否 apply

---

## Phase 2: 读取来源工件

### 2.1 `sync roadmap`

必须读取：
- `openspec/proposal-roadmap.md`
- 所有相关的 `openspec/proposal-roadmap-Phase*.md`

若用户指定了 `phase-or-file`：
- 仅读取对应 Phase 文件
- 但仍需读取 `openspec/proposal-roadmap.md` 作为总索引与计数基准

### 2.2 `sync proposal <change-id>`

必须读取：
- `openspec/changes/<change-id>/proposal.md`（若不存在：fallback 到 `openspec/changes/archive/YYYY-MM-DD-<change-id>/proposal.md`）
- `openspec/changes/<change-id>/tasks.md`（若不存在：fallback 到 `openspec/changes/archive/YYYY-MM-DD-<change-id>/tasks.md`）
- `openspec/changes/<change-id>/design.md`（若存在；否则尝试 `openspec/changes/archive/YYYY-MM-DD-<change-id>/design.md`）
- `openspec/changes/<change-id>/specs/**`（若不存在：fallback 到 `openspec/changes/archive/YYYY-MM-DD-<change-id>/specs/**`）

---

## Phase 3: 读取 Context 资产

必须读取：
- `.context/context-manifest.json`
- `.context/**` 中所有相关目标文件
- `.context/**/source/**` 中与本次同步主题对应的源文档

读取策略：
- 优先按主题映射读取，不要盲目重写整个 `.context/`
- 若来源涉及 roadmap 提案主题，至少覆盖对应的：
  - `domain/*`
  - `architecture/*`
  - `ui/*`
  - 相关 `source/*`

---

## Phase 4: 建立 source -> context 映射

按“主题/章节/能力”建立对应关系，而不是按文件名机械匹配。

示例：

| 来源 | 目标 Context |
|------|--------------|
| `feat-copy-input` | `domain/business_rules.md`, `domain/user_journeys.md`, `domain/source/MagicCrayon-Product-Overview.md` |
| `feat-subtitle-composition` | `criterion.md`, `domain/business_rules.md`, `architecture/system_design.md`, `architecture/source/MagicCrayon-Architecture-Design.md` |
| `feat-workflow-session` | `architecture/system_design.md`, `domain/user_journeys.md`, 相关 `source/` |

---

## Phase 5: 差异分类

必须把差异分类输出：

| 类型 | 含义 |
|------|------|
| `missing` | 来源已有，Context 缺失 |
| `drift` | 两边都有，但表述或边界漂移 |
| `reference` | 路径 / 章节 / Prompt / BR / metadata 引用错误 |
| `metadata` | Source / Generated At / manifest 条目不同步 |
| `conflict` | 双方语义冲突，不能自动决策 |

---

## Phase 6: 输出同步计划

若 mode = `review`，输出：

```text
🔄 Context Sync Plan

Source: <roadmap|proposal>
Scope: <...>
Authority: <roadmap|proposal>
Mode: review

1. Mapping
- <source section> -> <context file>

2. Differences
- [missing] ...
- [drift] ...
- [reference] ...
- [metadata] ...
- [conflict] ...

3. Planned Changes
- update <file>
- update <source file>
- update context-manifest.json

4. Stop / Apply Decision
- 若存在 conflict：STOP
- 若无 conflict：可继续 `--mode apply`
```

---

## Phase 7: 执行同步（仅 apply）

若 mode = `apply`：

1. 仅做**最小且可审计**的修改
2. 先更新目标 `.context/**`
3. 再更新相关 `source/**`
4. 最后更新 `context-manifest.json`
5. 输出变更摘要：
   - 修改了哪些文件
   - 每个文件修改原因
   - 依据来自哪个 roadmap/proposal 条目

---

## STOP 条件

出现以下任一情况必须停止：

- 来源工件不存在
- 无法建立明确的 source -> context 映射
- 存在 `conflict` 且无法自动判定 authority
- 用户要求 `apply`，但同步范围过大且未能生成可审计的最小修改计划

---

## 当前建议

先落地这两个最小入口：

- `sync roadmap [phase-or-file] [--mode review|apply]`
- `sync proposal <change-id> [--mode review|apply]`

暂不建议第一版支持：
- `sync context roadmap`
- `sync context proposal`
- `delete/fix/modify` 与 `sync` 混合执行
- 多 authority 自动合并

$ARGUMENTS
