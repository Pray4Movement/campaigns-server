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
        <div class="max-w-3xl mx-auto px-4">
          <UCard>
            <template #header>
              <h2 class="text-2xl font-bold text-center">{{ $t('campaign.signup.title') }}</h2>
            </template>

            <p class="text-center text-[var(--ui-text-muted)] mb-8">
              {{ $t('campaign.signup.description') }}
            </p>

            <form @submit.prevent="handleSignup" class="max-w-md mx-auto space-y-6">
              <!-- Name Field -->
              <UFormField :label="$t('campaign.signup.form.name.label')" required class="w-full">
                <UInput
                  v-model="signupForm.name"
                  type="text"
                  required
                  :placeholder="$t('campaign.signup.form.name.placeholder')"
                  class="w-full"
                />
              </UFormField>

              <!-- Email Field -->
              <UFormField :label="$t('campaign.signup.form.email.label')" required class="w-full">
                <UInput
                  v-model="signupForm.email"
                  type="email"
                  required
                  :placeholder="$t('campaign.signup.form.email.placeholder')"
                  class="w-full"
                />
              </UFormField>

              <!-- Frequency -->
              <UFormField :label="$t('campaign.signup.form.frequency.label')" required class="w-full">
                <USelect
                  v-model="signupForm.frequency"
                  :items="frequencyOptions"
                  required
                  class="w-full"
                />
              </UFormField>

              <!-- Days of Week (for weekly frequency) -->
              <UFormField v-if="signupForm.frequency === 'weekly'" :label="$t('campaign.signup.form.daysOfWeek.label')" class="w-full">
                <div class="grid grid-cols-7 gap-1 w-full">
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
                <template #hint>
                  <span v-if="signupForm.days_of_week.length === 0" class="text-[var(--ui-text-muted)]">
                    {{ $t('campaign.signup.form.daysOfWeek.error') }}
                  </span>
                </template>
              </UFormField>

              <!-- Time Picker -->
              <UFormField :label="$t('campaign.signup.form.time.label')" required class="w-full">
                <UInput
                  v-model="signupForm.reminder_time"
                  type="time"
                  required
                  class="w-full"
                />
                <template #hint>
                  {{ $t('campaign.signup.form.time.hint') }}
                </template>
              </UFormField>

              <!-- Prayer Duration -->
              <UFormField :label="$t('campaign.signup.form.duration.label')" required class="w-full">
                <USelect
                  v-model="signupForm.prayer_duration"
                  :items="durationOptions"
                  required
                  class="w-full"
                />
              </UFormField>

              <!-- Submit Button -->
              <UButton
                type="submit"
                size="lg"
                block
                :loading="submitting"
              >
                {{ submitting ? $t('campaign.signup.form.submitting') : $t('campaign.signup.form.submit') }}
              </UButton>

              <!-- Success/Error Messages -->
              <UAlert v-if="signupSuccess" color="success" :title="$t('campaign.signup.success')" />
              <UAlert v-if="signupError" color="error" :title="signupError" />
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

// Signup form state
const signupForm = ref({
  name: '',
  delivery_method: 'email',
  email: '',
  frequency: 'daily',
  days_of_week: [] as number[],
  reminder_time: '09:00',
  prayer_duration: 10
})

const submitting = ref(false)
const signupSuccess = ref(false)
const signupRequiresVerification = ref(false)
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
    prayer_duration: 5
  }
  signupRequiresVerification.value = false
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
  signupRequiresVerification.value = false
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
        prayer_duration: signupForm.value.prayer_duration
      }
    })

    console.log('Signup successful:', response)
    signupRequiresVerification.value = response.requires_verification || false

    // For email signups, show verification modal
    if (signupRequiresVerification.value) {
      verificationEmail.value = signupForm.value.email
      showVerificationModal.value = true
      // Reset form immediately for email signups
      resetForm()
    } else {
      // For non-email signups, show inline success message
      signupSuccess.value = true
      // Reset form after success
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

