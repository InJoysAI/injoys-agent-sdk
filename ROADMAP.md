# InJoys Agent SDK Roadmap

This document outlines the development roadmap for InJoys Agent SDK.

## Current Release

### v0.1.0 (December 2025) 

**Template-Based Foundation**

- [x] Context generation framework (.context/ structure)
- [x] Multi-agent support (Antigravity, Claude Code, Cursor, Windsurf)
- [x] Project Criterion and rule templates
- [x] SSoT integration templates (Atlas HCL, TypeSpec)
- [x] Shell-based installation script
- [x] Initial Node.js CLI (`init`, `check-env`)
- [x] Bilingual documentation (EN/ZH)

---

## Planned Releases

### v0.2.0 (Q1 2026)

**NPM Package Support**

- [ ] Publish to npm as `@injoysai/agent-sdk`
- [ ] Package and distribute `injoys` CLI via npm
- [ ] CLI command: `add`
- [ ] `npx @injoysai/agent-sdk init` one-liner support
- [ ] Programmatic API for Node.js integration

### v0.3.0 (Q2 2026)

**Interactive CLI Wizard**

- [ ] Interactive `init` with prompts for project type
- [ ] Auto-detect existing AI tool (Cursor/Claude/Windsurf)
- [ ] Context file selection wizard
- [ ] Hash calculation and manifest generation

### v0.4.0 (Q3 2026)

**Context Management**

- [ ] `injoys context add` - Add source documents
- [ ] `injoys context sync` - Sync with source changes
- [ ] `injoys context validate` - Validate manifest integrity
- [ ] Watch mode for auto-sync

### v1.0.0 (Q4 2026)

**Full SSoT Integration**

- [ ] Built-in Atlas HCL code generation
- [ ] Built-in TypeSpec compilation
- [ ] OpenSpec proposal workflow automation
- [ ] GitHub Actions integration
- [ ] VS Code / Cursor extension

---

## Future Ideas (Backlog)

- MCP Server for InJoys Agent SDK (AI agent can query context directly)
- Web UI for context management
- Team collaboration features
- Context versioning and diff visualization
- Integration with more AI coding tools

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Priority Areas

1. **CLI improvements** - Better user experience
2. **Documentation** - More examples and tutorials
3. **Templates** - Support for more tech stacks
4. **Integrations** - More AI tool support

---

## Feedback

Have ideas or feature requests? 
- Open an [issue](https://github.com/injoysai/injoys-agent-sdk/issues)
- Start a [discussion](https://github.com/injoysai/injoys-agent-sdk/discussions)
