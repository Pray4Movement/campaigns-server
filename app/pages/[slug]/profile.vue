<template>
  <div class="min-h-[calc(100vh-200px)] py-8 px-4">
    <div v-if="pending" class="flex items-center justify-center min-h-[50vh]">
      <div class="text-center">
        <UIcon name="i-lucide-loader" class="w-10 h-10 animate-spin mb-4" />
        <p>{{ $t('common.loading') }}</p>
      </div>
    </div>

    <div v-else-if="error" class="flex items-center justify-center min-h-[50vh]">
      <UCard class="max-w-md w-full text-center">
        <UIcon name="i-lucide-alert-circle" class="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h1 class="text-2xl font-bold mb-4">{{ $t('campaign.profile.error.title') }}</h1>
        <p class="text-[var(--ui-text-muted)] mb-6">
          {{ error.data?.statusMessage || $t('campaign.profile.error.notFound') }}
        </p>
        <UButton :to="localePath('/')">
          {{ $t('campaign.unsubscribe.error.goHome') }}
        </UButton>
      </UCard>
    </div>

    <div v-else-if="data" class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-2">
          <div class="p-2 rounded-full bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
            <UIcon name="i-lucide-settings" class="w-6 h-6" />
          </div>
          <div>
            <h1 class="text-2xl font-bold">{{ $t('campaign.profile.title') }}</h1>
          </div>
        </div>
        <p class="text-[var(--ui-text-muted)] mt-4">
          {{ $t('campaign.profile.greeting', { name: globalForm.name }) }}
        </p>
      </div>

      <!-- Email Verification Warning -->
      <UAlert
        v-if="!globalForm.email_verified && globalForm.email"
        color="warning"
        icon="i-lucide-alert-triangle"
        :title="$t('campaign.profile.emailNotVerified')"
        class="mb-6"
      />

      <!-- Success/Error Messages -->
      <UAlert v-if="saveSuccess" color="success" :title="successMessage" class="mb-6" />
      <UAlert v-if="saveError" color="error" :title="saveError" class="mb-6" />

      <!-- Global Account Settings -->
      <UCard class="mb-6">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-user" class="w-5 h-5" />
            <span class="font-medium">{{ $t('campaign.profile.sections.account') }}</span>
          </div>
        </template>

        <div class="space-y-4">
          <UFormField :label="$t('campaign.signup.form.name.label')">
            <UInput
              v-model="globalForm.name"
              type="text"
              required
              class="w-full"
            />
          </UFormField>

          <UFormField :label="$t('campaign.signup.form.email.label')">
            <UInput
              v-model="globalForm.email"
              type="email"
              class="w-full"
            />
            <template #hint>
              <span class="text-xs">{{ $t('campaign.profile.emailHint') }}</span>
            </template>
          </UFormField>

          <div class="flex justify-end">
            <UButton
              @click="saveGlobalSettings"
              :loading="savingGlobal"
              size="sm"
            >
              {{ $t('campaign.profile.saveAccount') }}
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Campaign Subscriptions -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold flex items-center gap-2">
          <UIcon name="i-lucide-bell" class="w-5 h-5" />
          {{ $t('campaign.profile.subscriptions') }}
        </h2>

        <div v-for="subscription in data.subscriptions" :key="subscription.id" class="relative">
          <UCard :class="{ 'opacity-60': subscription.status === 'unsubscribed' }">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ subscription.campaign_title }}</span>
                  <UBadge
                    v-if="subscription.status === 'unsubscribed'"
                    color="neutral"
                    size="xs"
                  >
                    {{ $t('campaign.profile.unsubscribed') }}
                  </UBadge>
                  <UBadge
                    v-else-if="subscription.campaign_id === data.campaign.id"
                    color="primary"
                    size="xs"
                  >
                    {{ $t('campaign.profile.current') }}
                  </UBadge>
                </div>
                <UButton
                  v-if="editingSubscription !== subscription.id"
                  variant="ghost"
                  size="xs"
                  @click="startEditingSubscription(subscription)"
                >
                  <UIcon name="i-lucide-pencil" class="w-4 h-4" />
                </UButton>
              </div>
            </template>

            <!-- View Mode -->
            <div v-if="editingSubscription !== subscription.id" class="text-sm space-y-2">
              <div class="flex justify-between">
                <span class="text-[var(--ui-text-muted)]">{{ $t('campaign.signup.form.frequency.label') }}:</span>
                <span>{{ subscription.frequency === 'daily' ? $t('campaign.signup.form.frequency.daily') : $t('campaign.signup.form.frequency.weekly') }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[var(--ui-text-muted)]">{{ $t('campaign.signup.form.time.label') }}:</span>
                <span>{{ subscription.time_preference }} ({{ subscription.timezone }})</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[var(--ui-text-muted)]">{{ $t('campaign.signup.form.duration.label') }}:</span>
                <span>{{ subscription.prayer_duration }} {{ $t('common.minutes') }}</span>
              </div>
            </div>

            <!-- Edit Mode -->
            <div v-else class="space-y-4">
              <UFormField :label="$t('campaign.signup.form.frequency.label')">
                <USelect
                  v-model="subscriptionForm.frequency"
                  :items="frequencyOptions"
                  required
                  class="w-full"
                />
              </UFormField>

              <UFormField v-if="subscriptionForm.frequency === 'weekly'" :label="$t('campaign.signup.form.daysOfWeek.label')">
                <div class="grid grid-cols-7 gap-1 w-full">
                  <label
                    v-for="day in translatedDaysOfWeek"
                    :key="day.value"
                    class="flex flex-col items-center gap-1 p-2 border border-[var(--ui-border)] rounded-lg cursor-pointer transition-colors hover:bg-[var(--ui-bg-elevated)]"
                    :class="{ 'border-[var(--ui-primary)] bg-[var(--ui-bg-elevated)]': subscriptionForm.days_of_week.includes(day.value) }"
                  >
                    <UCheckbox
                      :model-value="subscriptionForm.days_of_week.includes(day.value)"
                      @update:model-value="toggleDayOfWeek(day.value)"
                    />
                    <span class="text-xs font-medium">{{ day.label }}</span>
                  </label>
                </div>
              </UFormField>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField :label="$t('campaign.signup.form.time.label')">
                  <UInput
                    v-model="subscriptionForm.time_preference"
                    type="time"
                    required
                    class="w-full"
                  />
                </UFormField>

                <UFormField :label="$t('campaign.signup.form.timezone.label')">
                  <USelectMenu
                    v-model="subscriptionForm.timezone"
                    :items="timezoneOptions"
                    searchable
                    :search-placeholder="$t('campaign.signup.form.timezone.searchPlaceholder')"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <UFormField :label="$t('campaign.signup.form.duration.label')">
                <USelect
                  v-model="subscriptionForm.prayer_duration"
                  :items="durationOptions"
                  required
                  class="w-full"
                />
              </UFormField>

              <div class="flex items-center justify-between pt-2">
                <UButton
                  variant="ghost"
                  size="sm"
                  @click="cancelEditingSubscription"
                >
                  {{ $t('common.cancel') }}
                </UButton>
                <UButton
                  @click="saveSubscription(subscription)"
                  :loading="savingSubscription === subscription.id"
                  size="sm"
                >
                  {{ $t('campaign.profile.save') }}
                </UButton>
              </div>
            </div>

            <template #footer v-if="editingSubscription !== subscription.id">
              <div class="flex justify-between items-center">
                <NuxtLink
                  :to="localePath(`/${subscription.campaign_slug}`)"
                  class="text-sm text-[var(--ui-text-muted)] hover:underline"
                >
                  {{ $t('campaign.profile.viewCampaign') }}
                </NuxtLink>
                <UButton
                  v-if="subscription.status === 'active'"
                  variant="ghost"
                  color="error"
                  size="xs"
                  @click="confirmUnsubscribe(subscription)"
                >
                  {{ $t('campaign.profile.unsubscribeButton') }}
                </UButton>
                <UButton
                  v-else
                  variant="ghost"
                  size="xs"
                  @click="resubscribe(subscription)"
                >
                  {{ $t('campaign.profile.resubscribeButton') }}
                </UButton>
              </div>
            </template>
          </UCard>
        </div>
      </div>

      <!-- Back Button -->
      <div class="flex items-center justify-start pt-8">
        <UButton
          :to="localePath(`/${data.campaign.slug}`)"
          variant="ghost"
        >
          <UIcon name="i-lucide-arrow-left" class="w-4 h-4 mr-1" />
          {{ $t('prayerFuel.backTo', { campaign: data.campaign.title }) }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const route = useRoute()
const slug = route.params.slug as string
const trackingId = route.query.id as string
const { t } = useI18n()
const localePath = useLocalePath()
const toast = useToast()

// Fetch subscriber profile
const { data, pending, error, refresh } = await useFetch(`/api/campaigns/${slug}/profile`, {
  query: { id: trackingId }
})

// Global form state (name, email)
const globalForm = ref({
  name: '',
  email: '',
  email_verified: true
})

// Subscription form state (for editing individual subscriptions)
const subscriptionForm = ref({
  frequency: 'daily',
  days_of_week: [] as number[],
  time_preference: '09:00',
  timezone: 'UTC',
  prayer_duration: 10
})

// Edit state
const editingSubscription = ref<number | null>(null)
const savingGlobal = ref(false)
const savingSubscription = ref<number | null>(null)
const saveSuccess = ref(false)
const saveError = ref('')
const successMessage = ref('')

// Initialize global form with data
watch(data, (newData) => {
  if (newData?.subscriber) {
    globalForm.value = {
      name: newData.subscriber.name,
      email: newData.subscriber.email,
      email_verified: newData.subscriber.email_verified
    }
  }
}, { immediate: true })

// Frequency options
const frequencyOptions = computed(() => [
  { value: 'daily', label: t('campaign.signup.form.frequency.daily') },
  { value: 'weekly', label: t('campaign.signup.form.frequency.weekly') }
])

// Prayer duration options
const durationOptions = computed(() => [
  { value: 5, label: t('campaign.signup.form.duration.5min') },
  { value: 10, label: t('campaign.signup.form.duration.10min') },
  { value: 15, label: t('campaign.signup.form.duration.15min') },
  { value: 30, label: t('campaign.signup.form.duration.30min') },
  { value: 60, label: t('campaign.signup.form.duration.60min') }
])

// Days of week
const translatedDaysOfWeek = computed(() => [
  { value: 0, label: t('campaign.signup.form.daysOfWeek.days.sun') },
  { value: 1, label: t('campaign.signup.form.daysOfWeek.days.mon') },
  { value: 2, label: t('campaign.signup.form.daysOfWeek.days.tue') },
  { value: 3, label: t('campaign.signup.form.daysOfWeek.days.wed') },
  { value: 4, label: t('campaign.signup.form.daysOfWeek.days.thu') },
  { value: 5, label: t('campaign.signup.form.daysOfWeek.days.fri') },
  { value: 6, label: t('campaign.signup.form.daysOfWeek.days.sat') }
])

// Timezone options
const timezoneOptions = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'America/Phoenix', 'America/Toronto', 'America/Vancouver',
  'America/Mexico_City', 'America/Bogota', 'America/Lima', 'America/Santiago',
  'America/Buenos_Aires', 'America/Sao_Paulo', 'Europe/London', 'Europe/Dublin',
  'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome',
  'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Vienna', 'Europe/Warsaw',
  'Europe/Prague', 'Europe/Stockholm', 'Europe/Oslo', 'Europe/Helsinki',
  'Europe/Athens', 'Europe/Moscow', 'Asia/Dubai', 'Asia/Kolkata',
  'Asia/Bangkok', 'Asia/Singapore', 'Asia/Hong_Kong', 'Asia/Shanghai',
  'Asia/Tokyo', 'Asia/Seoul', 'Asia/Manila', 'Asia/Jakarta',
  'Pacific/Auckland', 'Pacific/Fiji', 'Pacific/Honolulu', 'Australia/Sydney',
  'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Perth',
  'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi', 'UTC'
]

function toggleDayOfWeek(day: number) {
  const index = subscriptionForm.value.days_of_week.indexOf(day)
  if (index === -1) {
    subscriptionForm.value.days_of_week.push(day)
  } else {
    subscriptionForm.value.days_of_week.splice(index, 1)
  }
}

function startEditingSubscription(subscription: any) {
  editingSubscription.value = subscription.id
  subscriptionForm.value = {
    frequency: subscription.frequency,
    days_of_week: subscription.days_of_week || [],
    time_preference: subscription.time_preference,
    timezone: subscription.timezone,
    prayer_duration: subscription.prayer_duration
  }
}

function cancelEditingSubscription() {
  editingSubscription.value = null
}

async function saveGlobalSettings() {
  savingGlobal.value = true
  saveSuccess.value = false
  saveError.value = ''

  try {
    const response = await $fetch(`/api/campaigns/${slug}/profile`, {
      method: 'PUT',
      body: {
        tracking_id: trackingId,
        name: globalForm.value.name,
        email: globalForm.value.email
      }
    })

    if (response.subscriber) {
      globalForm.value.email_verified = response.subscriber.email_verified
    }

    if (response.email_changed) {
      successMessage.value = t('campaign.profile.emailChanged')
    } else {
      successMessage.value = t('campaign.profile.success')
    }
    saveSuccess.value = true

    toast.add({ title: successMessage.value, color: 'success' })

    setTimeout(() => { saveSuccess.value = false }, 5000)
  } catch (err: any) {
    saveError.value = err.data?.statusMessage || err.message || t('campaign.profile.error.failed')
  } finally {
    savingGlobal.value = false
  }
}

async function saveSubscription(subscription: any) {
  if (subscriptionForm.value.frequency === 'weekly' && subscriptionForm.value.days_of_week.length === 0) {
    saveError.value = t('campaign.signup.form.daysOfWeek.error')
    return
  }

  savingSubscription.value = subscription.id
  saveSuccess.value = false
  saveError.value = ''

  try {
    await $fetch(`/api/campaigns/${subscription.campaign_slug}/profile`, {
      method: 'PUT',
      body: {
        tracking_id: trackingId,
        frequency: subscriptionForm.value.frequency,
        days_of_week: subscriptionForm.value.days_of_week,
        time_preference: subscriptionForm.value.time_preference,
        timezone: subscriptionForm.value.timezone,
        prayer_duration: subscriptionForm.value.prayer_duration
      }
    })

    successMessage.value = t('campaign.profile.success')
    saveSuccess.value = true
    editingSubscription.value = null

    toast.add({ title: successMessage.value, color: 'success' })

    await refresh()

    setTimeout(() => { saveSuccess.value = false }, 5000)
  } catch (err: any) {
    saveError.value = err.data?.statusMessage || err.message || t('campaign.profile.error.failed')
  } finally {
    savingSubscription.value = null
  }
}

async function confirmUnsubscribe(subscription: any) {
  if (!confirm(t('campaign.profile.unsubscribeConfirm', { campaign: subscription.campaign_title }))) {
    return
  }

  try {
    await $fetch(`/api/campaigns/${subscription.campaign_slug}/unsubscribe`, {
      query: { id: trackingId }
    })

    toast.add({
      title: t('campaign.profile.unsubscribeSuccess'),
      color: 'success'
    })

    await refresh()
  } catch (err: any) {
    toast.add({
      title: err.data?.statusMessage || t('campaign.profile.error.failed'),
      color: 'error'
    })
  }
}

async function resubscribe(subscription: any) {
  try {
    await $fetch(`/api/campaigns/${subscription.campaign_slug}/resubscribe`, {
      method: 'POST',
      body: { tracking_id: trackingId }
    })

    toast.add({
      title: t('campaign.profile.resubscribeSuccess'),
      color: 'success'
    })

    await refresh()
  } catch (err: any) {
    toast.add({
      title: err.data?.statusMessage || t('campaign.profile.error.failed'),
      color: 'error'
    })
  }
}

useHead({
  title: t('campaign.profile.pageTitle')
})
</script>
