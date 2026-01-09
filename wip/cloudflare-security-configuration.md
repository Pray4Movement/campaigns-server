# Cloudflare Security Configuration for Prayer Tools

## Overview

This document outlines the recommended Cloudflare configuration for protecting Prayer Tools at scale (1M+ daily users).

**Recommended Tier:** Cloudflare Pro ($20/mo) - provides 20 rate limiting rules, 5 WAF rulesets, Super Bot Fight Mode.

---

## Rate Limiting Rules

Configure in **Security > WAF > Rate limiting rules**:

### Rule 1: Signup Endpoint (Critical)
- **Name:** Protect Signup Endpoint
- **When:** URI Path contains `/api/campaigns/` AND URI Path contains `/signup`
- **Method:** POST
- **Rate:** 5 requests per 10 minutes
- **Action:** Block (429)
- **Counting:** By IP address

### Rule 2: Prayer Activity - Prayed
- **Name:** Protect Prayer Tracking
- **When:** URI Path contains `/prayed`
- **Method:** POST
- **Rate:** 60 requests per minute
- **Action:** Block (429)
- **Counting:** By IP address

### Rule 3: Prayer Activity - Sessions
- **Name:** Protect Prayer Sessions
- **When:** URI Path contains `/prayer-session`
- **Method:** POST
- **Rate:** 60 requests per minute
- **Action:** Block (429)
- **Counting:** By IP address

### Rule 4: Profile Updates
- **Name:** Protect Profile Updates
- **When:** URI Path matches `/api/profile/*`
- **Method:** PUT
- **Rate:** 10 requests per minute
- **Action:** Block (429)
- **Counting:** By IP address

### Rule 5: Invitation Token Validation
- **Name:** Protect Invitation Tokens
- **When:** URI Path matches `/api/auth/invitation/*`
- **Rate:** 10 requests per minute
- **Action:** Block (429)
- **Counting:** By IP address

### Rule 6: Unsubscribe Actions
- **Name:** Protect Subscription Actions
- **When:** URI Path contains `/unsubscribe` OR URI Path contains `/resubscribe`
- **Rate:** 20 requests per minute
- **Action:** Block (429)
- **Counting:** By IP address

**Note:** Image upload (`/api/upload/image`) is intentionally excluded - it requires authentication and admins may need to bulk upload library images (365+ files).

---

## WAF Custom Rules

Configure in **Security > WAF > Custom rules**:

### Rule 1: Block Requests Without User Agent
- **Expression:** `not http.user_agent contains " "`
- **Action:** Block

### Rule 2: Challenge Suspicious Bots
- **Expression:** `(cf.client.bot) and not cf.bot_management.verified_bot`
- **Action:** Managed Challenge

### Rule 3: Protect Admin Endpoints (Optional)
- **Expression:** `http.request.uri.path contains "/api/admin/" and not ip.geoip.country in {"US"}`
- **Action:** Block
- **Note:** Adjust country list based on where your admins are located

---

## Security Headers

Configure in **Rules > Transform Rules > Modify Response Header**:

Add these headers to all responses:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

---

## Bot Protection

Navigate to **Security > Bots**:

- Enable **Super Bot Fight Mode** (Pro tier)
- Or **Bot Fight Mode** (Free tier)

---

## DDoS Protection

Navigate to **Security > DDoS**:

1. **HTTP DDoS attack protection:** Set sensitivity to "High"
2. **Network-layer DDoS attack protection:** Enable

---

## Page Rules (Optional)

Configure in **Rules > Page Rules**:

### Bypass Cache for API
- **URL:** `*yourdomain.com/api/*`
- **Settings:**
  - Cache Level: Bypass
  - Security Level: High

### Cache Static Assets
- **URL:** `*yourdomain.com/uploads/*`
- **Settings:**
  - Cache Level: Cache Everything
  - Browser Cache TTL: 1 month
  - Edge Cache TTL: 1 month

---

## Verification

After configuration:

1. **Test rate limits:** Make rapid requests to protected endpoints, verify 429 responses
2. **Check dashboard:** Security > Events should show blocked requests
3. **Test bot protection:** `curl` without user-agent should be blocked
4. **Monitor:** Set up Cloudflare notifications for DDoS attacks and high blocked request rates

---

## Free Tier Alternative

If using Cloudflare Free (1 rate limiting rule only):

Prioritize **Rule 1 (Signup)** as your single rule - this is the highest risk endpoint for email bombing and database spam.
