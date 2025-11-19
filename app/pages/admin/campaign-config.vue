<template>
  <div class="campaign-config-page">
    <div class="page-header">
      <div>
        <h1>Global Campaign Configuration</h1>
        <p class="subtitle">Configure which libraries are available to all campaigns</p>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading configuration...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="config-container">
      <div class="config-section">
        <h3>Available Libraries</h3>
        <p class="section-description">Select libraries to make available to all campaigns</p>

        <div v-if="availableLibraries.length === 0" class="empty-message">
          <p>All libraries are already added to the global configuration.</p>
        </div>

        <div v-else class="library-list">
          <div
            v-for="library in availableLibraries"
            :key="library.id"
            class="library-card available"
          >
            <div class="library-info">
              <strong>{{ library.name }}</strong>
              <span v-if="library.description" class="library-description">
                {{ library.description }}
              </span>
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
        <p class="section-description">
          These libraries are available to all campaigns. Drag to reorder. Content will be served in this order.
        </p>

        <div v-if="selectedLibraries.length === 0" class="empty-message">
          <p>No libraries selected. Add libraries to make them available to all campaigns.</p>
        </div>

        <div v-else class="library-list">
          <div
            v-for="(libraryId, index) in selectedLibraries"
            :key="libraryId"
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
              <strong>{{ getLibraryName(libraryId) }}</strong>
              <span v-if="getLibraryDescription(libraryId)" class="library-description">
                {{ getLibraryDescription(libraryId) }}
              </span>
              <span class="library-stats">
                {{ getLibraryStats(libraryId) }}
              </span>
            </div>
            <UButton
              @click="removeLibrary(libraryId)"
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

interface Library {
  id: number
  name: string
  description: string
  stats?: {
    totalDays: number
    languageStats: { [key: string]: number }
  }
}

interface GlobalConfig {
  campaignLibraries: Array<{
    libraryId: number
    order: number
  }>
}

const allLibraries = ref<Library[]>([])
const selectedLibraries = ref<number[]>([])
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const draggedIndex = ref<number | null>(null)
const toast = useToast()

const availableLibraries = computed(() => {
  const selectedIds = new Set(selectedLibraries.value)
  return allLibraries.value.filter(lib => !selectedIds.has(lib.id))
})

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

    const response = await $fetch<{ config: GlobalConfig }>(
      '/api/admin/campaign-config/libraries'
    )

    // Extract library IDs in order
    selectedLibraries.value = response.config.campaignLibraries
      .sort((a, b) => a.order - b.order)
      .map(item => item.libraryId)
  } catch (err: any) {
    error.value = 'Failed to load configuration'
    console.error(err)
  } finally {
    loading.value = false
  }
}

function addLibrary(libraryId: number) {
  selectedLibraries.value.push(libraryId)
}

function removeLibrary(libraryId: number) {
  selectedLibraries.value = selectedLibraries.value.filter(id => id !== libraryId)
}

function getLibraryName(libraryId: number): string {
  const library = allLibraries.value.find(lib => lib.id === libraryId)
  return library?.name || 'Unknown'
}

function getLibraryDescription(libraryId: number): string {
  const library = allLibraries.value.find(lib => lib.id === libraryId)
  return library?.description || ''
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

  selectedLibraries.value = items
  draggedIndex.value = null
}

async function saveConfiguration() {
  try {
    saving.value = true

    await $fetch('/api/admin/campaign-config/libraries', {
      method: 'PUT',
      body: {
        library_ids: selectedLibraries.value
      }
    })

    toast.add({
      title: 'Configuration saved',
      description: 'Global campaign library configuration has been updated successfully.',
      color: 'green'
    })
  } catch (err: any) {
    toast.add({
      title: 'Failed to save configuration',
      description: err.data?.statusMessage || 'An error occurred while saving the configuration.',
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    loadLibraries(),
    loadConfiguration()
  ])
})
</script>

<style scoped>
.campaign-config-page {
  max-width: 1400px;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
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
  line-height: 1.5;
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
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: var(--text);
  color: var(--bg);
  font-size: 0.875rem;
  font-weight: 600;
}

.library-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.library-info strong {
  font-size: 0.9375rem;
}

.library-description {
  font-size: 0.8125rem;
  color: var(--ui-text-muted);
  line-height: 1.4;
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
