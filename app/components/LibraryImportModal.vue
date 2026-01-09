<template>
  <UModal
    v-model:open="isOpen"
    title="Import Library"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <div class="import-modal-body">
        <!-- Step 1: File Upload -->
        <div v-if="step === 'upload'" class="upload-section">
          <div
            class="upload-area"
            :class="{ 'drag-over': isDragOver }"
            @dragover.prevent="isDragOver = true"
            @dragleave.prevent="isDragOver = false"
            @drop.prevent="handleDrop"
            @click="fileInputRef?.click()"
          >
            <UIcon name="i-lucide-upload" class="upload-icon" />
            <p>Drop a library export file here or click to select</p>
            <p class="hint">Accepts .json files</p>
          </div>
          <input
            ref="fileInputRef"
            type="file"
            accept=".json"
            class="hidden"
            @change="handleFileSelect"
          />
          <p v-if="fileError" class="error-text">{{ fileError }}</p>
        </div>

        <!-- Step 2: Preview -->
        <div v-else-if="step === 'preview' && preview" class="preview-section">
          <div class="preview-header">
            <h3>{{ preview.library.name }}</h3>
            <p v-if="preview.library.description" class="description">{{ preview.library.description }}</p>
          </div>

          <div class="preview-stats">
            <div class="stat">
              <span class="stat-value">{{ preview.stats.totalDays }}</span>
              <span class="stat-label">Days</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ preview.stats.totalContentItems }}</span>
              <span class="stat-label">Content Items</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ Object.keys(preview.stats.languageCoverage).length }}</span>
              <span class="stat-label">Languages</span>
            </div>
          </div>

          <div class="language-coverage">
            <span
              v-for="(count, lang) in preview.stats.languageCoverage"
              :key="lang"
              class="language-badge"
              :title="`${count} items`"
            >
              {{ getLanguageFlag(String(lang)) }} {{ String(lang).toUpperCase() }}
            </span>
          </div>

          <UFormField label="Library Name" class="name-field">
            <UInput
              v-model="importName"
              placeholder="Enter library name"
            />
          </UFormField>

          <UFormField v-if="campaignId" label="Library Key" required class="key-field">
            <UInput
              v-model="libraryKey"
              placeholder="e.g., day_in_life"
            />
            <template #hint>
              Used for internal identification within the campaign
            </template>
          </UFormField>

          <p v-if="importError" class="error-text">{{ importError }}</p>
        </div>

        <!-- Step 3: Importing -->
        <div v-else-if="step === 'importing'" class="importing-section">
          <UIcon name="i-lucide-loader-2" class="loading-icon" />
          <p>Importing library content...</p>
        </div>

        <!-- Step 4: Complete -->
        <div v-else-if="step === 'complete' && result" class="complete-section">
          <UIcon name="i-lucide-check-circle" class="success-icon" />
          <h3>Import Successful</h3>
          <p>"{{ result.library.name }}" has been imported.</p>
          <div class="result-stats">
            <span>{{ result.importStats.contentItemsImported }} items imported</span>
            <span v-if="result.importStats.contentItemsSkipped > 0">
              {{ result.importStats.contentItemsSkipped }} items skipped
            </span>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="modal-actions">
        <UButton
          v-if="step !== 'importing'"
          @click="handleClose"
          variant="outline"
        >
          {{ step === 'complete' ? 'Close' : 'Cancel' }}
        </UButton>

        <UButton
          v-if="step === 'preview'"
          @click="handleImport"
          :disabled="!canImport"
        >
          Import Library
        </UButton>

        <UButton
          v-if="step === 'complete'"
          @click="handleViewLibrary"
        >
          View Library
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { getLanguageFlag } from '~/utils/languages'

interface LibraryExportData {
  version: string
  exportedAt: string
  library: {
    name: string
    description: string
    type: string
    repeating: boolean
    library_key: string | null
  }
  content: Array<{
    day_number: number
    language_code: string
    content_json: Record<string, any> | null
  }>
  stats: {
    totalDays: number
    totalContentItems: number
    languageCoverage: Record<string, number>
  }
}

interface ImportResult {
  success: boolean
  library: {
    id: number
    name: string
    description: string
  }
  importStats: {
    contentItemsImported: number
    contentItemsSkipped: number
  }
}

interface Props {
  open?: boolean
  campaignId?: number
}

const props = withDefaults(defineProps<Props>(), {
  open: false
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  imported: [library: ImportResult['library']]
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const step = ref<'upload' | 'preview' | 'importing' | 'complete'>('upload')
const preview = ref<LibraryExportData | null>(null)
const result = ref<ImportResult | null>(null)
const fileError = ref('')
const importError = ref('')
const importName = ref('')
const libraryKey = ref('')

const canImport = computed(() => {
  if (!importName.value.trim()) return false
  if (props.campaignId && !libraryKey.value.trim()) return false
  return true
})

function resetState() {
  step.value = 'upload'
  preview.value = null
  result.value = null
  fileError.value = ''
  importError.value = ''
  importName.value = ''
  libraryKey.value = ''
  isDragOver.value = false
}

function handleClose() {
  if (step.value === 'complete' && result.value) {
    emit('imported', result.value.library)
  }
  isOpen.value = false
  // Reset state after modal closes
  setTimeout(resetState, 300)
}

function handleDrop(event: DragEvent) {
  isDragOver.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    processFile(file)
  }
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    processFile(file)
  }
}

async function processFile(file: File) {
  fileError.value = ''

  if (!file.name.endsWith('.json')) {
    fileError.value = 'Please select a JSON file'
    return
  }

  try {
    const text = await file.text()
    const data = JSON.parse(text) as LibraryExportData

    // Basic validation
    if (!data.version || !data.library || !Array.isArray(data.content)) {
      fileError.value = 'Invalid library export file format'
      return
    }

    preview.value = data
    importName.value = data.library.name
    libraryKey.value = data.library.library_key || ''
    step.value = 'preview'
  } catch (error) {
    fileError.value = 'Failed to parse JSON file'
  }
}

async function handleImport() {
  if (!preview.value) return

  importError.value = ''
  step.value = 'importing'

  try {
    const response = await $fetch<ImportResult>('/api/admin/libraries/import', {
      method: 'POST',
      body: {
        data: preview.value,
        name: importName.value,
        campaign_id: props.campaignId || undefined,
        library_key: props.campaignId ? libraryKey.value : undefined
      }
    })

    result.value = response
    step.value = 'complete'
  } catch (error: any) {
    step.value = 'preview'
    importError.value = error.data?.statusMessage || 'Failed to import library'
  }
}

function handleViewLibrary() {
  if (!result.value) return

  const libraryId = result.value.library.id

  if (props.campaignId) {
    navigateTo(`/admin/campaigns/${props.campaignId}/libraries/${libraryId}/days/1`)
  } else {
    navigateTo(`/admin/libraries/${libraryId}/content`)
  }

  handleClose()
}

// Reset state when modal opens
watch(() => props.open, (newValue) => {
  if (newValue) {
    resetState()
  }
})
</script>

<style scoped>
.import-modal-body {
  padding: 1.5rem;
  min-height: 200px;
}

.upload-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  border: 2px dashed var(--ui-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: var(--ui-primary);
  background-color: var(--ui-bg-elevated);
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: var(--ui-text-muted);
  margin-bottom: 1rem;
}

.upload-area p {
  margin: 0;
  text-align: center;
}

.upload-area .hint {
  font-size: 0.875rem;
  color: var(--ui-text-muted);
  margin-top: 0.5rem;
}

.hidden {
  display: none;
}

.error-text {
  color: var(--ui-error);
  font-size: 0.875rem;
  margin: 0;
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.preview-header h3 {
  margin: 0 0 0.5rem;
}

.preview-header .description {
  margin: 0;
  color: var(--ui-text-muted);
  font-size: 0.875rem;
}

.preview-stats {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background-color: var(--ui-bg-elevated);
  border-radius: 8px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--ui-text-muted);
  text-transform: uppercase;
}

.language-coverage {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.language-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background-color: var(--ui-bg-elevated);
  border-radius: 4px;
  font-size: 0.875rem;
}

.name-field,
.key-field {
  margin-top: 0.5rem;
}

.importing-section,
.complete-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  gap: 1rem;
}

.loading-icon {
  width: 48px;
  height: 48px;
  color: var(--ui-primary);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.success-icon {
  width: 48px;
  height: 48px;
  color: var(--ui-success);
}

.complete-section h3 {
  margin: 0;
}

.complete-section p {
  margin: 0;
  color: var(--ui-text-muted);
}

.result-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 100%;
}
</style>
