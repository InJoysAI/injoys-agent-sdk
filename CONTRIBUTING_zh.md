# 贡献指南

感谢你对 injoys-agent-sdk 的关注！我们欢迎各种形式的贡献。

---

## 如何贡献

### 报告问题

1. 在 [Issues](https://github.com/injoysai/injoys-agent-sdk/issues) 中搜索是否已有类似问题
2. 如果没有，创建新 Issue，包含：
   - 问题描述
   - 复现步骤
   - 期望行为 vs 实际行为
   - 环境信息（OS、Node 版本、AI 工具）

### 提交代码

1. **Fork** 本仓库
2. 创建功能分支：`git checkout -b feat/your-feature`
3. 提交更改：`git commit -m "feat: add your feature"`
4. 推送分支：`git push origin feat/your-feature`
5. 创建 **Pull Request**

### Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 Bug |
| `docs` | 文档更新 |
| `refactor` | 代码重构 |
| `test` | 测试相关 |
| `chore` | 构建/工具变更 |

示例：
```
feat: add /context-update command
fix: correct manifest path in context-init
docs: update quick start guide
```

---

## 开发环境

```bash
# 克隆仓库
git clone https://github.com/injoysai/injoys-agent-sdk.git
cd injoys-agent-sdk

# 本地安装到测试项目
./scripts/install.sh /path/to/test-project
```

---

## 目录结构

| 目录 | 说明 |
|------|------|
| `templates/` | 用于上下文生成、OpenSpec 流程、检查与工具集成的核心指令资产 |
| `templates/templates/` | 会生成到目标项目中的可复用文档模板与 AI 入口文件模板 |
| `templates/commands/` | 安装到受支持编辑器/工具中的 AI 命令定义 |
| `scripts/` | 安装和辅助脚本 |
| `docs/` | 文档 |

---

## 代码风格

- Markdown：遵循 [markdownlint](https://github.com/DavidAnson/markdownlint) 规则
- Shell：遵循 [ShellCheck](https://www.shellcheck.net/)
- 中英文混排时使用空格分隔

---

## 问题反馈

- GitHub Issues：技术问题
- Discussions：功能建议和讨论

感谢你的贡献！🎉
