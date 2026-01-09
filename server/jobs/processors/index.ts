import type { Job } from '../../database/job-queue'
import { processMarketingEmail } from './marketing-email'
import { processTranslation } from './translation'

export interface ProcessorResult {
  success: boolean
  data?: Record<string, any>
}

export type JobProcessor = (job: Job) => Promise<ProcessorResult>

const processors: Record<string, JobProcessor> = {
  marketing_email: processMarketingEmail,
  translation: processTranslation
}

export function getProcessor(type: string): JobProcessor {
  const processor = processors[type]
  if (!processor) {
    throw new Error(`No processor registered for job type: ${type}`)
  }
  return processor
}

export function registerProcessor(type: string, processor: JobProcessor): void {
  processors[type] = processor
}
