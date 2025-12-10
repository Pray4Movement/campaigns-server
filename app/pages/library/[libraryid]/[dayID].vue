<template>
  <div class="min-h-screen flex flex-col">
    <div class="max-w-4xl mx-auto px-4 w-full">
      <!-- Breadcrumb Navigation -->
      <UBreadcrumb :items="breadcrumbItems" class="pt-8 mb-6" />

      <!-- Page Header -->
      <div class="mb-8">
        <div class="mb-4">
          <h1 class="text-3xl font-bold mb-2">Day {{ dayNumber }}</h1>
          <div v-if="library">
            <UBadge variant="subtle" color="neutral">{{ library.name }}</UBadge>
          </div>
        </div>

        <!-- Day Navigation -->
        <div class="flex justify-between gap-4 flex-wrap">
          <UButton
            @click="navigateToPreviousDay"
            variant="outline"
            :disabled="dayNumber <= 1"
            icon="i-lucide-chevron-left"
          >
            Previous
          </UButton>
          <UButton
            :to="`/library/${libraryId}`"
            variant="outline"
          >
            Back to Calendar
          </UButton>
          <UButton
            @click="navigateToNextDay"
            variant="outline"
            trailing-icon="i-lucide-chevron-right"
          >
            Next
          </UButton>
        </div>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader" class="w-6 h-6 animate-spin mr-2" />
        <span>Loading content...</span>
      </div>

      <UAlert v-else-if="error" color="error" :title="error" class="mb-6" />

      <div v-else-if="!currentContent" class="text-center py-16 border-2 border-dashed border-[var(--ui-border)] rounded-lg">
        <div class="text-6xl mb-4">📄</div>
        <h2 class="text-xl font-bold mb-2">No Content Available</h2>
        <p class="text-[var(--ui-text-muted)] mb-6">There is no content available for Day {{ dayNumber }} in {{ getLanguageName(locale) }}.</p>
        <div v-if="availableLanguages.length > 0">
          <p class="text-sm text-[var(--ui-text-muted)] mb-3">Content is available in:</p>
          <div class="flex flex-wrap gap-2 justify-center">
            <UBadge v-for="lang in availableLanguages" :key="lang" variant="subtle" color="neutral">
              {{ getLanguageFlag(lang) }} {{ getLanguageName(lang) }}
            </UBadge>
          </div>
        </div>
      </div>

      <UCard v-else class="min-h-[400px]">
        <RichTextViewer
          v-if="currentContent.content_json"
          :content="currentContent.content_json"
          :item-id="`day-${dayNumber}`"
        />
        <div v-else class="text-center py-12 text-[var(--ui-text-muted)]">
          <p>No content to display</p>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getLanguageName, getLanguageFlag } from '~/utils/languages'

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

const breadcrumbItems = computed(() => [
  { label: 'Library Calendar', to: `/library/${libraryId.value}` },
  { label: `Day ${dayNumber.value}` }
])

const availableLanguages = computed(() => {
  return content.value.map(c => c.language_code)
})

// Get content only in current language (no fallback)
const currentContent = computed(() => {
  if (content.value.length === 0) return null

  // Only return content in current locale
  return content.value.find(c => c.language_code === locale.value) || null
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
