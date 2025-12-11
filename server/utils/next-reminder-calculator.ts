import { toZonedTime, fromZonedTime } from 'date-fns-tz'

export interface NextReminderOptions {
  timezone: string          // IANA timezone (e.g., "America/New_York")
  timePreference: string    // "HH:MM" format (e.g., "09:00")
  frequency: string         // "daily" or "weekly"
  daysOfWeek?: number[]     // For weekly: array of days (0=Sunday, 1=Monday, etc.)
}

/**
 * Calculate the next reminder time in UTC based on user's timezone and preferences.
 *
 * @param options - The user's reminder preferences
 * @returns Date object representing the next reminder time in UTC
 */
export function calculateNextReminderUtc(options: NextReminderOptions): Date {
  const { timezone, timePreference, frequency, daysOfWeek } = options

  // Parse time preference
  const [hours, minutes] = timePreference.split(':').map(Number)

  // Get current time in user's timezone
  const nowUtc = new Date()
  const nowInUserTz = toZonedTime(nowUtc, timezone)

  // Start with today in user's timezone
  let candidateDate = new Date(nowInUserTz)
  candidateDate.setHours(hours, minutes, 0, 0)

  if (frequency === 'daily') {
    // For daily: if today's time has passed, move to tomorrow
    if (candidateDate <= nowInUserTz) {
      candidateDate.setDate(candidateDate.getDate() + 1)
    }
  } else if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
    // For weekly: find the next matching day
    candidateDate = findNextMatchingDay(nowInUserTz, hours, minutes, daysOfWeek)
  }

  // Convert back to UTC
  return fromZonedTime(candidateDate, timezone)
}

/**
 * Find the next date that matches one of the specified days of the week.
 */
function findNextMatchingDay(
  nowInUserTz: Date,
  hours: number,
  minutes: number,
  daysOfWeek: number[]
): Date {
  // Sort days for consistent iteration
  const sortedDays = [...daysOfWeek].sort((a, b) => a - b)
  const currentDay = nowInUserTz.getDay()

  // Create a candidate for today at the specified time
  const todayCandidate = new Date(nowInUserTz)
  todayCandidate.setHours(hours, minutes, 0, 0)

  // Check if today is a valid day and time hasn't passed
  if (sortedDays.includes(currentDay) && todayCandidate > nowInUserTz) {
    return todayCandidate
  }

  // Find the next valid day
  for (let daysAhead = 1; daysAhead <= 7; daysAhead++) {
    const futureDay = (currentDay + daysAhead) % 7
    if (sortedDays.includes(futureDay)) {
      const result = new Date(nowInUserTz)
      result.setDate(result.getDate() + daysAhead)
      result.setHours(hours, minutes, 0, 0)
      return result
    }
  }

  // Fallback: shouldn't reach here if daysOfWeek is valid
  const fallback = new Date(nowInUserTz)
  fallback.setDate(fallback.getDate() + 1)
  fallback.setHours(hours, minutes, 0, 0)
  return fallback
}

/**
 * Calculate the next reminder after a specific date (used after sending a reminder).
 * This ensures we always move forward in time.
 */
export function calculateNextReminderAfterSend(options: NextReminderOptions): Date {
  const { timezone, timePreference, frequency, daysOfWeek } = options

  // Parse time preference
  const [hours, minutes] = timePreference.split(':').map(Number)

  // Get current time in user's timezone
  const nowUtc = new Date()
  const nowInUserTz = toZonedTime(nowUtc, timezone)

  if (frequency === 'daily') {
    // For daily: always schedule for tomorrow
    const tomorrow = new Date(nowInUserTz)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(hours, minutes, 0, 0)
    return fromZonedTime(tomorrow, timezone)
  } else if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
    // For weekly: find the next matching day (excluding today since we just sent)
    const sortedDays = [...daysOfWeek].sort((a, b) => a - b)
    const currentDay = nowInUserTz.getDay()

    for (let daysAhead = 1; daysAhead <= 7; daysAhead++) {
      const futureDay = (currentDay + daysAhead) % 7
      if (sortedDays.includes(futureDay)) {
        const result = new Date(nowInUserTz)
        result.setDate(result.getDate() + daysAhead)
        result.setHours(hours, minutes, 0, 0)
        return fromZonedTime(result, timezone)
      }
    }
  }

  // Fallback: tomorrow at the same time
  const fallback = new Date(nowInUserTz)
  fallback.setDate(fallback.getDate() + 1)
  fallback.setHours(hours, minutes, 0, 0)
  return fromZonedTime(fallback, timezone)
}

/**
 * Validate that a timezone string is valid.
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

/**
 * Get user-friendly timezone label.
 */
export function getTimezoneLabel(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'long'
    })
    const parts = formatter.formatToParts(new Date())
    const tzName = parts.find(p => p.type === 'timeZoneName')?.value
    return tzName || timezone
  } catch {
    return timezone
  }
}
