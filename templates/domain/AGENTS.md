# Domain 总结生成入口

> **用途**: 从 PRD 产品需求文档生成结构化的业务领域总结。  
> **触发**: `.agent/workflows/context-openspec.md domain`，或由 `.agent/workflows/context-openspec.md`（无参数一键模式）按顺序调用。`/context-init` 只归档源文档，不会生成本模块的总结。

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
> 4. **源文档只读**: 谨慎修改 `source/` 目录中的文件。

---

## 🧭 业务 / 技术判定（所有生成步骤必须遵守）

> `domain` 只记录**业务层事实**：业务方不看代码也能读懂、能验收的内容。技术实现归 `.context/architecture/` 与 `.context/criterion.md`，**不在本模块重复**。

**判定问题**：把这条内容里的代码、框架、存储和协议细节全部拿掉，业务方还能读懂并据此验收吗？
- 能 → 写入 domain，用业务语言表述。
- 不能（本身就是实现手段）→ **不写入 domain**，这是架构 / criterion 的内容。
- 业务意图和技术手段混在一起 → 只保留业务意图，技术手段丢弃（或指向 `criterion §x` / 架构文档，不复述）。

**domain 中不得出现的内容**：

| 类别 | 例子 |
|------|------|
| 代码标识符 | 函数名、类名、模块名、字段名、枚举成员名、文件名（`resolveXxx`、`src/types.ts`） |
| 存储实现 | 文件/目录路径、数据库表与索引、缓存键、环境变量 |
| 并发与一致性机制 | 锁、乐观锁/版本号、事务、原子写入、重试与幂等实现 |
| 通信协议与接口 | RPC/HTTP 端点、WebSocket/SSE、报文信封、错误码、状态码 |
| 工程选型与度量 | 框架/库/SDK 名称、测试工具、覆盖率目标、分层/依赖方向 |

**允许保留的情形**：
- 产品名称、平台名称、第三方服务名称等**业务对象**（如“微信公众号”“Injoys 表格”）。
- PRD 明文写出的**用户可感知指标**（如“页面 2 秒内出结果”“数据保留 30 天”），照原数值写，不推导技术实现。
- 用户界面上**用户看得到的文案、按钮名**。

**改写示例**：

| ❌ 技术写法 | ✅ 业务写法 |
|-----------|-----------|
| 写入走原子写入 + `expectedVersion` 乐观锁，冲突返回 `CONFLICT` | 同一内容被两处同时修改时，后保存的一方会收到“内容已被更新”的提示，不会覆盖对方的修改 |
| 草稿存放于 `$DSH_HOME/.../{id}.json` | 草稿保存在用户本机，不上传到服务器 |
| 禁止 WebSocket/SSE 持久连接 | （技术约束，不写入 domain；已在 `criterion §x` 中） |
| 令牌禁止硬编码，日志必须脱敏 | （技术约束，不写入 domain；已在 `criterion §x` 中） |

**与 criterion / 架构重复时**：只写一行业务影响并引用来源（如“详见 criterion §4”），不复述原文。

---

## 📋 PRD 解析规则

优先读取目标项目内的 `docs/Standard_PRD_Guidelines.md`（若存在），否则按以下内置「章节→输出」映射解析 PRD：

### 核心提取项

> 下表的章节**编号仅为示例**：不同 PRD 的章节顺序和编号各不相同（例如随包的 `templates/PRD.md.template` 编号就与此不同）。解析时按章节**标题与内容语义**匹配，不依赖编号；找不到对应内容时在输出中标注“PRD 未提供”，不得编造。

| PRD 章节 | 提取内容 | 输出目标 |
|---------|---------|---------|
| 2. 项目全景 | 商业背景、目标、范围 | `business_rules.md` |
| 3. 用户中心 | 用户画像、用户故事、客户旅程 | `user_journeys.md` |
| 4. 功能性需求 | 业务流程、交互逻辑、异常处理 | `business_rules.md` |
| 5. 非功能性需求 | **仅**用户可感知且 PRD 给出明确数值/口径的指标（响应时间、可用性、合规、数据留存） | `business_rules.md` **（NFR 补充摘要）** |
| 6. 数据策略 | 埋点需求、统计体系 | `business_rules.md` |
| 7. 验收标准 | BDD 格式、UAT 流程 | `testing_strategy.md` |
| 8. 项目管理 | 依赖、风险评估 | `risks_and_debt.md` |

> **⚠️ NFR 处理说明**:  
> PRD 的「非功能性需求」作为 domain 的**补充摘要**写入 `business_rules.md`（供 project/plan 汇总与提案约束使用），**不作为架构权威输出**。架构层的 NFR 由 `.agent/workflows/context-openspec.md architecture` 单独处理。
>
> 只摘取**用户可感知、且 PRD 写了明确数值或口径**的条目；并发模型、加密算法、存储方式、分层约束等实现类要求**不摘取**（见上文「业务 / 技术判定」）。

---

## Phase 0: 分析源文档（动态生成决策）

> ⛔ **必须首先执行此步骤**，在生成任何文件之前完成分析。

### 0.1 读取源文档

**读取**：`.context/domain/source/` 目录下的所有文件，并先按 manifest 的 `sources.*.type` / 文件内容把它们分类：

| 源文档类型 | 例子 | 本模块如何使用 |
|-----------|------|---------------|
| **需求类**（主要来源） | PRD、产品需求、用户故事、验收标准 | 提取业务规则、旅程、验收、风险、数据策略 |
| **计划类**（辅助） | 开发计划、里程碑、排期 | 只用于确认**阶段范围与交付节奏**（如各 Phase 包含哪些平台/功能）；**不从中抽取规则** |
| **技术类**（不使用） | 架构设计、技术方案、接口/存储设计 | **不读取内容用于生成**，由 `architecture` 模块处理；发现需求类文档中夹带技术内容同样忽略 |

> 计划类 / 技术类文档里出现的约束，哪怕看起来像“业务规则”，只要需求类文档里没有对应表述，就**不写入 domain**。

### 0.2 关键词分析

**依次检查以下关键词，记录是否存在**：

| 检查项 | 关键词 | 若存在则生成 | 优先级 |
|--------|--------|-------------|--------|
| 用户旅程 | 用户旅程, 操作流程, 核心流程, 人工编辑路径, AI 操作路径, 商业授权路径, User Journey, 客户旅程 | `user_journeys.md` | 推荐 |
| 市场分析 | 市场分析, 竞品, Market, 用户画像 | `market_insights.md` | 可选 |
| 测试策略 | 验收标准, 测试策略, BDD, UAT, Given/When/Then | `testing_strategy.md` | 推荐 |
| 风险评估 | 业务风险, 项目风险, 依赖, 合规 | `risks_and_debt.md` | 可选 |
| 数据策略 | 埋点, 事件, 数据治理, 指标, 里程碑 | `data_strategy.md` | 可选 |
| 边缘情况 | 异常处理, 速率限制, 错误处理, 边界 | `edge_cases.md` | 可选 |

> 关键词用于语义分类而非只做精确字符串匹配。若源文档以“核心流程”“路径”等同义标题完整描述角色、触发条件、步骤和预期结果，应生成 `user_journeys.md`；不得因缺少“用户旅程”字样而跳过。

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
- **规则只写业务层**：遵守「业务 / 技术判定」，不写代码标识符、路径、锁/事务、协议/错误码、框架选型
- **不设“架构纪律 / 运行时 / 持久化 / 凭证实现”这类技术分组**；PRD 里这类内容属于架构与 criterion，不属于 domain
- 业务规则是否来自 PRD 要可追溯：每条规则标注 PRD 章节来源；PRD 没写的不得补充
- **务必**添加 Metadata 区块到文件顶部

# PRD 关键章节参考
- 功能性需求中的界面元素与交互逻辑（用户可见的校验规则）
- 功能性需求中的业务流程与计算口径（只取业务口径，不取实现算法）
- 异常流程（用户遇到异常时看到什么、业务如何兜底）

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
- 流程图与异常表只写**用户操作与用户看到的结果**，不出现接口、错误码、锁/事务等内部机制
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
- 用户画像需包含：基础信息、技术能力（指用户自身的使用能力，不是产品技术）、核心动机、使用场景、痛点
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
- 使用 BDD Gherkin 语法（Given/When/Then），**只写用户视角的行为与结果**，不出现内部函数、存储或接口
- 按模块/功能分类测试要求
- 包含 UAT 流程（Alpha → Beta → Sign-off）
- 测试工具、覆盖率目标、安全实现手段（加密/参数化查询等）不属于本文件，除非 PRD 明文要求，且只照原文记录并标注出处
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
- 风险：可能性/影响程度/负责人/缓解措施（业务/项目层面；技术风险归 `architecture`）
- 项目债务：类型/严重性/目标解决时间（范围、流程、文档类；技术债务归 `architecture`）
- **务必**添加 Metadata 区块到文件顶部

# PRD 关键章节参考
- 8.2 风险评估
- 8.1 依赖管理

# Output Format
使用 `risks_and_debt.md` 模板格式输出。
```

> 以下 6、7 两步与上面的 1–5 同属 Phase 1，仅在 Phase 0 判定需要生成对应文件时执行。

### 6. 填充 `data_strategy.md` (可选)

**Prompt**:
```markdown
# Role
你是一位数据产品经理。

# Task
从 PRD 提取业务侧的数据策略：要度量什么、为什么度量、数据如何被治理。

# Requirements
- 只写**业务口径**：事件名称、触发的业务时机、业务价值、指标定义与计算口径、数据治理与删除/导出/用途声明、里程碑
- 不写埋点 SDK、上报通道、后端埋点方式、字段类型与传输格式等实现；这些属于架构
- PRD 未提供的指标、事件、数值不得编造，标注“PRD 未提供”
- **务必**添加 Metadata 区块到文件顶部

# Output Format
使用 `data_strategy.md` 模板格式输出。
```

### 7. 填充 `edge_cases.md` (可选)

**Prompt**:
```markdown
# Role
你是一位产品经理。

# Task
从 PRD 提取异常与边缘场景：用户遇到异常时会发生什么、看到什么、业务如何兜底。

# Requirements
- 每个场景用「触发条件 → 用户看到什么 → 业务结果」描述，**用户视角**
- 只收录 PRD 提到或能由 PRD 直接推出的场景；模板中的章节（速率限制、内容审核、支付、同步冲突等）**与本项目无关就整节删除**，不要为凑齐章节而编造
- 不写检测方式、重试/退避策略、协议断连、锁/并发机制、错误码、负责模块；这些属于架构
- **务必**添加 Metadata 区块到文件顶部

# Output Format
使用 `edge_cases.md` 模板格式输出。
```

---

## Phase 2: 生成说明文档

### 8. 生成 `domain/README.md`

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

## Phase 2.5: 业务/技术自检（必须，生成完所有文件后、更新 Manifest 前）

> ⛔ 不得跳过。目的：把混进来的技术内容挡在 domain 之外。

对本次生成的每个 `.context/domain/*.md`（不含 `source/`）逐一执行：

1. **扫描**：找出以下内容
   - 反引号包裹的标识符（含 `.`、`/`、`_`、`()` 或驼峰）、文件路径、文件扩展名（`.ts` `.json` `.mjs` 等）、环境变量（`$XXX`）
   - 关键词：乐观锁、原子写入、事务、重试、幂等、WebSocket、SSE、RPC、端点、错误码、状态码、SDK、框架名
2. **逐条处理**：对每处命中套用「业务 / 技术判定」
   - 业务名词（产品名、平台名、界面文案）→ 保留
   - 实现细节 → **改写为业务语言**；若整条规则本身就是技术约束 → **整条删除**（它应在 `criterion.md` 或 `architecture/`）
   - 编号（`BR-XXX` 等）删除后保持连续或在 README 说明；被其他文件引用的编号必须同步更新引用
3. **检查分组**：`business_rules.md` 不得出现“架构纪律 / 运行时 / 持久化 / 凭证实现 / 测试隔离”这类技术分组
4. **检查重复**：与 `.context/criterion.md` 内容重合的条目，改为一行业务影响加 `详见 criterion §x`
5. **记录结果**：统计改写条数和删除条数，写入完成报告

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
- 🧹 业务/技术自检：改写 N 处、删除 M 条（列出删除的规则标题，说明已归属 criterion / architecture 的哪一处，或需用户补充到对应文档）
- 🔁 Manifest 更新状态
