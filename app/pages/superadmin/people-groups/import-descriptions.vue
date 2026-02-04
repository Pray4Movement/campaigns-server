<template>
  <div class="max-w-4xl">
    <div class="flex items-center gap-4 mb-8">
      <UButton
        to="/superadmin"
        variant="ghost"
        icon="i-lucide-arrow-left"
      />
      <h1 class="text-2xl font-bold">Import People Group Descriptions</h1>
    </div>

    <UCard class="mb-8">
      <template #header>
        <h2 class="text-lg font-semibold">CSV Format Requirements</h2>
      </template>
      <div class="space-y-4 text-sm text-muted">
        <p>Upload a CSV file with the following columns:</p>
        <ul class="list-disc list-inside space-y-1">
          <li><strong>PEID</strong> - The IMB People Group ID (used to match records)</li>
          <li><strong>PeopleDesc</strong> - The description text to import</li>
        </ul>
        <p>The PEID column will be matched against the <code>imb_peid</code> field in the people group metadata.</p>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">Upload CSV File</h2>
      </template>

      <div class="space-y-6">
        <div>
          <input
            ref="fileInput"
            type="file"
            accept=".csv"
            class="hidden"
            @change="handleFileSelect"
          />
          <UButton
            @click="($refs.fileInput as HTMLInputElement).click()"
            variant="outline"
            icon="i-lucide-upload"
          >
            Select CSV File
          </UButton>
          <span v-if="selectedFile" class="ml-4 text-muted">
            {{ selectedFile.name }} ({{ formatBytes(selectedFile.size) }})
          </span>
        </div>

        <UButton
          @click="importDescriptions"
          :loading="isImporting"
          :disabled="!selectedFile"
        >
          {{ isImporting ? 'Importing...' : 'Import Descriptions' }}
        </UButton>

        <UAlert
          v-if="importMessage"
          :color="importMessage.type === 'success' ? 'success' : 'error'"
          :title="importMessage.text"
        />

        <UCard v-if="importStats" variant="soft">
          <template #header>
            <h3 class="font-semibold">Import Results</h3>
          </template>
          <div class="space-y-2">
            <p><strong>Total rows:</strong> {{ importStats.total }}</p>
            <p><strong>Matched:</strong> {{ importStats.matched }}</p>
            <p><strong>Updated:</strong> {{ importStats.updated }}</p>
            <p><strong>Not found:</strong> {{ importStats.notFound }}</p>
            <p><strong>Errors:</strong> {{ importStats.errors }}</p>
          </div>
        </UCard>

        <UCard v-if="notFoundPeids && notFoundPeids.length > 0" variant="soft" class="mt-4">
          <template #header>
            <h3 class="font-semibold">PEIDs Not Found (first 50)</h3>
          </template>
          <div class="text-sm text-muted max-h-48 overflow-y-auto">
            {{ notFoundPeids.join(', ') }}
          </div>
        </UCard>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'superadmin'
})

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isImporting = ref(false)
const importMessage = ref<{ text: string; type: 'success' | 'error' } | null>(null)
const importStats = ref<{
  total: number
  matched: number
  updated: number
  notFound: number
  errors: number
} | null>(null)
const notFoundPeids = ref<string[] | null>(null)

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files[0] || null
    // Reset previous results
    importMessage.value = null
    importStats.value = null
    notFoundPeids.value = null
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

async function importDescriptions() {
  if (!selectedFile.value) return

  isImporting.value = true
  importMessage.value = null
  importStats.value = null
  notFoundPeids.value = null

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    const response = await $fetch<{
      success: boolean
      message: string
      stats: {
        total: number
        matched: number
        updated: number
        notFound: number
        errors: number
      }
      notFoundPeids?: string[]
    }>('/api/admin/people-groups/import-descriptions', {
      method: 'POST',
      body: formData
    })

    importMessage.value = {
      text: response.message,
      type: 'success'
    }
    importStats.value = response.stats
    notFoundPeids.value = response.notFoundPeids || null

    // Clear selected file on success
    selectedFile.value = null
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  } catch (error: any) {
    console.error('Import error:', error)
    importMessage.value = {
      text: error.data?.statusMessage || error.message || 'Failed to import descriptions. Please try again.',
      type: 'error'
    }
  } finally {
    isImporting.value = false
  }
}
</script>
