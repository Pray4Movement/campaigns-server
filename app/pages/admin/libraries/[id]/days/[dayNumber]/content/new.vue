<template>
  <div class="editor-page">
    <div class="editor-header">
      <NuxtLink :to="`/admin/libraries/${libraryId}/days/${dayNumber}`" class="back-link">
        ← Back to Day {{ dayNumber }}
      </NuxtLink>
      <div class="header-actions">
        <button @click="cancel" class="btn-secondary">
          Cancel
        </button>
        <button @click="saveContent" class="btn-primary" :disabled="saving || !isValid">
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>

    <div class="editor-container">
      <div class="editor-main">
        <div class="editor-details">
          Day {{ dayNumber }} • {{ selectedLanguage?.flag }} {{ selectedLanguage?.name }} ({{ selectedLanguage?.nativeName }})
        </div>
        <RichTextEditor v-model="form.content_json" />
      </div>
    </div>

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
import { LANGUAGES, getLanguageByCode } from '~/utils/languages'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const libraryId = computed(() => parseInt(route.params.id as string))
const dayNumber = computed(() => parseInt(route.params.dayNumber as string))
const languageCode = computed(() => route.query.lang as string || 'en')

const selectedLanguage = computed(() => getLanguageByCode(languageCode.value))

const form = ref({
  content_json: {
    type: 'doc',
    content: []
  }
})

const saving = ref(false)
const isSaved = ref(false)
const showUnsavedChangesModal = ref(false)
const pendingNavigation = ref<any>(null)

const isValid = computed(() => {
  // Content is always valid since we just need the content_json structure
  return true
})

const hasActualContent = computed(() => {
  // Check if content_json has actual content (not just empty doc structure)
  if (form.value.content_json?.content && Array.isArray(form.value.content_json.content)) {
    // Check if there's any actual text content
    for (const node of form.value.content_json.content) {
      if (node.content && Array.isArray(node.content) && node.content.length > 0) {
        // Has content nodes
        for (const child of node.content) {
          if (child.text && child.text.trim().length > 0) {
            return true
          }
        }
      }
    }
  }

  return false
})

function cancel() {
  router.push(`/admin/libraries/${libraryId.value}/days/${dayNumber.value}`)
}

const toast = useToast()

async function saveContent() {
  if (!isValid.value) return

  try {
    saving.value = true

    await $fetch(`/api/admin/libraries/${libraryId.value}/content`, {
      method: 'POST',
      body: {
        day_number: dayNumber.value,
        language_code: languageCode.value,
        content_json: form.value.content_json
      }
    })

    // Mark as saved so the route guard doesn't trigger
    isSaved.value = true

    toast.add({
      title: 'Content created',
      description: 'Your content has been saved successfully.',
      color: 'green'
    })

    // Navigate back to day overview
    router.push(`/admin/libraries/${libraryId.value}/days/${dayNumber.value}`)
  } catch (err: any) {
    console.error('Failed to create content:', err)
    toast.add({
      title: 'Failed to create content',
      description: err.data?.statusMessage || 'An error occurred while saving your content.',
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}

function confirmLeave() {
  isSaved.value = true
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
  // Don't warn if we just saved or if there's no actual content
  if (isSaved.value || !hasActualContent.value) {
    next()
  } else {
    pendingNavigation.value = next
    showUnsavedChangesModal.value = true
  }
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

.editor-details {
  font-size: 0.875rem;
  color: var(--ui-text-muted);
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--ui-border);
}

@media (max-width: 768px) {
  .editor-page {
    left: 0;
  }
}
</style>
