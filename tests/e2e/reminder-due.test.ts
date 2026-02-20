import { describe, it, expect, afterAll, afterEach } from 'vitest'
import {
  getTestDatabase,
  closeTestDatabase,
  cleanupTestData,
  createTestPeopleGroup,
  createTestSubscriber,
  createTestContactMethod,
  createTestPeopleGroupSubscription,
  setNextReminderUtc
} from '../helpers/db'
import { campaignSubscriptionService } from '../../server/database/campaign-subscriptions'

describe('getSubscriptionsDueForReminder', async () => {
  const sql = getTestDatabase()

  afterEach(async () => {
    await cleanupTestData(sql)
  })

  afterAll(async () => {
    await closeTestDatabase()
  })

  describe('Basic Filtering', () => {
    it('returns subscriptions with past due next_reminder_utc', async () => {
      const peopleGroup = await createTestPeopleGroup(sql)
      const subscriber = await createTestSubscriber(sql, { name: 'Test Due Subscriber' })
      await createTestContactMethod(sql, subscriber.id, {
        type: 'email',
        value: `test-due-${Date.now()}@example.com`,
        verified: true
      })

      const subscription = await createTestPeopleGroupSubscription(sql, peopleGroup.id, subscriber.id, {
        delivery_method: 'email',
        status: 'active'
      })

      // Set next_reminder_utc to 1 hour ago
      const pastTime = new Date(Date.now() - 60 * 60 * 1000)
      await setNextReminderUtc(sql, subscription.id, pastTime)

      const due = await campaignSubscriptionService.getSubscriptionsDueForReminder()
      const found = due.find(d => d.id === subscription.id)

      expect(found).toBeDefined()
      expect(found!.id).toBe(subscription.id)
    })

    it('excludes subscriptions with future next_reminder_utc', async () => {
      const peopleGroup = await createTestPeopleGroup(sql)
      const subscriber = await createTestSubscriber(sql, { name: 'Test Future Subscriber' })
      await createTestContactMethod(sql, subscriber.id, {
        type: 'email',
        value: `test-future-${Date.now()}@example.com`,
        verified: true
      })

      const subscription = await createTestPeopleGroupSubscription(sql, peopleGroup.id, subscriber.id, {
        delivery_method: 'email',
        status: 'active'
      })

      // Set next_reminder_utc to 1 hour in the future
      const futureTime = new Date(Date.now() + 60 * 60 * 1000)
      await setNextReminderUtc(sql, subscription.id, futureTime)

      const due = await campaignSubscriptionService.getSubscriptionsDueForReminder()
      const found = due.find(d => d.id === subscription.id)

      expect(found).toBeUndefined()
    })

    it('excludes inactive subscriptions', async () => {
      const peopleGroup = await createTestPeopleGroup(sql)
      const subscriber = await createTestSubscriber(sql, { name: 'Test Inactive Subscriber' })
      await createTestContactMethod(sql, subscriber.id, {
        type: 'email',
        value: `test-inactive-${Date.now()}@example.com`,
        verified: true
      })

      const subscription = await createTestPeopleGroupSubscription(sql, peopleGroup.id, subscriber.id, {
        delivery_method: 'email',
        status: 'inactive' // Inactive subscription
      })

      const pastTime = new Date(Date.now() - 60 * 60 * 1000)
      await setNextReminderUtc(sql, subscription.id, pastTime)

      const due = await campaignSubscriptionService.getSubscriptionsDueForReminder()
      const found = due.find(d => d.id === subscription.id)

      expect(found).toBeUndefined()
    })

    it('excludes unsubscribed subscriptions', async () => {
      const peopleGroup = await createTestPeopleGroup(sql)
      const subscriber = await createTestSubscriber(sql, { name: 'Test Unsubscribed Subscriber' })
      await createTestContactMethod(sql, subscriber.id, {
        type: 'email',
        value: `test-unsub-${Date.now()}@example.com`,
        verified: true
      })

      const subscription = await createTestPeopleGroupSubscription(sql, peopleGroup.id, subscriber.id, {
        delivery_method: 'email',
        status: 'unsubscribed'
      })

      const pastTime = new Date(Date.now() - 60 * 60 * 1000)
      await setNextReminderUtc(sql, subscription.id, pastTime)

      const due = await campaignSubscriptionService.getSubscriptionsDueForReminder()
      const found = due.find(d => d.id === subscription.id)

      expect(found).toBeUndefined()
    })

    it('excludes unverified emails', async () => {
      const peopleGroup = await createTestPeopleGroup(sql)
      const subscriber = await createTestSubscriber(sql, { name: 'Test Unverified Subscriber' })
      await createTestContactMethod(sql, subscriber.id, {
        type: 'email',
        value: `test-unverified-${Date.now()}@example.com`,
        verified: false // Not verified
      })

      const subscription = await createTestPeopleGroupSubscription(sql, peopleGroup.id, subscriber.id, {
        delivery_method: 'email',
        status: 'active'
      })

      const pastTime = new Date(Date.now() - 60 * 60 * 1000)
      await setNextReminderUtc(sql, subscription.id, pastTime)

      const due = await campaignSubscriptionService.getSubscriptionsDueForReminder()
      const found = due.find(d => d.id === subscription.id)

      expect(found).toBeUndefined()
    })

    it('only returns email delivery method', async () => {
      const peopleGroup = await createTestPeopleGroup(sql)
      const subscriber = await createTestSubscriber(sql, { name: 'Test WhatsApp Subscriber' })
      await createTestContactMethod(sql, subscriber.id, {
        type: 'email',
        value: `test-whatsapp-${Date.now()}@example.com`,
        verified: true
      })

      const subscription = await createTestPeopleGroupSubscription(sql, peopleGroup.id, subscriber.id, {
        delivery_method: 'whatsapp', // Not email
        status: 'active'
      })

      const pastTime = new Date(Date.now() - 60 * 60 * 1000)
      await setNextReminderUtc(sql, subscription.id, pastTime)

      const due = await campaignSubscriptionService.getSubscriptionsDueForReminder()
      const found = due.find(d => d.id === subscription.id)

      expect(found).toBeUndefined()
    })
  })

  describe('Edge Cases', () => {
    it('includes subscription due exactly at current time', async () => {
      const peopleGroup = await createTestPeopleGroup(sql)
      const subscriber = await createTestSubscriber(sql, { name: 'Test Exact Time Subscriber' })
      await createTestContactMethod(sql, subscriber.id, {
        type: 'email',
        value: `test-exact-${Date.now()}@example.com`,
        verified: true
      })

      const subscription = await createTestPeopleGroupSubscription(sql, peopleGroup.id, subscriber.id, {
        delivery_method: 'email',
        status: 'active'
      })

      // Set to a time slightly in the past to ensure it's included
      // (exact current time is tricky due to query execution time)
      const slightlyPast = new Date(Date.now() - 1000)
      await setNextReminderUtc(sql, subscription.id, slightlyPast)

      const due = await campaignSubscriptionService.getSubscriptionsDueForReminder()
      const found = due.find(d => d.id === subscription.id)

      expect(found).toBeDefined()
    })

    it('excludes subscriptions with null next_reminder_utc', async () => {
      const peopleGroup = await createTestPeopleGroup(sql)
      const subscriber = await createTestSubscriber(sql, { name: 'Test Null Reminder Subscriber' })
      await createTestContactMethod(sql, subscriber.id, {
        type: 'email',
        value: `test-null-${Date.now()}@example.com`,
        verified: true
      })

      const subscription = await createTestPeopleGroupSubscription(sql, peopleGroup.id, subscriber.id, {
        delivery_method: 'email',
        status: 'active'
      })

      // Explicitly set to null (subscription is created without next_reminder_utc by default)
      await setNextReminderUtc(sql, subscription.id, null)

      const due = await campaignSubscriptionService.getSubscriptionsDueForReminder()
      const found = due.find(d => d.id === subscription.id)

      expect(found).toBeUndefined()
    })
  })

  describe('Return Data', () => {
    it('returns complete data with all joined fields', async () => {
      const peopleGroup = await createTestPeopleGroup(sql, {
        title: 'Test People Group Data'
      })
      const subscriber = await createTestSubscriber(sql, { name: 'Test Data Subscriber' })
      const email = `test-data-${Date.now()}@example.com`
      await createTestContactMethod(sql, subscriber.id, {
        type: 'email',
        value: email,
        verified: true
      })

      const subscription = await createTestPeopleGroupSubscription(sql, peopleGroup.id, subscriber.id, {
        delivery_method: 'email',
        status: 'active',
        frequency: 'daily',
        time_preference: '09:00',
        timezone: 'America/New_York'
      })

      const pastTime = new Date(Date.now() - 60 * 60 * 1000)
      await setNextReminderUtc(sql, subscription.id, pastTime)

      const due = await campaignSubscriptionService.getSubscriptionsDueForReminder()
      const found = due.find(d => d.id === subscription.id)

      expect(found).toBeDefined()

      // Subscription fields
      expect(found!.people_group_id).toBe(peopleGroup.id)
      expect(found!.subscriber_id).toBe(subscriber.id)
      expect(found!.delivery_method).toBe('email')
      expect(found!.frequency).toBe('daily')
      expect(found!.time_preference).toBe('09:00')
      expect(found!.timezone).toBe('America/New_York')
      expect(found!.status).toBe('active')

      // Joined subscriber fields
      expect(found!.subscriber_name).toBe('Test Data Subscriber')
      expect(found!.subscriber_tracking_id).toBe(subscriber.tracking_id)
      expect(found!.subscriber_profile_id).toBe(subscriber.profile_id)

      // Joined contact method fields
      expect(found!.email_value).toBe(email)
      expect(found!.email_verified).toBe(true)

      // Joined people group fields
      expect(found!.people_group_slug).toBe(peopleGroup.slug)
      expect(found!.people_group_name).toBe('Test People Group Data')
    })

    it('orders by next_reminder_utc ASC', async () => {
      const peopleGroup = await createTestPeopleGroup(sql)

      // Create 3 subscribers with different due times
      const times = [
        new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
        new Date(Date.now() - 60 * 60 * 1000), // 60 min ago
        new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
      ]

      const subscriptionIds: number[] = []

      for (let i = 0; i < 3; i++) {
        const subscriber = await createTestSubscriber(sql, { name: `Test Order Subscriber ${i}` })
        await createTestContactMethod(sql, subscriber.id, {
          type: 'email',
          value: `test-order-${Date.now()}-${i}@example.com`,
          verified: true
        })

        const subscription = await createTestPeopleGroupSubscription(sql, peopleGroup.id, subscriber.id, {
          delivery_method: 'email',
          status: 'active'
        })

        await setNextReminderUtc(sql, subscription.id, times[i])
        subscriptionIds.push(subscription.id)
      }

      const due = await campaignSubscriptionService.getSubscriptionsDueForReminder()
      const testDue = due.filter(d => subscriptionIds.includes(d.id))

      expect(testDue.length).toBe(3)

      // Should be ordered: 60 min ago, 30 min ago, 10 min ago
      // subscriptionIds[1] = 60 min ago (earliest)
      // subscriptionIds[0] = 30 min ago
      // subscriptionIds[2] = 10 min ago (most recent)
      expect(testDue[0].id).toBe(subscriptionIds[1])
      expect(testDue[1].id).toBe(subscriptionIds[0])
      expect(testDue[2].id).toBe(subscriptionIds[2])
    })
  })
})
