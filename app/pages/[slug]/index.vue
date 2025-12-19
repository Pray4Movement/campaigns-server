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
                <TimePicker
                  v-model="signupForm.reminder_time"
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

      <!-- ============================================== -->
      <!-- ALTERNATIVE FORM DESIGNS FOR EXPLORATION -->
      <!-- ============================================== -->

      <!-- Alternative Form 1: Step-by-Step Wizard -->
      <section class="py-12 bg-[var(--ui-bg-elevated)]">
        <div class="max-w-3xl mx-auto px-4">
          <UCard>
            <template #header>
              <div class="text-center">
                <h2 class="text-2xl font-bold">Step-by-Step Wizard</h2>
              </div>
            </template>

            <!-- Progress Steps -->
            <div class="flex justify-center mb-8">
              <div class="flex items-center gap-2">
                <button
                  v-for="step in 4"
                  :key="step"
                  @click="wizardStep = step"
                  class="w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all"
                  :class="wizardStep === step
                    ? 'bg-[var(--ui-text)] text-[var(--ui-bg)]'
                    : wizardStep > step
                      ? 'bg-[var(--ui-text)] text-[var(--ui-bg)] opacity-50'
                      : 'border-2 border-[var(--ui-border)] text-[var(--ui-text-muted)]'"
                >
                  <UIcon v-if="wizardStep > step" name="i-lucide-check" class="w-5 h-5" />
                  <span v-else>{{ step }}</span>
                </button>
              </div>
            </div>

            <!-- Step 1: When to pray -->
            <div v-if="wizardStep === 1" class="text-center max-w-md mx-auto">
              <h3 class="text-xl font-semibold mb-2">When works best for you?</h3>
              <p class="text-[var(--ui-text-muted)] mb-6">Choose your prayer rhythm.</p>

              <div class="grid grid-cols-2 gap-3 mb-6">
                <button
                  @click="altForm1.frequency = 'daily'"
                  class="p-4 rounded-xl border-2 transition-all text-left"
                  :class="altForm1.frequency === 'daily'
                    ? 'border-[var(--ui-text)] bg-[var(--ui-bg-elevated)]'
                    : 'border-[var(--ui-border)] hover:border-[var(--ui-text-muted)]'"
                >
                  <div class="text-2xl mb-1">Every Day</div>
                  <div class="text-sm text-[var(--ui-text-muted)]">Build a daily habit</div>
                </button>
                <button
                  @click="altForm1.frequency = 'weekly'"
                  class="p-4 rounded-xl border-2 transition-all text-left"
                  :class="altForm1.frequency === 'weekly'
                    ? 'border-[var(--ui-text)] bg-[var(--ui-bg-elevated)]'
                    : 'border-[var(--ui-border)] hover:border-[var(--ui-text-muted)]'"
                >
                  <div class="text-2xl mb-1">Weekly</div>
                  <div class="text-sm text-[var(--ui-text-muted)]">Pick specific days</div>
                </button>
              </div>

              <!-- Day selection for weekly frequency -->
              <div v-if="altForm1.frequency === 'weekly'" class="mb-6">
                <label class="text-sm text-[var(--ui-text-muted)] mb-3 block">Which days?</label>
                <div class="grid grid-cols-7 gap-1 w-full max-w-md mx-auto">
                  <label
                    v-for="day in translatedDaysOfWeek"
                    :key="day.value"
                    class="flex flex-col items-center gap-1 p-2 border border-[var(--ui-border)] rounded-lg cursor-pointer transition-colors hover:bg-[var(--ui-bg-elevated)]"
                    :class="{ 'border-[var(--ui-primary)] bg-[var(--ui-bg-elevated)]': altForm1.days_of_week.includes(day.value) }"
                  >
                    <UCheckbox
                      :model-value="altForm1.days_of_week.includes(day.value)"
                      @update:model-value="toggleAltForm1Day(day.value)"
                    />
                    <span class="text-xs font-medium">{{ day.label }}</span>
                  </label>
                </div>
              </div>

              <div class="mb-6">
                <label class="text-sm text-[var(--ui-text-muted)] mb-2 block">Remind me at</label>
                <TimePicker v-model="altForm1.time" size="lg" class="max-w-[150px] mx-auto" />
              </div>

              <UButton
                :disabled="altForm1.frequency === 'weekly' && altForm1.days_of_week.length === 0"
                @click="wizardStep = 2"
              >
                Continue
              </UButton>
            </div>

            <!-- Step 2: How long -->
            <div v-if="wizardStep === 2" class="text-center max-w-md mx-auto">
              <h3 class="text-xl font-semibold mb-2">How much time can you commit?</h3>
              <p class="text-[var(--ui-text-muted)] mb-6">Every minute of prayer makes a difference.</p>

              <div class="flex flex-wrap gap-2 justify-center mb-8">
                <button
                  v-for="dur in [5, 10, 15, 30, 60]"
                  :key="dur"
                  @click="altForm1.duration = dur"
                  class="px-5 py-3 rounded-full border-2 transition-all font-medium"
                  :class="altForm1.duration === dur
                    ? 'border-[var(--ui-text)] bg-[var(--ui-text)] text-[var(--ui-bg)]'
                    : 'border-[var(--ui-border)] hover:border-[var(--ui-text-muted)]'"
                >
                  {{ dur < 60 ? `${dur} min` : '1 hour' }}
                </button>
              </div>

              <div class="flex gap-2 justify-center">
                <UButton variant="outline" @click="wizardStep = 1">Back</UButton>
                <UButton @click="wizardStep = 3">Continue</UButton>
              </div>
            </div>

            <!-- Step 3: Who are you? -->
            <div v-if="wizardStep === 3" class="text-center max-w-sm mx-auto">
              <h3 class="text-xl font-semibold mb-2">What's your name?</h3>
              <p class="text-[var(--ui-text-muted)] mb-6">We'd love to know who's joining us in prayer.</p>
              <UInput
                v-model="altForm1.name"
                type="text"
                placeholder="Your first name"
                size="xl"
                class="text-center text-lg"
              />
              <div class="flex gap-2 justify-center mt-6">
                <UButton variant="outline" @click="wizardStep = 2">Back</UButton>
                <UButton :disabled="!altForm1.name" @click="wizardStep = 4">Continue</UButton>
              </div>
            </div>

            <!-- Step 4: How to reach you -->
            <div v-if="wizardStep === 4" class="text-center max-w-sm mx-auto">
              <h3 class="text-xl font-semibold mb-2">Hi {{ altForm1.name }}!</h3>
              <p class="text-[var(--ui-text-muted)] mb-6">Where should we send your prayer reminders?</p>
              <UInput
                v-model="altForm1.email"
                type="email"
                placeholder="your@email.com"
                size="xl"
                class="text-center"
              />
              <div class="flex gap-2 justify-center mt-6">
                <UButton variant="outline" @click="wizardStep = 3">Back</UButton>
                <UButton size="lg" :disabled="!altForm1.email">
                  Join the Prayer Team
                </UButton>
              </div>
            </div>
          </UCard>
        </div>
      </section>

      <!-- Alternative Form 2: Single-Screen Visual Selector -->
      <section class="py-12">
        <div class="max-w-4xl mx-auto px-4">
          <UCard>
            <template #header>
              <div class="text-center">
                <h2 class="text-2xl font-bold">Visual Card Selector</h2>
              </div>
            </template>

            <div class="grid md:grid-cols-2 gap-8">
              <!-- Left side: Visual selectors -->
              <div class="space-y-6">
                <!-- Frequency as visual cards -->
                <div>
                  <label class="text-sm font-medium mb-3 block">I want to pray...</label>
                  <div class="grid grid-cols-2 gap-3">
                    <button
                      @click="altForm2.frequency = 'daily'"
                      class="relative p-5 rounded-2xl border-2 transition-all group"
                      :class="altForm2.frequency === 'daily'
                        ? 'border-[var(--ui-text)] bg-[var(--ui-bg-elevated)]'
                        : 'border-[var(--ui-border)] hover:border-[var(--ui-text-muted)]'"
                    >
                      <UIcon name="i-lucide-sun" class="w-8 h-8 mb-2" />
                      <div class="font-semibold">Every Day</div>
                      <div v-if="altForm2.frequency === 'daily'" class="absolute top-2 right-2">
                        <UIcon name="i-lucide-check-circle-2" class="w-5 h-5" />
                      </div>
                    </button>
                    <button
                      @click="altForm2.frequency = 'weekly'"
                      class="relative p-5 rounded-2xl border-2 transition-all group"
                      :class="altForm2.frequency === 'weekly'
                        ? 'border-[var(--ui-text)] bg-[var(--ui-bg-elevated)]'
                        : 'border-[var(--ui-border)] hover:border-[var(--ui-text-muted)]'"
                    >
                      <UIcon name="i-lucide-calendar-days" class="w-8 h-8 mb-2" />
                      <div class="font-semibold">Some Days</div>
                      <div v-if="altForm2.frequency === 'weekly'" class="absolute top-2 right-2">
                        <UIcon name="i-lucide-check-circle-2" class="w-5 h-5" />
                      </div>
                    </button>
                  </div>
                  <!-- Day selection for weekly frequency -->
                  <div v-if="altForm2.frequency === 'weekly'" class="grid grid-cols-7 gap-1 mt-3">
                    <label
                      v-for="day in translatedDaysOfWeek"
                      :key="day.value"
                      class="flex flex-col items-center gap-1 p-2 border border-[var(--ui-border)] rounded-lg cursor-pointer transition-colors hover:bg-[var(--ui-bg-elevated)]"
                      :class="{ 'border-[var(--ui-primary)] bg-[var(--ui-bg-elevated)]': altForm2.days_of_week.includes(day.value) }"
                    >
                      <UCheckbox
                        :model-value="altForm2.days_of_week.includes(day.value)"
                        @update:model-value="toggleAltForm2Day(day.value)"
                      />
                      <span class="text-xs font-medium">{{ day.label }}</span>
                    </label>
                  </div>
                </div>

                <!-- Duration as slider-style pills -->
                <div>
                  <label class="text-sm font-medium mb-3 block">For about...</label>
                  <div class="flex rounded-full border border-[var(--ui-border)] p-1 bg-[var(--ui-bg)]">
                    <button
                      v-for="dur in [5, 10, 15, 30, 60]"
                      :key="dur"
                      @click="altForm2.duration = dur"
                      class="flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all"
                      :class="altForm2.duration === dur
                        ? 'bg-[var(--ui-text)] text-[var(--ui-bg)]'
                        : 'hover:bg-[var(--ui-bg-elevated)]'"
                    >
                      {{ dur < 60 ? `${dur}m` : '1h' }}
                    </button>
                  </div>
                </div>

                <!-- Time picker -->
                <div>
                  <label class="text-sm font-medium mb-3 block">Best time for me</label>
                  <TimePicker
                    v-model="altForm2.time"
                    size="lg"
                    class="w-full"
                  />
                </div>
              </div>

              <!-- Right side: Contact -->
              <div class="space-y-6">
                <div class="space-y-3">
                  <UInput
                    v-model="altForm2.name"
                    placeholder="Your name"
                    size="lg"
                    class="w-full"
                  />
                  <UInput
                    v-model="altForm2.email"
                    type="email"
                    placeholder="Email address"
                    size="lg"
                    class="w-full"
                  />
                  <UButton block size="lg" :disabled="!altForm2.name || !altForm2.email || (altForm2.frequency === 'weekly' && altForm2.days_of_week.length === 0)">
                    Count Me In
                  </UButton>
                </div>

                <p class="text-xs text-center text-[var(--ui-text-muted)]">
                  Join {{ Math.floor(Math.random() * 500) + 100 }} others praying for this campaign
                </p>
              </div>
            </div>
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

// Alternative Form 1: Wizard state
const wizardStep = ref(1)
const altForm1 = ref({
  name: '',
  email: '',
  frequency: 'daily',
  days_of_week: [] as number[],
  time: '09:00',
  duration: 10
})

// Alternative Form 2: Visual selector state
const altForm2 = ref({
  name: '',
  email: '',
  frequency: 'daily',
  days_of_week: [] as number[],
  time: '09:00',
  duration: 10
})

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

// Toggle day for Alternative Form 1
function toggleAltForm1Day(day: number) {
  const index = altForm1.value.days_of_week.indexOf(day)
  if (index === -1) {
    altForm1.value.days_of_week.push(day)
  } else {
    altForm1.value.days_of_week.splice(index, 1)
  }
}

// Toggle day for Alternative Form 2
function toggleAltForm2Day(day: number) {
  const index = altForm2.value.days_of_week.indexOf(day)
  if (index === -1) {
    altForm2.value.days_of_week.push(day)
  } else {
    altForm2.value.days_of_week.splice(index, 1)
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

