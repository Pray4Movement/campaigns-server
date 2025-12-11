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
            <p class="text-sm text-[var(--ui-text-muted)]">{{ data.campaign.title }}</p>
          </div>
        </div>
        <p class="text-[var(--ui-text-muted)] mt-4">
          {{ $t('campaign.profile.greeting', { name: form.name }) }}
        </p>
      </div>

      <!-- Email Verification Warning -->
      <UAlert
        v-if="!form.email_verified"
        color="warning"
        icon="i-lucide-alert-triangle"
        :title="$t('campaign.profile.emailNotVerified')"
        class="mb-6"
      />

      <!-- Success/Error Messages -->
      <UAlert v-if="saveSuccess" color="success" :title="successMessage" class="mb-6" />
      <UAlert v-if="saveError" color="error" :title="saveError" class="mb-6" />

      <form @submit.prevent="handleSave" class="space-y-4">
        <!-- Account Settings -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-user" class="w-5 h-5" />
              <span class="font-medium">{{ $t('campaign.profile.sections.account') }}</span>
            </div>
          </template>

          <div class="space-y-4">
            <UFormField :label="$t('campaign.signup.form.name.label')">
              <UInput
                v-model="form.name"
                type="text"
                required
                class="w-full"
              />
            </UFormField>

            <UFormField :label="$t('campaign.signup.form.email.label')">
              <UInput
                v-model="form.email"
                type="email"
                required
                class="w-full"
              />
              <template #hint>
                <span class="text-xs">{{ $t('campaign.profile.emailHint') }}</span>
              </template>
            </UFormField>
          </div>
        </UCard>

        <!-- Reminder Schedule -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-clock" class="w-5 h-5" />
              <span class="font-medium">{{ $t('campaign.profile.sections.schedule') }}</span>
            </div>
          </template>

          <div class="space-y-4">
            <UFormField :label="$t('campaign.signup.form.frequency.label')">
              <USelect
                v-model="form.frequency"
                :items="frequencyOptions"
                required
                class="w-full"
              />
            </UFormField>

            <!-- Days of Week (for weekly frequency) -->
            <UFormField v-if="form.frequency === 'weekly'" :label="$t('campaign.signup.form.daysOfWeek.label')">
              <div class="grid grid-cols-7 gap-1 w-full">
                <label
                  v-for="day in translatedDaysOfWeek"
                  :key="day.value"
                  class="flex flex-col items-center gap-1 p-2 border border-[var(--ui-border)] rounded-lg cursor-pointer transition-colors hover:bg-[var(--ui-bg-elevated)]"
                  :class="{ 'border-[var(--ui-primary)] bg-[var(--ui-bg-elevated)]': form.days_of_week.includes(day.value) }"
                >
                  <UCheckbox
                    :model-value="form.days_of_week.includes(day.value)"
                    @update:model-value="toggleDayOfWeek(day.value)"
                  />
                  <span class="text-xs font-medium">{{ day.label }}</span>
                </label>
              </div>
              <template #hint>
                <span v-if="form.days_of_week.length === 0" class="text-[var(--ui-text-muted)]">
                  {{ $t('campaign.signup.form.daysOfWeek.error') }}
                </span>
              </template>
            </UFormField>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField :label="$t('campaign.signup.form.time.label')">
                <UInput
                  v-model="form.time_preference"
                  type="time"
                  required
                  class="w-full"
                />
              </UFormField>

              <UFormField :label="$t('campaign.signup.form.timezone.label')">
                <USelectMenu
                  v-model="form.timezone"
                  :items="timezoneOptions"
                  searchable
                  :search-placeholder="$t('campaign.signup.form.timezone.searchPlaceholder')"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
        </UCard>

        <!-- Prayer Preferences -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-heart" class="w-5 h-5" />
              <span class="font-medium">{{ $t('campaign.profile.sections.prayer') }}</span>
            </div>
          </template>

          <UFormField :label="$t('campaign.signup.form.duration.label')">
            <USelect
              v-model="form.prayer_duration"
              :items="durationOptions"
              required
              class="w-full"
            />
          </UFormField>
        </UCard>

        <!-- Actions -->
        <div class="flex items-center justify-between pt-4">
          <UButton
            :to="localePath(`/${data.campaign.slug}`)"
            variant="ghost"
          >
            <UIcon name="i-lucide-arrow-left" class="w-4 h-4 mr-1" />
            {{ $t('prayerFuel.backTo', { campaign: data.campaign.title }) }}
          </UButton>

          <UButton
            type="submit"
            :loading="saving"
          >
            <UIcon name="i-lucide-save" class="w-4 h-4 mr-1" />
            {{ saving ? $t('campaign.profile.saving') : $t('campaign.profile.save') }}
          </UButton>
        </div>
      </form>
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
const { data, pending, error } = await useFetch(`/api/campaigns/${slug}/profile`, {
  query: { id: trackingId }
})

// Form state
const form = ref({
  name: '',
  email: '',
  frequency: 'daily',
  days_of_week: [] as number[],
  time_preference: '09:00',
  timezone: 'UTC',
  prayer_duration: 10,
  email_verified: true
})

// Initialize form with data
watch(data, (newData) => {
  if (newData?.subscriber) {
    form.value = {
      name: newData.subscriber.name,
      email: newData.subscriber.email,
      frequency: newData.subscriber.frequency,
      days_of_week: newData.subscriber.days_of_week || [],
      time_preference: newData.subscriber.time_preference,
      timezone: newData.subscriber.timezone,
      prayer_duration: newData.subscriber.prayer_duration,
      email_verified: newData.subscriber.email_verified
    }
  }
}, { immediate: true })

// Form submission state
const saving = ref(false)
const saveSuccess = ref(false)
const saveError = ref('')
const successMessage = ref('')

// Frequency options
const frequencyOptions = computed(() => [
  { value: 'daily', label: t('campaign.signup.form.frequency.daily') },
  { value: 'weekly', label: t('campaign.signup.form.frequency.weekly') }
])

// Prayer duration options (in minutes)
const durationOptions = computed(() => [
  { value: 5, label: t('campaign.signup.form.duration.5min') },
  { value: 10, label: t('campaign.signup.form.duration.10min') },
  { value: 15, label: t('campaign.signup.form.duration.15min') },
  { value: 30, label: t('campaign.signup.form.duration.30min') },
  { value: 60, label: t('campaign.signup.form.duration.60min') }
])

// Days of week for weekly frequency (translated)
const translatedDaysOfWeek = computed(() => [
  { value: 0, label: t('campaign.signup.form.daysOfWeek.days.sun') },
  { value: 1, label: t('campaign.signup.form.daysOfWeek.days.mon') },
  { value: 2, label: t('campaign.signup.form.daysOfWeek.days.tue') },
  { value: 3, label: t('campaign.signup.form.daysOfWeek.days.wed') },
  { value: 4, label: t('campaign.signup.form.daysOfWeek.days.thu') },
  { value: 5, label: t('campaign.signup.form.daysOfWeek.days.fri') },
  { value: 6, label: t('campaign.signup.form.daysOfWeek.days.sat') }
])

// Common timezone options
const timezoneOptions = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Phoenix',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/Buenos_Aires',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Dublin',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Amsterdam',
  'Europe/Brussels',
  'Europe/Vienna',
  'Europe/Warsaw',
  'Europe/Prague',
  'Europe/Stockholm',
  'Europe/Oslo',
  'Europe/Helsinki',
  'Europe/Athens',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Manila',
  'Asia/Jakarta',
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Honolulu',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Brisbane',
  'Australia/Perth',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  'UTC'
]

// Toggle day of week selection
function toggleDayOfWeek(day: number) {
  const index = form.value.days_of_week.indexOf(day)
  if (index === -1) {
    form.value.days_of_week.push(day)
  } else {
    form.value.days_of_week.splice(index, 1)
  }
}

// Handle form submission
async function handleSave() {
  // Validate weekly frequency has at least one day selected
  if (form.value.frequency === 'weekly' && form.value.days_of_week.length === 0) {
    saveError.value = t('campaign.signup.form.daysOfWeek.error')
    return
  }

  saving.value = true
  saveSuccess.value = false
  saveError.value = ''

  try {
    const response = await $fetch(`/api/campaigns/${slug}/profile`, {
      method: 'PUT',
      body: {
        tracking_id: trackingId,
        name: form.value.name,
        email: form.value.email,
        frequency: form.value.frequency,
        days_of_week: form.value.days_of_week,
        time_preference: form.value.time_preference,
        timezone: form.value.timezone,
        prayer_duration: form.value.prayer_duration
      }
    })

    // Update form with response data
    if (response.subscriber) {
      form.value.email_verified = response.subscriber.email_verified
    }

    // Show appropriate success message
    if (response.email_changed) {
      successMessage.value = t('campaign.profile.emailChanged')
    } else {
      successMessage.value = t('campaign.profile.success')
    }
    saveSuccess.value = true

    toast.add({
      title: successMessage.value,
      color: 'success'
    })

    // Clear success message after a few seconds
    setTimeout(() => {
      saveSuccess.value = false
    }, 5000)
  } catch (err: any) {
    saveError.value = err.data?.statusMessage || err.message || t('campaign.profile.error.failed')
  } finally {
    saving.value = false
  }
}

// Set page title
useHead({
  title: t('campaign.profile.pageTitle')
})
</script>
