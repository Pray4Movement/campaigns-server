<template>
  <div class="day-overview-page">
    <!-- Breadcrumb Navigation -->
    <div class="breadcrumb">
      <NuxtLink to="/admin/libraries" class="breadcrumb-link">Libraries</NuxtLink>
      <span class="breadcrumb-separator">›</span>
      <NuxtLink :to="`/admin/libraries/${libraryId}/content`" class="breadcrumb-link">
        {{ library?.name || 'Library' }}
      </NuxtLink>
      <span class="breadcrumb-separator">›</span>
      <span class="breadcrumb-current">Day {{ dayNumber }}</span>
    </div>

    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1>Day {{ dayNumber }}</h1>
        <div class="header-actions">
          <UButton
            :to="`/admin/libraries/${libraryId}/content`"
            variant="outline"
            size="sm"
          >
            Back to Calendar
          </UButton>
        </div>
      </div>

      <!-- Day Navigation -->
      <div class="day-navigation">
        <UButton
          @click="navigateToPreviousDay"
          variant="outline"
          size="sm"
          :disabled="dayNumber <= 1"
        >
          ← Previous Day
        </UButton>
        <UButton
          @click="navigateToNextDay"
          variant="outline"
          size="sm"
        >
          Next Day →
        </UButton>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading translations...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="content-section">
      <!-- Existing Translations -->
      <div v-if="translations.length > 0" class="translations-list">
        <h2>Existing Translations</h2>
        <div class="translations-grid">
          <UCard
            v-for="translation in translations"
            :key="translation.id"
            class="translation-card"
          >
            <template #header>
              <div class="translation-header">
                <span class="translation-language">
                  {{ getLanguageFlag(translation.language_code) }}
                  {{ getLanguageName(translation.language_code) }}
                </span>
                <div class="translation-actions">
                  <UButton
                    :to="`/admin/libraries/${libraryId}/days/${dayNumber}/content/${translation.id}`"
                    variant="link"
                    size="sm"
                  >
                    Edit
                  </UButton>
                  <UButton
                    @click="promptDeleteTranslation(translation)"
                    variant="link"
                    size="sm"
                    color="neutral"
                  >
                    Delete
                  </UButton>
                </div>
              </div>
            </template>

            <div class="translation-body">
              <div class="translation-preview" v-html="getContentPreview(translation.content_json)"></div>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <p>No translations yet for Day {{ dayNumber }}</p>
      </div>

      <!-- Add Translation Button -->
      <div class="add-translation-section">
        <UButton
          @click="showLanguageSelector = true"
          size="lg"
        >
          Add Translation
        </UButton>
      </div>
    </div>

    <!-- Language Selector Modal -->
    <UModal
      v-model:open="showLanguageSelector"
      title="Select Language"
    >
      <template #body>
        <div class="language-selector">
          <p class="language-selector-description">
            Choose the language for the new translation:
          </p>
          <div class="language-options">
            <button
              v-for="lang in availableLanguages"
              :key="lang.code"
              @click="createTranslation(lang.code)"
              class="language-option"
            >
              <span class="language-flag">{{ lang.flag }}</span>
              <span class="language-name">{{ lang.name }}</span>
              <span class="language-native">({{ lang.nativeName }})</span>
            </button>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-model:open="showDeleteModal"
      title="Delete Translation"
      :message="translationToDelete ? `Are you sure you want to delete the ${getLanguageName(translationToDelete.language_code)} translation?` : ''"
      warning="This action cannot be undone."
      confirm-text="Delete"
      confirm-color="primary"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
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
const dayNumber = computed(() => parseInt(route.params.dayNumber as string))

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
const translations = ref<LibraryContent[]>([])
const loading = ref(true)
const error = ref('')
const showLanguageSelector = ref(false)
const showDeleteModal = ref(false)
const translationToDelete = ref<LibraryContent | null>(null)
const toast = useToast()

const availableLanguages = computed(() => {
  const usedLanguages = new Set(translations.value.map(t => t.language_code))
  return LANGUAGES.filter(lang => !usedLanguages.has(lang.code))
})

async function loadLibrary() {
  try {
    const response = await $fetch<{ library: Library }>(`/api/admin/libraries/${libraryId.value}`)
    library.value = response.library
  } catch (err) {
    console.error('Failed to load library:', err)
  }
}

async function loadTranslations() {
  try {
    loading.value = true
    error.value = ''

    const response = await $fetch<{ content: LibraryContent[] }>(
      `/api/admin/libraries/${libraryId.value}/content?startDay=${dayNumber.value}&endDay=${dayNumber.value}`
    )
    translations.value = response.content
  } catch (err: any) {
    error.value = 'Failed to load translations'
    console.error(err)
  } finally {
    loading.value = false
  }
}

function getContentPreview(contentJson: any): string {
  if (!contentJson) return ''

  try {
    const parsed = typeof contentJson === 'string' ? JSON.parse(contentJson) : contentJson

    // Extract text from Tiptap JSON structure
    if (parsed.content && Array.isArray(parsed.content)) {
      let text = ''
      for (const node of parsed.content) {
        if (node.content && Array.isArray(node.content)) {
          for (const child of node.content) {
            if (child.text) {
              text += child.text + ' '
            }
          }
        }
      }
      return text.trim().substring(0, 100) + (text.length > 100 ? '...' : '')
    }

    return ''
  } catch (err) {
    return ''
  }
}

function promptDeleteTranslation(translation: LibraryContent) {
  translationToDelete.value = translation
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!translationToDelete.value) return

  const translation = translationToDelete.value

  try {
    await $fetch(`/api/admin/libraries/${libraryId.value}/content/${translation.id}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Translation deleted',
      description: `${getLanguageName(translation.language_code)} translation has been deleted.`,
      color: 'green'
    })

    await loadTranslations()
  } catch (err: any) {
    console.error('Failed to delete translation:', err)
    toast.add({
      title: 'Failed to delete translation',
      description: err.data?.statusMessage || 'An error occurred while deleting the translation.',
      color: 'red'
    })
  } finally {
    showDeleteModal.value = false
    translationToDelete.value = null
  }
}

function cancelDelete() {
  showDeleteModal.value = false
  translationToDelete.value = null
}

function createTranslation(languageCode: string) {
  showLanguageSelector.value = false
  navigateTo(`/admin/libraries/${libraryId.value}/days/${dayNumber.value}/content/new?lang=${languageCode}`)
}

function navigateToPreviousDay() {
  if (dayNumber.value > 1) {
    navigateTo(`/admin/libraries/${libraryId.value}/days/${dayNumber.value - 1}`)
  }
}

function navigateToNextDay() {
  navigateTo(`/admin/libraries/${libraryId.value}/days/${dayNumber.value + 1}`)
}

onMounted(async () => {
  await loadLibrary()
  await loadTranslations()
})
</script>

<style scoped>
.day-overview-page {
  max-width: 1200px;
  margin: 0 auto;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-content h1 {
  margin: 0;
  font-size: 2rem;
}

.day-navigation {
  display: flex;
  gap: 0.75rem;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
}

.error {
  color: var(--ui-text-muted);
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.translations-list h2 {
  margin: 0 0 1rem;
  font-size: 1.25rem;
}

.translations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
}

.translation-card {
  transition: transform 0.2s;
}

.translation-card:hover {
  transform: translateY(-2px);
}

.translation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.translation-language {
  font-weight: 600;
  font-size: 1rem;
}

.translation-actions {
  display: flex;
  gap: 0.5rem;
}

.translation-preview {
  color: var(--ui-text-muted);
  font-size: 0.875rem;
  line-height: 1.5;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--ui-text-muted);
  border: 2px dashed var(--ui-border);
  border-radius: 8px;
}

.empty-state p {
  margin: 0;
  font-size: 1.125rem;
}

.add-translation-section {
  display: flex;
  justify-content: center;
  padding: 1rem;
}

.language-selector {
  padding: 1.5rem;
}

.language-selector-description {
  margin: 0 0 1.5rem;
  color: var(--ui-text-muted);
}

.language-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.language-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  background-color: var(--ui-bg);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.language-option:hover {
  background-color: var(--ui-bg-elevated);
  border-color: var(--color-text);
}

.language-flag {
  font-size: 1.5rem;
}

.language-name {
  font-weight: 500;
  flex: 1;
}

.language-native {
  color: var(--ui-text-muted);
  font-size: 0.875rem;
}
</style>
