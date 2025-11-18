<template>
  <div class="content-page">
    <div class="page-header">
      <div>
        <NuxtLink to="/admin/campaigns" class="back-link">← Back to Campaigns</NuxtLink>
        <h1 v-if="campaign" class="campaign-name">{{ campaign.title }}</h1>
        <p v-if="campaign" class="default-language">
          Default Language: {{ getLanguageName(campaign.default_language) }} {{ getLanguageFlag(campaign.default_language) }}
        </p>
      </div>
      <NuxtLink :to="`/admin/campaigns/${campaignId}/content/new`" class="btn-primary">
        + Add Content
      </NuxtLink>
    </div>

    <div v-if="loading" class="loading">Loading content...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="!groupedContent || groupedContent.length === 0" class="empty-state">
      <p>No prayer content yet. Create your first content entry.</p>
      <NuxtLink :to="`/admin/campaigns/${campaignId}/content/new`" class="btn-primary">
        Add Content
      </NuxtLink>
    </div>

    <div v-else class="content-list">
      <div v-for="group in groupedContent" :key="group.date" class="content-card">
        <div class="content-header">
          <div>
            <h3>{{ formatDate(group.date) }}</h3>
          </div>
          <div class="content-actions">
            <NuxtLink
              :to="`/admin/campaigns/${campaignId}/content/new?date=${group.date}`"
              class="btn-secondary"
            >
              + Add Content
            </NuxtLink>
            <button
              v-if="group.content.length === 1"
              @click="deleteContent(group.content[0])"
              class="btn-danger"
            >
              Delete
            </button>
            <button
              v-else
              @click="deleteAllForDate(group)"
              class="btn-danger"
            >
              Delete All
            </button>
          </div>
        </div>
        <div v-if="group.content.length > 0" class="content-preview">
          <div v-for="contentItem in group.content" :key="contentItem.id" class="preview-item">
            <div class="preview-info">
              <span class="preview-lang">{{ getLanguageFlag(contentItem.language_code) }}</span>
              <span class="preview-title">{{ contentItem.title }}</span>
            </div>
            <NuxtLink
              :to="`/admin/campaigns/${campaignId}/content/${contentItem.id}/edit`"
              class="btn-edit"
              :title="`Edit ${getLanguageName(contentItem.language_code)} version`"
            >
              Edit
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getLanguageName, getLanguageFlag } from '~/utils/languages'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const route = useRoute()
const campaignId = computed(() => parseInt(route.params.id as string))

interface Campaign {
  id: number
  title: string
  default_language: string
}

interface PrayerContent {
  id: number
  campaign_id: number
  content_date: string
  language_code: string
  title: string
  content_json: any
}

interface GroupedContent {
  date: string
  languages: string[]
  content: PrayerContent[]
}

const campaign = ref<Campaign | null>(null)
const groupedContent = ref<GroupedContent[]>([])
const loading = ref(true)
const error = ref('')

async function loadCampaign() {
  try {
    const response = await $fetch<{ campaign: Campaign }>(`/api/admin/campaigns/${campaignId.value}`)
    campaign.value = response.campaign
  } catch (err) {
    console.error('Failed to load campaign:', err)
  }
}

async function loadContent() {
  try {
    loading.value = true
    error.value = ''
    const response = await $fetch<{ content: GroupedContent[] }>(`/api/admin/campaigns/${campaignId.value}/content?grouped=true`)
    groupedContent.value = response.content || []
  } catch (err: any) {
    error.value = 'Failed to load content'
    console.error(err)
    groupedContent.value = []
  } finally {
    loading.value = false
  }
}

async function deleteContent(item: PrayerContent) {
  if (!confirm(`Are you sure you want to delete the ${getLanguageName(item.language_code)} version of "${item.title}"?`)) {
    return
  }

  try {
    await $fetch(`/api/admin/campaigns/${campaignId.value}/content/${item.id}`, {
      method: 'DELETE'
    })
    await loadContent()
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to delete content')
  }
}

async function deleteAllForDate(group: GroupedContent) {
  if (!confirm(`Are you sure you want to delete ALL language versions for ${formatDate(group.date)}? This will delete ${group.content.length} content items.`)) {
    return
  }

  try {
    await Promise.all(
      group.content.map(item =>
        $fetch(`/api/admin/campaigns/${campaignId.value}/content/${item.id}`, {
          method: 'DELETE'
        })
      )
    )
    await loadContent()
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to delete content')
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(() => {
  loadCampaign()
  loadContent()
})
</script>

<style scoped>
.content-page {
  max-width: 1200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

.campaign-name {
  margin: 0 0 0.5rem;
}

.default-language {
  margin: 0;
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}

.btn-primary {
  background-color: var(--text);
  color: var(--bg);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
  transition: opacity 0.15s;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  background-color: var(--ui-bg);
  border: 1px solid var(--ui-border);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  color: var(--color-text);
  display: inline-block;
  transition: background-color 0.15s;
}

.btn-secondary:hover {
  background-color: var(--ui-bg-elevated);
}

.btn-danger {
  background-color: var(--text);
  color: var(--bg);
  border: 1px solid var(--border);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-danger:hover {
  opacity: 0.9;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
}

.error {
  color: var(--text-muted);
}

.empty-state {
  text-align: center;
  padding: 3rem;
}

.empty-state p {
  margin-bottom: 1.5rem;
  color: var(--ui-text-muted);
}

.content-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.content-card {
  background-color: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  padding: 1.5rem;
  transition: border-color 0.15s;
}

.content-card:hover {
  border-color: var(--text-muted);
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.content-header h3 {
  margin: 0 0 0.25rem;
  font-size: 1.125rem;
}

.date {
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}

.content-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.content-preview {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--ui-border);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem;
  background-color: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  transition: border-color 0.15s;
}

.preview-item:hover {
  border-color: var(--text-muted);
}

.preview-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.preview-lang {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.preview-title {
  color: var(--color-text);
  flex: 1;
  font-size: 0.9375rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-edit {
  background-color: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  padding: 0.375rem 0.875rem;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  color: var(--color-text);
  font-size: 0.875rem;
  transition: all 0.15s;
  flex-shrink: 0;
}

.btn-edit:hover {
  border-color: var(--text);
  background-color: var(--ui-bg);
}
</style>
