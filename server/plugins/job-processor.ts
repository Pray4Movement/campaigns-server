import { jobQueueService } from '../database/job-queue'
import { marketingEmailService } from '../database/marketing-emails'
import { getProcessor } from '../jobs/processors'

export default defineNitroPlugin((nitroApp) => {
  const enableJobProcessor = process.env.ENABLE_JOB_PROCESSOR !== 'false'

  if (!enableJobProcessor) {
    console.log('Job processor disabled')
    console.log('   Set ENABLE_JOB_PROCESSOR=true to enable')
    return
  }

  console.log('Job processor started (checking every 30 seconds)')

  let isProcessing = false

  const interval = setInterval(async () => {
    if (isProcessing) return
    isProcessing = true

    try {
      await processJobQueue()
    } catch (error: any) {
      console.error('Job processor error:', error.message)
    } finally {
      isProcessing = false
    }
  }, 30 * 1000)

  setTimeout(async () => {
    if (!isProcessing) {
      isProcessing = true
      try {
        await processJobQueue()
      } catch (error: any) {
        console.error('Initial job check error:', error.message)
      } finally {
        isProcessing = false
      }
    }
  }, 15000)

  console.log('Job processor initialized')

  nitroApp.hooks.hook('close', () => {
    console.log('Stopping job processor...')
    clearInterval(interval)
  })
})

async function processJobQueue() {
  const batchSize = 10
  const pending = await jobQueueService.getPendingJobs(undefined, batchSize)

  if (pending.length === 0) return

  console.log(`Processing ${pending.length} job(s)...`)

  const marketingEmailIds = new Set<number>()

  for (const job of pending) {
    try {
      await jobQueueService.markProcessing(job.id)

      const processor = getProcessor(job.type)
      const result = await processor(job)

      if (result.success) {
        await jobQueueService.markCompleted(job.id, result.data)
      } else {
        throw new Error(result.data?.error || 'Job failed')
      }

      if (job.type === 'marketing_email' && job.reference_id) {
        marketingEmailIds.add(job.reference_id)
      }
    } catch (error: any) {
      const canRetry = job.attempts < job.max_attempts
      await jobQueueService.markFailed(job.id, error.message || 'Unknown error')

      if (canRetry) {
        await jobQueueService.retryJob(job.id)
      }

      if (job.type === 'marketing_email' && job.reference_id) {
        marketingEmailIds.add(job.reference_id)
      }
    }
  }

  for (const emailId of marketingEmailIds) {
    const isComplete = await jobQueueService.isComplete('marketing_email', emailId)
    if (isComplete) {
      const stats = await jobQueueService.getJobStats('marketing_email', emailId)
      const finalStatus = stats.failed > 0 && stats.completed === 0 ? 'failed' : 'sent'
      await marketingEmailService.updateStatus(emailId, finalStatus)
      console.log(`  Marketing email ${emailId} complete: ${stats.completed} sent, ${stats.failed} failed`)
    }
  }

  console.log('Job processing complete')
}
