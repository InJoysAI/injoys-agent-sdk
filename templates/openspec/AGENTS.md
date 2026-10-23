# OpenSpec Integration

> `.agents/workflows/context-openspec.md` 的权威执行流程

---

## 0. 幂等增强（Pre-step）

> ⛔ **必须首先执行此步骤**，在任何子命令之前执行

**执行**: `@design/context-dev/tools/integration/AGENTS.md`

> 该模块会：
> - 确保 `.context/openspec/integration.md` 存在
> - 刷新 `CONTEXT_ASSET_INDEX` 区块（从 Manifest 动态获取资产列表）

**⚠️ Pre-step 完成后，二选一**：带参数 → 按 §1 路由到**单个**模块；无参数 → 按 §2 执行一键模式。**不得两者都执行。**

---

## 1. 子命令路由

> ⛔ **子命令模式 = 只执行命中的那一个模块**（硬门禁）
> 1. 完成该模块后，**直接跳到 §3「子命令模式」报告并结束**；
> 2. **禁止执行 §2 的任何步骤**，也禁止“顺便”生成其他模块的产物（总结、`config.yaml`、`proposal-roadmap.md` 等）；
> 3. 发现缺少前置资产（如运行 `project` 时 `.context/domain/` 尚未生成）：在报告中**提示用户先运行对应子命令**，不得自行补跑；
> 4. 参数没有命中下表任何一行：⛔ **STOP**，列出下表中的可用子命令并询问用户，**不得回退为一键模式**。

| 子命令 | 执行模块 | 说明 |
|--------|---------|------|
| `domain` | `@design/context-dev/domain/AGENTS.md` | 生成 domain 总结 |
| `architecture` | `@design/context-dev/architecture/AGENTS.md` | 生成 architecture 总结 |
| `db` | `@design/context-dev/db/AGENTS.md` | 生成 db 总结 |
| `ui` | `@design/context-dev/ui/AGENTS.md` | 生成 ui 总结 |
| `legacy` | `@design/context-dev/legacy/AGENTS.md` | 生成 legacy 分析 |
| `project` | `@design/context-dev/openspec/project/AGENTS.md` | 生成 config.yaml |
| `plan` | `@design/context-dev/openspec/plan/AGENTS.md` | 按项目规模生成路线图：简单项目为单个 proposal-roadmap.md；复杂项目为 proposal-roadmap.md（总规划）+ proposal-roadmap-Phase-<N>.md（各阶段提案详情） |
| `plan add ui [Phase-N 文件]` | `@design/context-dev/openspec/plan/add/AGENTS.md` | 路线图已存在时，把 UI 新增提案补进现有路线图并同步总纲（只增不改；`Phase-N` 文件可省略，由 AI 建议落点，用户确认后才写） |
| `plan add source <文档路径> [Phase-N 文件]` | `@design/context-dev/openspec/plan/add/AGENTS.md` | 把一份已定稿、已立项、但不属于 `.context` 的需求文档（如 `docs/` 下的访谈定稿）拆成新增提案补进现有路线图（只增不改；只改路线图，不写 `.context`，结论在提案归档时经 `sync proposal` 进入 Context） |
| `proposal <change-id> [roadmap-doc]` | `@design/context-dev/openspec/proposal/AGENTS.md` | 创建并严格校验提案，基于实际证据动态生成三层评审 Prompt（主 roadmap 条目必需，`roadmap-doc` 仅补充） |

> 路由按**最长匹配**：`plan add ...` 命中 `plan add` 行，不得落到 `plan`（否则会重新生成整份路线图）。`plan` 本身不接受额外参数。

---

## 2. 一键模式（仅限无参数）

> ⚠️ **只有在没有任何参数时才进入本节**；带参数调用不得执行本节任何步骤。
>
> **必须完整执行以下顺序**：

1. **执行**: `@design/context-dev/domain/AGENTS.md`
2. **执行**: `@design/context-dev/architecture/AGENTS.md`
3. **执行**: `@design/context-dev/db/AGENTS.md` （仅当 `.context/db/source/` 下有源文档；没有则跳过）
4. **执行**: `@design/context-dev/ui/AGENTS.md` （仅当 `.context/ui/source/` 下有源文档；没有则跳过。只有 PRD 时如需降级生成，请显式运行 `ui` 子命令）
5. **执行**: `@design/context-dev/openspec/project/AGENTS.md`
6. **执行**: `@design/context-dev/openspec/plan/AGENTS.md`
7. **输出验收报告**（见下文）

---

## 3. 验收报告

> ⛔ **必须执行**。按调用模式选择对应清单，**两套清单不得混用**。

### 一键模式（无参数）

必须向用户报告：
- ✅ 各总结生成情况（及 Manifest 状态）
- ✅ `criterion.md` 填充情况
- ✅ `openspec/config.yaml` 更新情况
- ✅ `openspec/proposal-roadmap.md` 更新情况
- ⚠️ 任何跳过的步骤及原因

### 子命令模式（带参数）

**只报告被执行的那一个模块**：
- ✅ 本模块生成/更新的文件列表
- ✅ Manifest 更新状态
- ⚠️ 跳过的步骤及原因
- ➡️ 缺少的前置资产与建议用户接下来运行的子命令（若有）

> 未执行的模块**不在报告范围**，也**不得为了“凑报告项”去生成**其他产物（如运行 `domain` 时不报告、也不去更新 `config.yaml` / `proposal-roadmap.md`）。`proposal` 子命令按其模块自身的完成清单报告。
