# Claude Code Instructions

This file provides instructions for working on the Minecraft Enchant Guide project.

## Project Overview

A static web application for Minecraft players who craft enchanted items at scale. Provides a catalog of pre-defined enchantment "recipes" with optimized anvil combination orders, displayed as interactive visual trees.

**Tech Stack**: Flox + Bun + Astro + Solid.js + TypeScript + Vitest

## Key Files

| File | Purpose |
|------|---------|
| `specification.md` | **Source of truth** for all requirements |
| `docs/REFERENCES.md` | Authoritative sources for Minecraft data |
| `docs/missing_tools.md` | Request log for tools to add to Flox |
| `todos/OVERVIEW.md` | Current task status (keep compact!) |
| `todos/README.md` | Workflow instructions |
| `todos/NNN_*.md` | Individual task definitions |
| `.flox/env/manifest.toml` | Flox environment configuration |

## Development Environment

This project uses **Flox** for reproducible development environments with **Bun** as the JavaScript runtime.

### Activating the Environment

```bash
flox activate                    # Enter environment (auto-installs deps if needed)
flox activate --start-services   # Enter and start dev server
```

### If a Tool is Missing

If you need a tool that isn't in the Flox environment:

1. **Document it**: Add an entry to `docs/missing_tools.md`
2. **Notify admin**: The entry serves as the request
3. **Workaround**: Note any temporary workarounds in the request

**Do NOT attempt to install tools outside of Flox.** All tooling must go through the managed environment.

## Work Session Protocol

### Starting a Task

When user says "Work on task NNN":

1. **Ensure Flox is active**: Run `flox activate` if not already in environment
2. **Read the task file**: `todos/NNN_*.md`
3. **Check dependencies**: Ensure prerequisite tasks are DONE
4. **Read OVERVIEW.md**: Understand current project state
5. **Update OVERVIEW.md**: Set task status to `IN_PROGRESS`
6. **Reference spec**: Check `specification.md` for detailed requirements
7. **Begin work**

### During Work

- Follow acceptance criteria in the task file
- Write tests alongside implementation (not after)
- Verify data against `docs/REFERENCES.md`
- Make atomic commits with clear messages
- Run tests frequently: `bun run test:run`

### Ending a Task

1. **Verify acceptance criteria**: All checkboxes should be completable
2. **Run full test suite**: `bun run test:run`
3. **Update OVERVIEW.md**:
   - Mark task `DONE` or note `BLOCKED` with reason
   - Update "Current Focus" and "Recent Updates"
4. **If task is DONE and no next task exists**:
   - Propose next task based on spec + project state
   - **Ask user for approval** before creating the file
5. **Summarize**: Tell user what was done, any issues, what's next

## Task File Format

```markdown
# Task NNN: Title

## Status
PENDING | IN_PROGRESS | BLOCKED | DONE

## Description
What and why.

## Dependencies
- Task XXX

## Acceptance Criteria
- [ ] Checkable items

## Files to Create/Modify
- paths

## Reference
- Spec sections
- Doc references

## Notes
Implementation details.
```

## OVERVIEW.md Format

Keep this **compact**. It's for quick status checks.

```markdown
# Todo Overview

## Status
| # | Task | Status | Blockers |
|---|------|--------|----------|
| 001 | Name | DONE | - |

## Current Focus
What's being worked on.

## Recent Updates
- Bullet points

## Known Issues
- If any

## Next Task Candidates
Brief list, await user direction.
```

## Specification Usage

The `specification.md` file contains:

- Architecture decisions
- Data models (TypeScript types)
- UI/UX mockups (ASCII)
- Content collection schemas
- Rules engine design
- Testing strategy
- Deployment config

**Always reference the spec** when implementing. Don't guess.

## Data Accuracy

Minecraft enchantment data MUST be verified. Use `docs/REFERENCES.md`:

- XP formulas with reference values
- Enchantment multiplier table
- Conflict rules
- Version-specific changes

**Never hallucinate enchantment stats.** If unsure, check the wiki links in REFERENCES.md.

## Testing Requirements

| Area | Coverage Target |
|------|-----------------|
| Engine (optimizer) | 90%+ |
| Rules engine | 85%+ |
| XP calculations | 90%+ |
| Stores | 80%+ |
| Components | Smoke tests |

Run tests before marking a task DONE:
```bash
bun run test:run
bun run test:coverage
```

## Code Style

- TypeScript strict mode
- Explicit return types on functions
- Use types from `src/types/index.ts`
- Follow existing patterns in codebase
- No `any` types without justification

## Commits

- Atomic, logical changes
- Clear messages: `feat:`, `fix:`, `test:`, `docs:`
- Don't bundle unrelated changes

## Asking for User Input

Prefer asking the user over making autonomous decisions for:

- Creating new tasks beyond immediate next step
- Architectural changes not in spec
- Prioritization of multiple options
- Any significant deviation from spec

## Common Commands

```bash
# Environment
flox activate            # Enter dev environment
flox services start      # Start dev server as service
flox services stop       # Stop services

# Development
bun run dev              # Start dev server
bun run build            # Production build
bun run preview          # Preview production build

# Testing
bun run test             # Watch mode
bun run test:run         # Single run
bun run test:coverage    # With coverage

# Dependencies
bun install              # Install deps
bun add <pkg>            # Add dependency
bun add -d <pkg>         # Add dev dependency
```

## Directory Structure Reference

```
/
├── .flox/
│   └── env/
│       └── manifest.toml  # Flox environment config
├── CLAUDE.md              # This file
├── specification.md       # Requirements
├── docs/
│   ├── REFERENCES.md      # Minecraft data sources
│   └── missing_tools.md   # Tool request log
├── todos/
│   ├── README.md          # Workflow
│   ├── OVERVIEW.md        # Status tracker
│   └── NNN_*.md           # Task files
├── src/
│   ├── content/           # Astro content collections
│   ├── components/        # Astro + Solid components
│   ├── data/rules/        # Patch system
│   ├── engine/            # Core logic
│   ├── stores/            # Solid.js state
│   ├── types/             # TypeScript types
│   └── pages/             # Astro pages
└── tests/                 # Vitest tests
```
