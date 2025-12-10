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
              <UFormField :label="$t('campaign.signup.form.name.label')" required>
                <UInput
                  v-model="signupForm.name"
                  type="text"
                  required
                  :placeholder="$t('campaign.signup.form.name.placeholder')"
                />
              </UFormField>

              <!-- Delivery Method -->
              <UFormField :label="$t('campaign.signup.form.deliveryMethod.label')" required>
                <USelect
                  v-model="signupForm.delivery_method"
                  :items="deliveryMethodOptions"
                  :placeholder="$t('campaign.signup.form.deliveryMethod.placeholder')"
                  required
                />
              </UFormField>

              <!-- Email Field (conditional) -->
              <UFormField v-if="signupForm.delivery_method === 'email'" :label="$t('campaign.signup.form.email.label')" required>
                <UInput
                  v-model="signupForm.email"
                  type="email"
                  required
                  :placeholder="$t('campaign.signup.form.email.placeholder')"
                />
              </UFormField>

              <!-- Phone Field (conditional) -->
              <UFormField v-if="signupForm.delivery_method === 'whatsapp'" :label="$t('campaign.signup.form.phone.label')" required>
                <input
                  ref="phoneInput"
                  id="phone"
                  type="tel"
                  required
                  class="w-full px-3 py-2 border border-[var(--ui-border)] rounded-md bg-[var(--ui-bg)] text-[var(--ui-text)] focus:outline-none focus:border-[var(--ui-primary)]"
                />
                <template #hint>
                  {{ $t('campaign.signup.form.phone.hint') }}
                </template>
              </UFormField>

              <!-- Frequency -->
              <UFormField :label="$t('campaign.signup.form.frequency.label')" required>
                <USelect
                  v-model="signupForm.frequency"
                  :items="frequencyOptions"
                  required
                />
              </UFormField>

              <!-- Days of Week (for weekly frequency) -->
              <UFormField v-if="signupForm.frequency === 'weekly'" :label="$t('campaign.signup.form.daysOfWeek.label')">
                <div class="grid grid-cols-7 gap-1">
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
              <UFormField :label="$t('campaign.signup.form.time.label')" required>
                <UInput
                  v-model="signupForm.reminder_time"
                  type="time"
                  required
                />
                <template #hint>
                  {{ $t('campaign.signup.form.time.hint') }}
                </template>
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
import intlTelInput from 'intl-tel-input'
import 'intl-tel-input/build/css/intlTelInput.css'
import type { Iti } from 'intl-tel-input'

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

// Phone input ref and intl-tel-input instance
const phoneInput = ref<HTMLInputElement | null>(null)
let iti: Iti | null = null

// Delivery method options
const deliveryMethodOptions = computed(() => [
  { value: 'email', label: t('campaign.signup.form.deliveryMethod.email') },
  { value: 'whatsapp', label: t('campaign.signup.form.deliveryMethod.whatsapp') },
  { value: 'app', label: t('campaign.signup.form.deliveryMethod.app') }
])

// Frequency options
const frequencyOptions = computed(() => [
  { value: 'daily', label: t('campaign.signup.form.frequency.daily') },
  { value: 'weekly', label: t('campaign.signup.form.frequency.weekly') },
  { value: 'custom', label: t('campaign.signup.form.frequency.custom') }
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
  delivery_method: '',
  email: '',
  phone: '',
  frequency: 'daily',
  days_of_week: [] as number[],
  reminder_time: '09:00'
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
    delivery_method: '',
    email: '',
    phone: '',
    frequency: 'daily',
    days_of_week: [],
    reminder_time: '09:00'
  }
  if (iti) {
    iti.setNumber('')
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

  // Get phone number if WhatsApp delivery
  let phoneNumber = signupForm.value.phone
  if (signupForm.value.delivery_method === 'whatsapp' && iti) {
    if (!iti.isValidNumber()) {
      signupError.value = t('campaign.signup.errors.invalidPhone')
      return
    }
    phoneNumber = iti.getNumber()
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
        phone: phoneNumber,
        delivery_method: signupForm.value.delivery_method,
        frequency: signupForm.value.frequency,
        days_of_week: signupForm.value.days_of_week,
        reminder_time: signupForm.value.reminder_time
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

// Initialize intl-tel-input when component mounts
onMounted(() => {
  // Watch for delivery method changes to initialize phone input
  watch(
    () => signupForm.value.delivery_method,
    (newMethod) => {
      if (newMethod === 'whatsapp') {
        // Wait for next tick to ensure phoneInput ref is available
        nextTick(() => {
          if (phoneInput.value && !iti) {
            iti = intlTelInput(phoneInput.value, {
              separateDialCode: true,
              initialCountry: 'us'
            })
          }
        })
      } else {
        // Clean up intl-tel-input when switching away from WhatsApp
        if (iti) {
          iti.destroy()
          iti = null
        }
      }
    },
    { immediate: true }
  )
})

// Clean up on unmount
onUnmounted(() => {
  if (iti) {
    iti.destroy()
    iti = null
  }
})

// Set page title
useHead(() => ({
  title: campaign.value ? `${campaign.value.title} - ${t('app.title')}` : `${t('campaign.pageTitle')} - ${t('app.title')}`
}))
</script>

<style scoped>
/* intl-tel-input styling overrides for theme compatibility */
:deep(.iti) {
  width: 100%;
}

:deep(.iti__selected-dial-code) {
  color: var(--ui-text);
}

:deep(.iti__country-list) {
  background-color: var(--ui-bg);
  border-color: var(--ui-border);
}

:deep(.iti__country:hover) {
  background-color: var(--ui-bg-elevated);
}

:deep(.iti__country.iti__highlight) {
  background-color: var(--ui-bg-elevated);
}
</style>
