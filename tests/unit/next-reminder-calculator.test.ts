import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  calculateNextReminderUtc,
  calculateNextReminderAfterSend,
  isValidTimezone,
  type NextReminderOptions
} from '../../server/utils/next-reminder-calculator'

describe('next-reminder-calculator', () => {
  describe('calculateNextReminderUtc - Daily', () => {
    it('returns today at specified time when time has not passed', () => {
      // Mock: it's 8:00 AM UTC, user wants 9:00 AM UTC
      const mockNow = new Date('2024-03-15T08:00:00Z')
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderUtc({
        timezone: 'UTC',
        timePreference: '09:00',
        frequency: 'daily'
      })

      expect(result.getUTCFullYear()).toBe(2024)
      expect(result.getUTCMonth()).toBe(2) // March
      expect(result.getUTCDate()).toBe(15) // Same day
      expect(result.getUTCHours()).toBe(9)
      expect(result.getUTCMinutes()).toBe(0)
    })

    it('returns tomorrow when time has already passed', () => {
      // Mock: it's 10:00 AM UTC, user wants 9:00 AM UTC
      const mockNow = new Date('2024-03-15T10:00:00Z')
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderUtc({
        timezone: 'UTC',
        timePreference: '09:00',
        frequency: 'daily'
      })

      expect(result.getUTCFullYear()).toBe(2024)
      expect(result.getUTCMonth()).toBe(2) // March
      expect(result.getUTCDate()).toBe(16) // Next day
      expect(result.getUTCHours()).toBe(9)
      expect(result.getUTCMinutes()).toBe(0)
    })

    it('returns tomorrow when current time equals scheduled time', () => {
      // Mock: it's exactly 9:00 AM UTC
      const mockNow = new Date('2024-03-15T09:00:00Z')
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderUtc({
        timezone: 'UTC',
        timePreference: '09:00',
        frequency: 'daily'
      })

      // Should be tomorrow since the exact moment has passed
      expect(result.getUTCDate()).toBe(16)
    })
  })

  describe('calculateNextReminderUtc - Weekly', () => {
    it('returns today when today is scheduled day and time not passed', () => {
      // Friday March 15, 2024 at 8:00 AM UTC
      const mockNow = new Date('2024-03-15T08:00:00Z')
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderUtc({
        timezone: 'UTC',
        timePreference: '09:00',
        frequency: 'weekly',
        daysOfWeek: [5] // Friday = 5
      })

      expect(result.getUTCDate()).toBe(15) // Same day (Friday)
      expect(result.getUTCHours()).toBe(9)
    })

    it('returns next scheduled day when today\'s time passed', () => {
      // Friday March 15, 2024 at 10:00 AM UTC
      const mockNow = new Date('2024-03-15T10:00:00Z')
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderUtc({
        timezone: 'UTC',
        timePreference: '09:00',
        frequency: 'weekly',
        daysOfWeek: [1, 5] // Monday and Friday
      })

      // Next Monday is March 18
      expect(result.getUTCDate()).toBe(18)
      expect(result.getUTCDay()).toBe(1) // Monday
    })

    it('returns next scheduled day when today is not in daysOfWeek', () => {
      // Friday March 15, 2024
      const mockNow = new Date('2024-03-15T08:00:00Z')
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderUtc({
        timezone: 'UTC',
        timePreference: '09:00',
        frequency: 'weekly',
        daysOfWeek: [1, 3] // Monday (1) and Wednesday (3)
      })

      // Next Monday is March 18
      expect(result.getUTCDate()).toBe(18)
      expect(result.getUTCDay()).toBe(1)
    })

    it('handles single day per week correctly', () => {
      // Friday March 15, 2024 at 10:00 AM - time already passed
      const mockNow = new Date('2024-03-15T10:00:00Z')
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderUtc({
        timezone: 'UTC',
        timePreference: '09:00',
        frequency: 'weekly',
        daysOfWeek: [5] // Only Friday
      })

      // Next Friday is March 22
      expect(result.getUTCDate()).toBe(22)
      expect(result.getUTCDay()).toBe(5)
    })

    it('wraps around week boundary (Saturday to Monday)', () => {
      // Saturday March 16, 2024
      const mockNow = new Date('2024-03-16T08:00:00Z')
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderUtc({
        timezone: 'UTC',
        timePreference: '09:00',
        frequency: 'weekly',
        daysOfWeek: [1] // Monday only
      })

      // Next Monday is March 18
      expect(result.getUTCDate()).toBe(18)
      expect(result.getUTCDay()).toBe(1)
    })
  })

  describe('Timezone Conversion', () => {
    it('handles America/New_York in winter (EST = UTC-5)', () => {
      // User in New York wants 9 AM local, it's 8 AM local in January (winter = EST = UTC-5)
      const mockNow = new Date('2024-01-15T13:00:00Z') // 8 AM in EST (winter)
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderUtc({
        timezone: 'America/New_York',
        timePreference: '09:00',
        frequency: 'daily'
      })

      // 9 AM EST = 2 PM UTC (14:00)
      expect(result.getUTCHours()).toBe(14)
    })

    it('handles America/New_York in summer (EDT = UTC-4)', () => {
      // User in New York wants 9 AM local, it's 8 AM local in July (summer = EDT = UTC-4)
      const mockNow = new Date('2024-07-15T12:00:00Z') // 8 AM in EDT (summer)
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderUtc({
        timezone: 'America/New_York',
        timePreference: '09:00',
        frequency: 'daily'
      })

      // 9 AM EDT = 1 PM UTC (13:00)
      expect(result.getUTCHours()).toBe(13)
    })

    it('handles Europe/London in winter (GMT = UTC+0)', () => {
      // Winter: January 15 - London is UTC+0
      const mockNow = new Date('2024-01-15T08:00:00Z')
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderUtc({
        timezone: 'Europe/London',
        timePreference: '09:00',
        frequency: 'daily'
      })

      // 9 AM GMT = 9 AM UTC
      expect(result.getUTCHours()).toBe(9)
    })

    it('handles Europe/London in summer (BST = UTC+1)', () => {
      // Summer: July 15 - London is UTC+1 (British Summer Time)
      const mockNow = new Date('2024-07-15T07:00:00Z') // 8 AM in BST
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderUtc({
        timezone: 'Europe/London',
        timePreference: '09:00',
        frequency: 'daily'
      })

      // 9 AM BST = 8 AM UTC
      expect(result.getUTCHours()).toBe(8)
    })

    it('handles Asia/Tokyo (UTC+9, no DST)', () => {
      // User in Tokyo at midnight UTC (9 AM JST)
      const mockNow = new Date('2024-03-15T00:00:00Z') // 9 AM in Tokyo
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderUtc({
        timezone: 'Asia/Tokyo',
        timePreference: '10:00',
        frequency: 'daily'
      })

      // 10 AM JST = 1 AM UTC (10 - 9 = 1)
      expect(result.getUTCHours()).toBe(1)
    })

    it('handles UTC directly', () => {
      const mockNow = new Date('2024-03-15T08:00:00Z')
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderUtc({
        timezone: 'UTC',
        timePreference: '09:00',
        frequency: 'daily'
      })

      expect(result.getUTCHours()).toBe(9)
    })

    it('handles America/Los_Angeles in winter (PST = UTC-8)', () => {
      // User in LA at 7 AM local (3 PM UTC on Dec 15)
      const mockNow = new Date('2024-12-15T15:00:00Z') // 7 AM PST
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderUtc({
        timezone: 'America/Los_Angeles',
        timePreference: '09:00',
        frequency: 'daily'
      })

      // 9 AM PST = 5 PM UTC (17:00)
      expect(result.getUTCHours()).toBe(17)
    })

    it('handles America/Los_Angeles in summer (PDT = UTC-7)', () => {
      // User in LA at 7 AM local (2 PM UTC on July 15)
      const mockNow = new Date('2024-07-15T14:00:00Z') // 7 AM PDT
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderUtc({
        timezone: 'America/Los_Angeles',
        timePreference: '09:00',
        frequency: 'daily'
      })

      // 9 AM PDT = 4 PM UTC (16:00)
      expect(result.getUTCHours()).toBe(16)
    })

    it('handles Asia/Kolkata (UTC+5:30 - half-hour offset)', () => {
      // User in India
      const mockNow = new Date('2024-03-15T02:00:00Z') // 7:30 AM IST
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderUtc({
        timezone: 'Asia/Kolkata',
        timePreference: '09:00',
        frequency: 'daily'
      })

      // 9 AM IST = 3:30 AM UTC
      expect(result.getUTCHours()).toBe(3)
      expect(result.getUTCMinutes()).toBe(30)
    })
  })

  describe('calculateNextReminderAfterSend', () => {
    it('Daily: always returns tomorrow (never same day)', () => {
      // Even if it's early morning, after send we schedule for tomorrow
      const mockNow = new Date('2024-03-15T06:00:00Z')
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderAfterSend({
        timezone: 'UTC',
        timePreference: '09:00',
        frequency: 'daily'
      })

      expect(result.getUTCDate()).toBe(16) // Tomorrow
      expect(result.getUTCHours()).toBe(9)
    })

    it('Weekly: skips today, returns next valid day', () => {
      // Friday March 15, 2024 - scheduled days are Mon and Fri
      const mockNow = new Date('2024-03-15T08:00:00Z')
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderAfterSend({
        timezone: 'UTC',
        timePreference: '09:00',
        frequency: 'weekly',
        daysOfWeek: [1, 5] // Monday and Friday
      })

      // Should skip Friday (today), return Monday March 18
      expect(result.getUTCDate()).toBe(18)
      expect(result.getUTCDay()).toBe(1) // Monday
    })

    it('Single day per week: returns same day next week', () => {
      // Friday March 15, 2024
      const mockNow = new Date('2024-03-15T08:00:00Z')
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderAfterSend({
        timezone: 'UTC',
        timePreference: '09:00',
        frequency: 'weekly',
        daysOfWeek: [5] // Friday only
      })

      // Next Friday is March 22
      expect(result.getUTCDate()).toBe(22)
      expect(result.getUTCDay()).toBe(5)
    })
  })

  describe('isValidTimezone', () => {
    it('returns true for valid IANA timezones', () => {
      expect(isValidTimezone('UTC')).toBe(true)
      expect(isValidTimezone('America/New_York')).toBe(true)
      expect(isValidTimezone('Europe/London')).toBe(true)
      expect(isValidTimezone('Asia/Tokyo')).toBe(true)
      expect(isValidTimezone('Asia/Kolkata')).toBe(true)
      expect(isValidTimezone('Pacific/Auckland')).toBe(true)
    })

    it('returns false for invalid timezones', () => {
      expect(isValidTimezone('Invalid/Zone')).toBe(false)
      expect(isValidTimezone('not-a-timezone')).toBe(false)
      expect(isValidTimezone('')).toBe(false)
    })

    it('returns false for invalid timezone strings', () => {
      // Note: Some abbreviations (EST, PST, GMT) may be accepted by some runtimes
      // but full IANA zones (America/New_York) are always preferred
      expect(isValidTimezone('INVALID')).toBe(false)
      expect(isValidTimezone('US/Fake')).toBe(false)
      expect(isValidTimezone('123')).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('handles midnight (00:00) time preference', () => {
      const mockNow = new Date('2024-03-15T23:00:00Z')
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderUtc({
        timezone: 'UTC',
        timePreference: '00:00',
        frequency: 'daily'
      })

      // Should be midnight tomorrow
      expect(result.getUTCDate()).toBe(16)
      expect(result.getUTCHours()).toBe(0)
      expect(result.getUTCMinutes()).toBe(0)
    })

    it('handles end of day (23:59) time preference', () => {
      const mockNow = new Date('2024-03-15T12:00:00Z')
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderUtc({
        timezone: 'UTC',
        timePreference: '23:59',
        frequency: 'daily'
      })

      // Should be today at 23:59
      expect(result.getUTCDate()).toBe(15)
      expect(result.getUTCHours()).toBe(23)
      expect(result.getUTCMinutes()).toBe(59)
    })

    it('handles month boundary', () => {
      // March 31, 2024 at 10 PM UTC
      const mockNow = new Date('2024-03-31T22:00:00Z')
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderUtc({
        timezone: 'UTC',
        timePreference: '09:00',
        frequency: 'daily'
      })

      // Should be April 1
      expect(result.getUTCMonth()).toBe(3) // April (0-indexed)
      expect(result.getUTCDate()).toBe(1)
    })

    it('handles year boundary', () => {
      // December 31, 2024 at 10 PM UTC
      const mockNow = new Date('2024-12-31T22:00:00Z')
      vi.setSystemTime(mockNow)

      const result = calculateNextReminderUtc({
        timezone: 'UTC',
        timePreference: '09:00',
        frequency: 'daily'
      })

      // Should be January 1, 2025
      expect(result.getUTCFullYear()).toBe(2025)
      expect(result.getUTCMonth()).toBe(0) // January
      expect(result.getUTCDate()).toBe(1)
    })
  })

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })
})
