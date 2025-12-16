# Domain 总结生成入口

> **用途**: 从 PRD 产品需求文档生成结构化的业务领域总结。  
> **触发**: `/context-openspec domain` 或由 `design/context-dev/AGENTS.md` Step 5.2 调用。

---

## 📂 目录结构（混合模式）

> ⚠️ **动态生成**：具体生成哪些文件由 Phase 0 分析决定，以下仅为示例

```
.context/domain/
├── source/                    # 源文档目录（权威）
│   └── *.md                   # 完整 PRD 文档
├── business_rules.md          # 必须生成
├── [user_journeys.md]         # 按需生成（Phase 0 检测）
├── [market_insights.md]       # 按需生成（Phase 0 检测）
├── [testing_strategy.md]      # 按需生成（Phase 0 检测）
├── [risks_and_debt.md]        # 按需生成（Phase 0 检测）
├── [data_strategy.md]         # 按需生成（Phase 0 检测）
├── [edge_cases.md]            # 按需生成（Phase 0 检测）
└── README.md                  # 整体说明（快速索引）
```

> 方括号 `[文件名]` 表示该文件根据源文档内容动态决定是否生成

**读取优先级**：
1. 日常任务 → 读取总结文件（快速）
2. 提案检查 → 读取总结 + 业务规则验证
3. 遇到不确定/细节问题 → **回溯 `source/` 目录验证**

> ⚠️ **若总结与源文档冲突，以 `source/` 目录中的源文档为准**


---

## 🎯 执行指令

使用 **源文档**（位于 `.context/domain/source/` 目录），依次执行以下步骤。

> **⚠️ 全局规则**:  
> 1. 所有生成的文件都必须在顶部包含 Metadata 区块（Source, Generated At, Generator）。
> 2. 生成结果必须登记到目标项目 `.context/context-manifest.json` 的 `generated_files`。
> 3. **输出边界**: 本命令只能写入 `.context/domain/**`（不含 `source/`），不可直接写入其他目录。
> 4. **源文档只读**: 不得修改 `source/` 目录中的文件。

---

## 📋 PRD 解析规则

优先读取目标项目内的 `docs/Standard_PRD_Guidelines.md`（若存在），否则按以下内置「章节→输出」映射解析 PRD：

### 核心提取项

| PRD 章节 | 提取内容 | 输出目标 |
|---------|---------|---------|
| 2. 项目全景 | 商业背景、目标、范围 | `business_rules.md` |
| 3. 用户中心 | 用户画像、用户故事、客户旅程 | `user_journeys.md` |
| 4. 功能性需求 | 业务流程、交互逻辑、异常处理 | `business_rules.md` |
| 5. 非功能性需求 | 性能、安全、可靠性指标 | `business_rules.md` **（NFR 补充摘要）** |
| 6. 数据策略 | 埋点需求、统计体系 | `business_rules.md` |
| 7. 验收标准 | BDD 格式、UAT 流程 | `testing_strategy.md` |
| 8. 项目管理 | 依赖、风险评估 | `risks_and_debt.md` |

> **⚠️ NFR 处理说明**:  
> PRD 的「非功能性需求」作为 domain 的**补充摘要**写入 `business_rules.md`（供 project/plan 汇总与提案约束使用），**不作为架构权威输出**。架构层的 NFR 由 `/context-openspec architecture` 单独处理。

---

## Phase 0: 分析源文档（动态生成决策）

> ⛔ **必须首先执行此步骤**，在生成任何文件之前完成分析。

### 0.1 读取源文档

**读取**：`.context/domain/source/` 目录下的所有文件

### 0.2 关键词分析

**依次检查以下关键词，记录是否存在**：

| 检查项 | 关键词 | 若存在则生成 | 优先级 |
|--------|--------|-------------|--------|
| 用户旅程 | 用户旅程, 操作流程, User Journey, 客户旅程 | `user_journeys.md` | 推荐 |
| 市场分析 | 市场分析, 竞品, Market, 用户画像 | `market_insights.md` | 可选 |
| 测试策略 | 验收标准, 测试策略, BDD, UAT, Given/When/Then | `testing_strategy.md` | 推荐 |
| 风险评估 | 业务风险, 项目风险, 依赖, 合规 | `risks_and_debt.md` | 可选 |
| 数据策略 | 埋点, 事件, 数据治理, 指标, 里程碑 | `data_strategy.md` | 可选 |
| 边缘情况 | 异常处理, 速率限制, 错误处理, 边界 | `edge_cases.md` | 可选 |

### 0.3 输出生成计划

**必须输出**：

```
=== 生成计划 ===
必须生成：
- business_rules.md（核心业务规则）

推荐生成（关键词匹配）：
- user_journeys.md（检测到：用户旅程, 操作流程）
- testing_strategy.md（检测到：验收标准, BDD）

跳过（未检测到相关内容）：
- market_insights.md
- risks_and_debt.md
```

**确认后继续 Phase 1**。

---

## 模板引用

| 输出文件 | 模板路径 |
|----------|----------|
| `business_rules.md` | `templates/domain/business_rules.md.template` |
| `user_journeys.md` | `templates/domain/user_journeys.md.template` |
| `market_insights.md` | `templates/domain/market_insights.md.template` |
| `testing_strategy.md` | `templates/domain/testing_strategy.md.template` |
| `risks_and_debt.md` | `templates/domain/risks_and_debt.md.template` |
| `data_strategy.md` | `templates/domain/data_strategy.md.template` |
| `edge_cases.md` | `templates/domain/edge_cases.md.template` |

> 模板路径相对于 `design/context-dev/`

## Phase 1: 填充模板

### 1. 填充 `business_rules.md` (必须)

**Prompt**:
```markdown
# Role
你是一位业务架构师。

# Task
从 PRD 提取所有"硬性业务规则"，按领域分类并为每条规则分配 ID（BR-XXX）。

# Requirements
- 按强制等级分类：MUST（必须）/ SHOULD（建议）/ MAY（可选）
- 提取具体的数值限制、业务约束
- 使用 IF-THEN-ELSE 格式描述条件逻辑
- 按业务领域分组（如：用户管理、支付、订阅）
- **务必**添加 Metadata 区块到文件顶部

# PRD 关键章节参考
- 4.2 界面元素与交互逻辑（校验规则）
- 4.2.3 后端逻辑与算法（业务逻辑）
- 4.2.4 异常流程（边缘情况处理）

# Output Format
使用 `business_rules.md` 模板格式输出。
```

### 2. 填充 `user_journeys.md` (推荐)

**Prompt**:
```markdown
# Role
你是一位交互设计师。

# Task
梳理核心用户操作流程，按角色分类。

# Requirements
- 使用 Mermaid 流程图描述关键路径
- 列出异常和边缘情况
- 按用户故事层级组织：Epic → Feature → Story
- 标注触发条件和预期结果
- **务必**添加 Metadata 区块到文件顶部

# PRD 关键章节参考
- 3.2 用户故事与 INVEST 原则
- 3.3 客户旅程地图
- 4.1 信息架构

# Output Format
使用 `user_journeys.md` 模板格式输出。
```

### 3. 填充 `market_insights.md` (可选)

**Prompt**:
```markdown
# Role
你是一位产品经理。

# Task
提取市场定位、用户画像、价值主张和竞品分析。

# Requirements
- 用户画像需包含：基础信息、技术能力、核心动机、使用场景、痛点
- **务必**添加 Metadata 区块到文件顶部

# PRD 关键章节参考
- 2.2 项目背景与商业价值
- 2.3 目标与成功度量
- 3.1 用户画像的多维构建

# Output Format
使用 `market_insights.md` 模板格式输出。
```

### 4. 填充 `testing_strategy.md` (推荐)

**Prompt**:
```markdown
# Role
你是一位 QA 架构师。

# Task
从 PRD 提取验收测试策略。

# Requirements
- 使用 BDD Gherkin 语法（Given/When/Then）
- 按模块/功能分类测试要求
- 包含 UAT 流程（Alpha → Beta → Sign-off）
- **务必**添加 Metadata 区块到文件顶部

# PRD 关键章节参考
- 7.1 行为驱动开发与 Gherkin 语法
- 7.2 用户验收测试流程

# Output Format
使用 `testing_strategy.md` 模板格式输出。
```

### 5. 填充 `risks_and_debt.md` (可选)

**Prompt**:
```markdown
# Role
你是一位风险分析师。

# Task
从 PRD 提取产品风险、技术债务清单。

# Requirements
- 风险：可能性/影响程度/负责人/缓解措施
- 技术债：类型/严重性/目标解决时间
- **务必**添加 Metadata 区块到文件顶部

# PRD 关键章节参考
- 8.2 风险评估
- 8.1 依赖管理

# Output Format
使用 `risks_and_debt.md` 模板格式输出。
```

---

## Phase 2: 生成说明文档

### 6. 生成 `domain/README.md`

**Prompt**:
```markdown
# Task
为 domain 目录生成一份 README 说明文档。

# Content
1. 目录用途：存储业务领域知识。
2. 文件列表：列出本目录下已生成的文件及其简要用途。
3. PRD 源文档：标注来源 PRD 文件。
4. Metadata：在顶部包含元数据。

# Output
README.md 内容。
```

---

## Phase 3: 更新 Manifest

> ⛔ **必须执行此步骤**，Phase 1/2 完成后立即执行

**执行**: `@design/context-dev/tools/manifest/AGENTS.md` (mode: update)

**更新内容**：
1. 将本次生成的所有文件添加到 `generated_files.domain` 数组
2. 确认 `sources.PRD` 记录正确

**⚠️ Phase 3 完成后必须执行 ✅ 完成后 报告**

---

## ✅ 完成后

向上级调用者（`.context/AGENTS.md` 或用户）汇报完成状态：
- ✅ 已生成的文件列表
- ⏩ 跳过的文件及原因
- 🔁 Manifest 更新状态
