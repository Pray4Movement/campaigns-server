import { getDatabase } from './db'

export interface TranslationJob {
  id: number
  batch_id: string
  library_id: number
  source_content_id: number
  target_language: string
  overwrite: boolean
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  attempts: number
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export interface TranslationJobStats {
  total: number
  pending: number
  processing: number
  completed: number
  failed: number
  cancelled: number
}

export interface CreateTranslationJobData {
  batch_id: string
  library_id: number
  source_content_id: number
  target_language: string
  overwrite?: boolean
}

class TranslationJobsService {
  private db = getDatabase()

  async createJob(data: CreateTranslationJobData): Promise<TranslationJob> {
    const stmt = this.db.prepare(`
      INSERT INTO translation_jobs (batch_id, library_id, source_content_id, target_language, overwrite)
      VALUES (?, ?, ?, ?, ?)
    `)
    const result = await stmt.run(
      data.batch_id,
      data.library_id,
      data.source_content_id,
      data.target_language,
      data.overwrite ?? false
    )
    return (await this.getJobById(result.lastInsertRowid as number))!
  }

  async createJobs(jobs: CreateTranslationJobData[]): Promise<number> {
    if (jobs.length === 0) return 0

    const stmt = this.db.prepare(`
      INSERT INTO translation_jobs (batch_id, library_id, source_content_id, target_language, overwrite)
      VALUES (?, ?, ?, ?, ?)
    `)

    let count = 0
    for (const job of jobs) {
      await stmt.run(
        job.batch_id,
        job.library_id,
        job.source_content_id,
        job.target_language,
        job.overwrite ?? false
      )
      count++
    }

    return count
  }

  async getJobById(id: number): Promise<TranslationJob | null> {
    const stmt = this.db.prepare('SELECT * FROM translation_jobs WHERE id = ?')
    return await stmt.get(id) as TranslationJob | null
  }

  async getPendingJobs(limit: number = 1): Promise<TranslationJob[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM translation_jobs
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT ?
    `)
    return await stmt.all(limit) as TranslationJob[]
  }

  async markProcessing(id: number): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE translation_jobs
      SET status = 'processing',
          attempts = attempts + 1
      WHERE id = ?
    `)
    await stmt.run(id)
  }

  async markCompleted(id: number): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE translation_jobs
      SET status = 'completed',
          completed_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      WHERE id = ?
    `)
    await stmt.run(id)
  }

  async markFailed(id: number, errorMessage: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE translation_jobs
      SET status = 'failed',
          error_message = ?,
          completed_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      WHERE id = ?
    `)
    await stmt.run(errorMessage, id)
  }

  async cancelPendingJobs(batchId: string): Promise<number> {
    const stmt = this.db.prepare(`
      UPDATE translation_jobs
      SET status = 'cancelled',
          completed_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      WHERE batch_id = ? AND status = 'pending'
    `)
    const result = await stmt.run(batchId)
    return result.changes
  }

  async getBatchStats(batchId: string): Promise<TranslationJobStats> {
    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'processing') as processing,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
      FROM translation_jobs
      WHERE batch_id = ?
    `)
    return await stmt.get(batchId) as TranslationJobStats
  }

  async isBatchComplete(batchId: string): Promise<boolean> {
    const stmt = this.db.prepare(`
      SELECT 1 FROM translation_jobs
      WHERE batch_id = ? AND status IN ('pending', 'processing')
      LIMIT 1
    `)
    const result = await stmt.get(batchId)
    return !result
  }

  async hasPendingJobs(): Promise<boolean> {
    const stmt = this.db.prepare(`
      SELECT 1 FROM translation_jobs
      WHERE status = 'pending'
      LIMIT 1
    `)
    const result = await stmt.get()
    return !!result
  }

  async cleanupOldJobs(daysOld: number = 30): Promise<number> {
    const stmt = this.db.prepare(`
      DELETE FROM translation_jobs
      WHERE status IN ('completed', 'failed', 'cancelled')
        AND completed_at < NOW() - INTERVAL '? days'
    `)
    const result = await stmt.run(daysOld)
    return result.changes
  }

  async getJobsByBatch(batchId: string): Promise<TranslationJob[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM translation_jobs
      WHERE batch_id = ?
      ORDER BY created_at ASC
    `)
    return await stmt.all(batchId) as TranslationJob[]
  }
}

export const translationJobsService = new TranslationJobsService()
