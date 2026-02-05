# Asset Reader 指令

> 从 `.context/context-manifest.json` 动态获取并读取 Context 资产。

---

## 📂 混合模式目录结构

```
.context/<scope>/
├── source/                    # 源文档目录（权威）
│   └── *.md                   # 完整源文档
├── *.md                       # 总结文件（快速索引）
└── README.md                  # 目录说明
```

**读取优先级**：
1. **日常任务** → 读取总结文件（快速）
2. **提案检查** → 读取总结 + 约束验证
3. **细节验证** → 回溯 `source/` 目录中的源文档

> ⚠️ **若总结与源文档冲突，以 `source/` 目录中的源文档为准**

---

## 🎯 执行指令

---

### Phase 1: 从 Manifest 获取待读取文件列表

**读取 manifest**:
```bash
cat .context/context-manifest.json
```

**Manifest 结构说明**：

```json
{
  "sources": {
    "PRD": { "archived_to": ".context/domain/source/xxx.md", "status": "archived" },
    "LEGACY_CODEBASE": { "reference": ".context/legacy/source/_codebase_ref.md", "status": "referenced" }
  },
  "generated_files": {
    "root": [".context/README.md", ".context/criterion.md", ...],
    "architecture": [".context/architecture/system_design.md", ...],
    "domain": [".context/domain/business_rules.md", ...],
    "db": [...],
    "ui": [...],
    "legacy": [...],
    "openspec": [...]
  }
}
```

**筛选规则**：

从 `generated_files` 节点中筛选需要读取的文件：

| 条件 | 操作 |
|------|------|
| 在 `generated_files.architecture/domain/db/ui/legacy` 数组中 | ✅ 需要读取 |
| 文件名是 `README.md` | ❌ 跳过（目录说明文件） |
| 路径包含 `openspec/` | ❌ 跳过（避免循环引用） |
| 路径包含 `source/` | ❌ 默认跳过（除非需要回溯验证） |

**筛选示例**：

```
读取列表 = []

for scope in ["architecture", "domain", "db", "ui", "legacy"]:
    for file in generated_files[scope]:
        if "README.md" not in file:
            读取列表.append(file)

# 额外读取 criterion
读取列表.append(".context/criterion.md")
```

---

### Phase 2: 读取筛选后的文件

对 Phase 1 筛选出的每个文件执行读取。

> ⛔ **必须读取所有筛选出的文件**，不得遗漏

**读取顺序建议**：
1. `.context/criterion.md` — 项目约束（最先读取）
2. `.context/architecture/*` — 架构总结
3. `.context/domain/*` — 业务领域
4. `.context/db/*` — 数据库设计
5. `.context/ui/*` — UI 设计
6. `.context/legacy/*` — 遗留系统分析

---

### Phase 3: 回溯源文档（按需）

**触发条件**：
- 总结文件内容不确定或可能有遗漏
- 需要验证细节信息
- 调用方明确请求源文档

**从 Manifest sources 获取源文档路径**：

```json
"sources": {
    "PRD": { "archived_to": ".context/domain/source/InJoysAI-Product-Overview.md" },
    "ARCHITECTURE": { "archived_to": ".context/architecture/source/InJoysAI-System-Architecture-Design.md" }
}
```

**操作**：
读取 `archived_to` 指向的源文档进行验证。

---

### Phase 4: 额外读取核心文件（可选参数）

根据调用方需求，可额外读取以下文件：

| 文件 | 参数 | 用途 |
|------|------|------|
| `.context/criterion.md` | `--criterion` | 项目约束（MUST/MUST NOT） |
| `.context/openspec/integration.md` | `--integration` | Context 读取规范 |
| `openspec/config.yaml` | `--project` | 项目整体情况 |
| `openspec/proposal-roadmap.md` | `--roadmap` | 规划文档（索引/总览） |
| `openspec/proposal-roadmap-Phase*.md` / `openspec/proposal-roadmap-Phase-*.md` | `--roadmap <path>` | 提案大纲/分 Phase 规划（显式指定要读的 roadmap 文件） |
| `.context/<scope>/source/*` | `--source <scope>` | 回溯源文档 |

---

## ✅ 完成后

报告结果：

```
=== Asset Reader ===
从 Manifest 筛选并读取的资产:

[criterion]
- .context/criterion.md

[architecture] ({{N}} 个文件)
- .context/architecture/system_design.md
- .context/architecture/tech_stack.md
- .context/architecture/security_policy.md
- ...

[domain] ({{N}} 个文件)
- .context/domain/business_rules.md
- .context/domain/user_journeys.md
- ...

[db] ({{N}} 个文件)
- .context/db/schema_design.md
- ...

[ui] ({{N}} 个文件)
- .context/ui/design_system.md
- ...

[legacy] ({{N}} 个文件)
- .context/legacy/legacy_system_analysis.md

跳过的文件:
- .context/*/README.md (目录说明)
- .context/*/source/* (按需回溯)
- .context/openspec/* (避免循环引用)

回溯读取（若有）:
- .context/architecture/source/InJoysAI-*.md
```
