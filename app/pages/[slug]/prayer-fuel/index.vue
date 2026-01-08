<template>
  <div class="min-h-screen flex flex-col">
    <div v-if="pending" class="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
      <UIcon name="i-lucide-loader" class="w-10 h-10 animate-spin mb-4" />
      <p>{{ $t('prayerFuel.loading') }}</p>
    </div>

    <div v-else-if="error" class="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
      <h2 class="text-2xl font-bold mb-4">{{ $t('prayerFuel.error.title') }}</h2>
      <p class="text-muted mb-6">{{ error }}</p>
      <UButton :to="localePath(`/${slug}`)">{{ $t('prayerFuel.error.backToCampaign') }}</UButton>
    </div>

    <div v-else-if="data" class="flex flex-col flex-1">
      <!-- Campaign Header -->
      <header class="border-b border-default py-8 px-4">
        <div class="max-w-4xl mx-auto">
          <h1 class="text-3xl font-bold mb-2 text-center">{{ $t('prayerFuel.title') }}</h1>
          <p class="text-muted text-center">{{ formatDate(data.date, selectedLanguage) }}</p>
        </div>
      </header>

      <!-- Content Display -->
      <PrayerFuelDisplay
        :content="data.content"
        :has-content="data.hasContent"
        :prayed-marked="prayedMarked"
        :submitting="submitting"
        @pray="markAsPrayed"
      />

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

const { locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const slug = route.params.slug as string
const { setCampaignTitle } = useCampaign()

// Get current date in user's timezone
const currentDate = computed(() => new Date().toISOString().split('T')[0] as string)

// Get language preference from global language selector or query param
const selectedLanguage = ref((route.query.language as string) || locale.value || '')

// Use prayer session composable
const { prayedMarked, submitting, markAsPrayed, formatDate } = usePrayerSession(slug, currentDate)

// Fetch prayer content
const { data, pending, error: fetchError, refresh } = await useFetch(`/api/campaigns/${slug}/prayer-fuel`, {
  query: computed(() => ({
    userDate: new Date().toISOString(),
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

// Set campaign title on mount (handles cached data from navigation)
onMounted(() => {
  if (data.value?.campaign?.title) {
    setCampaignTitle(data.value.campaign.title)
  }
})

// Set page title
const { t } = useI18n()
useHead(() => ({
  title: data.value?.hasContent
    ? `${t('prayerFuel.pageTitle')} - ${data.value.campaign.title}`
    : `${t('prayerFuel.pageTitle')} - ${data.value?.campaign.title || t('common.loading')}`
}))
</script>
