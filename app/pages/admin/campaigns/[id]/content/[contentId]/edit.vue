<template>
  <div class="editor-page">
    <div v-if="loading" class="loading-state">Loading content...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <template v-else-if="content">
      <div class="editor-header">
        <NuxtLink :to="`/admin/campaigns/${campaignId}/content`" class="back-link">
          ← Back to Content
        </NuxtLink>
        <div class="header-actions">
          <button @click="deleteContent" class="btn-danger">Delete</button>
          <button @click="saveContent" class="btn-primary" :disabled="saving || !isValid">
            {{ saving ? 'Saving...' : 'Update' }}
          </button>
        </div>
      </div>

      <div class="editor-container">
        <div class="editor-main">
          <EditorPrayerFuelEditor v-model="form.content_json" />
        </div>

        <aside class="editor-sidebar">
          <div class="sidebar-section">
            <h3>Details</h3>

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

            <div class="form-group">
              <label for="content_date">Date *</label>
              <input
                id="content_date"
                v-model="form.content_date"
                type="date"
                required
              />
            </div>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const campaignId = computed(() => parseInt(route.params.id as string))
const contentId = computed(() => parseInt(route.params.contentId as string))

interface PrayerContent {
  id: number
  title: string
  content_date: string
  content_json: any
}

const content = ref<PrayerContent | null>(null)
const loading = ref(true)
const error = ref('')

const form = ref({
  title: '',
  content_date: '',
  content_json: null as any
})

const saving = ref(false)

const isValid = computed(() => {
  return form.value.title && form.value.content_date
})

async function loadContent() {
  try {
    loading.value = true
    error.value = ''

    const data = await $fetch<PrayerContent>(
      `/api/admin/campaigns/${campaignId.value}/content/${contentId.value}`
    )

    content.value = data
    form.value = {
      title: data.title,
      content_date: data.content_date,
      content_json: data.content_json || { time: Date.now(), blocks: [] }
    }
  } catch (err: any) {
    error.value = 'Failed to load content'
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function saveContent() {
  if (!isValid.value) return

  try {
    saving.value = true

    const updatedContent = await $fetch(`/api/admin/campaigns/${campaignId.value}/content/${contentId.value}`, {
      method: 'PUT',
      body: {
        title: form.value.title,
        content_date: form.value.content_date,
        content_json: form.value.content_json
      }
    })

    // Update local content reference
    content.value = updatedContent as any

    // Show success feedback (optional - could use a toast notification instead)
    const button = document.querySelector('.btn-primary') as HTMLButtonElement
    if (button) {
      const originalText = button.textContent
      button.textContent = 'Saved ✓'
      setTimeout(() => {
        button.textContent = originalText
      }, 2000)
    }
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to update content')
  } finally {
    saving.value = false
  }
}

async function deleteContent() {
  if (!confirm('Are you sure you want to delete this content?')) {
    return
  }

  try {
    await $fetch(`/api/admin/campaigns/${campaignId.value}/content/${contentId.value}`, {
      method: 'DELETE'
    })

    router.push(`/admin/campaigns/${campaignId.value}/content`)
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to delete content')
  }
}

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
  background: var(--color-background);
}

.loading-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 1.125rem;
}

.error-state {
  color: var(--text-muted);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-soft);
}

.back-link {
  color: var(--color-text-muted);
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

.btn-primary {
  background-color: var(--text);
  color: var(--bg);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.15s;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  background-color: var(--text);
  color: var(--bg);
  border: 1px solid var(--border);
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.15s;
}

.btn-danger:hover {
  opacity: 0.9;
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
  border-left: 1px solid var(--color-border);
  background: var(--color-background-soft);
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
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background-color: var(--color-background);
  font-size: 0.875rem;
  color: var(--color-text);
}

.form-group input:focus {
  outline: none;
  border-color: var(--text);
  box-shadow: 0 0 0 3px var(--shadow);
}

@media (max-width: 768px) {
  .editor-container {
    flex-direction: column-reverse;
  }

  .editor-sidebar {
    width: 100%;
    border-left: none;
    border-bottom: 1px solid var(--color-border);
  }
}
</style>
