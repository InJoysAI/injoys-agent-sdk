# Contributing Guide

Thank you for your interest in InJoys Agent SDK! We welcome all forms of contributions.

---

## How to Contribute

### Reporting Issues

1. Search [Issues](https://github.com/injoysai/injoys-agent-sdk/issues) for similar problems
2. If none found, create a new Issue with:
   - Problem description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment info (OS, Node version, AI tool)

### Submitting Code

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit changes: `git commit -m "feat: add your feature"`
4. Push the branch: `git push origin feat/your-feature`
5. Create a **Pull Request**

### Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation update |
| `refactor` | Code refactoring |
| `test` | Test-related |
| `chore` | Build/tooling changes |

Examples:
```
feat: add /context-update command
fix: correct manifest path in context-init
docs: update quick start guide
```

---

## Development Environment

```bash
# Clone the repository
git clone https://github.com/injoysai/injoys-agent-sdk.git
cd injoys-agent-sdk

# Install locally to a test project
./scripts/install.sh /path/to/test-project
```

---

## Directory Structure

| Directory | Description |
|-----------|-------------|
| `templates/` | Context generation templates (core) |
| `templates/commands/` | AI tool command definitions |
| `scripts/` | Installation and helper scripts |
| `docs/` | Documentation |

---

## Code Style

- Markdown: Follow [markdownlint](https://github.com/DavidAnson/markdownlint) rules
- Shell: Follow [ShellCheck](https://www.shellcheck.net/)
- Use spaces between CJK and English text

---

## Feedback

- GitHub Issues: Technical problems
- Discussions: Feature suggestions and discussions

Thank you for contributing! 🎉

