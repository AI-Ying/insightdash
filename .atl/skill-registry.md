# Skill Registry — InsightDash

Generated: 2026-03-28

## SDD Workflow Skills

| Skill | Trigger | Location |
|-------|---------|----------|
| sdd-init | "sdd init", "openspec init" | ~/.agents/skills/sdd-init |
| sdd-explore | Orchestrator launches explore phase | ~/.agents/skills/sdd-explore |
| sdd-propose | Orchestrator launches propose phase | ~/.agents/skills/sdd-propose |
| sdd-spec | Orchestrator launches spec phase | ~/.agents/skills/sdd-spec |
| sdd-design | Orchestrator launches design phase | ~/.agents/skills/sdd-design |
| sdd-tasks | Orchestrator launches tasks phase | ~/.agents/skills/sdd-tasks |
| sdd-apply | Orchestrator launches apply phase | ~/.agents/skills/sdd-apply |
| sdd-verify | Orchestrator launches verify phase | ~/.agents/skills/sdd-verify |
| sdd-archive | Orchestrator launches archive phase | ~/.agents/skills/sdd-archive |

## Development Skills

| Skill | Trigger | Location |
|-------|---------|----------|
| branch-pr | Creating a PR, opening a PR | ~/.agents/skills/branch-pr |
| issue-creation | Creating a GitHub issue | ~/.agents/skills/issue-creation |
| judgment-day | "judgment day", "dual review" | ~/.agents/skills/judgment-day |
| skill-creator | "create a new skill" | ~/.agents/skills/skill-creator |
| skill-registry | "update skills", "skill registry" | ~/.agents/skills/skill-registry |

## Project Conventions

- No CLAUDE.md, agents.md, .cursorrules, or GEMINI.md found
- ESLint: eslint-config-next
- TypeScript: strict mode enabled
- Path aliases: @/* -> ./src/*
- Git repository: https://github.com/AI-Ying/insightdash.git
