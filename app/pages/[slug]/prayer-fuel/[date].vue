<template>
  <div class="prayer-fuel-page">
    <div v-if="pending" class="loading">
      <div class="spinner"></div>
      <p>{{ $t('prayerFuel.loading') }}</p>
    </div>

    <div v-else-if="error" class="error-container">
      <h2>{{ $t('prayerFuel.error.title') }}</h2>
      <p>{{ error }}</p>
    </div>

    <div v-else-if="data" class="prayer-fuel-content">
      <!-- Campaign Header -->
      <header class="prayer-header">
        <div class="container">
          <!-- Title row with navigation buttons on sides -->
          <div class="title-row">
            <UButton
              :to="localePath(`/${slug}/prayer-fuel/${previousDate}`)"
              variant="ghost"
              size="sm"
              icon="i-lucide-chevron-left"
              class="nav-btn"
            />
            <h1 class="page-title">{{ $t('prayerFuel.pageTitle') }}</h1>
            <UButton
              v-if="!isNextDateFuture"
              :to="localePath(`/${slug}/prayer-fuel/${nextDate}`)"
              variant="ghost"
              size="sm"
              icon="i-lucide-chevron-right"
              class="nav-btn"
            />
            <UButton
              v-else
              :to="localePath(`/${slug}/prayer-fuel`)"
              variant="ghost"
              size="sm"
              icon="i-lucide-chevron-right"
              class="nav-btn"
            />
          </div>
          <p class="prayer-date">{{ formatDate(data.date) }}</p>
        </div>
      </header>

      <!-- Content or No Content Message -->
      <main class="prayer-main">
        <div class="container">
          <div v-if="data.hasContent" class="prayer-content-wrapper">
            <!-- Loop through all content items from different libraries -->
            <div v-for="(contentItem, index) in data.content" :key="contentItem.id" class="content-section">
              <div v-if="data.content.length > 1 && index > 0" class="content-divider">
                <span class="content-number">{{ index + 1 }}</span>
              </div>

              <!-- People Group content -->
              <template v-if="contentItem.content_type === 'people_group' && contentItem.people_group_data">
                <h2 v-if="contentItem.id === -2" class="content-title text-center">{{ $t('prayerFuel.peopleGroupOfTheDay') }}</h2>
                <PeopleGroupCard :people-group="contentItem.people_group_data" />
              </template>

              <!-- Static library content -->
              <template v-else>
                <h2 v-if="contentItem.title" class="content-title">{{ contentItem.title }}</h2>
                <RichTextViewer :content="contentItem.content_json as Record<string, any> | null" :item-id="String(contentItem.id)" />
              </template>
            </div>
          </div>

          <div v-else class="no-content">
            <div class="no-content-icon">📖</div>
            <h2>{{ $t('prayerFuel.dateView.noContent.title') }}</h2>
            <p>{{ $t('prayerFuel.dateView.noContent.message') }}</p>
          </div>
        </div>
      </main>

      <!-- I Prayed Button (only show if content exists) -->
      <footer v-if="data.hasContent" class="border-t border-[var(--ui-border)] py-8 px-4 bg-[var(--ui-bg-elevated)] text-center">
        <div class="max-w-4xl mx-auto">
          <UButton
            @click="markAsPrayed"
            :disabled="prayedMarked"
            :loading="submitting"
            size="xl"
            class="min-w-[200px] justify-center"
          >
            {{ prayedMarked ? $t('prayerFuel.button.recorded') : submitting ? $t('prayerFuel.button.recording') : $t('prayerFuel.button.iPrayed') }}
          </UButton>
          <p v-if="prayedMarked" class="mt-4 text-sm text-[var(--ui-text-muted)]">
            {{ $t('prayerFuel.thankYou') }}
          </p>
        </div>
      </footer>

      <!-- Past Prayer Fuel -->
      <PastPrayerFuelGrid
        v-if="pastContent?.content"
        :items="pastContent.content"
        :slug="slug"
        :language="selectedLanguage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const slug = route.params.slug as string
const dateParam = route.params.date as string
const { setCampaignTitle } = useCampaign()
const toast = useToast()

// Anonymous tracking ID storage key
const ANON_STORAGE_KEY = 'prayertools_anon_id'

// Get or create anonymous tracking ID from localStorage
function getAnonymousTrackingId(): string {
  if (import.meta.server) return ''
  let anonId = localStorage.getItem(ANON_STORAGE_KEY)
  if (!anonId) {
    anonId = `anon-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem(ANON_STORAGE_KEY, anonId)
  }
  return anonId
}

// Get tracking ID: URL param (from email) or localStorage (anonymous)
const trackingId = computed(() => {
  return (route.query.uid as string) || getAnonymousTrackingId()
})

// Track page open time for duration calculation
const pageOpenTime = ref(Date.now())

// Generate unique session ID for auto-save
const sessionId = ref(`${Date.now()}-${Math.random().toString(36).substring(2, 9)}`)

// Auto-save timeouts (5min, 10min, 15min)
const autoSaveTimeouts = ref<ReturnType<typeof setTimeout>[]>([])
const autoSaveComplete = ref(false)

// Prayer tracking state
const prayedMarked = ref(false)
const submitting = ref(false)

// Get language preference from global language selector or query param
const selectedLanguage = ref((route.query.language as string) || locale.value || '')

// Fetch prayer content for specific date
const { data, pending, error: fetchError, refresh } = await useFetch(`/api/campaigns/${slug}/prayer-fuel`, {
  query: computed(() => ({
    userDate: dateParam,
    language: selectedLanguage.value || undefined
  }))
})

const error = computed(() => fetchError.value?.message || null)

// Set selected language and campaign title after data loads
watch(data, (newData) => {
  if (newData) {
    if (!selectedLanguage.value) {
      selectedLanguage.value = newData.language
    }
    if (newData.campaign?.title) {
      setCampaignTitle(newData.campaign.title)
    }
  }
}, { immediate: true })

// Watch global language changes
watch(locale, async (newLang) => {
  if (newLang && newLang !== selectedLanguage.value) {
    selectedLanguage.value = newLang
    await refresh()
  }
})

// Fetch past prayer content
const { data: pastContent } = await useFetch(`/api/campaigns/${slug}/past-prayer-fuel`, {
  query: computed(() => ({
    language: selectedLanguage.value || undefined
  }))
})

// Format date for display
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString(selectedLanguage.value || 'en', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Compute previous and next dates for navigation
const previousDate = computed(() => {
  const date = new Date(dateParam)
  date.setDate(date.getDate() - 1)
  return date.toISOString().split('T')[0]
})

const nextDate = computed(() => {
  const date = new Date(dateParam)
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0]
})

// Check if next date is in the future (shouldn't navigate to future dates)
const isNextDateFuture = computed(() => {
  const next = new Date(nextDate.value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return next >= today
})

// Auto-save prayer session
async function autoSavePrayerSession() {
  if (prayedMarked.value || autoSaveComplete.value) return

  try {
    const duration = Math.floor((Date.now() - pageOpenTime.value) / 1000)
    const timestamp = new Date().toISOString()

    await $fetch(`/api/campaigns/${slug}/prayer-session`, {
      method: 'POST',
      body: {
        sessionId: sessionId.value,
        trackingId: trackingId.value || null,
        duration,
        timestamp,
        contentDate: dateParam
      }
    })
  } catch (err: any) {
    console.error('Failed to auto-save prayer session:', err)
  }
}

// Cancel all auto-save timeouts
function cancelAutoSaveTimeouts() {
  autoSaveTimeouts.value.forEach(timeout => clearTimeout(timeout))
  autoSaveTimeouts.value = []
  autoSaveComplete.value = true
}

// Mark as prayed
async function markAsPrayed() {
  if (prayedMarked.value || submitting.value) return

  submitting.value = true

  // Cancel remaining auto-save timeouts
  cancelAutoSaveTimeouts()

  try {
    // Calculate duration (time spent on page), capped at 2 hours
    const MAX_DURATION = 2 * 60 * 60 // 2 hours in seconds
    const rawDuration = Math.floor((Date.now() - pageOpenTime.value) / 1000)
    const duration = Math.min(rawDuration, MAX_DURATION)
    const timestamp = new Date().toISOString()

    // Final save using prayer-session endpoint (upsert)
    await $fetch(`/api/campaigns/${slug}/prayer-session`, {
      method: 'POST',
      body: {
        sessionId: sessionId.value,
        trackingId: trackingId.value || null,
        duration,
        timestamp,
        contentDate: dateParam
      }
    })

    prayedMarked.value = true
  } catch (err: any) {
    console.error('Failed to record prayer:', err)
    toast.add({
      title: 'Error',
      description: t('prayerFuel.error.recordFailed'),
      color: 'error'
    })
  } finally {
    submitting.value = false
  }
}

// Set page title
useHead(() => ({
  title: data.value?.hasContent
    ? `${t('prayerFuel.pageTitle')} - ${data.value.campaign.title}`
    : `${t('prayerFuel.pageTitle')} - ${data.value?.campaign.title || t('common.loading')}`
}))

// Update page open time and set up auto-save when component mounts
onMounted(() => {
  // Set campaign title on mount (handles cached data from navigation)
  if (data.value?.campaign?.title) {
    setCampaignTitle(data.value.campaign.title)
  }

  pageOpenTime.value = Date.now()

  // Set up auto-save timeouts at 5min, 10min, 15min
  const autoSaveIntervals = [5 * 60 * 1000, 10 * 60 * 1000, 15 * 60 * 1000]

  autoSaveIntervals.forEach((interval) => {
    const timeout = setTimeout(() => {
      autoSavePrayerSession()
    }, interval)
    autoSaveTimeouts.value.push(timeout)
  })
})

// Clean up timeouts when component unmounts
onUnmounted(() => {
  cancelAutoSaveTimeouts()
})
</script>

<style scoped>
.prayer-fuel-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Header */
.prayer-header {
  border-bottom: 1px solid var(--border);
  padding: 2rem 0 1.5rem;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.page-title {
  font-size: 2rem;
  font-weight: bold;
  margin: 0;
  text-align: center;
}

.nav-btn {
  flex-shrink: 0;
}

.prayer-date {
  color: var(--text-muted, #666);
  margin: 0.5rem 0 0;
  font-size: 1rem;
  text-align: center;
}

/* Main Content */
.prayer-main {
  flex: 1;
  padding: 2rem 0;
}

.content-section {
  margin-bottom: 3rem;
}

.content-section:last-child {
  margin-bottom: 0;
}

.content-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 3rem 0 2rem;
  position: relative;
}

.content-divider::before,
.content-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.content-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 0 1rem;
  background: var(--bg);
  border: 2px solid var(--border);
  border-radius: 50%;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted, #666);
}

.content-title {
  font-size: 1.75rem;
  font-weight: bold;
  margin-bottom: 2rem;
  text-align: center;
}

/* No Content */
.no-content {
  text-align: center;
  padding: 4rem 2rem;
}

.no-content-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.no-content h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.no-content p {
  color: var(--text-muted, #666);
  font-size: 1.125rem;
}

/* Buttons */
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

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }

  .content-title {
    font-size: 1.5rem;
  }

  .prayer-header,
  .prayer-main {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
