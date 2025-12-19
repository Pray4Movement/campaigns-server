<template>
  <div class="min-h-[calc(100vh-200px)]">
    <div v-if="pending" class="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
      <UIcon name="i-lucide-loader" class="w-10 h-10 animate-spin mb-4" />
      <p>{{ $t('campaign.loading') }}</p>
    </div>

    <div v-else-if="error" class="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
      <h2 class="text-2xl font-bold mb-4">{{ $t('campaign.notFound.title') }}</h2>
      <p class="text-[var(--ui-text-muted)] mb-6">{{ $t('campaign.notFound.message') }}</p>
      <UButton to="/">{{ $t('campaign.notFound.goHome') }}</UButton>
    </div>

    <div v-else-if="campaign" class="campaign-content">
      <!-- Hero Section -->
      <section class="py-8 text-center">
        <div class="max-w-3xl mx-auto px-4">
          <p class="text-xl text-[var(--ui-text-muted)] leading-relaxed">{{ campaign.description }}</p>
        </div>
      </section>

      <!-- Prayer Signup Section -->
      <section class="py-12">
        <div class="max-w-4xl mx-auto px-4">
          <UCard>
            <template #header>
              <div class="text-center">
                <h2 class="text-2xl font-bold">{{ $t('campaign.signup.title') }}</h2>
                <p class="text-[var(--ui-text-muted)] mt-2">{{ $t('campaign.signup.description') }}</p>
              </div>
            </template>

            <form @submit.prevent="handleSignup" class="grid md:grid-cols-2 gap-8">
              <!-- Left side: Visual selectors -->
              <div class="space-y-6">
                <!-- Frequency as visual cards -->
                <div>
                  <label class="text-sm font-medium mb-3 block">I will pray...</label>
                  <div class="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      @click="signupForm.frequency = 'daily'"
                      class="relative p-5 rounded-2xl border-2 transition-all group"
                      :class="signupForm.frequency === 'daily'
                        ? 'border-[var(--ui-text)] bg-[var(--ui-bg-elevated)]'
                        : 'border-[var(--ui-border)] hover:border-[var(--ui-text-muted)]'"
                    >
                      <UIcon name="i-lucide-sun" class="w-8 h-8 mb-2" />
                      <div class="font-semibold">Every Day</div>
                      <div v-if="signupForm.frequency === 'daily'" class="absolute top-2 right-2">
                        <UIcon name="i-lucide-check-circle-2" class="w-5 h-5" />
                      </div>
                    </button>
                    <button
                      type="button"
                      @click="signupForm.frequency = 'weekly'"
                      class="relative p-5 rounded-2xl border-2 transition-all group"
                      :class="signupForm.frequency === 'weekly'
                        ? 'border-[var(--ui-text)] bg-[var(--ui-bg-elevated)]'
                        : 'border-[var(--ui-border)] hover:border-[var(--ui-text-muted)]'"
                    >
                      <UIcon name="i-lucide-calendar-days" class="w-8 h-8 mb-2" />
                      <div class="font-semibold">Some Days</div>
                      <div v-if="signupForm.frequency === 'weekly'" class="absolute top-2 right-2">
                        <UIcon name="i-lucide-check-circle-2" class="w-5 h-5" />
                      </div>
                    </button>
                  </div>
                  <!-- Day selection for weekly frequency -->
                  <div v-if="signupForm.frequency === 'weekly'" class="grid grid-cols-7 gap-1 mt-3">
                    <label
                      v-for="day in translatedDaysOfWeek"
                      :key="day.value"
                      class="flex flex-col items-center gap-1 p-2 border border-[var(--ui-border)] rounded-lg cursor-pointer transition-colors hover:bg-[var(--ui-bg-elevated)]"
                      :class="{ 'border-[var(--ui-primary)] bg-[var(--ui-bg-elevated)]': signupForm.days_of_week.includes(day.value) }"
                    >
                      <UCheckbox
                        :model-value="signupForm.days_of_week.includes(day.value)"
                        @update:model-value="toggleDayOfWeek(day.value)"
                      />
                      <span class="text-xs font-medium">{{ day.label }}</span>
                    </label>
                  </div>
                </div>

                <!-- Duration as slider-style pills -->
                <div>
                  <label class="text-sm font-medium mb-3 block">For...</label>
                  <div class="flex rounded-full border border-[var(--ui-border)] p-1 bg-[var(--ui-bg)]">
                    <button
                      v-for="dur in [5, 10, 15, 30, 60]"
                      :key="dur"
                      type="button"
                      @click="signupForm.prayer_duration = dur"
                      class="flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all"
                      :class="signupForm.prayer_duration === dur
                        ? 'bg-[var(--ui-text)] text-[var(--ui-bg)]'
                        : 'hover:bg-[var(--ui-bg-elevated)]'"
                    >
                      {{ dur < 60 ? `${dur}m` : '1h' }}
                    </button>
                  </div>
                </div>

                <!-- Time picker -->
                <div>
                  <label class="text-sm font-medium mb-3 block">Reminder time</label>
                  <TimePicker
                    v-model="signupForm.reminder_time"
                    size="lg"
                    class="w-full"
                  />
                </div>

                <!-- Timezone -->
                <div>
                  <label class="text-sm font-medium mb-3 block">{{ $t('campaign.signup.form.timezone.label') }}</label>
                  <USelectMenu
                    v-model="userTimezone"
                    :items="timezoneOptions"
                    searchable
                    :search-placeholder="$t('campaign.signup.form.timezone.searchPlaceholder')"
                    class="w-full"
                  />
                </div>
              </div>

              <!-- Right side: Contact -->
              <div class="space-y-6">
                <div>
                  <label class="text-sm font-medium mb-3 block">{{ $t('campaign.signup.form.name.label') }}</label>
                  <UInput
                    v-model="signupForm.name"
                    :placeholder="$t('campaign.signup.form.name.placeholder')"
                    size="lg"
                    class="w-full"
                  />
                </div>

                <div>
                  <label class="text-sm font-medium mb-3 block">{{ $t('campaign.signup.form.email.label') }}</label>
                  <UInput
                    v-model="signupForm.email"
                    type="email"
                    :placeholder="$t('campaign.signup.form.email.placeholder')"
                    size="lg"
                    class="w-full"
                  />
                </div>

                <!-- Stay Connected -->
                <div class="border-t border-[var(--ui-border)] pt-4 space-y-3">
                  <p class="text-sm text-[var(--ui-text-muted)]">
                    {{ $t('campaign.signup.form.consent.description') }}
                  </p>
                  <UCheckbox
                    v-model="signupForm.consent_campaign_updates"
                    :label="$t('campaign.signup.form.consent.campaignUpdates', { campaign: campaign?.title })"
                  />
                  <UCheckbox
                    v-model="signupForm.consent_doxa_general"
                    :label="$t('campaign.signup.form.consent.doxaGeneral')"
                  />
                </div>

                <UButton
                  type="submit"
                  block
                  size="lg"
                  :loading="submitting"
                  :disabled="!signupForm.name || !signupForm.email || (signupForm.frequency === 'weekly' && signupForm.days_of_week.length === 0)"
                >
                  {{ submitting ? $t('campaign.signup.form.submitting') : $t('campaign.signup.form.submit') }}
                </UButton>

                <!-- Error Message -->
                <UAlert v-if="signupError" color="error" :title="signupError" />
              </div>
            </form>
          </UCard>
        </div>
      </section>

      <!-- Prayer Fuel Link Section -->
      <section class="py-12">
        <div class="max-w-3xl mx-auto px-4">
          <UCard class="text-center">
            <h2 class="text-2xl font-bold mb-3">{{ $t('campaign.prayerFuel.title') }}</h2>
            <p class="text-[var(--ui-text-muted)] mb-6">{{ $t('campaign.prayerFuel.description') }}</p>
            <UButton
              :to="localePath(`/${campaign.slug}/prayer-fuel`)"
              size="lg"
              variant="outline"
            >
              {{ $t('campaign.prayerFuel.button') }}
            </UButton>
          </UCard>
        </div>
      </section>

      <!-- Mobile App Links Section -->
      <section class="py-12">
        <div class="max-w-3xl mx-auto px-4">
          <UCard class="text-center">
            <h2 class="text-2xl font-bold mb-3">{{ $t('campaign.mobileApp.title') }}</h2>
            <p class="text-[var(--ui-text-muted)] mb-6">
              {{ $t('campaign.mobileApp.description') }}
            </p>

            <div class="flex gap-4 justify-center flex-wrap">
              <UButton href="#" variant="outline" size="lg" :aria-label="$t('campaign.mobileApp.appStore.ariaLabel')">
                <div class="flex flex-col items-start text-left min-w-[140px]">
                  <span class="text-xs opacity-80">{{ $t('campaign.mobileApp.appStore.label') }}</span>
                  <span class="text-lg font-semibold">{{ $t('campaign.mobileApp.appStore.store') }}</span>
                </div>
              </UButton>
              <UButton href="#" variant="outline" size="lg" :aria-label="$t('campaign.mobileApp.googlePlay.ariaLabel')">
                <div class="flex flex-col items-start text-left min-w-[140px]">
                  <span class="text-xs opacity-80">{{ $t('campaign.mobileApp.googlePlay.label') }}</span>
                  <span class="text-lg font-semibold">{{ $t('campaign.mobileApp.googlePlay.store') }}</span>
                </div>
              </UButton>
            </div>
          </UCard>
        </div>
      </section>

      <!-- Email Verification Modal -->
      <UModal v-model:open="showVerificationModal">
        <template #content>
          <div class="p-8 text-center">
            <div class="flex items-center justify-center gap-3 mb-6">
              <UIcon name="i-lucide-mail" class="w-10 h-10 text-[var(--ui-text)] animate-pulse" />
              <h2 class="text-2xl font-semibold">{{ $t('campaign.signup.modal.title') }}</h2>
            </div>
            <p class="text-[var(--ui-text-muted)] mb-2">{{ $t('campaign.signup.modal.message') }}</p>
            <p class="text-lg font-semibold mb-4 break-all">{{ verificationEmail }}</p>
            <p class="text-sm text-[var(--ui-text-muted)] mb-8">{{ $t('campaign.signup.modal.hint') }}</p>
            <UButton
              size="lg"
              @click="closeVerificationModal"
            >
              {{ $t('campaign.signup.modal.button') }}
            </UButton>
          </div>
        </template>
      </UModal>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const route = useRoute()
const slug = route.params.slug as string
const { t } = useI18n()
const localePath = useLocalePath()

// Fetch campaign data
const { data, pending, error } = await useFetch(`/api/campaigns/${slug}`)
const campaign = computed(() => data.value?.campaign)

// Campaign title management
const { setCampaignTitle } = useCampaign()

// Set campaign title when campaign is loaded
watch(campaign, (newCampaign) => {
  if (newCampaign?.title) {
    setCampaignTitle(newCampaign.title)
  }
}, { immediate: true })


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

// Common timezone options (grouped by region)
const timezoneOptions = [
  // Americas
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
  // Europe
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
  // Asia
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
  // Pacific
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Honolulu',
  // Australia
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Brisbane',
  'Australia/Perth',
  // Africa
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  // Other
  'UTC'
]

// Auto-detect user's timezone
const userTimezone = ref('UTC')
onMounted(() => {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    // Use detected timezone if it's in our list, otherwise keep it anyway
    userTimezone.value = detected || 'UTC'
    // Add detected timezone to options if not already there
    if (detected && !timezoneOptions.includes(detected)) {
      timezoneOptions.unshift(detected)
    }
  } catch {
    userTimezone.value = 'UTC'
  }
})

// Signup form state
const signupForm = ref({
  name: '',
  delivery_method: 'email',
  email: '',
  frequency: 'daily',
  days_of_week: [] as number[],
  reminder_time: '09:00',
  prayer_duration: 10,
  consent_campaign_updates: false,
  consent_doxa_general: false
})

const submitting = ref(false)
const signupSuccess = ref(false)
const signupError = ref('')

// Email verification modal state
const showVerificationModal = ref(false)
const verificationEmail = ref('')

// Toggle day of week selection
function toggleDayOfWeek(day: number) {
  const index = signupForm.value.days_of_week.indexOf(day)
  if (index === -1) {
    signupForm.value.days_of_week.push(day)
  } else {
    signupForm.value.days_of_week.splice(index, 1)
  }
}

// Reset form helper
function resetForm() {
  signupForm.value = {
    name: '',
    delivery_method: 'email',
    email: '',
    frequency: 'daily',
    days_of_week: [],
    reminder_time: '09:00',
    prayer_duration: 10,
    consent_campaign_updates: false,
    consent_doxa_general: false
  }
}

// Close verification modal
function closeVerificationModal() {
  showVerificationModal.value = false
  verificationEmail.value = ''
}

// Handle form submission
async function handleSignup() {
  // Validate weekly frequency has at least one day selected
  if (signupForm.value.frequency === 'weekly' && signupForm.value.days_of_week.length === 0) {
    signupError.value = t('campaign.signup.form.daysOfWeek.error')
    return
  }

  submitting.value = true
  signupSuccess.value = false
  signupError.value = ''

  try {
    const response = await $fetch(`/api/campaigns/${slug}/signup`, {
      method: 'POST',
      body: {
        name: signupForm.value.name,
        email: signupForm.value.email,
        delivery_method: signupForm.value.delivery_method,
        frequency: signupForm.value.frequency,
        days_of_week: signupForm.value.days_of_week,
        reminder_time: signupForm.value.reminder_time,
        prayer_duration: signupForm.value.prayer_duration,
        timezone: userTimezone.value,
        consent_campaign_updates: signupForm.value.consent_campaign_updates,
        consent_doxa_general: signupForm.value.consent_doxa_general
      }
    })

    console.log('Signup successful:', response)

    // For email signups, always show verification modal
    if (signupForm.value.delivery_method === 'email') {
      verificationEmail.value = signupForm.value.email
      showVerificationModal.value = true
      resetForm()
    } else {
      // For non-email signups, show inline success message
      signupSuccess.value = true
      setTimeout(() => {
        resetForm()
        signupSuccess.value = false
      }, 5000)
    }
  } catch (err: any) {
    signupError.value = err.data?.statusMessage || err.message || t('campaign.signup.errors.failed')
  } finally {
    submitting.value = false
  }
}

// Set page title
useHead(() => ({
  title: campaign.value ? `${campaign.value.title} - ${t('app.title')}` : `${t('campaign.pageTitle')} - ${t('app.title')}`
}))
</script>

