# Claude Code Skills for SongBird

This folder contains custom Claude Code skills tailored for the SongBird project. These are reusable prompts that help Claude act as a specialized expert for specific tasks.

## How to Use

In Claude Code, reference a skill by typing its name as a command:

```
/security-check
/ui-review
/api-review
```

Then provide context about what you want reviewed (a file, feature, or area of the codebase).

---

## Available Skills

### 🔒 Security & Quality

| Skill | Description |
|-------|-------------|
| `/security-check` | Red-team pen-testing for auth, data exposure, injection, IDOR |
| `/code-review` | Thorough code review with blocking/non-blocking/nit comments |
| `/accessibility-check` | WCAG 2.1 AA compliance review |

### 🎨 Frontend

| Skill | Description |
|-------|-------------|
| `/ui-review` | Design system compliance, UX patterns, visual polish |
| `/component-review` | React component best practices and patterns |

### ⚙️ Backend

| Skill | Description |
|-------|-------------|
| `/api-review` | API route correctness, security, performance |
| `/database-check` | Prisma schema, queries, and data operations |
| `/prisma-help` | Quick reference for Prisma ORM patterns |

### 🚀 Performance & Deployment

| Skill | Description |
|-------|-------------|
| `/performance-audit` | React, database, and serverless performance |
| `/deploy-check` | Pre-deployment checklist for Vercel |

### 🛠️ Development

| Skill | Description |
|-------|-------------|
| `/feature-plan` | Plan and scope new features with MVP thinking |
| `/debug-issue` | Systematic bug investigation process |
| `/refactor` | Clean up code without changing behavior |
| `/test-scenarios` | Generate comprehensive test cases |

---

## Skill Details

### `/security-check`
Acts as a red-team penetration tester. Checks for:
- Authentication bypass
- Authorization failures (IDOR)
- Data exposure
- Input validation gaps
- SQL injection / XSS vectors

### `/ui-review`
Acts as a senior product designer. Checks for:
- Design system compliance (colors, typography, spacing)
- Loading/empty/error state patterns
- Responsive design
- Accessibility basics

### `/api-review`
Acts as a senior backend engineer. Checks for:
- Auth validation
- Input validation
- Error handling
- Database query efficiency
- Response format consistency

### `/performance-audit`
Acts as a performance engineer. Checks for:
- React rendering issues
- Database N+1 queries
- Bundle size
- Serverless cold starts

### `/database-check`
Acts as a DBA. Checks for:
- Schema design
- Index usage
- Query efficiency
- Connection pooling

### `/accessibility-check`
Acts as an a11y specialist. Checks for:
- Keyboard navigation
- Screen reader support
- Color contrast
- Motion preferences

### `/component-review`
Acts as a senior React developer. Checks for:
- Hook patterns
- State management
- TypeScript usage
- SongBird loading state pattern

### `/deploy-check`
Acts as a DevOps engineer. Provides:
- Environment variable checklist
- Build verification commands
- Database readiness checks
- Post-deploy verification

### `/feature-plan`
Acts as a product engineer. Helps with:
- MVP scoping
- Technical assessment
- Development phases
- Risk identification

### `/debug-issue`
Acts as a senior debugger. Provides:
- Systematic investigation process
- Common SongBird issue patterns
- Evidence gathering techniques
- Fix verification

### `/refactor`
Acts as a senior engineer. Helps with:
- Extract function/constant
- Simplify conditionals
- Remove duplication
- SongBird-specific patterns

### `/test-scenarios`
Acts as a QA engineer. Generates:
- Happy path tests
- Error handling tests
- Edge cases
- SongBird-specific scenarios

### `/code-review`
Acts as a thoughtful reviewer. Provides:
- Correctness checks
- Security review
- Maintainability assessment
- Praise for good work

### `/prisma-help`
Quick Prisma reference. Includes:
- Schema patterns
- Query examples
- Common issues and solutions
- Commands

---

## Adding New Skills

To add a new skill:

1. Create a new file in `.claude/skills/` named `your-skill.md`
2. Use this format:

```markdown
# /your-skill

One-line description of what this skill does.

## Focus Areas
- Area 1
- Area 2

## How to Use
Instructions...

## Output Format
What the output should look like...
```

3. Add it to this README

---

## SongBird-Specific Context

All skills are tailored for SongBird's stack:
- **Next.js 14+** with App Router
- **TypeScript** with strict typing
- **Prisma** ORM with PostgreSQL
- **Clerk** authentication
- **Tailwind CSS** with custom design system
- **Vercel** deployment

They reference SongBird patterns like:
- Loading state before empty state
- Design system colors (`bg-bg`, `text-text`, `bg-surface`, `text-accent`)
- API route structure with `auth()` checks
- Prisma singleton pattern

---

*Last updated: January 2026*

