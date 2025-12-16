# injoys-agent-sdk 开发路线图

本文档概述 injoys-agent-sdk 的开发计划。

## 当前版本

### v0.1.0 (2025年12月) ✅

**模板化基础架构**

- [x] 上下文生成框架 (.context/ 结构)
- [x] 多 Agent 支持 (Antigravity, Claude Code, Cursor, Windsurf)
- [x] 项目准则和规则模板
- [x] SSoT 集成模板 (Atlas HCL, TypeSpec)
- [x] Shell 安装脚本
- [x] 初版 Node.js CLI（`init`, `check-env`）
- [x] 双语文档 (中/英)

---

## 计划版本

### v0.2.0 (2026年Q1)

**NPM 包支持**

- [ ] 发布到 npm (`@injoysai/agent-sdk`)
- [ ] 通过 npm 打包并分发 `injoys` CLI
- [ ] CLI 命令: `add`
- [ ] `npx @injoysai/agent-sdk init` 一键支持
- [ ] Node.js 编程接口

### v0.3.0 (2026年Q2)

**交互式 CLI 向导**

- [ ] 交互式 `init` 项目类型选择
- [ ] 自动检测现有 AI 工具 (Cursor/Claude/Windsurf)
- [ ] 上下文文件选择向导
- [ ] Hash 计算和 Manifest 生成

### v0.4.0 (2026年Q3)

**上下文管理**

- [ ] `injoys context add` - 添加源文档
- [ ] `injoys context sync` - 同步源文档变更
- [ ] `injoys context validate` - 验证 Manifest 完整性
- [ ] Watch 模式自动同步

### v1.0.0 (2026年Q4)

**完整 SSoT 集成**

- [ ] 内置 Atlas HCL 代码生成
- [ ] 内置 TypeSpec 编译
- [ ] OpenSpec 提案工作流自动化
- [ ] GitHub Actions 集成
- [ ] VS Code / Cursor 插件

---

## 未来规划 (Backlog)

- InJoys Agent SDK MCP Server (AI Agent 可直接查询上下文)
- Web UI 上下文管理界面
- 团队协作功能
- 上下文版本控制和差异可视化
- 更多 AI 编码工具集成

---

## 贡献指南

我们欢迎贡献！参见 [CONTRIBUTING.md](CONTRIBUTING_zh.md)。

### 优先领域

1. **CLI 改进** - 更好的用户体验
2. **文档完善** - 更多示例和教程
3. **模板扩展** - 支持更多技术栈
4. **工具集成** - 更多 AI 工具支持

---

## 反馈

有想法或功能建议？
- 创建 [Issue](https://github.com/injoysai/injoys-agent-sdk/issues)
- 发起 [Discussion](https://github.com/injoysai/injoys-agent-sdk/discussions)
