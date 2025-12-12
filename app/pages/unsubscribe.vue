<template>
  <div class="min-h-[calc(100vh-200px)] py-8 px-4">
    <div v-if="pending" class="flex items-center justify-center min-h-[50vh]">
      <div class="text-center">
        <UIcon name="i-lucide-loader" class="w-10 h-10 animate-spin mb-4" />
        <p>{{ $t('campaign.unsubscribe.processing') }}</p>
      </div>
    </div>

    <div v-else-if="error" class="flex items-center justify-center min-h-[50vh]">
      <UCard class="max-w-md w-full text-center">
        <UIcon name="i-lucide-alert-circle" class="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h1 class="text-2xl font-bold mb-4">{{ $t('campaign.unsubscribe.error.title') }}</h1>
        <p class="text-[var(--ui-text-muted)] mb-6">
          {{ error.data?.statusMessage || $t('campaign.unsubscribe.error.message') }}
        </p>
        <UButton :to="localePath('/')">
          {{ $t('campaign.unsubscribe.error.goHome') }}
        </UButton>
      </UCard>
    </div>

    <!-- Resubscribed successfully -->
    <div v-else-if="resubscribed" class="flex items-center justify-center min-h-[50vh]">
      <UCard class="max-w-md w-full text-center">
        <UIcon name="i-lucide-check-circle" class="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h1 class="text-2xl font-bold mb-4">{{ $t('campaign.unsubscribe.resubscribed.title') }}</h1>
        <p class="text-[var(--ui-text-muted)] mb-6">
          {{ $t('campaign.unsubscribe.resubscribed.message') }}
        </p>
        <UButton :to="localePath(`/${data?.campaign?.slug}`)">
          {{ $t('campaign.unsubscribe.resubscribed.viewCampaign') }}
        </UButton>
      </UCard>
    </div>

    <!-- Main unsubscribe content -->
    <div v-else-if="data" class="max-w-2xl mx-auto">
      <!-- Success message -->
      <UCard class="mb-6 text-center">
        <UIcon name="i-lucide-check-circle" class="w-12 h-12 mx-auto mb-4 text-green-500" />
        <h1 class="text-2xl font-bold mb-2">
          {{ data.already_unsubscribed ? $t('campaign.unsubscribe.alreadyDone.title') : $t('campaign.unsubscribe.success.title') }}
        </h1>
        <p class="text-[var(--ui-text-muted)]">
          {{ data.unsubscribed_from_campaign
            ? $t('campaign.unsubscribe.unsubscribedFromCampaign', { campaign: data.campaign.title })
            : data.already_unsubscribed
              ? $t('campaign.unsubscribe.alreadyDone.message')
              : $t('campaign.unsubscribe.success.message')
          }}
        </p>

        <!-- Show unsubscribed reminder details -->
        <div v-if="data.unsubscribed_reminder && !data.unsubscribed_from_campaign" class="mt-4 p-3 bg-[var(--ui-bg-elevated)] rounded-lg text-sm">
          <p class="font-medium">{{ data.campaign.title }} - {{ formatReminderSchedule(data.unsubscribed_reminder) }}</p>
        </div>

        <!-- Resubscribe button -->
        <div class="mt-6">
          <UButton @click="resubscribe" :loading="resubscribing" variant="outline">
            {{ resubscribing ? $t('campaign.unsubscribe.success.resubscribing') : $t('campaign.unsubscribe.success.resubscribe') }}
          </UButton>
        </div>
      </UCard>

      <!-- All Subscriptions -->
      <div v-if="allCampaigns.length > 0">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <UIcon name="i-lucide-bell" class="w-5 h-5" />
          Your Subscriptions
        </h2>

        <div class="space-y-4">
          <UCard v-for="campaign in allCampaigns" :key="campaign.id">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ campaign.title }}</span>
                  <UBadge v-if="campaign.id === data.campaign.id" color="primary" size="xs">Current</UBadge>
                </div>
                <UBadge color="neutral" size="xs">
                  {{ activeRemindersCount(campaign) }} active
                </UBadge>
              </div>
            </template>

            <div class="space-y-2">
              <div
                v-for="reminder in campaign.reminders"
                :key="reminder.id"
                class="flex items-center justify-between p-3 border border-[var(--ui-border)] rounded-lg"
                :class="{ 'opacity-60': reminder.status === 'unsubscribed' }"
              >
                <div class="flex items-center gap-2">
                  <span class="text-sm">{{ formatReminderSchedule(reminder) }}</span>
                  <UBadge v-if="reminder.status === 'unsubscribed'" color="neutral" size="xs">
                    {{ $t('campaign.profile.unsubscribed') }}
                  </UBadge>
                </div>
                <UButton
                  v-if="reminder.status === 'active'"
                  size="xs"
                  variant="ghost"
                  color="error"
                  :loading="unsubscribingId === reminder.id"
                  @click="unsubscribeFromReminder(campaign.slug, campaign.id, reminder.id)"
                >
                  Unsubscribe
                </UButton>
                <UButton
                  v-else
                  size="xs"
                  variant="ghost"
                  :loading="resubscribingId === reminder.id"
                  @click="resubscribeReminder(campaign.slug, reminder.id)"
                >
                  {{ $t('campaign.profile.resubscribeButton') }}
                </UButton>
              </div>
            </div>

            <!-- Unsubscribe from entire campaign -->
            <div v-if="activeRemindersCount(campaign) > 1" class="mt-4 pt-4 border-t border-[var(--ui-border)]">
              <UButton
                variant="outline"
                color="error"
                size="sm"
                :loading="unsubscribingFromCampaignId === campaign.id"
                @click="unsubscribeFromEntireCampaign(campaign)"
                class="w-full"
              >
                Unsubscribe from all {{ campaign.title }} reminders
              </UButton>
            </div>
          </UCard>
        </div>
      </div>

      <!-- No subscriptions message -->
      <div v-else class="text-center text-[var(--ui-text-muted)] mt-6">
        <p>You have no active subscriptions.</p>
      </div>

      <!-- Communication Preferences -->
      <div v-if="profileData?.consents" class="mt-6">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <UIcon name="i-lucide-mail" class="w-5 h-5" />
          {{ $t('campaign.profile.sections.emailPreferences') }}
        </h2>

        <UCard>
          <div class="space-y-4">
            <p class="text-sm text-[var(--ui-text-muted)]">
              {{ $t('campaign.profile.emailPreferences.description') }}
            </p>

            <!-- Doxa General Consent -->
            <div class="flex items-center justify-between py-2 border-b border-[var(--ui-border)]">
              <div>
                <p class="text-sm font-medium">{{ $t('campaign.profile.emailPreferences.doxaGeneral') }}</p>
                <p class="text-xs text-[var(--ui-text-muted)]">{{ $t('campaign.profile.emailPreferences.doxaGeneralHint') }}</p>
              </div>
              <UToggle
                v-model="consentForm.doxa_general"
                @update:model-value="updateDoxaConsent"
              />
            </div>

            <!-- Campaign-specific consents -->
            <div
              v-for="campaign in allCampaigns"
              :key="'consent-' + campaign.id"
              class="flex items-center justify-between py-2"
            >
              <p class="text-sm">{{ $t('campaign.profile.emailPreferences.campaignUpdates', { campaign: campaign.title }) }}</p>
              <UToggle
                :model-value="isCampaignConsented(campaign.id)"
                @update:model-value="(val: boolean) => updateCampaignConsent(campaign.id, campaign.slug, val)"
              />
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

interface Reminder {
  id: number
  frequency: string
  days_of_week: number[]
  time_preference: string
  timezone: string
  status: 'active' | 'unsubscribed'
}

interface Campaign {
  id: number
  title: string
  slug: string
  reminders: Reminder[]
}

interface UnsubscribeData {
  success: boolean
  message: string
  already_unsubscribed: boolean
  unsubscribed_from_campaign: boolean
  campaign: {
    id: number
    title: string
    slug: string
  }
  unsubscribed_reminder: Reminder | null
  other_reminders_in_campaign: Reminder[]
  other_campaigns: Campaign[]
}

const route = useRoute()
const slug = route.query.slug as string
const profileId = route.query.id as string
const subscriptionId = route.query.sid as string | undefined
const { t } = useI18n()
const localePath = useLocalePath()
const toast = useToast()

// Call the unsubscribe API
const { data, pending, error } = await useFetch<UnsubscribeData>(`/api/campaigns/${slug}/unsubscribe`, {
  query: { id: profileId, sid: subscriptionId }
})

// Fetch profile data for consent information
const { data: profileData } = await useFetch(`/api/campaigns/${slug}/profile`, {
  query: { id: profileId }
})

// Consent form state
const consentForm = ref({
  doxa_general: false,
  campaign_ids: [] as number[]
})

// Initialize consent form when profile data loads
watch(profileData, (newData) => {
  if (newData?.consents) {
    consentForm.value = {
      doxa_general: newData.consents.doxa_general || false,
      campaign_ids: (newData.consents.campaigns || []).map((c: any) => c.campaign_id)
    }
  }
}, { immediate: true })

// State
const resubscribing = ref(false)
const resubscribed = ref(false)
const unsubscribingId = ref<number | null>(null)
const unsubscribingFromCampaignId = ref<number | null>(null)
const resubscribingId = ref<number | null>(null)

// Local reactive copy of campaigns for UI updates
const localCampaigns = ref<Campaign[]>([])

// Initialize local campaigns when data loads
watch(data, (newData) => {
  if (newData) {
    const campaigns: Campaign[] = []

    // Add current campaign if it has reminders
    if (newData.other_reminders_in_campaign && newData.other_reminders_in_campaign.length > 0) {
      campaigns.push({
        id: newData.campaign.id,
        title: newData.campaign.title,
        slug: newData.campaign.slug,
        reminders: newData.other_reminders_in_campaign.map(r => ({ ...r, status: r.status || 'active' as const }))
      })
    }

    // Add other campaigns
    if (newData.other_campaigns) {
      campaigns.push(...newData.other_campaigns.map(c => ({
        ...c,
        reminders: c.reminders.map(r => ({ ...r, status: r.status || 'active' as const }))
      })))
    }

    localCampaigns.value = campaigns
  }
}, { immediate: true })

// Use local campaigns for display
const allCampaigns = computed(() => localCampaigns.value)

// Count active reminders in a campaign
function activeRemindersCount(campaign: Campaign): number {
  return campaign.reminders.filter(r => r.status === 'active').length
}

// Format reminder schedule for display
function formatReminderSchedule(reminder: Reminder) {
  const time = reminder.time_preference
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (reminder.frequency === 'daily') {
    return t('campaign.unsubscribe.reminderFormat.daily', { time })
  } else {
    const days = reminder.days_of_week.map(d => dayNames[d]).join(', ')
    return t('campaign.unsubscribe.reminderFormat.weekly', { days, time })
  }
}

// Unsubscribe from a specific reminder
async function unsubscribeFromReminder(campaignSlug: string, campaignId: number, reminderId: number) {
  try {
    unsubscribingId.value = reminderId
    await $fetch(`/api/campaigns/${campaignSlug}/unsubscribe`, {
      query: { id: profileId, sid: reminderId }
    })

    // Mark reminder as unsubscribed
    const campaign = localCampaigns.value.find(c => c.id === campaignId)
    if (campaign) {
      const reminder = campaign.reminders.find(r => r.id === reminderId)
      if (reminder) {
        reminder.status = 'unsubscribed'
      }
    }

    toast.add({ title: 'Unsubscribed', description: 'Successfully unsubscribed from this reminder', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Error', description: 'Failed to unsubscribe', color: 'error' })
  } finally {
    unsubscribingId.value = null
  }
}

// Unsubscribe from entire campaign
async function unsubscribeFromEntireCampaign(campaign: Campaign) {
  try {
    unsubscribingFromCampaignId.value = campaign.id
    await $fetch(`/api/campaigns/${campaign.slug}/unsubscribe`, {
      query: { id: profileId, all: 'true' }
    })

    // Mark all reminders in campaign as unsubscribed
    const localCampaign = localCampaigns.value.find(c => c.id === campaign.id)
    if (localCampaign) {
      localCampaign.reminders.forEach(r => {
        r.status = 'unsubscribed'
      })
    }

    toast.add({ title: 'Unsubscribed', description: `Unsubscribed from all ${campaign.title} reminders`, color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Error', description: 'Failed to unsubscribe', color: 'error' })
  } finally {
    unsubscribingFromCampaignId.value = null
  }
}

// Resubscribe to a specific reminder
async function resubscribeReminder(campaignSlug: string, reminderId: number) {
  try {
    resubscribingId.value = reminderId
    await $fetch(`/api/campaigns/${campaignSlug}/resubscribe`, {
      method: 'POST',
      body: { profile_id: profileId, subscription_id: reminderId }
    })

    // Mark reminder as active
    for (const campaign of localCampaigns.value) {
      const reminder = campaign.reminders.find(r => r.id === reminderId)
      if (reminder) {
        reminder.status = 'active'
        break
      }
    }

    toast.add({ title: 'Resubscribed', description: 'Successfully resubscribed to this reminder', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Error', description: 'Failed to resubscribe', color: 'error' })
  } finally {
    resubscribingId.value = null
  }
}

// Resubscribe to the reminder that was just unsubscribed (from the initial page load)
async function resubscribe() {
  try {
    resubscribing.value = true
    await $fetch(`/api/campaigns/${slug}/resubscribe`, {
      method: 'POST',
      body: { profile_id: profileId }
    })
    resubscribed.value = true
  } catch (err: any) {
    toast.add({ title: 'Error', description: 'Failed to resubscribe', color: 'error' })
  } finally {
    resubscribing.value = false
  }
}

// Check if a campaign is consented
function isCampaignConsented(campaignId: number): boolean {
  return consentForm.value.campaign_ids.includes(campaignId)
}

// Update Doxa general consent
async function updateDoxaConsent(granted: boolean) {
  try {
    await $fetch(`/api/campaigns/${slug}/profile`, {
      method: 'PUT',
      body: {
        profile_id: profileId,
        consent_doxa_general: granted
      }
    })

    toast.add({
      title: t('campaign.profile.consentUpdated'),
      color: 'success'
    })
  } catch (err: any) {
    // Revert on error
    consentForm.value.doxa_general = !granted
    toast.add({
      title: err.data?.statusMessage || t('campaign.profile.error.failed'),
      color: 'error'
    })
  }
}

// Update campaign-specific consent
async function updateCampaignConsent(campaignId: number, campaignSlug: string, granted: boolean) {
  try {
    await $fetch(`/api/campaigns/${campaignSlug}/profile`, {
      method: 'PUT',
      body: {
        profile_id: profileId,
        consent_campaign_updates: granted
      }
    })

    // Update local state
    if (granted) {
      if (!consentForm.value.campaign_ids.includes(campaignId)) {
        consentForm.value.campaign_ids.push(campaignId)
      }
    } else {
      consentForm.value.campaign_ids = consentForm.value.campaign_ids.filter(id => id !== campaignId)
    }

    toast.add({
      title: t('campaign.profile.consentUpdated'),
      color: 'success'
    })
  } catch (err: any) {
    toast.add({
      title: err.data?.statusMessage || t('campaign.profile.error.failed'),
      color: 'error'
    })
  }
}

// Set page title
useHead({
  title: t('campaign.unsubscribe.pageTitle')
})
</script>
