<template>
  <div class="campaign-landing">
    <div v-if="pending" class="loading">
      <div class="spinner"></div>
      <p>{{ $t('campaign.loading') }}</p>
    </div>

    <div v-else-if="error" class="error-container">
      <h2>{{ $t('campaign.notFound.title') }}</h2>
      <p>{{ $t('campaign.notFound.message') }}</p>
      <NuxtLink to="/" class="btn-primary">{{ $t('campaign.notFound.goHome') }}</NuxtLink>
    </div>

    <div v-else-if="campaign" class="campaign-content">
      <!-- Hero Section -->
      <section class="hero">
        <div class="container">
          <p class="campaign-description">{{ campaign.description }}</p>
        </div>
      </section>

      <!-- Prayer Signup Section -->
      <section class="signup-section">
        <div class="container">
          <div class="card">
            <h2>{{ $t('campaign.signup.title') }}</h2>
            <p class="section-description">
              {{ $t('campaign.signup.description') }}
            </p>

            <form @submit.prevent="handleSignup" class="signup-form">
              <!-- Name Field -->
              <div class="form-group">
                <label for="name">{{ $t('campaign.signup.form.name.label') }}</label>
                <input
                  id="name"
                  v-model="signupForm.name"
                  type="text"
                  required
                  :placeholder="$t('campaign.signup.form.name.placeholder')"
                  class="form-input"
                />
              </div>

              <!-- Delivery Method -->
              <div class="form-group">
                <label for="delivery_method">{{ $t('campaign.signup.form.deliveryMethod.label') }}</label>
                <select
                  id="delivery_method"
                  v-model="signupForm.delivery_method"
                  required
                  class="form-select"
                >
                  <option value="">{{ $t('campaign.signup.form.deliveryMethod.placeholder') }}</option>
                  <option value="email">{{ $t('campaign.signup.form.deliveryMethod.email') }}</option>
                  <option value="whatsapp">{{ $t('campaign.signup.form.deliveryMethod.whatsapp') }}</option>
                  <option value="app">{{ $t('campaign.signup.form.deliveryMethod.app') }}</option>
                </select>
              </div>

              <!-- Email Field (conditional) -->
              <div v-if="signupForm.delivery_method === 'email'" class="form-group">
                <label for="email">{{ $t('campaign.signup.form.email.label') }}</label>
                <input
                  id="email"
                  v-model="signupForm.email"
                  type="email"
                  required
                  :placeholder="$t('campaign.signup.form.email.placeholder')"
                  class="form-input"
                />
              </div>

              <!-- Phone Field (conditional) -->
              <div v-if="signupForm.delivery_method === 'whatsapp'" class="form-group">
                <label for="phone">{{ $t('campaign.signup.form.phone.label') }}</label>
                <input
                  ref="phoneInput"
                  id="phone"
                  type="tel"
                  required
                  class="form-input"
                />
                <small class="form-hint">{{ $t('campaign.signup.form.phone.hint') }}</small>
              </div>

              <!-- Frequency -->
              <div class="form-group">
                <label for="frequency">{{ $t('campaign.signup.form.frequency.label') }}</label>
                <select
                  id="frequency"
                  v-model="signupForm.frequency"
                  required
                  class="form-select"
                >
                  <option value="daily">{{ $t('campaign.signup.form.frequency.daily') }}</option>
                  <option value="weekly">{{ $t('campaign.signup.form.frequency.weekly') }}</option>
                  <option value="custom">{{ $t('campaign.signup.form.frequency.custom') }}</option>
                </select>
              </div>

              <!-- Days of Week (for weekly frequency) -->
              <div v-if="signupForm.frequency === 'weekly'" class="form-group">
                <label>{{ $t('campaign.signup.form.daysOfWeek.label') }}</label>
                <div class="days-grid">
                  <label
                    v-for="day in translatedDaysOfWeek"
                    :key="day.value"
                    class="day-checkbox"
                  >
                    <input
                      v-model="signupForm.days_of_week"
                      type="checkbox"
                      :value="day.value"
                      class="checkbox-input"
                    />
                    <span class="day-label">{{ day.label }}</span>
                  </label>
                </div>
                <small v-if="signupForm.days_of_week.length === 0" class="form-hint error-hint">
                  {{ $t('campaign.signup.form.daysOfWeek.error') }}
                </small>
              </div>

              <!-- Time Picker -->
              <div class="form-group">
                <label for="reminder_time">{{ $t('campaign.signup.form.time.label') }}</label>
                <input
                  id="reminder_time"
                  v-model="signupForm.reminder_time"
                  type="time"
                  required
                  class="form-input"
                />
                <small class="form-hint">{{ $t('campaign.signup.form.time.hint') }}</small>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="btn-grey btn-large btn-submit"
                :disabled="submitting"
              >
                {{ submitting ? $t('campaign.signup.form.submitting') : $t('campaign.signup.form.submit') }}
              </button>

              <!-- Success/Error Messages -->
              <div v-if="signupSuccess" class="message message-success">
                {{ $t('campaign.signup.success') }}
              </div>
              <div v-if="signupError" class="message message-error">
                {{ signupError }}
              </div>
            </form>
          </div>
        </div>
      </section>

      <!-- Prayer Fuel Link Section -->
      <section class="prayer-fuel-section">
        <div class="container">
          <div class="card">
            <h2>{{ $t('campaign.prayerFuel.title') }}</h2>
            <p class="section-description">{{ $t('campaign.prayerFuel.description') }}</p>
            <NuxtLink
              :to="localePath(`/${campaign.slug}/prayer-fuel`)"
              class="btn-grey btn-large"
            >
              {{ $t('campaign.prayerFuel.button') }}
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Mobile App Links Section -->
      <section class="app-links-section">
        <div class="container">
          <div class="card">
            <h2>{{ $t('campaign.mobileApp.title') }}</h2>
            <p class="section-description">
              {{ $t('campaign.mobileApp.description') }}
            </p>

            <div class="app-buttons">
              <a href="#" class="btn-outline" :aria-label="$t('campaign.mobileApp.appStore.ariaLabel')">
                <div class="app-button-content">
                  <span class="app-button-label">{{ $t('campaign.mobileApp.appStore.label') }}</span>
                  <span class="app-button-store">{{ $t('campaign.mobileApp.appStore.store') }}</span>
                </div>
              </a>
              <a href="#" class="btn-outline" :aria-label="$t('campaign.mobileApp.googlePlay.ariaLabel')">
                <div class="app-button-content">
                  <span class="app-button-label">{{ $t('campaign.mobileApp.googlePlay.label') }}</span>
                  <span class="app-button-store">{{ $t('campaign.mobileApp.googlePlay.store') }}</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>
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
const signupError = ref('')

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
    signupSuccess.value = true

    // Reset form after success
    setTimeout(() => {
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
      signupSuccess.value = false
    }, 5000)
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
.campaign-landing {
  min-height: calc(100vh - 200px);
}

.loading,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border);
  border-top: 4px solid var(--text);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container h2 {
  margin-bottom: 1rem;
}

.error-container p {
  margin-bottom: 1.5rem;
  color: var(--text-muted, #666);
}

/* Container */
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Hero Section */
.hero {
  padding: 2rem 0 1rem;
  text-align: center;
}

.campaign-description {
  font-size: 1.25rem;
  color: var(--text-muted, #666);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Sections */
section {
  padding: 3rem 0;
}

.card {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
}

.card h2 {
  font-size: 1.75rem;
  margin-bottom: 0.75rem;
}

.section-description {
  color: var(--text-muted, #666);
  margin-bottom: 2rem;
  line-height: 1.6;
}

/* Buttons */
/* Solid button - for primary actions */
.btn-solid {
  display: inline-block;
  background: var(--text);
  color: var(--bg);
  border: 2px solid var(--text);
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-solid:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}

/* Outline button - for secondary actions */
.btn-outline {
  display: inline-block;
  background: transparent;
  color: var(--text);
  border: 2px solid var(--text);
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-outline:hover {
  background: var(--text);
  color: var(--bg);
  transform: translateY(-1px);
}

/* Ghost button - for tertiary actions */
.btn-ghost {
  display: inline-block;
  background: transparent;
  color: var(--text-muted);
  border: 2px solid transparent;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-ghost:hover {
  color: var(--text);
  border-color: var(--border);
  transform: translateY(-1px);
}

/* Grey button - charcoal with white text */
.btn-grey {
  display: inline-block;
  background: #555;
  color: white;
  border: 2px solid #555;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-grey:hover {
  background: #444;
  border-color: #444;
  transform: translateY(-1px);
}

/* Legacy support */
.btn-primary {
  display: inline-block;
  background: var(--text);
  color: var(--bg);
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  opacity: 0.85;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

/* Signup Form */
.signup-form {
  max-width: 500px;
  margin: 0 auto;
  text-align: left;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text);
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text);
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--text);
}

.form-select {
  cursor: pointer;
}

.form-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-muted, #666);
}

.form-hint.error-hint {
  color: var(--text);
  font-weight: 500;
}

/* Days of Week Checkboxes */
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.day-checkbox {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg);
}

.day-checkbox:hover {
  border-color: var(--text-muted);
  background: var(--bg-soft);
}

.day-checkbox:has(.checkbox-input:checked) {
  border-color: var(--text);
  background: var(--bg-soft);
}

.checkbox-input {
  cursor: pointer;
}

.day-label {
  font-size: 0.875rem;
  font-weight: 500;
  user-select: none;
}

.btn-submit {
  width: 100%;
  margin-top: 1rem;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Messages */
.message {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
  font-weight: 500;
}

.message-success {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  color: var(--text);
}

.message-error {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  color: var(--text);
}

/* App Links */
.app-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-outline .app-button-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  min-width: 140px;
}

.btn-outline .app-button-label {
  font-size: 0.75rem;
  opacity: 0.8;
}

.btn-outline .app-button-store {
  font-size: 1.125rem;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .campaign-description {
    font-size: 1rem;
  }

  .card {
    padding: 1.5rem;
  }

  .card h2 {
    font-size: 1.5rem;
  }

  section {
    padding: 2rem 0;
  }

  .days-grid {
    grid-template-columns: repeat(7, 1fr);
    gap: 0.25rem;
  }

  .day-checkbox {
    padding: 0.5rem 0.25rem;
  }

  .day-label {
    font-size: 0.75rem;
  }
}
</style>
