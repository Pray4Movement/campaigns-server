# Security Audit Report

**Date:** 2026-01-08
**Auditor:** Claude Code Security Scanner
**Repository:** Pray4Movement/campaigns-server

---

## Executive Summary

This security audit identified **2 Critical**, **2 High**, and **2 Medium** severity vulnerabilities in the codebase. The most severe issues relate to Insecure Direct Object Reference (IDOR) vulnerabilities in the profile and subscription management endpoints.

---

## Critical Severity Issues

### 1. IDOR: Unauthenticated Profile Read Access

**Location:** `server/api/profile/[id].get.ts`
**Severity:** Critical
**CVSS Score:** 7.5 (High)

**Description:**
The profile GET endpoint does not require any authentication. Any attacker who knows or can guess a `profile_id` (UUID) can read sensitive subscriber information including:
- Full name
- Email address
- Email verification status
- Phone number
- All campaign subscriptions
- Consent preferences

**Vulnerable Code:**
```typescript
// server/api/profile/[id].get.ts:5-23
export default defineEventHandler(async (event) => {
  const profileId = getRouterParam(event, 'id')
  // NO AUTHENTICATION CHECK
  const subscriber = await subscriberService.getSubscriberByProfileId(profileId)
  // Returns sensitive subscriber data...
})
```

**Recommendation:**
Either:
1. Require authentication and verify the logged-in user owns the profile, OR
2. Implement signed URLs with HMAC tokens for profile access from emails

---

### 2. IDOR: Unauthenticated Profile Modification

**Location:** `server/api/profile/[id].put.ts`
**Severity:** Critical
**CVSS Score:** 9.1 (Critical)

**Description:**
The profile PUT endpoint allows modifying subscriber data without authentication. An attacker can:
- Change a victim's email address (account takeover)
- Modify consent preferences
- Update subscription settings
- Change the subscriber's name

**Vulnerable Code:**
```typescript
// server/api/profile/[id].put.ts:7-26
export default defineEventHandler(async (event) => {
  const profileId = getRouterParam(event, 'id')
  const body = await readBody(event)
  // NO AUTHENTICATION CHECK
  const subscriber = await subscriberService.getSubscriberByProfileId(profileId)
  // Allows full profile modification...
})
```

**Recommendation:**
Same as Issue #1 - require authentication or implement signed tokens.

---

## High Severity Issues

### 3. IDOR: Unauthenticated Subscription Management

**Locations:**
- `server/api/campaigns/[slug]/unsubscribe.get.ts`
- `server/api/campaigns/[slug]/resubscribe.post.ts`
- `server/api/campaigns/[slug]/reminder/[id].delete.ts`

**Severity:** High
**CVSS Score:** 6.5 (Medium-High)

**Description:**
These endpoints use `profile_id` from query parameters or request body as the only form of authorization. While the impact is lower (limited to subscription management), attackers can:
- Unsubscribe victims from campaigns (denial of service)
- Resubscribe victims without consent
- Delete specific reminders

**Vulnerable Pattern:**
```typescript
// All three files follow this pattern:
const profileId = query.id as string  // or body.profile_id
// NO AUTHENTICATION - anyone with profile_id can manage subscriptions
```

**Recommendation:**
Implement signed unsubscribe/resubscribe links using HMAC tokens that include the action type, profile_id, and expiration timestamp.

---

### 4. No Rate Limiting

**Locations:** All API endpoints
**Severity:** High
**CVSS Score:** 6.5 (Medium-High)

**Description:**
The application has no rate limiting on any endpoints. This enables:
- **Brute force attacks on profile IDs:** UUID v4 is 122 bits of randomness, but with no rate limiting, attackers can probe millions of IDs
- **Account enumeration:** The signup endpoint's consistent responses prevent enumeration, but other endpoints may leak information
- **Denial of Service:** Unlimited requests can overwhelm the server
- **Email bombing:** Unlimited verification email requests

**Recommendation:**
Implement rate limiting using a library like `h3-ratelimit` or a reverse proxy (Nginx, Cloudflare):
- Login/signup: 5 requests per minute per IP
- Profile access: 30 requests per minute per IP
- Email sending: 3 requests per hour per email

---

## Medium Severity Issues

### 5. XSS Risk in Rich Text Content

**Locations:**
- `app/pages/admin/marketing/emails/[id]/index.vue:155,168`
- `app/pages/admin/marketing/emails/new.vue:101`
- `app/composables/editor/useEditorSetup.ts:164`

**Severity:** Medium
**CVSS Score:** 5.4 (Medium)

**Description:**
The application uses `v-html` directive to render rich text content. While currently limited to admin-created content, this presents risks:
- If an admin account is compromised, malicious scripts could be injected
- The content is rendered in emails sent to subscribers
- Copy-paste from external sources could inject malicious content

**Recommendation:**
1. Implement server-side HTML sanitization using DOMPurify before storing content
2. Sanitize content on render as an additional defense layer
3. Consider Content Security Policy (CSP) headers

---

### 6. SQL Query Pattern Risk

**Location:** `server/api/admin/diagnostics/db-latency.get.ts:53-118`

**Severity:** Medium (currently unexploitable)
**CVSS Score:** 0 (Currently safe, future risk)

**Description:**
The diagnostics endpoint uses `sql.unsafe()` with string interpolation for table names:

```typescript
const testTableName = `_diag_test_${Date.now()}`
await sql.unsafe(`CREATE TABLE ${testTableName} ...`)
```

While currently safe (table name is server-generated), this pattern is risky:
- Developers might copy this pattern with user input
- Future modifications could introduce vulnerabilities

**Recommendation:**
Add explicit comments warning against user input, or refactor to use a fixed table name with row-based isolation.

---

## Low Severity / Informational

### 7. Missing Security Headers

The application should ensure these headers are set (typically via Nuxt config or reverse proxy):
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy: default-src 'self'`
- `Strict-Transport-Security: max-age=31536000`

### 8. Environment Variable Handling

Secrets are properly loaded from environment variables (not hardcoded). However, ensure:
- `.env` files are in `.gitignore`
- Production secrets are different from development
- JWT_SECRET is a strong random value (minimum 256 bits)

---

## Remediation Priority

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 1 | Profile IDOR (GET) | Medium | Critical |
| 2 | Profile IDOR (PUT) | Medium | Critical |
| 3 | Subscription IDOR | Medium | High |
| 4 | Rate Limiting | Medium | High |
| 5 | XSS Sanitization | Low | Medium |
| 6 | SQL Pattern | Low | Low |

---

## Recommended Immediate Actions

1. **Add authentication or signed tokens to profile endpoints** - This is the most critical fix
2. **Implement rate limiting** - Use middleware or reverse proxy
3. **Add HTML sanitization** - Install and configure DOMPurify
4. **Security headers** - Configure via `nuxt.config.ts` or reverse proxy

---

## Files Reviewed

- All files in `server/api/` directory
- Database service files in `server/database/`
- Configuration files (`nuxt.config.ts`)
- Vue components with security implications
- Authentication utilities

---

*This report was generated through automated security scanning and manual code review. It should be used as a starting point for security improvements. Consider a professional penetration test for comprehensive security validation.*
