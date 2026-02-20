import { describe, it, expect, afterAll, afterEach } from 'vitest'
import {
  getTestDatabase,
  closeTestDatabase,
  cleanupTestData,
  createTestCampaign,
  createTestSubscriber,
  createTestContactMethod,
  createTestCampaignSubscription
} from '../helpers/db'
import { reminderSentService } from '../../server/database/reminder-sent'

describe('Reminder Sent Duplicate Prevention', async () => {
  const sql = getTestDatabase()

  afterEach(async () => {
    await cleanupTestData(sql)
  })

  afterAll(async () => {
    await closeTestDatabase()
  })

  describe('recordSent()', () => {
    it('records sent reminder for subscription and date', async () => {
      const campaign = await createTestCampaign(sql)
      const subscriber = await createTestSubscriber(sql, { name: 'Test Record Subscriber' })
      await createTestContactMethod(sql, subscriber.id, {
        type: 'email',
        value: `test-record-${Date.now()}@example.com`,
        verified: true
      })

      const subscription = await createTestCampaignSubscription(sql, campaign.id, subscriber.id, {
        delivery_method: 'email',
        status: 'active'
      })

      const sentDate = '2024-03-15'

      // Record that reminder was sent
      await reminderSentService.recordSent( subscription.id, sentDate)

      // Verify it was recorded
      const wasSent = await reminderSentService.wasSent( subscription.id, sentDate)
      expect(wasSent).toBe(true)
    })

    it('is idempotent - no error on duplicate insert', async () => {
      const campaign = await createTestCampaign(sql)
      const subscriber = await createTestSubscriber(sql, { name: 'Test Idempotent Subscriber' })
      await createTestContactMethod(sql, subscriber.id, {
        type: 'email',
        value: `test-idempotent-${Date.now()}@example.com`,
        verified: true
      })

      const subscription = await createTestCampaignSubscription(sql, campaign.id, subscriber.id, {
        delivery_method: 'email',
        status: 'active'
      })

      const sentDate = '2024-03-15'

      // Record the same reminder twice - should not throw
      await reminderSentService.recordSent( subscription.id, sentDate)
      await expect(
        reminderSentService.recordSent( subscription.id, sentDate)
      ).resolves.not.toThrow()

      // Verify still recorded correctly
      const wasSent = await reminderSentService.wasSent( subscription.id, sentDate)
      expect(wasSent).toBe(true)
    })
  })

  describe('wasSent()', () => {
    it('returns true when reminder already sent today', async () => {
      const campaign = await createTestCampaign(sql)
      const subscriber = await createTestSubscriber(sql, { name: 'Test WasSent True Subscriber' })
      await createTestContactMethod(sql, subscriber.id, {
        type: 'email',
        value: `test-wassent-true-${Date.now()}@example.com`,
        verified: true
      })

      const subscription = await createTestCampaignSubscription(sql, campaign.id, subscriber.id, {
        delivery_method: 'email',
        status: 'active'
      })

      const today = new Date().toISOString().split('T')[0]

      // Record reminder sent
      await reminderSentService.recordSent( subscription.id, today)

      // Check if sent
      const result = await reminderSentService.wasSent( subscription.id, today)
      expect(result).toBe(true)
    })

    it('returns false when no reminder sent for date', async () => {
      const campaign = await createTestCampaign(sql)
      const subscriber = await createTestSubscriber(sql, { name: 'Test WasSent False Subscriber' })
      await createTestContactMethod(sql, subscriber.id, {
        type: 'email',
        value: `test-wassent-false-${Date.now()}@example.com`,
        verified: true
      })

      const subscription = await createTestCampaignSubscription(sql, campaign.id, subscriber.id, {
        delivery_method: 'email',
        status: 'active'
      })

      // Check if sent without having recorded anything
      const result = await reminderSentService.wasSent( subscription.id, '2024-03-15')
      expect(result).toBe(false)
    })

    it('different dates are independent', async () => {
      const campaign = await createTestCampaign(sql)
      const subscriber = await createTestSubscriber(sql, { name: 'Test Dates Independent Subscriber' })
      await createTestContactMethod(sql, subscriber.id, {
        type: 'email',
        value: `test-dates-${Date.now()}@example.com`,
        verified: true
      })

      const subscription = await createTestCampaignSubscription(sql, campaign.id, subscriber.id, {
        delivery_method: 'email',
        status: 'active'
      })

      const date1 = '2024-03-15'
      const date2 = '2024-03-16'

      // Record for date1 only
      await reminderSentService.recordSent( subscription.id, date1)

      // date1 should be true
      const wasSentDate1 = await reminderSentService.wasSent( subscription.id, date1)
      expect(wasSentDate1).toBe(true)

      // date2 should be false
      const wasSentDate2 = await reminderSentService.wasSent( subscription.id, date2)
      expect(wasSentDate2).toBe(false)
    })

    it('different subscriptions are independent', async () => {
      const campaign = await createTestCampaign(sql)

      // Create two subscribers with subscriptions
      const subscriber1 = await createTestSubscriber(sql, { name: 'Test Sub1 Independent' })
      await createTestContactMethod(sql, subscriber1.id, {
        type: 'email',
        value: `test-sub1-${Date.now()}@example.com`,
        verified: true
      })
      const subscription1 = await createTestCampaignSubscription(sql, campaign.id, subscriber1.id, {
        delivery_method: 'email',
        status: 'active'
      })

      const subscriber2 = await createTestSubscriber(sql, { name: 'Test Sub2 Independent' })
      await createTestContactMethod(sql, subscriber2.id, {
        type: 'email',
        value: `test-sub2-${Date.now()}@example.com`,
        verified: true
      })
      const subscription2 = await createTestCampaignSubscription(sql, campaign.id, subscriber2.id, {
        delivery_method: 'email',
        status: 'active'
      })

      const date = '2024-03-15'

      // Record for subscription1 only
      await reminderSentService.recordSent( subscription1.id, date)

      // subscription1 should be true
      const wasSentSub1 = await reminderSentService.wasSent( subscription1.id, date)
      expect(wasSentSub1).toBe(true)

      // subscription2 should be false
      const wasSentSub2 = await reminderSentService.wasSent( subscription2.id, date)
      expect(wasSentSub2).toBe(false)
    })
  })

  describe('cleanupOldRecords()', () => {
    it('removes records older than threshold', async () => {
      const campaign = await createTestCampaign(sql)
      const subscriber = await createTestSubscriber(sql, { name: 'Test Cleanup Subscriber' })
      await createTestContactMethod(sql, subscriber.id, {
        type: 'email',
        value: `test-cleanup-${Date.now()}@example.com`,
        verified: true
      })

      const subscription = await createTestCampaignSubscription(sql, campaign.id, subscriber.id, {
        delivery_method: 'email',
        status: 'active'
      })

      // Create an old record (100 days ago)
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 100)
      const oldDateStr = oldDate.toISOString().split('T')[0]

      await reminderSentService.recordSent( subscription.id, oldDateStr)

      // Verify it exists
      let wasSent = await reminderSentService.wasSent( subscription.id, oldDateStr)
      expect(wasSent).toBe(true)

      // Run cleanup with 90-day threshold using actual service
      const deletedCount = await reminderSentService.cleanupOldRecords(90)
      expect(deletedCount).toBeGreaterThanOrEqual(1)

      // Verify old record is removed
      wasSent = await reminderSentService.wasSent(subscription.id, oldDateStr)
      expect(wasSent).toBe(false)
    })

    it('keeps recent records', async () => {
      const campaign = await createTestCampaign(sql)
      const subscriber = await createTestSubscriber(sql, { name: 'Test Keep Recent Subscriber' })
      await createTestContactMethod(sql, subscriber.id, {
        type: 'email',
        value: `test-keep-${Date.now()}@example.com`,
        verified: true
      })

      const subscription = await createTestCampaignSubscription(sql, campaign.id, subscriber.id, {
        delivery_method: 'email',
        status: 'active'
      })

      // Create a recent record (10 days ago)
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 10)
      const recentDateStr = recentDate.toISOString().split('T')[0]

      await reminderSentService.recordSent(subscription.id, recentDateStr)

      // Run cleanup with 90-day threshold using actual service
      await reminderSentService.cleanupOldRecords(90)

      // Verify recent record is kept
      const wasSent = await reminderSentService.wasSent(subscription.id, recentDateStr)
      expect(wasSent).toBe(true)
    })
  })
})
