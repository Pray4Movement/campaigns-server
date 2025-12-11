<template>
  <div class="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
    <div v-if="pending" class="text-center">
      <UIcon name="i-lucide-loader" class="w-10 h-10 animate-spin mb-4" />
      <p>{{ $t('campaign.unsubscribe.processing') }}</p>
    </div>

    <UCard v-else class="max-w-md w-full text-center">
      <template v-if="error">
        <UIcon name="i-lucide-alert-circle" class="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h1 class="text-2xl font-bold mb-4">{{ $t('campaign.unsubscribe.error.title') }}</h1>
        <p class="text-[var(--ui-text-muted)] mb-6">
          {{ error.data?.statusMessage || $t('campaign.unsubscribe.error.message') }}
        </p>
        <UButton :to="localePath('/')">
          {{ $t('campaign.unsubscribe.error.goHome') }}
        </UButton>
      </template>

      <!-- Resubscribed successfully -->
      <template v-else-if="resubscribed">
        <UIcon name="i-lucide-check-circle" class="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h1 class="text-2xl font-bold mb-4">{{ $t('campaign.unsubscribe.resubscribed.title') }}</h1>
        <p class="text-[var(--ui-text-muted)] mb-6">
          {{ $t('campaign.unsubscribe.resubscribed.message') }}
        </p>
        <UButton :to="localePath(`/${data.campaign_slug}`)">
          {{ $t('campaign.unsubscribe.resubscribed.viewCampaign') }}
        </UButton>
      </template>

      <!-- Unsubscribed -->
      <template v-else-if="data">
        <UIcon name="i-lucide-check-circle" class="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h1 class="text-2xl font-bold mb-4">
          {{ data.already_unsubscribed ? $t('campaign.unsubscribe.alreadyDone.title') : $t('campaign.unsubscribe.success.title') }}
        </h1>
        <p class="text-[var(--ui-text-muted)] mb-4">
          {{ data.already_unsubscribed ? $t('campaign.unsubscribe.alreadyDone.message') : $t('campaign.unsubscribe.success.message') }}
        </p>

        <!-- Show unsubscribed reminder details -->
        <div v-if="data.unsubscribed_reminder" class="bg-[var(--ui-bg-elevated)] rounded-lg p-3 mb-4 text-sm">
          <p class="font-medium">{{ formatReminderSchedule(data.unsubscribed_reminder) }}</p>
        </div>

        <p class="text-sm text-[var(--ui-text-muted)] mb-6">
          {{ $t('campaign.unsubscribe.success.campaign', { title: data.campaign_title }) }}
        </p>

        <!-- Other reminders section -->
        <div v-if="data.other_reminders && data.other_reminders.length > 0" class="mb-6 text-left">
          <p class="text-sm font-medium mb-3 text-center">{{ $t('campaign.unsubscribe.otherReminders') }}</p>
          <div class="space-y-2">
            <div
              v-for="reminder in data.other_reminders"
              :key="reminder.id"
              class="flex items-center justify-between p-3 border border-[var(--ui-border)] rounded-lg"
            >
              <span class="text-sm">{{ formatReminderSchedule(reminder) }}</span>
              <UButton
                size="xs"
                variant="ghost"
                color="error"
                :loading="unsubscribingId === reminder.id"
                @click="unsubscribeReminder(reminder.id)"
              >
                {{ $t('campaign.unsubscribe.unsubscribeThis') }}
              </UButton>
            </div>
          </div>

          <!-- Unsubscribe from all button -->
          <div v-if="data.other_reminders.length > 1" class="mt-4 text-center">
            <UButton
              variant="outline"
              color="error"
              size="sm"
              :loading="unsubscribingAll"
              @click="unsubscribeAll"
            >
              {{ $t('campaign.unsubscribe.unsubscribeAll') }}
            </UButton>
          </div>
        </div>

        <UButton @click="resubscribe" :loading="resubscribing">
          {{ resubscribing ? $t('campaign.unsubscribe.success.resubscribing') : $t('campaign.unsubscribe.success.resubscribe') }}
        </UButton>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const route = useRoute()
const slug = route.params.slug as string
const profileId = route.query.id as string
const subscriptionId = route.query.sid as string | undefined
const { t } = useI18n()
const localePath = useLocalePath()

// Call the unsubscribe API
const { data, pending, error } = await useFetch(`/api/campaigns/${slug}/unsubscribe`, {
  query: { id: profileId, sid: subscriptionId }
})

// Resubscribe state
const resubscribing = ref(false)
const resubscribed = ref(false)

// Unsubscribe individual reminders
const unsubscribingId = ref<number | null>(null)
const unsubscribingAll = ref(false)

// Format reminder schedule for display
function formatReminderSchedule(reminder: { frequency: string; time_preference: string; days_of_week: number[]; timezone: string }) {
  const time = reminder.time_preference
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (reminder.frequency === 'daily') {
    return t('campaign.unsubscribe.reminderFormat.daily', { time })
  } else {
    const days = reminder.days_of_week.map(d => dayNames[d]).join(', ')
    return t('campaign.unsubscribe.reminderFormat.weekly', { days, time })
  }
}

async function unsubscribeReminder(reminderId: number) {
  try {
    unsubscribingId.value = reminderId
    await $fetch(`/api/campaigns/${slug}/unsubscribe`, {
      query: { id: profileId, sid: reminderId }
    })
    // Remove from list
    if (data.value?.other_reminders) {
      data.value.other_reminders = data.value.other_reminders.filter(r => r.id !== reminderId)
    }
  } catch (err: any) {
    console.error('Unsubscribe reminder error:', err)
  } finally {
    unsubscribingId.value = null
  }
}

async function unsubscribeAll() {
  if (!data.value?.other_reminders) return

  try {
    unsubscribingAll.value = true
    // Unsubscribe from each remaining reminder
    for (const reminder of data.value.other_reminders) {
      await $fetch(`/api/campaigns/${slug}/unsubscribe`, {
        query: { id: profileId, sid: reminder.id }
      })
    }
    data.value.other_reminders = []
  } catch (err: any) {
    console.error('Unsubscribe all error:', err)
  } finally {
    unsubscribingAll.value = false
  }
}

async function resubscribe() {
  try {
    resubscribing.value = true
    await $fetch(`/api/campaigns/${slug}/resubscribe`, {
      method: 'POST',
      body: { profile_id: profileId }
    })
    resubscribed.value = true
  } catch (err: any) {
    console.error('Resubscribe error:', err)
  } finally {
    resubscribing.value = false
  }
}

// Set page title
useHead({
  title: t('campaign.unsubscribe.pageTitle')
})
</script>
