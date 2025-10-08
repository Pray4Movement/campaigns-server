<template>
  <div class="prayer-fuel-page">
    <div v-if="pending" class="loading">
      <div class="spinner"></div>
      <p>{{ $t('prayerFuel.loading') }}</p>
    </div>

    <div v-else-if="error" class="error-container">
      <h2>{{ $t('prayerFuel.error.title') }}</h2>
      <p>{{ error }}</p>
      <NuxtLink :to="localePath(`/${slug}/prayer-fuel`)" class="btn-primary">{{ $t('prayerFuel.backToToday') }}</NuxtLink>
    </div>

    <div v-else-if="data" class="prayer-fuel-content">
      <!-- Campaign Header -->
      <header class="prayer-header">
        <div class="container">
          <NuxtLink :to="localePath(`/${slug}/prayer-fuel`)" class="back-link">← {{ $t('prayerFuel.backToToday') }}</NuxtLink>
          <h1 class="page-title">{{ $t('prayerFuel.pageTitle') }}</h1>
          <p class="prayer-date">{{ formatDate(data.date) }}</p>
        </div>
      </header>

      <!-- Content or No Content Message -->
      <main class="prayer-main">
        <div class="container">
          <div v-if="data.content" class="prayer-content-wrapper">
            <h2 class="content-title">{{ data.content.title }}</h2>
            <PrayerContentRenderer :content="data.content.content_json" />
          </div>

          <div v-else class="no-content">
            <div class="no-content-icon">📖</div>
            <h2>{{ $t('prayerFuel.dateView.noContent.title') }}</h2>
            <p>{{ data.message || $t('prayerFuel.dateView.noContent.message') }}</p>
          </div>
        </div>
      </main>
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

// Set page title
useHead(() => ({
  title: data.value?.content
    ? `${data.value.content.title} - ${data.value.campaign.title}`
    : `${t('prayerFuel.pageTitle')} - ${data.value?.campaign.title || t('common.loading')}`
}))
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

.back-link {
  display: inline-block;
  color: var(--text-muted, #666);
  text-decoration: none;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--text);
}

.page-title {
  font-size: 2rem;
  font-weight: bold;
  margin: 0 0 0.5rem;
}

.prayer-date {
  color: var(--text-muted, #666);
  margin: 0;
  font-size: 1rem;
}

/* Main Content */
.prayer-main {
  flex: 1;
  padding: 2rem 0;
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
