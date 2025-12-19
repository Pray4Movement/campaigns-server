# Tech Stack & Infrastructure Plan

**Last Updated:** December 19, 2025

## Overview

Prayer Tools is deployed on Railway with PostgreSQL, using Cloudflare for edge caching and AWS SES for email delivery. This architecture is designed to scale from launch to 500k+ subscribers with minimal infrastructure changes.

---

## Infrastructure

### Hosting: Railway

| Component | Service | Cost Estimate |
|-----------|---------|---------------|
| Application | Nuxt 4.1 (Node.js) | $20-50/mo |
| Database | Railway PostgreSQL | $15-50/mo |

**Why Railway:**
- Single platform for app + database
- Auto-scaling (vertical)
- Built-in connection pooling (PgBouncer)
- Zero-downtime deployments
- Git push to deploy
- ~1ms database latency (same network)

**Deployment:**
- Region: US-East (good latency to Americas and EU)

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
│                       Railway                           │
│                                                         │
│  ┌─────────────────┐         ┌─────────────────┐       │
│  │   Nuxt App      │────────▶│   PostgreSQL    │       │
│  │   (Node.js)     │ ~1ms    │                 │       │
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

### SES Template Example

```javascript
// Template: daily-prayer-reminder
{
  Subject: 'Your Daily Prayer for {{campaignName}}',
  Body: `
    Hello {{subscriberName}},

    {{prayerContent}}

    <a href="{{prayerLink}}">Read Full Prayer</a>
    <a href="{{unsubscribeLink}}">Unsubscribe</a>
  `
}

// Bulk send (50 recipients per call)
SendBulkTemplatedEmail({
  Template: 'daily-prayer-reminder',
  DefaultTemplateData: { campaignName, prayerContent },
  Destinations: subscribers.map(s => ({
    Destination: { ToAddresses: [s.email] },
    ReplacementTemplateData: {
      subscriberName: s.name,
      prayerLink: `https://site.com/${slug}/fuel?uid=${s.trackingId}`,
      unsubscribeLink: `https://site.com/unsubscribe/${s.trackingId}`
    }
  }))
})
```

---

## Database Considerations

### Why Not Neon (Previous Setup)

| Issue | Impact |
|-------|--------|
| Cold starts | 100-500ms delay if database scaled to zero |
| Per-query latency | 5-15ms vs 1-3ms with Railway |
| N+1 query impact | Sync operations took 10-50x longer |

### Railway PostgreSQL Benefits

- No cold starts (always running)
- ~1ms latency (same internal network)
- Built-in PgBouncer for connection pooling
- Automatic backups

### Connection Limits by Scale

| Subscribers | App Instances | Connections Needed | Handles? |
|-------------|---------------|-------------------|----------|
| 10k | 1 | ~10 | Yes |
| 100k | 2 | ~20 | Yes |
| 500k | 3-4 | ~40 | Yes |

---

## Cost Projections

| Subscribers | Railway | SES | Cloudflare | Total |
|-------------|---------|-----|------------|-------|
| 10k | ~$25/mo | ~$3/mo | Free | **~$28/mo** |
| 100k | ~$50/mo | ~$30/mo | Free | **~$80/mo** |
| 500k | ~$100/mo | ~$150/mo | Free | **~$250/mo** |
| 1M | ~$170/mo | ~$300/mo | Free | **~$470/mo** |

---

## Scaling Roadmap

### Phase 1: Launch (0-50k subscribers)
- Railway (app + PostgreSQL)
- Cloudflare caching
- SES with bulk templated emails
- Single scheduler process

### Phase 2: Growth (50k-100k subscribers)
- Add `Promise.all` for parallel batch sends
- Monitor database connection usage
- Consider read replicas if needed

### Phase 3: Scale (100k-500k subscribers)
- Separate worker service for reminders
- Possibly add Redis for job queue
- Evaluate DigitalOcean for managed database features

### Phase 4: Large Scale (500k+ subscribers)
- Redis + BullMQ for job queue
- Multiple worker instances
- Database read replicas
- Evaluate multi-region if latency issues arise

---

## What We're NOT Using (And Why)

| Technology | Why Not |
|------------|---------|
| Redis (for now) | Cloudflare handles caching; bulk email API handles queue |
| Kubernetes | Overkill for current scale |
| Multi-region | Cloudflare CDN handles global distribution |
| Vercel | Serverless cold starts + Neon latency issues |
| DigitalOcean | Railway is simpler; DO available as fallback at scale |
| Individual email sends | Bulk API is 50x more efficient |

---


## Global User Distribution

Users are distributed worldwide, which actually helps:
- No single massive traffic spike (rolling prayer times across timezones)
- Cloudflare serves cached content from nearest edge
- Write latency (signup, "I prayed") is acceptable with optimistic UI
- Single-region deployment is sufficient

---

## Summary

This architecture prioritizes:
1. **Simplicity** - One platform, minimal services
2. **Performance** - Edge caching, bulk APIs, internal DB latency
3. **Cost efficiency** - Pay for what you use, no over-provisioning
4. **Scalability** - Clear upgrade path when needed

The system is designed to reach 500k subscribers before requiring significant architectural changes.
