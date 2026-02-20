import { subscriberService } from '#server/database/subscribers'
import { contactMethodService } from '#server/database/contact-methods'
import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'

export default defineEventHandler(async (event) => {
  const profileId = getRouterParam(event, 'id')

  if (!profileId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Profile ID is required'
    })
  }

  // Get the subscriber by profile ID
  const subscriber = await subscriberService.getSubscriberByProfileId(profileId)

  if (!subscriber) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Subscriber not found'
    })
  }

  // Get all contact methods for this subscriber
  const contacts = await contactMethodService.getSubscriberContactMethods(subscriber.id)
  const primaryEmail = contacts.find(c => c.type === 'email')
  const primaryPhone = contacts.find(c => c.type === 'phone')

  // Get all subscriptions for this subscriber
  const allSubscriptions = await campaignSubscriptionService.getSubscriberSubscriptions(subscriber.id)

  // Group subscriptions by people group
  const subscriptionsByPeopleGroup = new Map<number, typeof allSubscriptions>()
  for (const sub of allSubscriptions) {
    if (!subscriptionsByPeopleGroup.has(sub.people_group_id)) {
      subscriptionsByPeopleGroup.set(sub.people_group_id, [])
    }
    subscriptionsByPeopleGroup.get(sub.people_group_id)!.push(sub)
  }

  // Build people groups array with reminders
  const peopleGroups = Array.from(subscriptionsByPeopleGroup.entries())
    .filter(([, subs]) => subs.length > 0)
    .map(([peopleGroupId, subs]) => ({
      id: peopleGroupId,
      title: subs[0]!.people_group_name,
      slug: subs[0]!.people_group_slug,
      reminders: subs.map(sub => ({
        id: sub.id,
        delivery_method: sub.delivery_method,
        frequency: sub.frequency,
        days_of_week: sub.days_of_week ? JSON.parse(sub.days_of_week) : [],
        time_preference: sub.time_preference,
        timezone: sub.timezone,
        prayer_duration: sub.prayer_duration,
        status: sub.status
      }))
    }))

  // Build consent information (from primary contact method)
  const consents = {
    doxa_general: primaryEmail?.consent_doxa_general || false,
    doxa_general_at: primaryEmail?.consent_doxa_general_at || null,
    peopleGroups: (primaryEmail?.consented_people_group_ids || []).map(peopleGroupId => ({
      people_group_id: peopleGroupId,
      consented_at: primaryEmail?.consented_people_group_ids_at?.[String(peopleGroupId)] || null
    }))
  }

  return {
    subscriber: {
      id: subscriber.id,
      profile_id: subscriber.profile_id,
      name: subscriber.name,
      email: primaryEmail?.value || '',
      email_verified: primaryEmail?.verified || false,
      phone: primaryPhone?.value || ''
    },
    peopleGroups,
    consents
  }
})
