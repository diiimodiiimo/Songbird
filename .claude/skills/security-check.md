# /security-check

Thoroughly investigate the current feature or codebase for security vulnerabilities, permission gaps, and authentication issues. Act like a red-team penetration tester.

## Focus Areas

### Authentication & Authorization
- Verify all API routes check `auth()` from `@clerk/nextjs/server`
- Ensure user can only access/modify their own data
- Check for missing session validation
- Look for routes that should be protected but aren't

### Data Exposure
- Check for sensitive data in API responses (passwords, tokens, internal IDs)
- Verify database queries don't leak other users' data
- Look for over-fetching (returning more fields than needed)
- Check for base64 images being exposed in bulk queries

### Input Validation
- Check for SQL injection vectors (even with Prisma, be paranoid)
- Look for XSS vulnerabilities in user-generated content
- Verify input sanitization on notes, names, and other user inputs
- Check for missing Zod validation on API inputs

### API Security
- Look for missing rate limiting
- Check for IDOR (Insecure Direct Object Reference) vulnerabilities
- Verify proper HTTP status codes for auth failures (401/403)
- Check for information disclosure in error messages

### Database Security
- Verify `userId` checks on all database operations
- Look for queries that could expose other users' data
- Check for proper use of Prisma's `where` clauses
- Ensure friend-only content is properly protected

## Output Format

Provide findings as:
1. **CRITICAL** - Must fix before deployment
2. **HIGH** - Should fix soon
3. **MEDIUM** - Recommended improvements
4. **LOW** - Nice to have

For each issue, provide:
- Location (file and line)
- Vulnerability description
- Potential exploit scenario
- Recommended fix

