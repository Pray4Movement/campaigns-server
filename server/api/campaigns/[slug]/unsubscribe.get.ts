import { campaignService } from '#server/database/campaigns'
import { subscriberService } from '#server/database/subscribers'
import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'

interface ReminderInfo {
  id: number
  frequency: string
  days_of_week: number[]
  time_preference: string
  timezone: string
}

interface CampaignInfo {
  id: number
  title: string
  slug: string
  reminders: ReminderInfo[]
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)
  const profileId = query.id as string
  const subscriptionId = query.sid ? Number(query.sid) : null
  // unsubscribe_all flag to unsubscribe from entire campaign
  const unsubscribeAll = query.all === 'true'

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campaign slug is required'
    })
  }

  if (!profileId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Profile ID is required'
    })
  }

  // Verify the campaign exists
  const campaign = await campaignService.getCampaignBySlug(slug)

  if (!campaign) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Campaign not found'
    })
  }

  // Get the subscriber by profile ID
  const subscriber = await subscriberService.getSubscriberByProfileId(profileId)

  if (!subscriber) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Subscription not found'
    })
  }

  // Get ALL subscriptions for this subscriber (across all campaigns)
  const allSubscriberSubscriptions = await campaignSubscriptionService.getSubscriberSubscriptions(subscriber.id)

  // Get subscriptions for this specific campaign
  const campaignSubscriptions = allSubscriberSubscriptions.filter(s => s.campaign_id === campaign.id)

  if (campaignSubscriptions.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'You are not subscribed to this campaign'
    })
  }

  // Helper to format reminder
  const formatReminder = (s: typeof campaignSubscriptions[0]): ReminderInfo => ({
    id: s.id,
    frequency: s.frequency,
    days_of_week: s.days_of_week ? JSON.parse(s.days_of_week) : [],
    time_preference: s.time_preference,
    timezone: s.timezone
  })

  // Helper to group subscriptions by campaign
  const groupByCampaign = (subs: typeof allSubscriberSubscriptions): CampaignInfo[] => {
    const campaignMap = new Map<number, CampaignInfo>()

    for (const sub of subs) {
      if (sub.status !== 'active') continue

      if (!campaignMap.has(sub.campaign_id)) {
        campaignMap.set(sub.campaign_id, {
          id: sub.campaign_id,
          title: sub.campaign_title,
          slug: sub.campaign_slug,
          reminders: []
        })
      }
      campaignMap.get(sub.campaign_id)!.reminders.push(formatReminder(sub))
    }

    return Array.from(campaignMap.values())
  }

  // If unsubscribe_all flag is set, unsubscribe from entire campaign
  if (unsubscribeAll) {
    const unsubscribedCount = await campaignSubscriptionService.unsubscribeAllForCampaign(
      subscriber.id,
      campaign.id
    )

    // Get other campaigns (excluding current one)
    const otherCampaigns = groupByCampaign(
      allSubscriberSubscriptions.filter(s => s.campaign_id !== campaign.id)
    )

    return {
      success: true,
      message: `Unsubscribed from all ${unsubscribedCount} reminder(s) for this campaign`,
      already_unsubscribed: false,
      unsubscribed_from_campaign: true,
      campaign: {
        id: campaign.id,
        title: campaign.title,
        slug: slug
      },
      unsubscribed_reminder: null,
      other_reminders_in_campaign: [],
      other_campaigns: otherCampaigns
    }
  }

  // Find the specific subscription to unsubscribe
  let subscriptionToUnsubscribe = subscriptionId
    ? campaignSubscriptions.find(s => s.id === subscriptionId)
    : campaignSubscriptions.find(s => s.status === 'active')

  // Get other campaigns (excluding current one)
  const otherCampaigns = groupByCampaign(
    allSubscriberSubscriptions.filter(s => s.campaign_id !== campaign.id)
  )

  if (!subscriptionToUnsubscribe) {
    const otherRemindersInCampaign = campaignSubscriptions
      .filter(s => s.status === 'active')
      .map(formatReminder)

    return {
      success: true,
      message: 'You have already been unsubscribed',
      already_unsubscribed: true,
      unsubscribed_from_campaign: false,
      campaign: {
        id: campaign.id,
        title: campaign.title,
        slug: slug
      },
      unsubscribed_reminder: null,
      other_reminders_in_campaign: otherRemindersInCampaign,
      other_campaigns: otherCampaigns
    }
  }

  // Check if this specific subscription is already unsubscribed
  if (subscriptionToUnsubscribe.status === 'unsubscribed') {
    const otherRemindersInCampaign = campaignSubscriptions
      .filter(s => s.id !== subscriptionToUnsubscribe!.id && s.status === 'active')
      .map(formatReminder)

    return {
      success: true,
      message: 'You have already been unsubscribed from this reminder',
      already_unsubscribed: true,
      unsubscribed_from_campaign: false,
      campaign: {
        id: campaign.id,
        title: campaign.title,
        slug: slug
      },
      unsubscribed_reminder: formatReminder(subscriptionToUnsubscribe),
      other_reminders_in_campaign: otherRemindersInCampaign,
      other_campaigns: otherCampaigns
    }
  }

  // Unsubscribe from this specific reminder
  const result = await campaignSubscriptionService.unsubscribe(subscriptionToUnsubscribe.id)

  if (!result) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to unsubscribe'
    })
  }

  // Get remaining active reminders in this campaign
  const otherRemindersInCampaign = campaignSubscriptions
    .filter(s => s.id !== subscriptionToUnsubscribe!.id && s.status === 'active')
    .map(formatReminder)

  return {
    success: true,
    message: 'Successfully unsubscribed from this reminder',
    already_unsubscribed: false,
    unsubscribed_from_campaign: false,
    campaign: {
      id: campaign.id,
      title: campaign.title,
      slug: slug
    },
    unsubscribed_reminder: formatReminder(subscriptionToUnsubscribe),
    other_reminders_in_campaign: otherRemindersInCampaign,
    other_campaigns: otherCampaigns
  }
})
