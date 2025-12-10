<template>
  <div class="max-w-6xl">
    <h1 class="text-2xl font-bold mb-8">Superadmin Panel</h1>

    <UTabs v-model="activeTab" :items="tabs" class="mb-8">
      <template #content="{ item }">
        <!-- Backups Tab -->
        <div v-if="item.value === 'backups'" class="py-6">
          <h2 class="text-xl font-semibold mb-2">Database Backups</h2>
          <p class="text-[var(--ui-text-muted)] mb-6">Manually trigger a database backup. Backups are automatically stored in S3.</p>

          <UButton
            @click="createBackup"
            :loading="isCreatingBackup"
            variant="outline"
          >
            {{ isCreatingBackup ? 'Creating Backup...' : 'Create Manual Backup' }}
          </UButton>

          <UAlert
            v-if="backupMessage"
            :color="backupMessage.type === 'success' ? 'success' : 'error'"
            :title="backupMessage.text"
            class="mt-4"
          />

          <UCard v-if="lastBackup" class="mt-6">
            <template #header>
              <h3 class="font-semibold">Last Backup Details</h3>
            </template>
            <div class="space-y-2">
              <p><strong>Filename:</strong> {{ lastBackup.filename }}</p>
              <p><strong>Size:</strong> {{ formatBytes(lastBackup.size) }}</p>
              <p><strong>Location:</strong> {{ lastBackup.location }}</p>
            </div>
          </UCard>
        </div>
      </template>
    </UTabs>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'superadmin'
})

const tabs = [
  { label: 'Backups', value: 'backups' },
  // Add more tabs here as needed
]

const activeTab = ref('backups')
const isCreatingBackup = ref(false)
const backupMessage = ref<{ text: string; type: 'success' | 'error' } | null>(null)
const lastBackup = ref<{ filename: string; size: number; location: string } | null>(null)

async function createBackup() {
  isCreatingBackup.value = true
  backupMessage.value = null

  try {
    const response = await $fetch('/api/admin/backup/create', {
      method: 'POST'
    })

    backupMessage.value = {
      text: 'Backup created successfully!',
      type: 'success'
    }

    lastBackup.value = response.backup
  } catch (error: any) {
    console.error('Backup error:', error)
    backupMessage.value = {
      text: error.data?.message || 'Failed to create backup. Please try again.',
      type: 'error'
    }
  } finally {
    isCreatingBackup.value = false
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>
