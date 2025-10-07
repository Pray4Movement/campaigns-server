<template>
  <div class="content-page">
    <div class="page-header">
      <div>
        <NuxtLink to="/admin/campaigns" class="back-link">← Back to Campaigns</NuxtLink>
        <h1 v-if="campaign">{{ campaign.title }} - Prayer Content</h1>
        <h1 v-else>Prayer Content</h1>
      </div>
      <NuxtLink :to="`/admin/campaigns/${campaignId}/content/new`" class="btn-primary">
        + Add Content
      </NuxtLink>
    </div>

    <div v-if="loading" class="loading">Loading content...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="!content || content.length === 0" class="empty-state">
      <p>No prayer content yet. Create your first content entry.</p>
      <NuxtLink :to="`/admin/campaigns/${campaignId}/content/new`" class="btn-primary">
        Add Content
      </NuxtLink>
    </div>

    <div v-else class="content-list">
      <div v-for="item in content" :key="item.id" class="content-card">
        <div class="content-header">
          <div>
            <h3>{{ item.title }}</h3>
            <span class="date">{{ formatDate(item.content_date) }}</span>
          </div>
          <div class="content-actions">
            <NuxtLink :to="`/admin/campaigns/${campaignId}/content/${item.id}/edit`" class="btn-secondary">
              Edit
            </NuxtLink>
            <button @click="deleteContent(item)" class="btn-danger">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const route = useRoute()
const campaignId = computed(() => parseInt(route.params.id as string))

interface Campaign {
  id: number
  title: string
}

interface PrayerContent {
  id: number
  campaign_id: number
  content_date: string
  title: string
  content_json: any
}

const campaign = ref<Campaign | null>(null)
const content = ref<PrayerContent[]>([])
const loading = ref(true)
const error = ref('')

async function loadCampaign() {
  try {
    campaign.value = await $fetch(`/api/admin/campaigns/${campaignId.value}`)
  } catch (err) {
    console.error('Failed to load campaign:', err)
  }
}

async function loadContent() {
  try {
    loading.value = true
    error.value = ''
    const response = await $fetch<{ content: PrayerContent[] }>(`/api/admin/campaigns/${campaignId.value}/content`)
    content.value = response.content || []
  } catch (err: any) {
    error.value = 'Failed to load content'
    console.error(err)
    content.value = []
  } finally {
    loading.value = false
  }
}

async function deleteContent(item: PrayerContent) {
  if (!confirm(`Are you sure you want to delete "${item.title}"?`)) {
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
  color: var(--color-text-muted);
  text-decoration: none;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.back-link:hover {
  color: var(--color-text);
}

.page-header h1 {
  margin: 0;
}

.btn-primary {
  background-color: #8b5cf6;
  color: white;
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
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  color: var(--color-text);
  display: inline-block;
  transition: background-color 0.15s;
}

.btn-secondary:hover {
  background-color: var(--color-background-soft);
}

.btn-danger {
  background-color: #dc3545;
  color: white;
  border: none;
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
  color: #dc3545;
}

.empty-state {
  text-align: center;
  padding: 3rem;
}

.empty-state p {
  margin-bottom: 1.5rem;
  color: var(--color-text-muted);
}

.content-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.content-card {
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  transition: border-color 0.15s;
}

.content-card:hover {
  border-color: #8b5cf6;
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
  color: var(--color-text-muted);
}

.content-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
