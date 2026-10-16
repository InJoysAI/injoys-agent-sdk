# Commands Check 指令

> 当 `.agent/workflows/context-check.md commands` 被调用时执行此文件。
> 遵循 `@design/context-dev/check/AGENTS.md` 通用审查协议。

---

## 🎯 执行指令

> ⛔ **必须依次执行所有步骤**，不得跳过或中断。

---

## Phase 1: 运行同步校验脚本

执行：

```bash
bash design/context-dev/scripts/check-ai-commands.sh
```

该脚本把 `design/context-dev/commands/*.md` 与 `.agent/workflows/` 下的同名文件**逐字节比较**，并分别检出三种漂移：

| 漂移 | 含义 |
|------|------|
| 缺失 | 命令源有，`.agent/workflows/` 没有 |
| 不一致 | 两处内容不同（命令源已改但未重新安装） |
| 残留 | `.agent/workflows/` 有，但命令源已删除或改名 |

**结果**：
- ❌ 退出码非 0 → 判定 `FAIL`，直接进入 Phase 3 报告
- ✅ 退出码 0 → 继续 Phase 2

---

## Phase 2: 核对命令清单完整性

读取 `design/context-dev/commands/*.md`，与 `design/context-dev/README.md` 的「命令」表对照：

| 校验项 | 规则 |
|--------|------|
| 数量一致 | 命令源文件数 = README 表中列出的命令数 |
| 名称一致 | 每个 `commands/context-*.md` 都在 README 表中出现，反之亦然 |
| 子命令描述一致 | README 表中 `context-check` 一行列出的子命令，与 `commands/context-check.md` 顶部清单一致 |

**结果**：
- ❌ 数量或名称不一致 → `[DEVIATION]` P2
- ⚠️ 子命令清单不一致 → `[DESYNC]` P2
- ✅ 一致 → 通过

---

## Phase 3: 生成检查报告

按通用协议的差异标签与严重程度输出报告，并给出最小修复建议：

```
🔍 AI 命令同步检查报告
命令源：design/context-dev/commands/
目标：  .agent/workflows/
状态：[🟢 通过 | 🔴 失败]

✅/❌ 逐字节同步（N 个命令文件）
   ├── context-check.md   [一致 | 漂移 | 缺失 | 残留]
   ├── context-init.md    [一致 | 漂移 | 缺失 | 残留]
   └── ...

✅/⚠️ 命令清单完整性
   ├── 数量一致 → [状态]
   ├── 名称一致 → [状态]
   └── README 子命令清单 → [状态]

📋 修复建议：
1. 重新安装命令（不要手工编辑 .agent/workflows/ 下的副本）：
   bash design/context-dev/scripts/install-ai-commands.sh --tools antigravity
```

**修复约定**：命令漂移只通过重新安装修复。`.agent/workflows/` 下的文件是 `commands/` 的同步产物，手工编辑会在下一次安装时被覆盖，且掩盖真实漂移。
