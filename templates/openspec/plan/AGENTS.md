# Plan 生成指令

> 当 `.agents/workflows/context-openspec.md plan` 被调用时执行此文件。

---

## 🎯 执行指令

> ⛔ **本命令只生成路线图文件（`proposal-roadmap.md`，复杂项目另含 `proposal-roadmap-Phase-<N>.md`），不能触发 `config.yaml` 生成**

依次执行以下步骤：

---

## Phase 0: 检测项目类型

### 0.1 判断是否包含遗留系统

**检查**：`.context/legacy/legacy_system_analysis.md` 是否存在

| 检查结果 | 项目类型 | 后续行为 |
|----------|---------|---------|
| 存在 | **棕地项目** | 路线图需包含遗留系统改造阶段（见 §2.2） |
| 不存在，但**已有实现**（见下） | **已有实现项目** | 不加遗留改造阶段；路线图区分「新增能力 `feat-*`」与「对现有实现的修复/对齐 `fix-*`」，高严重性缺口（触碰 criterion 铁律、数据真实性、安全）放在最前的 Phase |
| 不存在，且无已有实现 | **绿地项目** | 纯新功能开发路线图 |

**“已有实现”判定**（无 `legacy/` 时，满足任一即可，并把依据写进总纲 Metadata）：
- `.context/architecture/`、`.context/domain/` 资产中描述了**现状实现**及其与目标的差距（如既有技术债、缺口、`已实现/未实现` 清单）
- 项目中已存在架构文档所述的源码目录与可运行代码（按架构资产给出的目录结构核对，不假定特定语言或目录名）

> `legacy/` 表示“提供了遗留系统分析”，不等于“项目没有代码”。只看 `legacy/` 会把已有实现的项目误标为绿地。

---

## Phase 1: 读取 Context 资产

**执行**: `@design/context-dev/tools/asset-reader/AGENTS.md`

> 该模块会：
> - 从 `context-manifest.json` 的 `generated_files` 节点获取文件列表
> - 按 scope 遍历：architecture, domain, db, ui, legacy
> - 跳过 README.md（目录说明）
> - 跳过 openspec/（避免循环引用）
> - 跳过 source/（按需回溯）

**若为棕地项目**（检测到 `generated_files.legacy` 存在且非空；键不存在视同空）：
- 读取 `.context/legacy/legacy_system_analysis.md`
- 从 `sources.LEGACY_CODEBASE.reference` 获取遗留代码库引用路径

---

## Phase 2: 生成路线图

**模板**：
- `design/context-dev/templates/proposal-roadmap.md.template` — 总规划（两种形态都用）
- `design/context-dev/templates/proposal-roadmap-phase.md.template` — 提案块结构；「总纲+分Phase」形态下同时是 Phase 文件模板

### 2.0 规模判定：单文件 还是 总纲+分Phase（必须先做）

> 目标：简单需求只要一份 `openspec/proposal-roadmap.md`；复杂业务则 `proposal-roadmap.md` 是总规划，`proposal-roadmap-Phase-<N>.md` 是各阶段具体的实现提案计划。

**步骤**：
1. 基于 Phase 1 读取的资产，先拟定**规划草案**：Phase 列表 + 每个 Phase 的提案 ID 清单（只列 ID 和一句话，不展开）
2. 数出：提案总数 `M`、Phase 数 `P`、单个 Phase 最多的提案数 `K`
3. 按下表判定

| 形态 | 判定条件 | 产出 |
|------|---------|------|
| **单文件** | `M ≤ 10` 且 `P ≤ 3` 且 `K ≤ 6` | 仅 `openspec/proposal-roadmap.md`，含全部提案详情 |
| **总纲+分Phase** | 满足任一：`M > 10`、`P ≥ 4`、`K > 6` | `openspec/proposal-roadmap.md`（总规划：阶段总览、全局依赖图、提案索引）+ **每个 Phase 一个** `openspec/proposal-roadmap-Phase-<N>.md`（提案详情） |

4. 用户明确指定形态时以用户为准，并在 Metadata 的「判定依据」写明“用户指定”
5. 判定结果写入总纲 Metadata：`规划形态` 与 `判定依据`（含 `M` / `P` / `K` 实际数值）

> 阈值是默认值，用于避免单文件过长或为简单需求制造多余文件；接近阈值时偏向**简单**，除非总览已明显难以阅读。
> 两种形态**二选一**：复杂形态下**每个 Phase 都要有文件**，不要只给部分 Phase 拆文件。

### 2.1 通用填充规则

1. **动态 Phase 数量**：
   - 根据 `.context/` 资产实际情况决定 Phase 数量（2-6 个）
   - 不是固定 3 个 Phase

2. **原子化提案**：
   - 每个提案只修改一个功能点或一个模块
   - 提案粒度建议 1-3 人日可完成
   - **超过 5 人日的提案必须拆分**为多个原子提案（如“一次接入多个平台”按平台拆开）；确实不宜拆分时，在该提案块「范围边界」下的 `[!NOTE]` 写明**不拆的理由**（如多个平台共用同一套未拆分的基础工作），并在输出验证时逐条复核
   - 4-5 人日为灰区：允许保留，但应能说明为什么不再拆
   - 提案 ID 格式: `feat-模块-功能` 或 `fix-模块-问题`

3. **提案依赖关系**：
   - 明确标注每个提案的前置依赖（`depends_on`）
   - 标注被依赖关系（`dependents`）
   - 生成依赖关系图（Mermaid）

4. **基础设施识别**：
   - **基础设施提案**应放在 Phase 0/1，其他功能依赖它们
   - 识别关键词：`infra`, `skeleton`, `rls`, `dual-db`, `auth-base`, `ssot`
   - 基础设施提案必须优先完成，不可并行跳过

   | 类型 | 示例 | 特征 |
   |------|------|------|
   | 数据层基础 | `feat-infra-db`, `feat-infra-migrations` | 所有写数据库的功能依赖 |
   | 认证基础 | `feat-auth-register`, `feat-auth-sso` | 所有需要用户身份的功能依赖 |
   | API 契约 | `feat-infra-typespec` | 所有 API 实现依赖 |
   | 合规前置（仅当 `criterion.md` / domain 资产中存在合规前置要求时） | 按该要求命名，如 `feat-compliance-*` | 受该要求约束的功能依赖 |

   > 以上仅为命名示例，Phase 与提案必须来自 `.context/` 资产，不得照搬示例。

5. **条件性内容**：
   - 若 `.context/db/` 存在 → 包含数据库相关 Phase
   - 若 `.context/ui/` 存在 → 包含 UI 相关 Phase
   - 若 `.context/legacy/` 存在 → 包含遗留系统改造 Phase（Phase 0）

6. **阶段边界是硬约束**：
   - 读取 `criterion.md` 与架构约束类资产（如 `constraints.md`）中关于**阶段规划**的条款（如“Phase 0 做核心闭环、Phase 1 做舆情、未到阶段的能力不提前实现”）
   - 若存在此类约束：只为**当前阶段**的能力排提案；**未到阶段**的能力一律不排入，哪怕 PRD 或其他资产里写了完整愿景
   - 被移出的能力要在总纲「规划口径说明」中列出：能力名、所属后续阶段、依据（资产路径与章节）
   - 若资产里没有此类约束 → 本条不适用，按 PRD / 架构的完整范围规划；不得自行假设阶段边界
   - 不确定某项能力属于当前阶段还是后续阶段时，不要自行裁决，写入总纲「待决事项」并提示用户

### 2.1.1 两种形态的写法

**单文件**
- 用 `proposal-roadmap.md.template`，保留「【单文件形态】」，删除「提案索引」和「【总纲+分Phase 形态】」
- 各 Phase 详情直接写提案块（结构见 `proposal-roadmap-phase.md.template` 的「提案详情」）
- 不生成 `proposal-roadmap-Phase-*.md`

**总纲+分Phase**
- 总纲：保留阶段总览（含提案数与链接）、全局依赖图、**提案索引**、「【总纲+分Phase 形态】」；**删除**「【单文件形态】」，**总纲里不写提案块**
- Phase 文件：用 `proposal-roadmap-phase.md.template`，文件名 `openspec/proposal-roadmap-Phase-<N>.md`，`<N>` 与总纲阶段编号一致（Phase 0 → `Phase-0`）
- **唯一来源**：提案详情只写在 Phase 文件；总纲索引只放 Change ID、Phase、标题、优先级、前置依赖、状态、链接，且必须与 Phase 文件一致，不得两处各写一套
- 全局依赖图只在总纲维护；Phase 文件只写本 Phase 内的执行顺序与跨阶段前置/产出

**提案块的必填与按需**
- 必填：Change ID、优先级、预计时间、状态、业务目标、范围边界、关联 Context 资产、关键任务、验证标准、依赖
- 按需：里程碑、风险、迁移与回滚、运维、KPI、验收场景、跨提案场景、跟踪清单；**没有来源依据就删除整块**，不得为填满模板而编造
- 单文件形态下的简单提案尤其如此，只写必填项即可

**命名**：生成时统一使用 `proposal-roadmap-Phase-<N>.md`。读取方同时兼容旧的 `proposal-roadmap-Phase<N>.md`。

### 2.2 棕地项目特殊规则

> ⚠️ **若检测到遗留系统，路线图必须包含改造阶段**

**遗留系统改造 Phase 结构**：

| 阶段 | 名称 | 内容 |
|------|------|------|
| Phase 0 | **遗留系统对齐** | 稳定现有功能、补充测试、建立基线 |
| Phase 1 | **渐进式改造** | 按风险从低到高逐步替换模块 |
| Phase N | **正常开发** | 新功能开发 |

**必须包含的改造提案类型**：

```
=== 遗留系统改造提案 ===
feat-legacy-stabilize     # 稳定旧系统（测试补充）
feat-legacy-api-adapter   # API 适配层
feat-legacy-migrate-xxx   # 模块迁移（按模块拆分）
feat-legacy-deprecate     # 废弃旧代码
```

**从 legacy_system_analysis.md 提取**：
- 已知技术债 → 生成 `fix-legacy-xxx` 提案
- 禁止修改区域 → 在提案中标注约束
- API 接口清单 → 生成 API 适配提案

---

## Phase 3: 输出验证

**输出**:
- 单文件：`openspec/proposal-roadmap.md`
- 总纲+分Phase：`openspec/proposal-roadmap.md` + `openspec/proposal-roadmap-Phase-<N>.md`（每个 Phase 一个）

**规则**：
- 不得残留任何 `{{...}}` 占位符，也不得残留模板里的“生成规则/使用说明”块、未选中形态的章节，以及**形态标记标题**（`【单文件形态】`、`【总纲+分Phase 形态】`：保留所选形态下的内容，删除标记标题行本身）
- 任何预计时间 > 5 人日的提案，必须已拆分或在 `[!NOTE]` 中写明不拆的理由
- 路线图应与 criterion.md 约束保持一致
- Metadata 已写明 `规划形态` 与 `判定依据`
- **总纲+分Phase 形态额外校验**：
  - 总览中每个 Phase 都有对应文件，链接可达，编号与文件名一致
  - 总纲索引的 Change ID 集合 = 各 Phase 文件中提案块的 Change ID 集合（无遗漏、无重复）
  - 索引中的优先级、前置依赖、状态与 Phase 文件逐条一致
  - 总纲中不含提案块
- **单文件形态额外校验**：没有残留的「提案索引」章节
- **Manifest 登记**：把本次实际生成/更新的 `openspec/proposal-roadmap.md` 以及每个 `openspec/proposal-roadmap-Phase-<N>.md` 登记进 `generated_files.openspec`（去重；不覆盖其他模块已登记的条目；口径见 `tools/manifest/AGENTS.md`），并从 `pending_generation.openspec` 移除已生成项；已登记但磁盘上已不存在的 Phase 文件条目，先在报告中说明再移除
- **形态切换（重新运行 `plan` 时）**：若发现与本次形态不符的旧文件（如本次为单文件，但已有 `proposal-roadmap-Phase-*.md`），⛔ **不得自行删除**，在报告中列出并询问用户处理
- **❌ 禁止同时生成 config.yaml**

---

## ✅ 完成后

> ⛔ 本模块只生成 `proposal-roadmap.md`（复杂项目另含各 `proposal-roadmap-Phase-<N>.md`）。完成后向调用方（`@design/context-dev/openspec/AGENTS.md` 路由层）报告并**停止**，不得自行继续执行其他模块。子命令模式下路由层直接结束；一键模式下由路由层决定下一步。（`.context/AGENTS.md` 是索引文档，不是调用方。）

报告结果：

```
=== OpenSpec Plan ===
项目类型: [绿地项目 / 已有实现项目 / 棕地项目]（依据：…）
✅ openspec/proposal-roadmap.md (生成/更新)
✅ openspec/proposal-roadmap-Phase-<N>.md × {{P}}（仅「总纲+分Phase」形态）

规划形态: [单文件 / 总纲+分Phase]（依据：M={{M}}、P={{P}}、K={{K}} 或 用户指定）
遗留的旧形态文件（若有，等待用户确认处理）: {{STALE_FILES_OR_NONE}}

路线图概览:
- Phase 数量: {{N}}
- 提案总数: {{M}}
- 遗留改造提案: {{L}} 个（若为棕地项目）
```
