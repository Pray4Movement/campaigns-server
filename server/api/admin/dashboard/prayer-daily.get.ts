import { getDatabase } from '#server/database/db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const db = getDatabase()

  const [recordedRows, committedRows] = await Promise.all([
    db.prepare(`
      SELECT
        TO_CHAR(DATE(timestamp), 'YYYY-MM-DD') as date,
        COALESCE(ROUND(SUM(duration) / 60.0), 0) as minutes,
        COUNT(DISTINCT COALESCE(tracking_id, id::text)) as unique_sessions
      FROM prayer_activity
      WHERE timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `).all(),
    db.prepare(`
      SELECT
        TO_CHAR(d.date, 'YYYY-MM-DD') as date,
        COALESCE(SUM(cs.prayer_duration), 0) as committed
      FROM generate_series(
        (NOW() - INTERVAL '29 days')::date,
        NOW()::date,
        '1 day'::interval
      ) as d(date)
      LEFT JOIN campaign_subscriptions cs
        ON cs.status = 'active'
        AND cs.created_at::date <= d.date
      GROUP BY d.date
      ORDER BY d.date ASC
    `).all()
  ])

  const recordedMap = new Map(recordedRows.map((r: any) => [r.date, r]))
  const committedMap = new Map(committedRows.map((r: any) => [r.date, Number(r.committed)]))
  const result = []
  const now = new Date()

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i)
    const key = d.toISOString().split('T')[0]!
    const existing = recordedMap.get(key)
    result.push({
      date: key,
      minutes: Number(existing?.minutes ?? 0),
      unique_sessions: Number(existing?.unique_sessions ?? 0),
      committed: committedMap.get(key) ?? 0
    })
  }

  return result
})
