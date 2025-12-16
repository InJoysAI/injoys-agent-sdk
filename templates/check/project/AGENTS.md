# Project Check 指令

> 当 `/context-check project` 被调用时执行此文件。

---

## 🎯 执行指令

> ⛔ **必须依次执行所有步骤**，不得跳过或中断。

---

## Phase 1: 文件存在性校验

检查以下文件是否存在：

| 文件 | 必需 | 说明 |
|------|:----:|------|
| `openspec/project.md` | ✅ | Project 文件 |
| `.context/context-manifest.json` | ✅ | 用于读取 Context 资产 |

**结果**：
- ❌ 缺失必需文件 → 失败，提示先运行 `/context-openspec project`
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
| Testing Strategy | ✅ |
| Git Workflow | ✅ |
| Domain Context | ✅ |
| Important Constraints | ✅ |
| External Dependencies | ✅ |
| UI Guidelines | ⚠️ 若 `.context/ui/` 存在 |
| Database Design | ⚠️ 若 `.context/db/` 存在 |

**结果**：
- ❌ 缺失必需章节 → 警告
- ✅ 格式正确 → 继续

---

## Phase 3: Context 内容一致性校验

### 3.1 读取 Context 资产

**执行**: `@design/context-dev/tools/asset-reader/AGENTS.md`

> 该模块会：
> - 从 `context-manifest.json` 的 `generated_files` 节点获取文件列表
> - 按 scope 遍历：architecture, domain, db, ui, legacy
> - 跳过 README.md、openspec/、source/

### 3.2 内容校验

根据读取的资产**动态校验**  `openspec/project.md` 内容：

| 校验项 | 来源 | 校验规则 |
|--------|------|---------|
| Purpose 一致性 | `criterion.md` | project.md 的 Purpose 必须与 criterion.md 一致 |
| Tech Stack 完整性 | `tech_stack.md` | 必须覆盖所有 MUST 级别的技术 |
| 约束一致性 | `criterion.md` | Constraints 必须反映 MUST/MUST NOT 规则 |
| Domain 覆盖 | `business_rules.md` | 必须涵盖核心业务规则 |

**示例**：
- ❌ `tech_stack.md` 要求 Rust stable，但 `project.md` 中未体现
- ❌ `criterion.md` 有 MUST NOT 规则，但 `project.md` 的 Constraints 未包含
- ⚠️ `project.md` 缺少 Git Workflow 章节

---

## Phase 4: 完整性校验

| 校验项 | 校验规则 |
|--------|---------|
| 章节存在 | 所有必需章节都存在 |
| 章节非空 | 所有章节都有实质内容（非占位符） |
| 无残留占位符 | 不得残留 `{{...}}` 占位符 |

---

## Phase 5: 生成检查报告

输出检查报告（✅/⚠️/❌），并给出最小修复建议：

```
🔍 Project 检查报告
文件：openspec/project.md
状态：[🟢 通过 | 🟡 需要关注 | 🔴 失败]

✅/❌ 文件存在性
   └── project.md [状态]

✅/⚠️/❌ 格式正确性
   ├── Purpose [状态]
   ├── Tech Stack [状态]
   ├── Code Style [状态]
   ├── Architecture [状态]
   ├── Testing [状态]
   ├── Git Workflow [状态]
   ├── Domain Context [状态]
   ├── Constraints [状态]
   └── Dependencies [状态]

✅/⚠️/❌ Context 一致性
   ├── Purpose → [状态]
   ├── Tech Stack → [状态]
   ├── Constraints → [状态]
   └── Domain → [状态]

✅/⚠️ 完整性
   └── 占位符检查 → [状态]

📋 修复建议：
1. [具体修复建议]
2. [具体修复建议]
```
