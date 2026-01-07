<template>
  <div class="min-h-screen flex flex-col">
    <div v-if="pending" class="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
      <UIcon name="i-lucide-loader" class="w-10 h-10 animate-spin mb-4" />
      <p>{{ $t('prayerFuel.loading') }}</p>
    </div>

    <div v-else-if="error" class="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
      <h2 class="text-2xl font-bold mb-4">{{ $t('prayerFuel.error.title') }}</h2>
      <p class="text-[var(--ui-text-muted)] mb-6">{{ error }}</p>
      <UButton :to="localePath(`/${slug}`)">{{ $t('prayerFuel.error.backToCampaign') }}</UButton>
    </div>

    <div v-else-if="data" class="flex flex-col flex-1">
      <!-- Campaign Header -->
      <header class="border-b border-[var(--ui-border)] py-8 px-4">
        <div class="max-w-4xl mx-auto">
          <h1 class="text-3xl font-bold mb-2 text-center">{{ $t('prayerFuel.title') }}</h1>
          <p class="text-[var(--ui-text-muted)] text-center">{{ formatDate(data.date) }}</p>
        </div>
      </header>

      <!-- Content or No Content Message -->
      <main class="flex-1 py-8 px-4">
        <div class="max-w-4xl mx-auto">
          <div v-if="data.hasContent">
            <!-- Loop through all content items from different libraries -->
            <div v-for="(contentItem, index) in data.content" :key="contentItem.id" class="mb-12 last:mb-0">
              <div v-if="data.content.length > 1 && index > 0" class="flex items-center justify-center my-12 relative">
                <div class="flex-1 h-px bg-[var(--ui-border)]"></div>
                <span class="inline-flex items-center justify-center w-8 h-8 mx-4 bg-[var(--ui-bg)] border-2 border-[var(--ui-border)] rounded-full text-sm font-semibold text-[var(--ui-text-muted)]">
                  {{ index + 1 }}
                </span>
                <div class="flex-1 h-px bg-[var(--ui-border)]"></div>
              </div>

              <!-- People Group content -->
              <template v-if="contentItem.content_type === 'people_group' && contentItem.people_group_data">
                <h2 v-if="contentItem.id === -2" class="text-2xl font-bold mb-8 text-center">{{ $t('prayerFuel.peopleGroupOfTheDay') }}</h2>
                <PeopleGroupCard :people-group="contentItem.people_group_data" />
              </template>

              <!-- Static library content -->
              <template v-else>
                <h2 v-if="contentItem.title" class="text-2xl font-bold mb-8 text-center">{{ contentItem.title }}</h2>
                <RichTextViewer :content="contentItem.content_json as Record<string, any> | null" :item-id="String(contentItem.id)" />
              </template>
            </div>
          </div>

          <div v-else class="text-center py-16">
            <div class="text-6xl mb-4">📖</div>
            <h2 class="text-xl font-bold mb-4">{{ $t('prayerFuel.noContent.title') }}</h2>
            <p class="text-[var(--ui-text-muted)] text-lg">{{ $t('prayerFuel.noContent.message') }}</p>
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
            class="min-w-[200px]"
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
const router = useRouter()
const slug = route.params.slug as string
const { setCampaignTitle, resetCampaignTitle } = useCampaign()

// Reset campaign header when leaving this page
onUnmounted(() => {
  resetCampaignTitle()
})
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

// Get current date in user's timezone
const currentDate = new Date().toISOString()

// Get language preference from global language selector or query param
const selectedLanguage = ref((route.query.language as string) || locale.value || '')

// Fetch prayer content
const { data, pending, error: fetchError, refresh } = await useFetch(`/api/campaigns/${slug}/prayer-fuel`, {
  query: computed(() => ({
    userDate: currentDate,
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

// Prayer tracking state
const prayedMarked = ref(false)
const submitting = ref(false)

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
        timestamp
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
        timestamp
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
