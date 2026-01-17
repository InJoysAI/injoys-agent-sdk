# Proposal Check 指令

> 当 `/context-check proposal <change-id>` 被调用时执行此文件。

---

## 🎯 执行指令

> ⛔ **必须依次执行所有步骤**，不得跳过或中断。

---

## Phase 1: 文件完整性校验

检查 `openspec/changes/<change-id>/` 目录：

| 文件 | 必需 | 说明 |
|------|:----:|------|
| `proposal.md` | ✅ | 范围/边界/验收标准 |
| `tasks.md` | ✅ | 可执行任务清单 |
| `design.md` | ⚠️ | 复杂变更需要 |
| `specs/<capability>/spec.md` | ✅ | 至少一个 delta |

**结果**：
- ❌ 缺失必需文件 → 失败，列出缺失文件
- ✅ 所有必需文件存在 → 继续

---

## Phase 2: OpenSpec 规范校验

```bash
openspec validate <change-id> --strict
```

**结果**：
- ❌ 验证失败 → 失败，输出错误信息
- ✅ 验证通过 → 继续

---

## Phase 3: Context 引用一致性

检查 `proposal.md` 中声明的 Context 引用：

**必读文件**（`proposal.md` 必须引用）：
- `.context/criterion.md` — 项目约束
- `.context/architecture/tech_stack.md` — 技术约束
- `openspec/project.md` — 项目概况

**检查方法**：
1. 读取 `proposal.md`
2. 检查 "Context References" 或类似部分
3. 验证必读文件是否被引用

**声明依赖检查**：若 `proposal.md` 声明依赖其他 `.context/**` 文件：
- 文件必须存在
- 路径必须正确

**结果**：
- ❌ 必读文件未引用 → 警告
- ⚠️ 声明的依赖文件不存在 → 警告
- ✅ 所有引用正确 → 继续

---

## Phase 4: Context 内容一致性校验

> ⛔ **必须执行此步骤**，不得跳过。

### 4.1 读取 Context 资产

**执行**: `@design/context-dev/tools/asset-reader/AGENTS.md`

> 该模块会：
> - 从 `context-manifest.json` 的 `generated_files` 节点获取文件列表
> - 按 scope 遍历：architecture, domain, db, ui, legacy
> - 跳过 README.md、openspec/、source/

### 4.2 内容校验

根据 `asset-reader` 读取的资产**动态校验**提案内容：

**必须校验**（若资产存在）：
| 资产 | 校验规则 |
|------|---------|
| `criterion.md` | 提案不得违反 MUST/MUST NOT 约束 |
| `architecture/tech_stack.md` | 提案使用的技术必须在 Tech Stack 中定义 |
| `domain/business_rules.md` | 相关业务规则必须在 specs 中有对应 Scenario |

**条件校验**（若资产存在且提案涉及相关内容）：
| 资产 | 触发条件 | 校验规则 |
|------|---------|---------|
| `architecture/security_policy.md` | 涉及认证、存储、API | 必须符合安全策略 |
| `ui/design_spec.md` | 涉及 UI 变更 | 必须引用设计规范 |
| `db/*.md` | 涉及数据库变更 | 必须符合数据规范 |

**校验方法**：
1. 遍历 `asset-reader` 读取的所有资产
2. 提取每个资产中的约束规则
3. 检查提案是否违反任何规则

**示例**：
- ❌ 提案使用 MongoDB，但 `tech_stack.md` 只允许 PostgreSQL
- ❌ 提案直接调用第三方 API，但 `criterion.md` 要求通过 Proxy
- ⚠️ 提案涉及消息去重，但未包含相关业务规则的 Scenario

---

## Phase 5: SSoT 先行任务检查

读取 `.context/architecture/tech_stack.md` 判断项目 SSoT 类型：

| Tech Stack | `tasks.md` 必须包含 |
|------------|------------------|
| PostgreSQL | 创建 Goose 迁移 `SSoT/schema/migrations/` 任务 |
| REST API (Go) | 修改 `SSoT/api/main.tsp` 任务 |
| 启用 Codegen | Codegen 执行任务 |
| Tauri/Rust | 无 SSoT 约束 |
| 所有项目 | 测试 + 归档任务（`openspec validate` + `openspec archive`） |

**检查方法**：
1. 根据 Tech Stack 确定需要检查的 SSoT 任务
2. 在 `tasks.md` 中搜索相关任务
3. 验证任务顺序是否正确（SSoT 先行）

---

## Phase 6: 生成检查报告

输出检查报告（✅/⚠️/❌），并给出最小修复建议：

```
🔍 提案检查报告
提案ID：<change-id>
状态：[🟢 通过 | 🟡 需要关注 | 🔴 失败]

✅/⚠️/❌ 文件完整性
   ├── proposal.md [状态]
   ├── tasks.md [状态]
   ├── design.md [状态]
   └── specs/ [状态]

✅/❌ OpenSpec 验证
   └── openspec validate <change-id> --strict → [结果]

✅/⚠️/❌ Context 引用
   ├── criterion.md → [状态]
   ├── tech_stack.md → [状态]
   └── project.md → [状态]

✅/⚠️/❌ Context 内容一致性
   ├── 技术栈 → [状态]
   ├── 约束遵守 → [状态]
   ├── 业务规则 → [状态]
   └── 安全策略 → [状态]

✅/⚠️ SSoT 先行任务
   └── [SSoT 类型] → [状态]

📋 修复建议：
1. [具体修复建议]
2. [具体修复建议]
```
