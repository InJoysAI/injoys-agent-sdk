# Plan Add 指令

> 当 `.agents/workflows/context-openspec.md plan add <scope> [Phase-N 文件]` 被调用时执行此文件。

---

## 🎯 执行指令

用途：路线图已经存在之后，Context 里新增了一类资产（目前只有 UI），把对应的**新增提案**补进现有路线图，**不重做整份路线图**。

当前**只启用 `ui`**：

```bash
.agents/workflows/context-openspec.md plan add ui                 # 由 AI 建议放哪个 Phase，用户确认后才写
.agents/workflows/context-openspec.md plan add ui Phase-2         # 也接受 `2`、`proposal-roadmap-Phase-2.md`、完整路径
```

> ⛔ 其他 scope（`db`、`legacy` 等）**尚未启用**：STOP，告诉用户“目前 `plan add` 只支持 `ui`”，不得按 UI 的流程自行推广。
>
> ⛔ **只增不改**：不得修改、删除、重排**已有提案**（含其状态、优先级、依赖）；不得生成或修改 `config.yaml`；不得重新规划已有 Phase。

> **通用规则（后续新增 scope 沿用，仅数据来源不同）**：Phase 0 检查前置 → Phase 1 读该 scope 的资产 → Phase 2 拟定提案并确认落点 → Phase 3 写入 → Phase 4 同步总纲与 Manifest。

---

## Phase 0: 前置检查（任一不满足就 STOP）

| 检查 | 不满足时 |
|------|---------|
| `openspec/proposal-roadmap.md` 存在 | STOP：先运行 `.agents/workflows/context-openspec.md plan` |
| scope 为 `ui` | STOP：见上 |
| Manifest 的 `generated_files.ui` 存在且非空，且文件在磁盘上存在 | STOP：先运行 `.agents/workflows/context-openspec.md ui`（若 `sources.UI_SPEC` 也不存在，先 `context-update add ui <文档>`） |
| 读取总纲 Metadata 的 `规划形态` | 缺失按 `单文件` 处理并给出警告 |

**已有 UI 提案检测**：扫描路线图（单文件看总纲，分 Phase 看各 Phase 文件）中「关联 Context 资产」含 `.context/ui/` 的提案，或 Change ID 含 `-ui-`。若已存在：列出这些提案，询问用户是「补充新增」还是「已覆盖，无需处理」；用户未明确选择不得继续。

---

## Phase 1: 读取 UI 资产

**执行**: `@design/context-dev/tools/asset-reader/AGENTS.md`（scope: ui，只读 `generated_files.ui`；跳过 README.md、`source/`）

同时读取 `criterion.md` 与架构约束中的**阶段边界**条款（口径同 `plan` §2.1 第 6 条）：属于未到阶段的 UI 能力不排入，列入总纲「规划口径说明」的移出清单；拿不准的写入「待决事项」，不自行裁决。

---

## Phase 2: 拟定提案并确认落点（⛔ 用户确认前不得写任何文件）

### 2.1 拟定 UI 提案

- 依据 `design_system.md`、`atomic_components.md`、`layout_grid.md`、`design_tokens.json`、`interaction_states.md` 等资产，按 `plan` §2.1 的原子化规则拟定提案（粒度 1-3 人日，> 5 人日必须拆分或写明不拆理由）
- Change ID 用 `feat-ui-<功能>`（缺陷对齐用 `fix-ui-<问题>`）；每个提案必须有「关联 Context 资产」且指向 `.context/ui/` 下的具体文件
- 依赖：只写真实依赖（如依赖已有的基础设施/前端骨架提案），Change ID 必须存在于现有路线图；**不得**为凑依赖而改动已有提案
- 设计令牌/基础组件类提案排在页面级 UI 提案之前
- 每个提案块用 `proposal-roadmap-phase.md.template` 的「提案详情」结构，**必须填 `变更类型`（`change_kind`）**，状态初始 `proposed`
- 没有来源依据的按需项整块不写，不得编造

### 2.2 确定落点（按形态与参数）

**分 Phase 形态**

| 调用 | 处理 |
|------|------|
| 带参数，文件存在 | 参数接受 `Phase-N` / `N` / 文件名 / 完整路径；归一为 `openspec/proposal-roadmap-Phase-<N>.md`（兼容旧名 `Phase<N>`）。向用户展示拟追加的提案清单并确认后，**追加**到该文件「提案详情」末尾 |
| 带参数，文件不存在 | 询问用户是否新建该 Phase 文件；同意才新建（用 `proposal-roadmap-phase.md.template`，编号取参数中的 `N`），并同步总纲「阶段总览」新增该 Phase 行 |
| 不带参数 | AI 依据依赖关系与阶段边界**建议**一个落点（已有 Phase，或建议新建一个 Phase），说明理由；用户确认或改选后才写 |
| 参数无法解析 | STOP：列出现有 Phase 文件并询问 |

**单文件形态**

- Phase 文件参数不适用：忽略并告知用户；提案块追加到总纲对应 Phase 的详情下（带 `Phase-N` 且该阶段存在则放入该阶段；否则按“不带参数”流程建议落点并确认）
- **不自动切换形态**：即使追加后 `M`/`P`/`K` 超过 `plan` §2.0 阈值，也只在报告里提示“可考虑改为总纲+分Phase”，由用户决定

> 展示给用户确认的内容至少包含：目标文件、每个提案的 Change ID / 标题 / 优先级 / 预计人日 / 依赖。用户修改清单后按修改结果执行。

---

## Phase 3: 写入提案块

- 只在确认的文件中**追加**，不改动文件里已有内容
- 提案之间的 `### 提案 N` 序号接在该文件已有序号之后
- 写完后自检：无 `{{...}}` 残留；每个 Change ID 在整个路线图中唯一；依赖的 Change ID 均存在；预计时间 > 5 人日的已拆分或写明理由

---

## Phase 4: 同步总纲与 Manifest（⛔ 必须执行）

**总纲 `openspec/proposal-roadmap.md`**（仅做增量，不重写）：

| 内容 | 处理 |
|------|------|
| 提案索引（分 Phase 形态） | 为每个新提案追加一行：Change ID、Phase、标题、优先级、前置依赖、状态（`proposed`）、详情链接；与 Phase 文件逐项一致 |
| 阶段总览 | 更新受影响 Phase 的「提案数」（新建 Phase 则新增一行）；预计周期若原为估算，只在能由新增人日直接累加时更新，否则保持原值并在报告中提示 |
| Metadata `判定依据` | 只更新其中的数值 `提案总数 / Phase 数 / 单 Phase 最多提案数`，**不改** `规划形态` 与文字依据 |
| 依赖关系图 | 把新提案节点与依赖边追加到 Mermaid 图，不改动已有节点 |
| 规划口径说明 | 有被阶段边界移出的 UI 能力时，追加到「已移出本路线图的能力」 |

**Manifest**：把新建的 Phase 文件登记进 `generated_files.openspec`（去重，不覆盖其他条目；口径见 `tools/manifest/AGENTS.md`）；仅追加到已有文件时无需登记。

**刷新索引**：按 `@design/context-dev/tools/integration/AGENTS.md` Phase 2 刷新 `CONTEXT_ASSET_INDEX`（若新建了 Phase 文件）。

**校验**：运行 `node design/context-dev/tools/specflow/specflow.mjs roadmap-status --check`，确认新提案没有被误判；有 `[DESYNC]` 就按其 `fix` 栏修正索引或 Phase 文件。

---

## ✅ 完成后

> ⛔ 本模块只新增 UI 提案并同步总纲，完成后向路由层报告并**停止**，不得继续创建提案（`proposal`）或执行其他模块。

报告：
- ✅ 新增的提案（Change ID / 标题 / 落点文件）
- ✅ 总纲同步内容（索引、阶段总览、数值、依赖图）
- ⚠️ 被阶段边界移出 / 待决的 UI 能力
- ⚠️ 形态阈值提示（若有）
- ➡️ 下一步：`.agents/workflows/context-check.md plan` 复核路线图，再用 `.agents/workflows/context-openspec.md proposal <change-id>` 逐个创建提案
