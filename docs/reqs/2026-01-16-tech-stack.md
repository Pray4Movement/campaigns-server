# Tech Stack & Infrastructure Plan

**Last Updated:** January 16, 2026

## Overview

Prayer Tools is deployed on DigitalOcean with Managed PostgreSQL, using Cloudflare for edge caching and AWS SES for email delivery. This architecture is designed to scale from launch to 500k+ subscribers with minimal infrastructure changes.

---

## Infrastructure

### Hosting: DigitalOcean

| Component | Service | Cost Estimate |
|-----------|---------|---------------|
| Application | App Platform (Nuxt 4.1) | $12-50/mo |
| Database | Managed PostgreSQL | $15-60/mo |

**Why DigitalOcean:**
- 4-12x faster write performance than Railway (measured)
- Predictable fixed-tier pricing
- Built-in High Availability option for database
- Premium AMD with NVMe storage
- Git push to deploy via App Platform
- ~1ms read latency, ~2-3ms write latency (same region)

**Why Not Railway:**
- Measured 10-20ms write latency vs DO's 2-3ms
- Likely due to network-attached storage and stricter WAL settings
- Write-heavy workload (prayer tracking, reminders) benefits from faster writes

**Deployment:**
- Region: NYC or SFO (good latency to Americas)
- App and database in same region for minimal latency

### CDN: Cloudflare

| What's Cached | TTL |
|---------------|-----|
| Prayer fuel pages | 1 hour |
| Campaign landing pages | 1 hour |
| People group API responses | 1 hour |
| Static assets (JS, CSS, images) | 1 week |

**Why Cloudflare:**
- Global edge caching (reduces origin traffic ~80%)
- Free tier sufficient for most usage
- DDoS protection included
- Handles global user distribution without multi-region deployment

**Not Cached:**
- Write operations (signup, "I prayed" tracking)
- Admin pages
- Authenticated API endpoints

### Email: AWS SES

| Volume | Cost |
|--------|------|
| 100k emails/month | ~$10 |
| 500k emails/month | ~$50 |
| 1M emails/month | ~$100 |

**Why SES:**
- Cheapest at scale ($0.10 per 1,000 emails)
- Bulk templated email API (50 recipients per call)
- High deliverability
- No monthly minimums

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Cloudflare                         │
│              (CDN, caching, DDoS protection)            │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ Cache MISS only
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    DigitalOcean                         │
│                                                         │
│  ┌─────────────────┐         ┌─────────────────┐       │
│  │   Nuxt App      │────────▶│   PostgreSQL    │       │
│  │   (App Platform)│  1-3ms  │   (Managed)     │       │
│  │                 │         │                 │       │
│  │  - API routes   │         │  - Subscribers  │       │
│  │  - SSR pages    │         │  - Campaigns    │       │
│  │  - Schedulers   │         │  - Content      │       │
│  └────────┬────────┘         └─────────────────┘       │
│           │                                             │
└───────────┼─────────────────────────────────────────────┘
            │
            │ Bulk templated emails
            ▼
      ┌──────────┐
      │  AWS SES │
      └──────────┘
```

---

## Database Latency Comparison

Measured January 2026 (same-region app + database):

| Metric | DigitalOcean | Railway |
|--------|--------------|---------|
| Simple SELECT avg | 1.16ms | 1.42ms |
| Single INSERT | 2.05ms | 9.71ms |
| Single UPDATE | 1.91ms | 8.49ms |
| Sequential INSERTs avg | 1.71ms | 19.37ms |
| SELECT+UPDATE pattern | 5.56ms | 15.97ms |
| Bulk INSERT (100 rows) | 2.46ms | 29.27ms |

**Key finding:** DigitalOcean writes are 4-12x faster. For a prayer app with frequent "I Prayed" tracking and reminder scheduling, this matters.

### DigitalOcean PostgreSQL Tiers

| RAM | Connections | Price (single) | Price (HA) |
|-----|-------------|----------------|------------|
| 1 GB | 22 | $15/mo | - |
| 2 GB | 47 | ~$30/mo | $60/mo |
| 4 GB | 97 | ~$60/mo | $120/mo |
| 8 GB | 197 | ~$120/mo | $240/mo |

### Connection Limits by Scale

| Subscribers | App Instances | DB Tier Needed | Connections |
|-------------|---------------|----------------|-------------|
| 10k | 1 | 1GB ($15) | 22 |
| 100k | 2 | 2GB ($30) | 47 |
| 500k | 3 | 4GB HA ($120) | 97 |

---

## Email Reminder System

### Current Approach (< 100k subscribers)

```
Every 5 minutes:
├── Query due reminders (indexed query)
├── Group by campaign (same content)
└── For each campaign:
    ├── Fetch prayer content (once)
    ├── Chunk subscribers into batches of 50
    ├── SendBulkTemplatedEmail per chunk
    └── Batch update next_reminder_utc
```

### Why No Redis Queue (Yet)

| Approach | Emails/second | When Needed |
|----------|---------------|-------------|
| Individual sends | ~5/sec | Current |
| Bulk API (50/call) | ~250/sec | Recommended |
| Bulk + parallel | ~1000/sec | 100k+ subscribers |
| Redis + workers | ~5000/sec | 500k+ subscribers |

The SES bulk templated API eliminates the need for Redis queues until much higher scale.

---

## Bulk Database Operations

Sequential queries compound latency. Always use bulk operations for batch processing:

| Pattern | Time for 2000 rows (DO) | Time for 2000 rows (Railway) |
|---------|-------------------------|------------------------------|
| Sequential SELECT+UPDATE | ~11 seconds | ~33 seconds |
| Bulk UPSERT (batches of 100) | < 1 second | < 1 second |

Use `INSERT ... ON CONFLICT DO UPDATE` (upsert) for sync operations instead of check-then-insert/update patterns.

---

## Cost Projections

| Subscribers | DO App | DO Database | SES | Cloudflare | Total |
|-------------|--------|-------------|-----|------------|-------|
| 10k | $12/mo | $18/mo | $3/mo | Free | **~$33/mo** |
| 100k | $50/mo | $30/mo | $30/mo | Free | **~$110/mo** |
| 500k | $117/mo | $120/mo (HA) | $150/mo | Free | **~$387/mo** |
| 1M | $312/mo | $240/mo (HA) | $300/mo | Free | **~$852/mo** |

### Comparison with Railway

| Subscribers | DigitalOcean | Railway | Notes |
|-------------|--------------|---------|-------|
| 10k | $33/mo | $35/mo | Similar cost |
| 100k | $110/mo | $109/mo | Similar cost |
| 500k | $387/mo | $327/mo | Railway cheaper, but no HA |
| 1M | $852/mo | $735/mo | Railway cheaper, but 4-12x slower writes |

**Decision:** DigitalOcean's faster writes justify the cost premium at scale. Write latency compounds with concurrent users.

---

## Scaling Roadmap

### Phase 1: Launch (0-50k subscribers)
- DigitalOcean App Platform (1 instance, shared CPU)
- DO Managed PostgreSQL (1GB, single node)
- Cloudflare caching
- SES with bulk templated emails
- Single scheduler process

### Phase 2: Growth (50k-100k subscribers)
- Scale App Platform to 2 instances
- Upgrade database to 2GB for more connections
- Add `Promise.all` for parallel batch sends
- Monitor database connection usage

### Phase 3: Scale (100k-500k subscribers)
- Dedicated CPU instances on App Platform
- Upgrade to HA database (4GB with standby)
- Separate worker service for reminders if needed
- Consider Redis for job queue

### Phase 4: Large Scale (500k+ subscribers)
- Multiple dedicated instances
- 8GB+ HA database
- Redis + BullMQ for job queue
- Database read replicas
- Evaluate dedicated server if cost becomes critical

---

## What We're NOT Using (And Why)

| Technology | Why Not |
|------------|---------|
| Railway | 4-12x slower writes; optimized for safety over speed |
| Neon | Cross-network latency + cold starts |
| Vercel | Serverless cold starts + database latency issues |
| Redis (for now) | Cloudflare handles caching; bulk email API handles queue |
| Kubernetes | Overkill for current scale |
| Multi-region | Cloudflare CDN handles global distribution |
| Individual email sends | Bulk API is 50x more efficient |
| Sequential DB queries | Bulk upsert is 50-100x faster for batch operations |

---

## Global User Distribution

Users are distributed worldwide, which actually helps:
- No single massive traffic spike (rolling prayer times across timezones)
- Cloudflare serves cached content from nearest edge
- Write latency (signup, "I prayed") benefits from DO's fast writes
- Single-region deployment is sufficient

---

## Migration from Railway

If migrating from Railway:

```bash
# Export from Railway
pg_dump "$RAILWAY_DATABASE_URL" \
  --format=custom --no-owner --no-acl \
  -f backup.dump

# Import to DigitalOcean
pg_restore "$DO_DATABASE_URL?sslmode=require" \
  --no-owner --no-acl -d defaultdb backup.dump
```

Then update `DATABASE_URL` environment variable in the app.

---

## Summary

This architecture prioritizes:
1. **Performance** - Fast writes (2-3ms), edge caching, bulk APIs
2. **Simplicity** - Managed services, minimal ops burden
3. **Reliability** - HA database option, automatic backups
4. **Scalability** - Clear upgrade path from $33/mo to enterprise scale

The system is designed to reach 500k subscribers before requiring significant architectural changes.
