# Todo-Driven Development Workflow

This directory contains task definitions for implementing the Minecraft Enchant Guide.

## Directory Structure

```
todos/
├── README.md           # This file - workflow instructions
├── OVERVIEW.md         # Compact status tracker (keep concise!)
├── 001_project_setup.md
├── 002_test_scaffolding.md
├── 003_core_types.md
└── ...
```

## Work Session Flow

### 1. Start of Session

User provides prompt like:
```
Work on task 003
```

### 2. Agent Actions (Start)

1. Read `todos/003_*.md` for task details
2. Read `OVERVIEW.md` for context
3. Read `specification.md` if needed
4. Update `OVERVIEW.md` status to `IN_PROGRESS`
5. Begin implementation

### 3. During Work

- Follow task's acceptance criteria
- Reference `docs/REFERENCES.md` for data accuracy
- Run tests as appropriate
- Commit logical chunks

### 4. End of Session

1. Update `OVERVIEW.md`:
   - Mark task `DONE` or note blockers
   - Add any discovered issues
2. If task is done AND no next task exists:
   - Draft next todo based on spec + current state
   - **Ask user for feedback** before finalizing
3. Summarize what was done

## Task File Format

```markdown
# Task NNN: Title

## Status
PENDING | IN_PROGRESS | BLOCKED | DONE

## Description
What this task accomplishes.

## Dependencies
- Task XXX (must be done first)

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Files to Create/Modify
- `path/to/file.ts`

## Notes
Any implementation notes or gotchas.

## Blockers (if any)
- Description of blocker
```

## Status Values

| Status | Meaning |
|--------|---------|
| `PENDING` | Not started, dependencies may not be met |
| `IN_PROGRESS` | Currently being worked on |
| `BLOCKED` | Cannot proceed, blocker noted |
| `DONE` | Completed, acceptance criteria met |

## Principles

1. **User direction > auto-generation** - Ask before creating future tasks
2. **Keep OVERVIEW.md compact** - It's a quick-glance document
3. **Spec is source of truth** - Reference `specification.md` for requirements
4. **Verify data** - Use `docs/REFERENCES.md` for enchantment accuracy
5. **Test as you go** - Don't leave tests for later
6. **Small commits** - Logical, atomic changes

## Task Ordering

Tasks are numbered but not strictly linear. Dependencies are explicit in each task file. Work on whatever is unblocked and prioritized by user.
