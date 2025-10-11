<template>
  <div class="superadmin-container">
    <h1>Superadmin Panel</h1>

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="tab-content">
      <!-- Backups Tab -->
      <div v-if="activeTab === 'backups'" class="tab-panel">
        <h2>Database Backups</h2>
        <p>Manually trigger a database backup. Backups are automatically stored in S3.</p>

        <button
          @click="createBackup"
          :disabled="isCreatingBackup"
          class="backup-btn"
        >
          {{ isCreatingBackup ? 'Creating Backup...' : 'Create Manual Backup' }}
        </button>

        <div v-if="backupMessage" :class="['message', backupMessage.type]">
          {{ backupMessage.text }}
        </div>

        <div v-if="lastBackup" class="backup-info">
          <h3>Last Backup Details</h3>
          <p><strong>Filename:</strong> {{ lastBackup.filename }}</p>
          <p><strong>Size:</strong> {{ formatBytes(lastBackup.size) }}</p>
          <p><strong>Location:</strong> {{ lastBackup.location }}</p>
        </div>
      </div>

      <!-- Additional tabs can be added here -->
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'superadmin'
})

const tabs = [
  { id: 'backups', label: 'Backups' },
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

<style scoped>
.superadmin-container {
  max-width: 1200px;
}

h1 {
  margin: 0 0 2rem;
  font-size: 2rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 2rem;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 1rem;
  color: var(--color-text-muted);
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--text);
}

.tab-btn.active {
  color: var(--text);
  border-bottom-color: var(--text);
}

.tab-panel h2 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
}

.tab-panel p {
  margin: 0 0 1.5rem;
  color: var(--color-text-muted);
}

.backup-btn {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-background);
  color: var(--text);
  border: 2px solid var(--text);
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.backup-btn:hover:not(:disabled) {
  background-color: var(--text);
  color: var(--background);
}

.backup-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid;
}

.message.success {
  background-color: var(--color-background-soft);
  border-color: var(--color-border);
}

.message.error {
  background-color: var(--color-background-soft);
  border-color: var(--text);
}

.backup-info {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.backup-info h3 {
  margin: 0 0 1rem;
  font-size: 1.25rem;
}

.backup-info p {
  margin: 0.5rem 0;
  color: var(--text);
}

.backup-info strong {
  font-weight: 600;
}
</style>
