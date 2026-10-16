# Project Check 指令

> 当 `.agent/workflows/context-check.md project` 被调用时执行此文件。
> 遵循 `@design/context-dev/check/AGENTS.md` 通用审查协议。

---

## 🎯 执行指令

> ⛔ **必须依次执行所有步骤**，不得跳过或中断。

---

## Phase 1: 文件存在性校验

检查以下文件是否存在：

| 文件 | 必需 | 说明 |
|------|:----:|------|
| `openspec/config.yaml` | ✅ | Project 配置文件 |
| `.context/context-manifest.json` | ✅ | 用于读取 Context 资产 |

**结果**：
- ❌ 缺失必需文件 → 失败，提示先运行 `.agent/workflows/context-openspec.md project`
- ✅ 所有必需文件存在 → 继续

---

## Phase 2: 格式正确性校验

**参考生成逻辑**: `design/context-dev/openspec/project/AGENTS.md`

### 2.1 必须包含的章节

| 章节 | 必需 |
|------|:----:|
| Purpose | ✅ |
| Tech Stack | ✅ |
| Code Style | ✅ |
| Architecture Patterns | ✅ |
| Testing Strategy | ⚠️ 若来源提供（`domain/testing_strategy.md` 等） |
| Git Workflow | ⚠️ 若来源提供（`criterion.md` 中有分支/提交约定） |
| Domain Context | ✅ |
| Important Constraints | ✅ |
| External Dependencies | ✅ |
| UI Guidelines | ⚠️ 若 `.context/ui/` 存在 |
| Database Design | ⚠️ 若 `.context/db/` 存在 |

> 与生成规范（`openspec/project/AGENTS.md`「缺失来源处理」）保持一致：标 ⚠️ 的章节在来源不存在或记为 `N/A` 时，生成方会**整节省略**，此时缺该章节**不算缺失**；也**不得**为消除告警补一个空章节。

**结果**：
- ❌ 缺失必需章节（标 ✅ 的章节）→ 警告
- ✅ 格式正确 → 继续

### 2.2 派生快照元数据

- 顶部包含生成来源、`Context-SHA256` 和禁止手工编辑声明
- 对实际来源文件按 **`design/context-dev/openspec/project/AGENTS.md` →「Context-SHA256 算法」** 重算组合指纹：
  - `file_digest = hex(sha256(utf8(path) || 0x0A || file_bytes))`
  - 按路径排序后 `Context-SHA256 = hex(sha256(join_hex_with_newline))`（末条无尾随 `\n`）
  - 与 YAML 头部 `Context-SHA256`（及 Manifest `last_openspec_project.context_sha256` 若存在）比对
  - **不一致** → 标记 `[STALE] P1`（来源已变或快照过期；要求 `.agent/workflows/context-openspec.md project` 重生成）
  - **无法解析算法文档** → 标记 `[AMBIGUOUS] P2`（流程缺陷，非内容错误）
- **内容基线**：Manifest `last_openspec_project.config_sha256` 存在时，计算 `config.yaml` 当前原始字节的 sha256 与之比对：
  - 来源指纹一致、但内容摘要 ≠ 基线 → 标记 `[DESYNC] P2`（快照在生成后被修改过，可能与来源不一致；要求复核并用 `.agent/workflows/context-openspec.md project` 重生成）
  - 字段不存在 → 跳过本项（旧 Manifest 兼容），不报错
  - 注意：该基线只能发现“生成之后被改动”，**发现不了“生成时就不完整”**；后者由 Phase 3 / Phase 4 的内容一致性与完整性校验负责
- **体积**：`config.yaml` 超过 **32 KiB** → 标记 `[OVERSIZE] P2`（仅警告；裁剪优先级见生成规范「体积预算」）；超过 20 KiB 目标但未到 32 KiB 仅在报告中提示
- `schema: spec-driven` 和 `context` / `rules` 结构可被 YAML 解析器读取

---

## Phase 3: Context 内容一致性校验

### 3.1 读取 Context 资产

**执行**: `@design/context-dev/tools/asset-reader/AGENTS.md`

> 该模块会：
> - 从 `context-manifest.json` 的 `generated_files` 节点获取文件列表
> - 按 scope 遍历：architecture, domain, db, ui, legacy
> - 跳过 README.md、openspec/、source/

### 3.2 内容校验

根据读取的资产**动态校验** `openspec/config.yaml` 内容：

| 校验项 | 来源 | 校验规则 |
|--------|------|---------|
| Purpose 一致性 | `criterion.md` | config.yaml 的 context 必须与 criterion.md 一致 |
| Tech Stack 完整性 | `tech_stack.md` | 必须覆盖所有 MUST 级别的技术 |
| 约束一致性 | `criterion.md` | context 必须反映 MUST/MUST NOT 规则 |
| Domain 覆盖 | `business_rules.md` | 必须涵盖核心业务规则 |
| 反向可追溯 | 全部实际来源 | config 中的具体技术、数值、路径和强约束必须能追溯到来源；否则标记 `[UNJUSTIFIED]` |

**示例**：
- ❌ `tech_stack.md` 要求 Rust stable，但 `config.yaml` 中未体现
- ❌ `criterion.md` 有 MUST NOT 规则，但 `config.yaml` 的 context 未包含
- ⚠️ `criterion.md` 写明了分支/提交约定，但 `config.yaml` 没有 Git Workflow 约定（来源为 N/A 时不告警）

---

## Phase 4: 完整性校验

| 校验项 | 校验规则 |
|--------|---------|
| 章节存在 | 所有必需章节（标 ✅）都存在；标 ⚠️ 的章节仅在来源存在时检查 |
| 章节非空 | 所有章节都有实质内容（非占位符） |
| 无残留占位符 | 不得残留 `{{...}}` 占位符 |
| 数值与枚举精度 | 动态提取 config 中的数值、状态、错误码和路径，逐项与来源核对 |
| 条件章节 | DB/UI 等模块不存在时允许缺席，不使用固定项目清单误报 |

---

## Phase 5: 生成检查报告

输出检查报告（✅/⚠️/❌），并给出最小修复建议：

```
🔍 Project 检查报告
文件：openspec/config.yaml
状态：[🟢 通过 | 🟡 需要关注 | 🔴 失败]

✅/❌ 文件存在性
   └── config.yaml [状态]

✅/⚠️/❌ 格式正确性
   ├── Purpose [状态]
   ├── Tech Stack [状态]
   ├── Code Style [状态]
   ├── Architecture [状态]
   ├── Testing [状态 / 来源未提供，已省略]
   ├── Git Workflow [状态 / 来源未提供，已省略]
   ├── Domain Context [状态]
   ├── Constraints [状态]
   └── Dependencies [状态]

✅/⚠️/❌ Context 一致性
   ├── Purpose → [状态]
   ├── Tech Stack → [状态]
   ├── Constraints → [状态]
   └── Domain → [状态]

✅/⚠️ 完整性
   ├── 占位符检查 → [状态]
   ├── 内容基线 → [状态 / [DESYNC] / 未记录基线]
   └── 体积 → [状态 / [OVERSIZE]]（实际 N KiB）

📋 修复建议：
1. [具体修复建议]
2. [具体修复建议]
```
