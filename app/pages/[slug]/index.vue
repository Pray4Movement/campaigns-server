<template>
  <div class="campaign-landing">
    <div v-if="pending" class="loading">
      <div class="spinner"></div>
      <p>Loading campaign...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <h2>Campaign Not Found</h2>
      <p>The campaign you're looking for doesn't exist or is not available.</p>
      <NuxtLink to="/" class="btn-primary">Go Home</NuxtLink>
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
            <h2>Join the Prayer Movement</h2>
            <p class="section-description">
              Commit to praying daily and receive helpful reminders via email, WhatsApp, or mobile app.
            </p>

            <form @submit.prevent="handleSignup" class="signup-form">
              <!-- Name Field -->
              <div class="form-group">
                <label for="name">Name</label>
                <input
                  id="name"
                  v-model="signupForm.name"
                  type="text"
                  required
                  placeholder="Your name"
                  class="form-input"
                />
              </div>

              <!-- Delivery Method -->
              <div class="form-group">
                <label for="delivery_method">How would you like to receive your daily prayer prompts?</label>
                <select
                  id="delivery_method"
                  v-model="signupForm.delivery_method"
                  required
                  class="form-select"
                >
                  <option value="">Select a method...</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="app">Mobile App</option>
                </select>
              </div>

              <!-- Email Field (conditional) -->
              <div v-if="signupForm.delivery_method === 'email'" class="form-group">
                <label for="email">Email Address</label>
                <input
                  id="email"
                  v-model="signupForm.email"
                  type="email"
                  required
                  placeholder="your@email.com"
                  class="form-input"
                />
              </div>

              <!-- Phone Field (conditional) -->
              <div v-if="signupForm.delivery_method === 'whatsapp'" class="form-group">
                <label for="phone">Phone Number</label>
                <input
                  ref="phoneInput"
                  id="phone"
                  type="tel"
                  required
                  class="form-input"
                />
                <small class="form-hint">Select your country and enter your phone number</small>
              </div>

              <!-- Frequency -->
              <div class="form-group">
                <label for="frequency">Prayer Frequency</label>
                <select
                  id="frequency"
                  v-model="signupForm.frequency"
                  required
                  class="form-select"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <!-- Days of Week (for weekly frequency) -->
              <div v-if="signupForm.frequency === 'weekly'" class="form-group">
                <label>Select Days</label>
                <div class="days-grid">
                  <label
                    v-for="day in daysOfWeek"
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
                  Please select at least one day
                </small>
              </div>

              <!-- Time Picker -->
              <div class="form-group">
                <label for="reminder_time">Preferred Time</label>
                <input
                  id="reminder_time"
                  v-model="signupForm.reminder_time"
                  type="time"
                  required
                  class="form-input"
                />
                <small class="form-hint">Your local time</small>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="btn-grey btn-large btn-submit"
                :disabled="submitting"
              >
                {{ submitting ? 'Joining...' : 'Commit to Prayer' }}
              </button>

              <!-- Success/Error Messages -->
              <div v-if="signupSuccess" class="message message-success">
                ✓ Welcome! You've joined the prayer movement. You'll receive your first prayer prompt soon.
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
            <h2>Today's Prayer</h2>
            <p class="section-description">Access today's prayer content and prompts</p>
            <NuxtLink
              :to="`/${campaign.slug}/prayer-fuel`"
              class="btn-grey btn-large"
            >
              View Prayer Fuel
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Mobile App Links Section -->
      <section class="app-links-section">
        <div class="container">
          <div class="card">
            <h2>Get the Mobile App</h2>
            <p class="section-description">
              Download our mobile app for a better prayer experience
            </p>

            <div class="app-buttons">
              <a href="#" class="btn-outline" aria-label="Download on App Store">
                <div class="app-button-content">
                  <span class="app-button-label">Download on</span>
                  <span class="app-button-store">App Store</span>
                </div>
              </a>
              <a href="#" class="btn-outline" aria-label="Get it on Google Play">
                <div class="app-button-content">
                  <span class="app-button-label">Get it on</span>
                  <span class="app-button-store">Google Play</span>
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

// Fetch campaign data
const { data, pending, error } = await useFetch(`/api/campaigns/${slug}`)
const campaign = computed(() => data.value?.campaign)

// Campaign title management
const { setCampaignTitle, resetCampaignTitle } = useCampaign()

// Set campaign title when campaign is loaded
watch(campaign, (newCampaign) => {
  if (newCampaign?.title) {
    setCampaignTitle(newCampaign.title)
  }
}, { immediate: true })

// Phone input ref and intl-tel-input instance
const phoneInput = ref<HTMLInputElement | null>(null)
let iti: Iti | null = null

// Days of week for weekly frequency
const daysOfWeek = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' }
]

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
    signupError.value = 'Please select at least one day for weekly reminders'
    return
  }

  // Get phone number if WhatsApp delivery
  let phoneNumber = signupForm.value.phone
  if (signupForm.value.delivery_method === 'whatsapp' && iti) {
    if (!iti.isValidNumber()) {
      signupError.value = 'Please enter a valid phone number'
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
    signupError.value = err.data?.statusMessage || err.message || 'Failed to sign up. Please try again.'
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
              initialCountry: 'us',
              preferredCountries: ['us', 'gb', 'ca', 'au'],
              utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.12/build/js/utils.js'
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
  resetCampaignTitle()
})

// Set page title
useHead(() => ({
  title: campaign.value ? `${campaign.value.title} - Prayer Tools` : 'Campaign - Prayer Tools'
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
