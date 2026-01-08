<template>
  <div class="day-overview-page">
    <!-- Breadcrumb Navigation -->
    <div class="breadcrumb">
      <template v-for="(crumb, index) in breadcrumbs" :key="index">
        <NuxtLink v-if="crumb.to" :to="crumb.to" class="breadcrumb-link">
          {{ crumb.label }}
        </NuxtLink>
        <span v-else class="breadcrumb-current">{{ crumb.label }}</span>
        <span v-if="index < breadcrumbs.length - 1" class="breadcrumb-separator">›</span>
      </template>
    </div>

    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1>Day {{ dayNumber }}</h1>
        <div class="header-actions">
          <UButton
            :to="calendarUrl"
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
          @click="$emit('navigate-previous')"
          variant="outline"
          size="sm"
          :disabled="dayNumber <= 1"
        >
          ← Previous Day
        </UButton>
        <UButton
          @click="$emit('navigate-next')"
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
      <!-- Languages Table -->
      <div class="languages-table">
        <div class="table-header">
          <div class="col-language">Language</div>
          <div class="col-preview">Content Preview</div>
          <div class="col-actions">Actions</div>
        </div>

        <div
          v-for="lang in allLanguagesWithStatus"
          :key="lang.code"
          class="table-row"
          :class="{ 'row-missing': !lang.translation }"
        >
          <div class="col-language">
            <span class="language-flag">{{ lang.flag }}</span>
            <span class="language-name">{{ lang.name }}</span>
          </div>

          <div class="col-preview">
            <template v-if="lang.translation">
              {{ getContentPreview(lang.translation.content_json) }}
            </template>
            <span v-else class="no-translation">No translation</span>
          </div>

          <div class="col-actions">
            <template v-if="lang.translation">
              <UButton
                v-if="showPublicViewLink"
                :to="getPublicUrl(lang.code)"
                variant="link"
                size="sm"
                target="_blank"
                trailing-icon="lucide:external-link"
              >
                View
              </UButton>
              <UButton
                :to="`${contentBaseUrl}/${lang.translation.id}`"
                variant="link"
                size="sm"
              >
                Edit
              </UButton>
              <UButton
                @click="promptDeleteTranslation(lang.translation)"
                variant="link"
                size="sm"
                color="neutral"
              >
                Delete
              </UButton>
            </template>
            <template v-else>
              <UButton
                @click="$emit('create-translation', lang.code)"
                size="sm"
              >
                Create
              </UButton>
            </template>
          </div>
        </div>
      </div>
    </div>

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
import { getLanguageName, LANGUAGES } from '~/utils/languages'

interface BreadcrumbItem {
  label: string
  to?: string
}

interface LibraryContent {
  id: number
  library_id: number
  day_number: number
  language_code: string
  content_json: any
}

const props = defineProps<{
  libraryId: number
  dayNumber: number
  breadcrumbs: BreadcrumbItem[]
  calendarUrl: string
  contentBaseUrl: string
  showPublicViewLink?: boolean
}>()

const emit = defineEmits<{
  'navigate-previous': []
  'navigate-next': []
  'create-translation': [languageCode: string]
}>()

const translations = ref<LibraryContent[]>([])
const loading = ref(true)
const error = ref('')
const showDeleteModal = ref(false)
const translationToDelete = ref<LibraryContent | null>(null)
const toast = useToast()

const allLanguagesWithStatus = computed(() => {
  const translationMap = new Map(translations.value.map(t => [t.language_code, t]))
  return LANGUAGES.map(lang => ({
    code: lang.code,
    name: lang.name,
    flag: lang.flag,
    translation: translationMap.get(lang.code) || null
  }))
})

async function loadTranslations() {
  try {
    loading.value = true
    error.value = ''

    const response = await $fetch<{ content: LibraryContent[] }>(
      `/api/admin/libraries/${props.libraryId}/content?startDay=${props.dayNumber}&endDay=${props.dayNumber}`
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
  if (!contentJson?.content || !Array.isArray(contentJson.content)) return ''

  let text = ''
  for (const node of contentJson.content) {
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

function promptDeleteTranslation(translation: LibraryContent) {
  translationToDelete.value = translation
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!translationToDelete.value) return

  const translation = translationToDelete.value

  try {
    await $fetch(`/api/admin/libraries/${props.libraryId}/content/${translation.id}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Translation deleted',
      description: `${getLanguageName(translation.language_code)} translation has been deleted.`,
      color: 'primary'
    })

    await loadTranslations()
  } catch (err: any) {
    console.error('Failed to delete translation:', err)
    toast.add({
      title: 'Failed to delete translation',
      description: err.data?.statusMessage || 'An error occurred while deleting the translation.',
      color: 'warning'
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

function getPublicUrl(languageCode: string): string {
  if (languageCode === 'en') {
    return `/library/${props.libraryId}/${props.dayNumber}`
  }
  return `/${languageCode}/library/${props.libraryId}/${props.dayNumber}`
}

watch(() => [props.libraryId, props.dayNumber], () => {
  loadTranslations()
}, { immediate: true })

defineExpose({ loadTranslations })
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

.languages-table {
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 200px 1fr auto;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background-color: var(--ui-bg-elevated);
  font-weight: 600;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--ui-border);
}

.table-row {
  display: grid;
  grid-template-columns: 200px 1fr auto;
  gap: 1rem;
  padding: 0.75rem 1rem;
  align-items: center;
  border-bottom: 1px solid var(--ui-border);
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background-color: var(--ui-bg-elevated);
}

.row-missing {
  opacity: 0.7;
}

.col-language {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.language-flag {
  font-size: 1.25rem;
}

.language-name {
  font-weight: 500;
}

.col-preview {
  color: var(--ui-text-muted);
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-translation {
  font-style: italic;
}

.col-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
</style>
