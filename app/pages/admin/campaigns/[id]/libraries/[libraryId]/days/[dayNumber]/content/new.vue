<template>
  <div class="editor-page">
    <div class="editor-header">
      <NuxtLink :to="`/admin/campaigns/${campaignId}/libraries/${libraryId}/days/${dayNumber}`" class="back-link">
        ← Back to Day {{ dayNumber }}
      </NuxtLink>
      <div class="flex gap-2">
        <UButton @click="cancel" variant="outline">
          Cancel
        </UButton>
        <UButton @click="saveContent" :loading="saving" :disabled="!isValid">
          Save
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
const campaignId = computed(() => parseInt(route.params.id as string))
const libraryId = computed(() => parseInt(route.params.libraryId as string))
const dayNumber = computed(() => parseInt(route.params.dayNumber as string))
const languageCode = computed(() => route.query.lang as string || 'en')

const selectedLanguage = computed(() => getLanguageByCode(languageCode.value))

const form = ref({
  content_json: {
    type: 'doc',
    content: [] as Array<{ content?: Array<{ text?: string }> }>
  }
})

const saving = ref(false)
const isSaved = ref(false)
const showUnsavedChangesModal = ref(false)
const pendingNavigation = ref<any>(null)

const isValid = computed(() => {
  return true
})

const hasActualContent = computed(() => {
  if (form.value.content_json?.content && Array.isArray(form.value.content_json.content)) {
    for (const node of form.value.content_json.content) {
      if (node.content && Array.isArray(node.content) && node.content.length > 0) {
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
  router.push(`/admin/campaigns/${campaignId.value}/libraries/${libraryId.value}/days/${dayNumber.value}`)
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

    isSaved.value = true

    toast.add({
      title: 'Content created',
      description: 'Your content has been saved successfully.',
      color: 'success'
    })

    router.push(`/admin/campaigns/${campaignId.value}/libraries/${libraryId.value}/days/${dayNumber.value}`)
  } catch (err: any) {
    console.error('Failed to create content:', err)
    toast.add({
      title: 'Failed to create content',
      description: err.data?.statusMessage || 'An error occurred while saving your content.',
      color: 'error'
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

onBeforeRouteLeave((to, from, next) => {
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
