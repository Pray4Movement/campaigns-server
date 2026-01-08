<template>
  <div class="editor-page">
    <div v-if="loading" class="loading-state">
      <p>Loading content...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <UButton :to="`/admin/campaigns/${campaignId}/libraries/${libraryId}/days/${dayNumber}`">
        Back to Day {{ dayNumber }}
      </UButton>
    </div>

    <template v-else>
      <div class="editor-header">
        <NuxtLink :to="`/admin/campaigns/${campaignId}/libraries/${libraryId}/days/${dayNumber}`" class="back-link">
          ← Back to Day {{ dayNumber }}
        </NuxtLink>
        <div class="flex gap-2">
          <UButton @click="cancel" variant="outline">
            Cancel
          </UButton>
          <UButton @click="saveContent" :loading="saving" :disabled="!isValid">
            Save Changes
          </UButton>
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
const campaignId = computed(() => parseInt(route.params.id as string))
const libraryId = computed(() => parseInt(route.params.libraryId as string))
const dayNumber = computed(() => parseInt(route.params.dayNumber as string))
const contentId = computed(() => parseInt(route.params.contentId as string))

interface LibraryContent {
  id: number
  library_id: number
  day_number: number
  language_code: string
  content_json: any
}

const content = ref<LibraryContent | null>(null)
const loading = ref(true)
const error = ref('')

const selectedLanguage = computed(() =>
  content.value ? getLanguageByCode(content.value.language_code) : null
)

const form = ref({
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
  return true
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
    form.value.content_json = response.content.content_json || { type: 'doc', content: [] }

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
  router.push(`/admin/campaigns/${campaignId.value}/libraries/${libraryId.value}/days/${dayNumber.value}`)
}

async function saveContent() {
  if (!isValid.value) return

  try {
    saving.value = true

    await $fetch(`/api/admin/libraries/${libraryId.value}/content/${contentId.value}`, {
      method: 'PUT',
      body: {
        content_json: form.value.content_json
      }
    })

    // Mark as saved so the route guard doesn't trigger
    hasChanges.value = false

    toast.add({
      title: 'Content updated',
      description: 'Your changes have been saved successfully.',
      color: 'success'
    })
  } catch (err: any) {
    console.error('Failed to save content:', err)
    toast.add({
      title: 'Failed to save content',
      description: err.data?.statusMessage || 'An error occurred while saving your changes.',
      color: 'error'
    })
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
