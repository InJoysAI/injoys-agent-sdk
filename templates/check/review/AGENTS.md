# Context Review 核对指令

> 当 `/context-check review <profile> [arguments]` 被调用时执行。遵循 `@design/context-dev/check/AGENTS.md` 通用审查协议。

## 输入

支持以下预置画像，也兼容自由文本：

| Profile | 用途 | 默认范围 |
|---------|------|----------|
| `prd-tad [prd-path] [tad-path]` | PRD 与技术架构双向一致性 | 指定路径；未指定时从 Manifest 的 PRD/ARCHITECTURE source 解析 |
| `assets` | 全量生成资产一致性 | `.context/**`，排除 `source/`、系统文件和临时文件 |
| `core` | 初始化核心文档检查 | `.context/README.md`、`AGENTS.md`、`criterion.md`、Manifest、实际文件系统 |
| `scope <domain|architecture|db|ui|legacy>` | 单模块生成资产与源文档对照 | 对应 scope、`source/`、关联 SSoT 和必要的跨模块资产 |
| `"<自由描述>"` | 临时专项检查 | 从描述解析范围与参照物 |

`project`、`plan`、`proposal` 已有专用子命令，不通过自由文本重复实现。

## Phase 1: 解析范围

1. 识别 profile、显式路径和排除项。
2. 检查路径是否存在；显式路径缺失则停止并报告。
3. 未提供可从 Manifest 唯一确定的路径时直接使用；存在多个权威候选且无法判定时才询问用户。
4. 输出实际审查范围，禁止把示例文件名、项目名、字段名或数值当作当前项目事实。

## Phase 2: 加载证据

### prd-tad

只读取 PRD、TAD 及其 Metadata。分别提取：业务流程、实体、状态、接口诉求、NFR、技术组件、数据流、安全和运维约束。

### assets

建立以下四方清单：

1. `.context/context-manifest.json.generated_files`
2. 根 README 和各模块 README 索引
3. `.context/openspec/integration.md` 的 `CONTEXT_ASSET_INDEX`
4. 实际文件系统

排除 `*/source/*`、`.DS_Store`、临时文件。内容审查按 Manifest 中实际存在的 scope 动态执行，不假定固定文件清单。

### core

读取三份核心文档、Manifest 和实际目录树，核对职责边界：README 是人类索引，AGENTS 是 AI 入口，criterion 是工程约束 SSoT。

### scope

读取对应生成资产和 `source/` 权威材料；DB 额外读取迁移 SSoT，UI 额外读取产品旅程与安全约束，architecture/domain 互相读取必要的术语和接口引用。仅在用户提供代码路径时检查实现。

### 自由文本

按描述加载最小必要资产。涉及 OpenSpec 时可读取根目录 `openspec/*`，但必须区分它与 `.context/openspec/integration.md`。

## Phase 3: 执行画像检查

### 3.1 prd-tad 双向追溯

- PRD → TAD：业务链路、异常边界、实体/状态、接口诉求、NFR 是否有技术落点。
- TAD → PRD：每个关键组件、数据存储、接口和强约束是否能追溯到业务价值或明确架构决策。
- 生成业务流覆盖矩阵、实体/接口映射、术语差异和 NFR 落地表。

### 3.2 assets 全量一致性

- Manifest / README / Integration Index / 文件系统四方同步。
- Metadata 来源、生成批次和待生成状态是否自洽。
- 领域术语、状态枚举、数据模型、API、错误语义、安全和 SSoT 路径跨模块是否一致。
- criterion 的每条相关 MUST/MUST NOT 是否被引用资产覆盖且无冲突。
- 风险、测试策略和边缘场景是否形成可验证闭环。

### 3.3 core 职责与结构

- 目录树无幽灵引用和遗漏引用。
- 三份核心文档对目录、更新规则和 SSoT 路径的描述一致。
- 不在 README/AGENTS 重复维护 criterion 的详细规则。
- 外部路径标明已存在、待生成或可选，不把待生成资产误报为缺失。

### 3.4 scope 源资产对照

- 建立生成文件与源材料的配对表。
- 双向识别遗漏、冲突、过时、无依据新增和孤立文件。
- DB：执行源文档 ↔ DB 摘要 ↔ migrations 三角验证。
- UI：执行 UI 源规范 ↔ UI 资产 ↔ PRD 旅程/架构安全约束三角验证。
- Domain：检查实体、规则、旅程、术语、边界和测试覆盖。
- Architecture：检查组件、接口、运行时、部署、安全、数据和风险的一致性。

## Phase 4: 输出报告

严格使用通用协议的标签、严重度和标准输出。额外要求：

- 引用具体文件路径及章节、字段或行号。
- 区分“权威源缺失”和“生成资产遗漏”。
- `assets` 必须单独说明 `generated_files.openspec` 与 `.context/openspec/integration.md` 是否同步。
- 只报告有证据的问题；通过项可以矩阵汇总，不展开重复叙述。
- 默认不请求用户逐项确认，也不自动修复。用户明确要求修复后，修改对应资产并更新 Manifest。

$ARGUMENTS
