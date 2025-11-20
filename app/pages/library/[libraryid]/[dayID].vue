<template>
  <div class="library-day-page">
    <div class="container">
      <!-- Breadcrumb Navigation -->
      <div class="breadcrumb">
        <NuxtLink :to="`/library/${libraryId}`" class="breadcrumb-link">Library Calendar</NuxtLink>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Day {{ dayNumber }}</span>
      </div>

      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Day {{ dayNumber }}</h1>
          <div class="header-info" v-if="library">
            <span class="library-badge">{{ library.name }}</span>
          </div>
        </div>

        <!-- Day Navigation -->
        <div class="day-navigation">
          <UButton
            @click="navigateToPreviousDay"
            variant="outline"
            size="md"
            :disabled="dayNumber <= 1"
          >
            ← Previous
          </UButton>
          <UButton
            :to="`/library/${libraryId}`"
            variant="outline"
            size="md"
          >
            Back to Calendar
          </UButton>
          <UButton
            @click="navigateToNextDay"
            variant="outline"
            size="md"
          >
            Next →
          </UButton>
        </div>
      </div>

      <div v-if="loading" class="loading">Loading content...</div>

      <div v-else-if="error" class="error">{{ error }}</div>

      <div v-else-if="!currentContent" class="empty-state">
        <div class="empty-icon">📄</div>
        <h2>No Content Available</h2>
        <p>There is no content available for Day {{ dayNumber }} in {{ getLanguageName(locale) }}.</p>
        <div v-if="availableLanguages.length > 0" class="available-languages">
          <p>Content is available in:</p>
          <div class="language-chips">
            <span v-for="lang in availableLanguages" :key="lang" class="language-chip">
              {{ getLanguageFlag(lang) }} {{ getLanguageName(lang) }}
            </span>
          </div>
        </div>
      </div>

      <div v-else class="content-section">
        <!-- Language Indicator -->
        <div v-if="displayedLanguage !== locale" class="language-fallback-notice">
          <span class="notice-icon">ℹ️</span>
          Content not available in {{ getLanguageName(locale) }}. Showing {{ getLanguageName(displayedLanguage) }} instead.
        </div>

        <!-- Content Display -->
        <div class="content-display">
          <RichTextViewer
            v-if="currentContent.content_json"
            :content="currentContent.content_json"
            :item-id="`day-${dayNumber}`"
          />
          <div v-else class="no-content">
            <p>No content to display</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getLanguageName, getLanguageFlag, LANGUAGES } from '~/utils/languages'

const route = useRoute()
const { locale } = useI18n()
const libraryId = computed(() => parseInt(route.params.libraryid as string))
const dayNumber = computed(() => parseInt(route.params.dayID as string))

interface Library {
  id: number
  name: string
  description: string
}

interface LibraryContent {
  id: number
  library_id: number
  day_number: number
  language_code: string
  content_json: any
}

const library = ref<Library | null>(null)
const content = ref<LibraryContent[]>([])
const loading = ref(true)
const error = ref('')

const availableLanguages = computed(() => {
  return content.value.map(c => c.language_code)
})

// Get content in current language, or fallback to English, or first available
const currentContent = computed(() => {
  if (content.value.length === 0) return null

  // Try to find content in current locale
  const localeContent = content.value.find(c => c.language_code === locale.value)
  if (localeContent) return localeContent

  // Fallback to English
  const enContent = content.value.find(c => c.language_code === 'en')
  if (enContent) return enContent

  // Fallback to first available
  return content.value[0]
})

const displayedLanguage = computed(() => {
  return currentContent.value?.language_code || locale.value
})

async function loadLibrary() {
  try {
    const response = await $fetch<{ library: Library }>(`/api/libraries/${libraryId.value}`)
    library.value = response.library
  } catch (err) {
    console.error('Failed to load library:', err)
  }
}

async function loadContent() {
  try {
    loading.value = true
    error.value = ''

    const response = await $fetch<{ dayNumber: number; content: LibraryContent[] }>(
      `/api/libraries/${libraryId.value}/content/day/${dayNumber.value}`
    )
    content.value = response.content
  } catch (err: any) {
    error.value = 'Failed to load content'
    console.error(err)
  } finally {
    loading.value = false
  }
}

function navigateToPreviousDay() {
  if (dayNumber.value > 1) {
    navigateTo(`/library/${libraryId.value}/${dayNumber.value - 1}`)
  }
}

function navigateToNextDay() {
  navigateTo(`/library/${libraryId.value}/${dayNumber.value + 1}`)
}

// Load content when component mounts or day changes
onMounted(async () => {
  await loadLibrary()
  await loadContent()
})

// Reload content when day changes
watch(dayNumber, async () => {
  await loadContent()
})

// Reload content when language changes (in case we have content in the new language)
watch(locale, async () => {
  // Content will automatically update via computed property
  // We might want to reload if we implement lazy loading later
})
</script>

<style scoped>
.library-day-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding-top: 2rem;
  font-size: 0.875rem;
}

.breadcrumb-link {
  color: var(--ui-text-muted);
  text-decoration: none;
}

.breadcrumb-link:hover {
  color: var(--color-text);
}

.breadcrumb-separator {
  color: var(--ui-text-muted);
}

.breadcrumb-current {
  color: var(--color-text);
  font-weight: 500;
}

.page-header {
  margin-bottom: 2rem;
}

.header-content {
  margin-bottom: 1rem;
}

.header-content h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
}

.header-info {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.library-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 9999px;
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}

.day-navigation {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.loading, .error {
  text-align: center;
  padding: 3rem;
}

.error {
  color: var(--ui-text-muted);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  border: 2px dashed var(--ui-border);
  border-radius: 8px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
}

.empty-state > p {
  margin: 0 0 1.5rem;
  color: var(--ui-text-muted);
}

.available-languages {
  margin-top: 1.5rem;
}

.available-languages > p {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}

.language-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.language-chip {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  background-color: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 9999px;
  font-size: 0.875rem;
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.language-fallback-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}

.notice-icon {
  font-size: 1.25rem;
}

.content-display {
  padding: 2rem;
  background-color: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  min-height: 400px;
}

.no-content {
  text-align: center;
  padding: 3rem;
  color: var(--ui-text-muted);
}

.no-content p {
  margin: 0;
}

/* Add some spacing for the rich text content */
:deep(.rich-text-viewer) {
  line-height: 1.7;
}
</style>
