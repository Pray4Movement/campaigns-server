import { getDatabase } from '#server/database/db'

export interface ActivityStats {
  newSubscribers: number
  totalPrayerTime: number
  prayerCommitted: number
  groupsWithPrayer: number
  groupsWith144: number
  groupsAdopted: number
  groupsEngaged: number
}

export async function collectActivityStats(periodStart: Date, periodEnd: Date): Promise<ActivityStats> {
  const db = getDatabase()

  const startIso = periodStart.toISOString()
  const endIso = periodEnd.toISOString()

  const [
    subscribersRow,
    prayerTimeRow,
    prayerCommittedRow,
    groupsWithPrayerRow,
    groupsWith144Row,
    groupsAdoptedRow,
    groupsEngagedRow
  ] = await Promise.all([
    db.prepare(`SELECT COUNT(*) as count FROM subscribers WHERE created_at >= ? AND created_at < ?`).get(startIso, endIso),
    db.prepare(`SELECT COALESCE(ROUND(SUM(duration) / 60.0), 0) as total FROM prayer_activity WHERE timestamp >= ? AND timestamp < ?`).get(startIso, endIso),
    db.prepare(`
      SELECT COALESCE(SUM(daily_committed), 0) as total
      FROM (
        SELECT d.date, SUM(cs.prayer_duration) as daily_committed
        FROM generate_series(?::date, (?::date - INTERVAL '1 day'), '1 day'::interval) as d(date)
        JOIN campaign_subscriptions cs
          ON cs.status = 'active'
          AND cs.created_at::date <= d.date
        GROUP BY d.date
      ) daily_totals
    `).get(startIso, endIso),
    db.prepare(`SELECT COUNT(DISTINCT people_group_id) as count FROM campaign_subscriptions WHERE status = 'active'`).get(),
    db.prepare(`SELECT COUNT(*) as count FROM (SELECT people_group_id FROM campaign_subscriptions WHERE status = 'active' GROUP BY people_group_id HAVING COUNT(*) >= 144) sub`).get(),
    db.prepare(`SELECT COUNT(DISTINCT group_id) as count FROM people_group_adoptions WHERE status = 'active' AND adopted_at >= ? AND adopted_at < ?`).get(startIso, endIso),
    db.prepare(`SELECT COUNT(*) as count FROM people_groups WHERE engagement_status = 'engaged' OR (metadata::jsonb->>'imb_engagement_status') = 'engaged'`).get()
  ])

  return {
    newSubscribers: Number(subscribersRow?.count ?? 0),
    totalPrayerTime: Number(prayerTimeRow?.total ?? 0),
    prayerCommitted: Math.round(Number(prayerCommittedRow?.total ?? 0)),
    groupsWithPrayer: Number(groupsWithPrayerRow?.count ?? 0),
    groupsWith144: Number(groupsWith144Row?.count ?? 0),
    groupsAdopted: Number(groupsAdoptedRow?.count ?? 0),
    groupsEngaged: Number(groupsEngagedRow?.count ?? 0)
  }
}
