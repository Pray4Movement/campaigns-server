import { getDatabase } from '../database/db'

/**
 * Update the people_praying column for all campaigns
 * Calculates the average number of unique people praying daily over the last 7 days
 */
export async function updatePrayerStats(): Promise<void> {
  const db = getDatabase()

  // Calculate average daily unique prayers per campaign for the last 7 days
  // and update the campaigns table
  const stmt = db.prepare(`
    UPDATE campaigns c
    SET people_praying = COALESCE(stats.avg_daily_count, 0)
    FROM (
      SELECT campaign_id, ROUND(AVG(daily_count))::integer as avg_daily_count
      FROM (
        SELECT campaign_id, DATE(timestamp) as prayer_date, COUNT(DISTINCT COALESCE(tracking_id, id::text)) as daily_count
        FROM prayer_activity
        WHERE timestamp >= NOW() - INTERVAL '7 days'
        GROUP BY campaign_id, DATE(timestamp)
      ) daily_stats
      GROUP BY campaign_id
    ) stats
    WHERE c.id = stats.campaign_id
  `)

  await stmt.run()

  // Reset campaigns with no recent activity to 0
  const resetStmt = db.prepare(`
    UPDATE campaigns
    SET people_praying = 0
    WHERE id NOT IN (
      SELECT DISTINCT campaign_id
      FROM prayer_activity
      WHERE timestamp >= NOW() - INTERVAL '7 days'
    )
  `)

  await resetStmt.run()
}
