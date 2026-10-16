# Plan 生成指令

> 当 `.agent/workflows/context-openspec.md plan` 被调用时执行此文件。

---

## 🎯 执行指令

> ⛔ **本命令只生成 `proposal-roadmap.md`，不能触发 `config.yaml` 生成**

依次执行以下步骤：

---

## Phase 0: 检测项目类型

### 0.1 判断是否包含遗留系统

**检查**：`.context/legacy/legacy_system_analysis.md` 是否存在

| 检查结果 | 项目类型 | 后续行为 |
|----------|---------|---------|
| 存在 | **棕地项目** | 路线图需包含遗留系统改造阶段 |
| 不存在 | **绿地项目** | 纯新功能开发路线图 |

---

## Phase 1: 读取 Context 资产

**执行**: `@design/context-dev/tools/asset-reader/AGENTS.md`

> 该模块会：
> - 从 `context-manifest.json` 的 `generated_files` 节点获取文件列表
> - 按 scope 遍历：architecture, domain, db, ui, legacy
> - 跳过 README.md（目录说明）
> - 跳过 openspec/（避免循环引用）
> - 跳过 source/（按需回溯）

**若为棕地项目**（检测到 `generated_files.legacy` 非空）：
- 读取 `.context/legacy/legacy_system_analysis.md`
- 从 `sources.LEGACY_CODEBASE.reference` 获取遗留代码库引用路径

---

## Phase 2: 生成 proposal-roadmap.md

**模板**: `design/context-dev/templates/proposal-roadmap.md.template`

### 2.1 通用填充规则

1. **动态 Phase 数量**：
   - 根据 `.context/` 资产实际情况决定 Phase 数量（2-6 个）
   - 不是固定 3 个 Phase

2. **原子化提案**：
   - 每个提案只修改一个功能点或一个模块
   - 提案粒度控制在 1-3 天可完成
   - 大功能拆分为多个原子提案
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

### 2.1.1 可选：分 Phase 细化文件

默认只生成 `openspec/proposal-roadmap.md`（索引/总览）。仅当用户明确要求，或某个 Phase 的提案过多（>8 个）、总览已难以阅读时，才为该 Phase 额外生成 `openspec/proposal-roadmap-Phase<N>.md`：

- 模板：`design/context-dev/templates/proposal-roadmap-phase.md.template`
- 总览中该 Phase 保留标题、目标和提案 ID 索引，并链接到 Phase 文件；提案条目以 Phase 文件为细化来源
- 提案 ID、依赖关系须与总览一致，不得两处各写一套

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

**输出**: `openspec/proposal-roadmap.md`

**规则**：
- 不得残留任何 `{{...}}` 占位符
- 路线图应与 criterion.md 约束保持一致
- **❌ 禁止同时生成 config.yaml**

---

## ✅ 完成后

> ⛔ 本模块只生成 `proposal-roadmap.md`（及其分 Phase 细化文件）。完成后向调用方（`@design/context-dev/openspec/AGENTS.md` 路由层）报告并**停止**，不得自行继续执行其他模块。子命令模式下路由层直接结束；一键模式下由路由层决定下一步。（`.context/AGENTS.md` 是索引文档，不是调用方。）

报告结果：

```
=== OpenSpec Plan ===
项目类型: [绿地项目 / 棕地项目]
✅ openspec/proposal-roadmap.md (生成/更新)

路线图概览:
- Phase 数量: {{N}}
- 提案总数: {{M}}
- 遗留改造提案: {{L}} 个（若为棕地项目）
```
