# Missing Tools Request Log

This document tracks tools/packages that were needed during development but are not available in the Flox environment. Submit these to an admin for review and potential addition to the environment.

## How to Request a Tool

1. Add an entry to the table below with:
   - Tool name and version (if specific)
   - Why it's needed
   - Date requested
   - Your name/identifier
2. Notify the admin responsible for the Flox environment
3. Admin will update status once reviewed

## Request Format

```markdown
| Tool | Version | Purpose | Requested | By | Status |
|------|---------|---------|-----------|-----|--------|
| example-cli | latest | Needed for X feature | 2026-01-04 | @dev | PENDING |
```

## Pending Requests

| Tool | Version | Purpose | Requested | By | Status |
|------|---------|---------|-----------|-----|--------|
| *none* | - | - | - | - | - |

## Approved & Installed

| Tool | Version | Purpose | Installed | Notes |
|------|---------|---------|-----------|-------|
| bun | 1.3.5 | JS runtime & package manager | 2026-01-04 | Initial setup |
| nodejs_24 | 24.x | Node.js runtime (Astro compat) | 2026-01-04 | Initial setup |
| git | latest | Version control | 2026-01-04 | Initial setup |
| jq | latest | JSON processing | 2026-01-04 | Initial setup |

## Rejected Requests

| Tool | Reason | Date |
|------|--------|------|
| *none* | - | - |

---

## Admin Notes

To add a tool to the Flox environment:

```bash
# Search for available packages
flox search <tool-name>

# Show available versions
flox show <tool-name>

# Install (within activated environment)
flox install <tool-name>@<version>
```

The Flox manifest is located at `.flox/env/manifest.toml`.
