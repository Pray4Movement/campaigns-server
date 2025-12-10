<template>
  <div class="min-h-screen flex flex-col">
    <div class="max-w-4xl mx-auto px-4 w-full">
      <div class="py-8 mb-8">
        <div>
          <h1 v-if="library" class="text-3xl font-bold mb-2">{{ library.name }}</h1>
          <p v-if="library && library.description" class="text-lg text-[var(--ui-text-muted)]">{{ library.description }}</p>
        </div>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader" class="w-6 h-6 animate-spin mr-2" />
        <span>Loading library content...</span>
      </div>

      <UAlert v-else-if="error" color="error" :title="error" class="mb-6" />

      <div v-else>
        <!-- Stats Bar -->
        <div class="flex justify-end items-center mb-6 p-4 bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] rounded-lg">
          <span class="text-sm text-[var(--ui-text-muted)]">Total Days: {{ dayRange.maxDay || 0 }}</span>
        </div>

        <!-- Calendar View -->
        <UCard>
          <template #header>
            <div class="flex justify-between items-center flex-wrap gap-4">
              <h3 class="font-semibold">Content Calendar - {{ getLanguageName(locale) }}</h3>
              <div class="flex gap-4 text-sm">
                <span class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded bg-green-500 border border-green-600"></span>
                  Has content
                </span>
                <span class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]"></span>
                  No content
                </span>
              </div>
            </div>
          </template>

          <div class="grid grid-cols-[repeat(auto-fill,minmax(60px,1fr))] gap-2 mb-6">
            <UButton
              v-for="day in displayDays"
              :key="day"
              @click="selectDay(day)"
              :variant="getDayStatus(day) === 'complete' ? 'solid' : 'outline'"
              :color="getDayStatus(day) === 'complete' ? 'success' : 'neutral'"
              :title="getDayTooltip(day)"
              class="aspect-square !p-0 justify-center"
            >
              {{ day }}
            </UButton>
          </div>

          <div class="flex justify-center items-center gap-4">
            <UButton
              v-if="currentPage > 1"
              @click="previousPage"
              variant="outline"
              size="sm"
            >
              Previous
            </UButton>
            <span class="text-sm text-[var(--ui-text-muted)]">
              Days {{ startDay }}-{{ endDay }}
            </span>
            <UButton
              @click="nextPage"
              variant="outline"
              size="sm"
            >
              Next
            </UButton>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getLanguageName } from '~/utils/languages'

const route = useRoute()
const { locale } = useI18n()
const libraryId = computed(() => parseInt(route.params.libraryid as string))

interface Library {
  id: number
  name: string
  description: string
  stats?: {
    totalDays: number
    languageStats: { [key: string]: number }
  }
}

interface LibraryContent {
  id: number
  library_id: number
  day_number: number
  language_code: string
  title: string
  content_json: any
}

const library = ref<Library | null>(null)
const loading = ref(true)
const error = ref('')
const dayContentMap = ref<Map<number, LibraryContent[]>>(new Map())
const dayRange = ref({ minDay: 1, maxDay: 365 })
const currentPage = ref(1)
const daysPerPage = 100

const startDay = computed(() => (currentPage.value - 1) * daysPerPage + 1)
const endDay = computed(() => Math.min(currentPage.value * daysPerPage, dayRange.value.maxDay || 365))
const displayDays = computed(() => {
  const days = []
  for (let i = startDay.value; i <= endDay.value; i++) {
    days.push(i)
  }
  return days
})

async function loadLibrary() {
  try {
    const response = await $fetch<{ library: Library }>(`/api/libraries/${libraryId.value}`)
    library.value = response.library

    if (response.library.stats?.totalDays) {
      dayRange.value.maxDay = Math.max(response.library.stats.totalDays, 365)
    }
  } catch (err) {
    console.error('Failed to load library:', err)
    error.value = 'Failed to load library'
  }
}

async function loadContent() {
  try {
    loading.value = true
    error.value = ''

    const response = await $fetch<{ content: Array<{ dayNumber: number; languages: string[]; content: LibraryContent[] }> }>(
      `/api/libraries/${libraryId.value}/content?grouped=true`
    )

    // Build a map of day -> content
    const map = new Map<number, LibraryContent[]>()
    response.content.forEach(group => {
      map.set(group.dayNumber, group.content)
    })
    dayContentMap.value = map

    // Update day range
    if (response.content.length > 0) {
      const days = response.content.map(g => g.dayNumber)
      dayRange.value.maxDay = Math.max(...days, 365)
    }
  } catch (err: any) {
    error.value = 'Failed to load content'
    console.error(err)
  } finally {
    loading.value = false
  }
}

function getDayStatus(day: number): string {
  const content = dayContentMap.value.get(day)

  if (!content || content.length === 0) {
    return 'empty'
  }

  // Check if content exists in current language
  const hasCurrentLanguage = content.some(c => c.language_code === locale.value)
  return hasCurrentLanguage ? 'complete' : 'empty'
}

function getDayTooltip(day: number): string {
  const content = dayContentMap.value.get(day)

  if (!content || content.length === 0) {
    return `Day ${day}: No content`
  }

  const hasCurrentLanguage = content.some(c => c.language_code === locale.value)
  if (hasCurrentLanguage) {
    return `Day ${day}: Available in ${getLanguageName(locale.value)}`
  } else {
    const languages = content.map(c => getLanguageName(c.language_code)).join(', ')
    return `Day ${day}: Not available in ${getLanguageName(locale.value)} (Available: ${languages})`
  }
}

async function selectDay(day: number) {
  await navigateTo(`/library/${libraryId.value}/${day}`)
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function nextPage() {
  currentPage.value++
}

onMounted(async () => {
  await loadLibrary()
  await loadContent()
})

// Reload content when language changes
watch(locale, async () => {
  // Calendar view will automatically update based on the computed getDayStatus
})
</script>
