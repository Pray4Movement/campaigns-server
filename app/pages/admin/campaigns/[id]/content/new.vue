<template>
  <div class="editor-page">
    <div class="editor-header">
      <NuxtLink :to="`/admin/campaigns/${campaignId}/content`" class="back-link">
        ← Back to Content
      </NuxtLink>
      <div class="header-actions">
        <button @click="saveContent" class="btn-primary" :disabled="saving || !isValid">
          {{ saving ? 'Saving...' : 'Publish' }}
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

          <div class="form-group">
            <label for="language_code">Language *</label>
            <select id="language_code" v-model="form.language_code">
              <option v-for="lang in LANGUAGES" :key="lang.code" :value="lang.code">
                {{ lang.flag }} {{ lang.name }} ({{ lang.nativeName }})
              </option>
            </select>
            <small v-if="campaign">Campaign default: {{ getLanguageName(campaign.default_language) }}</small>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LANGUAGES, getLanguageName } from '~/utils/languages'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const campaignId = computed(() => parseInt(route.params.id as string))
const queryDate = route.query.date as string | undefined

interface Campaign {
  id: number
  default_language: string
}

const campaign = ref<Campaign | null>(null)

const form = ref({
  title: '',
  content_date: '',
  language_code: 'en',
  content_json: {
    type: 'doc',
    content: []
  }
})

const saving = ref(false)

const isValid = computed(() => {
  return form.value.title && form.value.content_date && form.value.language_code
})

async function loadCampaign() {
  try {
    campaign.value = await $fetch(`/api/admin/campaigns/${campaignId.value}`)
    // Set default language from campaign
    if (campaign.value) {
      form.value.language_code = campaign.value.default_language
    }
  } catch (err) {
    console.error('Failed to load campaign:', err)
  }
}

async function saveContent() {
  if (!isValid.value) return

  try {
    saving.value = true

    await $fetch(`/api/admin/campaigns/${campaignId.value}/content`, {
      method: 'POST',
      body: {
        title: form.value.title,
        content_date: form.value.content_date,
        language_code: form.value.language_code,
        content_json: form.value.content_json
      }
    })

    // Navigate back to content list
    router.push(`/admin/campaigns/${campaignId.value}/content`)
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to create content')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadCampaign()

  // Set date from query param or default to today
  if (queryDate) {
    form.value.content_date = queryDate
  } else {
    const today = new Date().toISOString().split('T')[0]
    form.value.content_date = today
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
