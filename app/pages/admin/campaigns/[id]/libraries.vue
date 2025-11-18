<template>
  <div class="campaign-libraries-page">
    <div class="page-header">
      <div>
        <NuxtLink to="/admin/campaigns" class="back-link">← Back to Campaigns</NuxtLink>
        <h1 v-if="campaign" class="campaign-name">{{ campaign.title }} - Library Configuration</h1>
        <p class="subtitle">Configure which content libraries this campaign uses</p>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading configuration...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="config-container">
      <div class="config-section">
        <h3>Available Libraries</h3>
        <p class="section-description">Select libraries to add to this campaign</p>

        <div v-if="availableLibraries.length === 0" class="empty-message">
          <p>All libraries are already added to this campaign.</p>
        </div>

        <div v-else class="library-list">
          <div
            v-for="library in availableLibraries"
            :key="library.id"
            class="library-card available"
          >
            <div class="library-info">
              <strong>{{ library.name }}</strong>
              <span class="library-stats">
                {{ library.stats?.totalDays || 0 }} days
              </span>
            </div>
            <UButton
              @click="addLibrary(library.id)"
              size="sm"
            >
              Add
            </UButton>
          </div>
        </div>
      </div>

      <div class="config-section">
        <h3>Selected Libraries</h3>
        <p class="section-description">Drag to reorder. Content will be served in this order.</p>

        <div v-if="selectedLibraries.length === 0" class="empty-message">
          <p>No libraries selected. Add libraries to provide content for this campaign.</p>
        </div>

        <div v-else class="library-list">
          <div
            v-for="(item, index) in selectedLibraries"
            :key="item.library_id"
            class="library-card selected"
            draggable="true"
            @dragstart="dragStart(index)"
            @dragover.prevent
            @drop="drop(index)"
          >
            <div class="drag-handle">
              <span class="order-number">{{ index + 1 }}</span>
              ⋮⋮
            </div>
            <div class="library-info">
              <strong>{{ getLibraryName(item.library_id) }}</strong>
              <span class="library-stats">
                {{ getLibraryStats(item.library_id) }}
              </span>
            </div>
            <UButton
              @click="removeLibrary(item.library_id)"
              size="sm"
              color="neutral"
              variant="outline"
            >
              Remove
            </UButton>
          </div>
        </div>

        <div v-if="selectedLibraries.length > 0" class="save-section">
          <UButton
            @click="saveConfiguration"
            size="lg"
            :disabled="saving"
          >
            {{ saving ? 'Saving...' : 'Save Configuration' }}
          </UButton>
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

interface Library {
  id: number
  name: string
  description: string
  stats?: {
    totalDays: number
    languageStats: { [key: string]: number }
  }
}

interface CampaignLibraryConfig {
  id: number
  campaign_id: number
  library_id: number
  order_index: number
  enabled: boolean
  library?: Library
}

const campaign = ref<Campaign | null>(null)
const allLibraries = ref<Library[]>([])
const selectedLibraries = ref<CampaignLibraryConfig[]>([])
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const draggedIndex = ref<number | null>(null)

const availableLibraries = computed(() => {
  const selectedIds = new Set(selectedLibraries.value.map(item => item.library_id))
  return allLibraries.value.filter(lib => !selectedIds.has(lib.id))
})

async function loadCampaign() {
  try {
    const response = await $fetch<{ campaign: Campaign }>(`/api/admin/campaigns/${campaignId.value}`)
    campaign.value = response.campaign
  } catch (err) {
    console.error('Failed to load campaign:', err)
    error.value = 'Failed to load campaign'
  }
}

async function loadLibraries() {
  try {
    const response = await $fetch<{ libraries: Library[] }>('/api/admin/libraries')
    allLibraries.value = response.libraries
  } catch (err) {
    console.error('Failed to load libraries:', err)
    error.value = 'Failed to load libraries'
  }
}

async function loadConfiguration() {
  try {
    loading.value = true
    error.value = ''

    const response = await $fetch<{ libraries: CampaignLibraryConfig[] }>(
      `/api/admin/campaigns/${campaignId.value}/libraries`
    )
    selectedLibraries.value = response.libraries.sort((a, b) => a.order_index - b.order_index)
  } catch (err: any) {
    error.value = 'Failed to load configuration'
    console.error(err)
  } finally {
    loading.value = false
  }
}

function addLibrary(libraryId: number) {
  const library = allLibraries.value.find(lib => lib.id === libraryId)
  if (!library) return

  selectedLibraries.value.push({
    id: 0, // Temporary ID
    campaign_id: campaignId.value,
    library_id: libraryId,
    order_index: selectedLibraries.value.length + 1,
    enabled: true,
    library
  })
}

function removeLibrary(libraryId: number) {
  selectedLibraries.value = selectedLibraries.value.filter(
    item => item.library_id !== libraryId
  )
  // Update order indices
  selectedLibraries.value.forEach((item, index) => {
    item.order_index = index + 1
  })
}

function getLibraryName(libraryId: number): string {
  const library = allLibraries.value.find(lib => lib.id === libraryId)
  return library?.name || 'Unknown'
}

function getLibraryStats(libraryId: number): string {
  const library = allLibraries.value.find(lib => lib.id === libraryId)
  if (!library?.stats) return ''
  return `${library.stats.totalDays || 0} days`
}

function dragStart(index: number) {
  draggedIndex.value = index
}

function drop(dropIndex: number) {
  if (draggedIndex.value === null) return

  const items = [...selectedLibraries.value]
  const [draggedItem] = items.splice(draggedIndex.value, 1)
  items.splice(dropIndex, 0, draggedItem)

  // Update order indices
  items.forEach((item, index) => {
    item.order_index = index + 1
  })

  selectedLibraries.value = items
  draggedIndex.value = null
}

async function saveConfiguration() {
  try {
    saving.value = true

    await $fetch(`/api/admin/campaigns/${campaignId.value}/libraries`, {
      method: 'PUT',
      body: {
        library_ids: selectedLibraries.value.map(item => item.library_id)
      }
    })

    alert('Configuration saved successfully!')
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to save configuration')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    loadCampaign(),
    loadLibraries(),
    loadConfiguration()
  ])
})
</script>

<style scoped>
.campaign-libraries-page {
  max-width: 1200px;
}

.page-header {
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

.subtitle {
  margin: 0;
  color: var(--ui-text-muted);
}

.loading, .error {
  text-align: center;
  padding: 2rem;
}

.config-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.config-section {
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  padding: 1.5rem;
  background-color: var(--ui-bg);
}

.config-section h3 {
  margin: 0 0 0.5rem;
}

.section-description {
  margin: 0 0 1.5rem;
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}

.empty-message {
  text-align: center;
  padding: 2rem;
  color: var(--ui-text-muted);
  font-size: 0.875rem;
}

.library-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.library-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  background-color: var(--ui-bg-elevated);
  transition: all 0.2s;
}

.library-card.available:hover {
  border-color: var(--text);
}

.library-card.selected {
  cursor: move;
}

.library-card.selected:hover {
  border-color: var(--text);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.drag-handle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ui-text-muted);
  cursor: move;
  user-select: none;
}

.order-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--text);
  color: var(--bg);
  font-size: 0.75rem;
  font-weight: 600;
}

.library-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.library-stats {
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}

.save-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--ui-border);
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .config-container {
    grid-template-columns: 1fr;
  }
}
</style>
