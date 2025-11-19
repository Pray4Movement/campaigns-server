<template>
  <div class="editor-page">
    <div v-if="loading" class="loading-state">
      <p>Loading content...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <UButton :to="`/admin/libraries/${libraryId}/days/${dayNumber}`">
        Back to Day {{ dayNumber }}
      </UButton>
    </div>

    <template v-else>
      <div class="editor-header">
        <NuxtLink :to="`/admin/libraries/${libraryId}/days/${dayNumber}`" class="back-link">
          ← Back to Day {{ dayNumber }}
        </NuxtLink>
        <div class="header-actions">
          <button @click="cancel" class="btn-secondary">
            Cancel
          </button>
          <button @click="saveContent" class="btn-primary" :disabled="saving || !isValid">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <div class="editor-container">
        <div class="editor-main">
          <RichTextEditor v-model="form.content_json" />
        </div>

        <aside class="editor-sidebar">
          <div class="sidebar-section">
            <h3>Details</h3>

            <div class="info-field">
              <label>Day</label>
              <div class="info-value">Day {{ dayNumber }}</div>
            </div>

            <div class="info-field">
              <label>Language</label>
              <div class="info-value">
                {{ selectedLanguage?.flag }} {{ selectedLanguage?.name }}
                <span class="language-native">({{ selectedLanguage?.nativeName }})</span>
              </div>
            </div>

            <div class="form-group">
              <label for="title">Title *</label>
              <input
                id="title"
                v-model="form.title"
                type="text"
                required
                placeholder="Enter content title"
              />
            </div>
          </div>
        </aside>
      </div>
    </template>

    <!-- Unsaved Changes Modal -->
    <ConfirmModal
      v-model:open="showUnsavedChangesModal"
      title="Leave Without Saving?"
      message="Your changes will be lost."
      confirm-text="Leave"
      confirm-color="primary"
      @confirm="confirmLeave"
      @cancel="cancelLeave"
    />
  </div>
</template>

<script setup lang="ts">
import { getLanguageByCode } from '~/utils/languages'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const libraryId = computed(() => parseInt(route.params.id as string))
const dayNumber = computed(() => parseInt(route.params.dayNumber as string))
const contentId = computed(() => parseInt(route.params.contentId as string))

interface LibraryContent {
  id: number
  library_id: number
  day_number: number
  language_code: string
  title: string
  content_json: any
}

const content = ref<LibraryContent | null>(null)
const loading = ref(true)
const error = ref('')

const selectedLanguage = computed(() =>
  content.value ? getLanguageByCode(content.value.language_code) : null
)

const form = ref({
  title: '',
  content_json: {
    type: 'doc',
    content: []
  }
})

const saving = ref(false)
const hasChanges = ref(false)
const toast = useToast()
const showUnsavedChangesModal = ref(false)
const pendingNavigation = ref<any>(null)

const isValid = computed(() => {
  return form.value.title.trim().length > 0
})

async function loadContent() {
  try {
    loading.value = true
    error.value = ''

    const response = await $fetch<{ content: LibraryContent }>(
      `/api/admin/libraries/${libraryId.value}/content/${contentId.value}`
    )

    content.value = response.content

    // Populate form with existing data
    form.value.title = response.content.title
    form.value.content_json = response.content.content_json
      ? (typeof response.content.content_json === 'string'
          ? JSON.parse(response.content.content_json)
          : response.content.content_json)
      : { type: 'doc', content: [] }

    // Wait for next tick to ensure all reactive updates are complete
    await nextTick()

    // Now set up the watcher to track changes
    watch(form, () => {
      hasChanges.value = true
    }, { deep: true })

  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to load content'
    console.error(err)
  } finally {
    loading.value = false
  }
}

function cancel() {
  router.push(`/admin/libraries/${libraryId.value}/days/${dayNumber.value}`)
}

async function saveContent() {
  if (!isValid.value) return

  try {
    saving.value = true

    await $fetch(`/api/admin/libraries/${libraryId.value}/content/${contentId.value}`, {
      method: 'PUT',
      body: {
        title: form.value.title,
        content_json: form.value.content_json
      }
    })

    // Mark as saved so the route guard doesn't trigger
    hasChanges.value = false

    toast.add({
      title: 'Content updated',
      description: 'Your changes have been saved successfully.',
      color: 'green'
    })

    // Navigate back to day overview
    router.push(`/admin/libraries/${libraryId.value}/days/${dayNumber.value}`)
  } catch (err: any) {
    console.error('Failed to save content:', err)
    toast.add({
      title: 'Failed to save content',
      description: err.data?.statusMessage || 'An error occurred while saving your changes.',
      color: 'red'
    })
    // If save failed, keep hasChanges as true
  } finally {
    saving.value = false
  }
}

function confirmLeave() {
  hasChanges.value = false
  showUnsavedChangesModal.value = false
  if (pendingNavigation.value) {
    pendingNavigation.value()
  }
}

function cancelLeave() {
  showUnsavedChangesModal.value = false
  pendingNavigation.value = null
}

// Warn before leaving if there are unsaved changes
onBeforeRouteLeave((to, from, next) => {
  if (hasChanges.value) {
    pendingNavigation.value = next
    showUnsavedChangesModal.value = true
  } else {
    next()
  }
})

onMounted(() => {
  loadContent()
})
</script>

<style scoped>
.editor-page {
  position: fixed;
  top: 0;
  left: 250px;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: var(--ui-bg);
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 1rem;
  text-align: center;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--ui-border);
  background: var(--ui-bg-elevated);
}

.back-link {
  color: var(--ui-text-muted);
  text-decoration: none;
  font-size: 0.875rem;
}

.back-link:hover {
  color: var(--color-text);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-primary, .btn-secondary {
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.15s;
}

.btn-primary {
  background-color: var(--text);
  color: var(--bg);
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: transparent;
  color: var(--color-text);
  border: 1px solid var(--ui-border);
}

.btn-secondary:hover {
  background-color: var(--ui-bg-elevated);
}

.editor-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-main {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.editor-sidebar {
  width: 320px;
  border-left: 1px solid var(--ui-border);
  background: var(--ui-bg-elevated);
  overflow-y: auto;
  padding: 1.5rem;
}

.sidebar-section {
  margin-bottom: 2rem;
}

.sidebar-section h3 {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.info-field {
  margin-bottom: 1.25rem;
}

.info-field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}

.info-value {
  font-size: 0.875rem;
  color: var(--color-text);
  font-weight: 500;
}

.language-native {
  color: var(--ui-text-muted);
  font-weight: normal;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--color-text);
}

.form-group input {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  background-color: var(--ui-bg);
  font-size: 0.875rem;
  color: var(--color-text);
}

.form-group input:focus {
  outline: none;
  border-color: var(--text);
  box-shadow: 0 0 0 3px var(--shadow);
}

@media (max-width: 768px) {
  .editor-page {
    left: 0;
  }

  .editor-container {
    flex-direction: column-reverse;
  }

  .editor-sidebar {
    width: 100%;
    border-left: none;
    border-bottom: 1px solid var(--ui-border);
  }
}
</style>
