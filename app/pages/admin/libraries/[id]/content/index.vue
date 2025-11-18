<template>
  <div class="library-content-page">
    <div class="page-header">
      <div>
        <NuxtLink to="/admin/libraries" class="back-link">← Back to Libraries</NuxtLink>
        <h1 v-if="library" class="library-name">{{ library.name }}</h1>
        <p v-if="library && library.description" class="library-description">{{ library.description }}</p>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading library content...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="content-editor">
      <!-- Language Filter -->
      <div class="filter-bar">
        <div class="filter-group">
          <label>Filter by Language:</label>
          <USelect
            v-model="selectedLanguage"
            :items="languageOptions"
            value-key="value"
            class="language-select"
          />
        </div>
        <div class="stats">
          <span>Total Days: {{ dayRange.maxDay || 0 }}</span>
        </div>
      </div>

      <!-- Calendar View -->
      <div class="calendar-container">
        <div class="calendar-header">
          <h3>Days Calendar</h3>
          <div class="legend">
            <span class="legend-item">
              <span class="indicator complete"></span> All languages
            </span>
            <span class="legend-item">
              <span class="indicator partial"></span> Some languages
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

      <!-- Day Editor Modal -->
      <UModal
        v-model:open="showDayEditor"
        :title="`Day ${selectedDay} Content`"
        :ui="{ content: 'max-w-4xl' }"
      >
        <template #body>
          <div class="day-editor">
            <div class="day-navigation">
              <UButton
                @click="navigateToPreviousDay"
                variant="outline"
                size="sm"
                :disabled="selectedDay <= 1"
              >
                ← Previous Day
              </UButton>
              <h3>Day {{ selectedDay }}</h3>
              <UButton
                @click="navigateToNextDay"
                variant="outline"
                size="sm"
              >
                Next Day →
              </UButton>
            </div>

            <!-- Existing content for this day -->
            <div v-if="dayContent.length > 0" class="existing-content">
              <h4>Existing Translations</h4>
              <div class="content-list">
                <div
                  v-for="content in dayContent"
                  :key="content.id"
                  class="content-item"
                >
                  <div class="content-item-header">
                    <span class="content-lang">
                      {{ getLanguageFlag(content.language_code) }}
                      {{ getLanguageName(content.language_code) }}
                    </span>
                    <div class="content-actions">
                      <UButton
                        @click="editContent(content)"
                        variant="link"
                        size="sm"
                      >
                        Edit
                      </UButton>
                      <UButton
                        @click="deleteContent(content)"
                        variant="link"
                        size="sm"
                        color="neutral"
                      >
                        Delete
                      </UButton>
                    </div>
                  </div>
                  <div class="content-item-body">
                    <strong>{{ content.title }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Add/Edit content form -->
            <div class="content-form">
              <h4>{{ editingContent ? 'Edit Translation' : 'Add Translation' }}</h4>

              <form @submit.prevent="saveContent">
                <UFormField label="Language" required>
                  <USelect
                    v-model="contentForm.language_code"
                    :items="languageOptions"
                    value-key="value"
                    class="w-full"
                    :disabled="!!editingContent"
                  />
                </UFormField>

                <UFormField label="Title" required>
                  <UInput
                    v-model="contentForm.title"
                    placeholder="Enter content title"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Content">
                  <RichTextEditor
                    v-model="contentForm.content_json"
                    :campaign-id="null"
                  />
                </UFormField>

                <div class="form-actions">
                  <UButton
                    v-if="editingContent"
                    type="button"
                    variant="outline"
                    @click="cancelEdit"
                  >
                    Cancel
                  </UButton>
                  <UButton type="submit" :disabled="saving">
                    {{ saving ? 'Saving...' : 'Save Content' }}
                  </UButton>
                </div>
              </form>
            </div>
          </div>
        </template>
      </UModal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getLanguageName, getLanguageFlag, LANGUAGES } from '~/utils/languages'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const route = useRoute()
const libraryId = computed(() => parseInt(route.params.id as string))

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
const selectedLanguage = ref('all')
const dayContentMap = ref<Map<number, LibraryContent[]>>(new Map())
const dayRange = ref({ minDay: 1, maxDay: 365 })
const currentPage = ref(1)
const daysPerPage = 100
const showDayEditor = ref(false)
const selectedDay = ref(1)
const dayContent = ref<LibraryContent[]>([])
const editingContent = ref<LibraryContent | null>(null)
const saving = ref(false)

const contentForm = ref({
  language_code: 'en',
  title: '',
  content_json: null
})

const languageOptions = computed(() => [
  { label: 'All Languages', value: 'all' },
  ...LANGUAGES.map(lang => ({
    label: `${lang.flag} ${lang.name}`,
    value: lang.code
  }))
])

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
    const response = await $fetch<{ library: Library }>(`/api/admin/libraries/${libraryId.value}`)
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
      `/api/admin/libraries/${libraryId.value}/content?grouped=true`
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

  if (selectedLanguage.value !== 'all') {
    // Filtered by language
    const hasLanguage = content.some(c => c.language_code === selectedLanguage.value)
    return hasLanguage ? 'complete' : 'empty'
  }

  // Check if all languages are present
  const languages = new Set(content.map(c => c.language_code))
  if (languages.size >= LANGUAGES.length) {
    return 'complete'
  } else if (languages.size > 0) {
    return 'partial'
  }

  return 'empty'
}

function getDayTooltip(day: number): string {
  const content = dayContentMap.value.get(day)

  if (!content || content.length === 0) {
    return `Day ${day}: No content`
  }

  const languages = content.map(c => getLanguageName(c.language_code)).join(', ')
  return `Day ${day}: ${languages}`
}

async function selectDay(day: number) {
  selectedDay.value = day
  await loadDayContent(day)
  showDayEditor.value = true
}

async function loadDayContent(day: number) {
  try {
    const response = await $fetch<{ content: LibraryContent[] }>(
      `/api/admin/libraries/${libraryId.value}/content?startDay=${day}&endDay=${day}`
    )
    dayContent.value = response.content
  } catch (err) {
    console.error('Failed to load day content:', err)
    dayContent.value = []
  }
}

function editContent(content: LibraryContent) {
  editingContent.value = content
  contentForm.value = {
    language_code: content.language_code,
    title: content.title,
    content_json: content.content_json ? JSON.parse(content.content_json) : null
  }
}

function cancelEdit() {
  editingContent.value = null
  contentForm.value = {
    language_code: 'en',
    title: '',
    content_json: null
  }
}

async function saveContent() {
  if (!contentForm.value.title.trim()) {
    alert('Title is required')
    return
  }

  try {
    saving.value = true

    if (editingContent.value) {
      // Update existing content
      await $fetch(`/api/admin/libraries/${libraryId.value}/content/${editingContent.value.id}`, {
        method: 'PUT',
        body: contentForm.value
      })
    } else {
      // Create new content
      await $fetch(`/api/admin/libraries/${libraryId.value}/content`, {
        method: 'POST',
        body: {
          ...contentForm.value,
          day_number: selectedDay.value
        }
      })
    }

    // Reload content
    await loadDayContent(selectedDay.value)
    await loadContent()
    cancelEdit()
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to save content')
  } finally {
    saving.value = false
  }
}

async function deleteContent(content: LibraryContent) {
  if (!confirm(`Delete ${getLanguageName(content.language_code)} translation?`)) {
    return
  }

  try {
    await $fetch(`/api/admin/libraries/${libraryId.value}/content/${content.id}`, {
      method: 'DELETE'
    })
    await loadDayContent(selectedDay.value)
    await loadContent()
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to delete content')
  }
}

function navigateToPreviousDay() {
  if (selectedDay.value > 1) {
    selectDay(selectedDay.value - 1)
  }
}

function navigateToNextDay() {
  selectDay(selectedDay.value + 1)
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

watch(selectedLanguage, () => {
  // Calendar view will automatically update based on the computed getDayStatus
})
</script>

<style scoped>
.library-content-page {
  max-width: 1400px;
}

.page-header {
  margin-bottom: 2rem;
}

.back-link {
  display: inline-block;
  color: var(--ui-text-muted);
  text-decoration: none;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.back-link:hover {
  color: var(--color-text);
}

.library-name {
  margin: 0 0 0.5rem;
}

.library-description {
  margin: 0;
  color: var(--ui-text-muted);
}

.loading, .error {
  text-align: center;
  padding: 2rem;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 8px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.filter-group label {
  font-weight: 500;
  font-size: 0.875rem;
}

.language-select {
  min-width: 200px;
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

.indicator.partial {
  background-color: #eab308;
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

.day-cell.partial {
  background-color: #eab308;
  color: white;
  border-color: #ca8a04;
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

.day-editor {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-height: 80vh;
  overflow-y: auto;
}

.day-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--ui-border);
}

.day-navigation h3 {
  margin: 0;
}

.existing-content h4,
.content-form h4 {
  margin: 0 0 1rem;
  font-size: 1rem;
}

.content-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.content-item {
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  padding: 1rem;
  background-color: var(--ui-bg-elevated);
}

.content-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.content-lang {
  font-weight: 500;
  font-size: 0.875rem;
}

.content-actions {
  display: flex;
  gap: 0.5rem;
}

.content-item-body {
  font-size: 0.875rem;
}

.content-form {
  border-top: 1px solid var(--ui-border);
  padding-top: 1.5rem;
}

.content-form form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 1rem;
}
</style>
