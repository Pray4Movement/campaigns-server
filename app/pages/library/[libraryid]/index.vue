<template>
  <div class="library-calendar-page">
    <div class="page-header">
      <div>
        <h1 v-if="library" class="library-name">{{ library.name }}</h1>
        <p v-if="library && library.description" class="library-description">{{ library.description }}</p>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading library content...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="content-view">
      <!-- Stats Bar -->
      <div class="stats-bar">
        <div class="stats">
          <span>Total Days: {{ dayRange.maxDay || 0 }}</span>
        </div>
      </div>

      <!-- Calendar View -->
      <div class="calendar-container">
        <div class="calendar-header">
          <h3>Content Calendar - {{ getLanguageName(locale) }}</h3>
          <div class="legend">
            <span class="legend-item">
              <span class="indicator complete"></span> Has content
            </span>
            <span class="legend-item">
              <span class="indicator empty"></span> No content
            </span>
          </div>
        </div>

        <div class="days-grid">
          <button
            v-for="day in displayDays"
            :key="day"
            @click="selectDay(day)"
            class="day-cell"
            :class="getDayStatus(day)"
            :title="getDayTooltip(day)"
          >
            {{ day }}
          </button>
        </div>

        <div class="pagination-controls">
          <UButton
            v-if="currentPage > 1"
            @click="previousPage"
            variant="outline"
            size="sm"
          >
            Previous
          </UButton>
          <span class="page-info">
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

<style scoped>
.library-calendar-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.library-name {
  margin: 0 0 0.5rem;
  font-size: 2rem;
}

.library-description {
  margin: 0;
  color: var(--ui-text-muted);
  font-size: 1.125rem;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
}

.error {
  color: var(--ui-text-muted);
}

.stats-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 8px;
}

.stats {
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}

.calendar-container {
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  padding: 1.5rem;
  background-color: var(--ui-bg);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.calendar-header h3 {
  margin: 0;
}

.legend {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.indicator {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid var(--ui-border);
}

.indicator.complete {
  background-color: #22c55e;
}

.indicator.empty {
  background-color: var(--ui-bg-elevated);
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.day-cell {
  aspect-ratio: 1;
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  background-color: var(--ui-bg-elevated);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-cell:hover {
  border-color: var(--text);
  transform: scale(1.05);
}

.day-cell.complete {
  background-color: #22c55e;
  color: white;
  border-color: #16a34a;
}

.day-cell.empty {
  background-color: var(--ui-bg-elevated);
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.page-info {
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}
</style>
