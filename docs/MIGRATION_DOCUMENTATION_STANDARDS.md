# Migration Documentation Standards

This document establishes standards for migration documentation to prevent confusion and ensure safe database operations.

## Documentation Template

All migration documentation must follow this template:

```markdown
# [Migration Name] - [Date]

## Status: [IN_PROGRESS | COMPLETED | DEPRECATED]
## Last Updated: [YYYY-MM-DD]
## Safe to Follow: [YES | NO | WITH_CAUTION]

[If completed or deprecated, include warning:]
⚠️ **WARNING**: This migration has been [completed/deprecated]. Do not run these commands again as they may cause database conflicts.

## Overview
[Brief description of what this migration does]

## Prerequisites
[What needs to be in place before running]

## Steps
[Detailed migration steps]

## Verification
[How to verify the migration worked]

## Rollback (if applicable)
[How to rollback if something goes wrong]
```

## File Naming Convention

### Active Migrations
- `migration-[name]-[date].md` - For migrations in progress
- Example: `migration-user-roles-2025-01-15.md`

### Completed Migrations
- Archive in `/docs/archive/`
- `[name]-migration-completed-[date].md`
- Example: `user-roles-migration-completed-2025-01-15.md`

### SQL Migration Files
- Must be in appropriate Supabase migrations directory
- `/apps/[app]/supabase/migrations/[timestamp]-[description].sql`
- Never place loose SQL files in root directory

## Migration Lifecycle Process

### 1. Planning Phase
- Create migration document using template
- Status: `IN_PROGRESS`
- Safe to Follow: `WITH_CAUTION`

### 2. Implementation Phase
- Update document as migration progresses
- Test thoroughly in development
- Document any issues encountered

### 3. Completion Phase
- Update Status to `COMPLETED`
- Safe to Follow to `NO`
- Add completion warning
- Move to archive directory

### 4. Maintenance Phase
- Review archived migrations quarterly
- Remove obsolete documentation
- Update references in CLAUDE.md

## Safety Guidelines

### ❌ Never Do This
- Place SQL files directly in root directory
- Leave migration docs without clear status
- Include executable SQL in documentation without safeguards
- Reference non-existent migration files
- Leave rollback procedures for completed migrations

### ✅ Always Do This
- Use proper Supabase migration workflow
- Include clear status headers
- Test migrations in development first
- Document prerequisites and verification steps
- Archive completed migrations with warnings

## Documentation Review Checklist

Before publishing migration documentation:

- [ ] Uses standard template format
- [ ] Has clear status and safety indicators
- [ ] References only existing files and procedures
- [ ] Includes proper verification steps
- [ ] Has been tested in development environment
- [ ] Rollback procedure documented (if applicable)
- [ ] File naming follows convention

## Integration with CLAUDE.md

All active migrations should be referenced in the main CLAUDE.md file with:
- Current status
- Link to documentation
- Any special considerations for AI assistants

Completed migrations should be removed from CLAUDE.md to prevent confusion.

## Examples

### Good Documentation
```markdown
# User Roles Migration - 2025-01-15

## Status: IN_PROGRESS
## Last Updated: 2025-01-15
## Safe to Follow: WITH_CAUTION

⚠️ **Test in development first** - This migration affects user authentication

## Overview
Adds role-based access control to user_buyers table...
```

### Bad Documentation
```markdown
# Some Migration

Run this SQL:
```sql
DROP TABLE users; -- DON'T DO THIS
```

Migration done!
```

Follow these standards to maintain clean, safe migration documentation that helps rather than hinders future development.