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

        <!-- People Groups Tab -->
        <div v-if="item.value === 'people-groups'" class="py-6">
          <h2 class="text-xl font-semibold mb-2">People Groups Sync</h2>
          <p class="text-[var(--ui-text-muted)] mb-6">Synchronize people groups from the Disciple.Tools API. Existing records will be updated, new records will be created.</p>

          <UButton
            @click="syncPeopleGroups"
            :loading="isSyncingPeopleGroups"
            variant="outline"
          >
            {{ isSyncingPeopleGroups ? 'Syncing...' : 'Sync People Groups' }}
          </UButton>

          <UAlert
            v-if="syncMessage"
            :color="syncMessage.type === 'success' ? 'success' : 'error'"
            :title="syncMessage.text"
            class="mt-4"
          />

          <UCard v-if="syncStats" class="mt-6">
            <template #header>
              <h3 class="font-semibold">Sync Results</h3>
            </template>
            <div class="space-y-2">
              <p><strong>Total from API:</strong> {{ syncStats.total }}</p>
              <p><strong>Created:</strong> {{ syncStats.created }}</p>
              <p><strong>Updated:</strong> {{ syncStats.updated }}</p>
              <p><strong>Errors:</strong> {{ syncStats.errors }}</p>
            </div>
          </UCard>
        </div>

        <!-- Campaigns Tab -->
        <div v-if="item.value === 'campaigns'" class="py-6">
          <h2 class="text-xl font-semibold mb-2">Campaign Management</h2>
          <p class="text-[var(--ui-text-muted)] mb-6">Update the "People Praying" count for all campaigns. This calculates the 7-day average of daily unique prayers.</p>

          <UButton
            @click="updatePrayerCounts"
            :loading="isUpdatingPrayerCounts"
            variant="outline"
          >
            {{ isUpdatingPrayerCounts ? 'Updating...' : 'Save Prayer Counts' }}
          </UButton>

          <UAlert
            v-if="prayerCountsMessage"
            :color="prayerCountsMessage.type === 'success' ? 'success' : 'error'"
            :title="prayerCountsMessage.text"
            class="mt-4"
          />
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
  { label: 'People Groups', value: 'people-groups' },
  { label: 'Campaigns', value: 'campaigns' },
]

const activeTab = ref('backups')
const isCreatingBackup = ref(false)
const backupMessage = ref<{ text: string; type: 'success' | 'error' } | null>(null)
const lastBackup = ref<{ filename: string; size: number; location: string } | null>(null)

const isSyncingPeopleGroups = ref(false)
const syncMessage = ref<{ text: string; type: 'success' | 'error' } | null>(null)
const syncStats = ref<{ total: number; created: number; updated: number; errors: number } | null>(null)

const isUpdatingPrayerCounts = ref(false)
const prayerCountsMessage = ref<{ text: string; type: 'success' | 'error' } | null>(null)

async function createBackup() {
  isCreatingBackup.value = true
  backupMessage.value = null

  try {
    const response = await $fetch<{
      success: boolean
      backup: { filename: string; size: number; location: string }
    }>('/api/admin/backup/create', {
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

async function syncPeopleGroups() {
  isSyncingPeopleGroups.value = true
  syncMessage.value = null
  syncStats.value = null

  try {
    const response = await $fetch<{
      success: boolean
      message: string
      stats: { total: number; created: number; updated: number; errors: number }
    }>('/api/admin/people-groups/sync', {
      method: 'POST'
    })

    syncMessage.value = {
      text: response.message,
      type: 'success'
    }
    syncStats.value = response.stats
  } catch (error: any) {
    console.error('Sync error:', error)
    syncMessage.value = {
      text: error.data?.message || 'Failed to sync people groups. Please try again.',
      type: 'error'
    }
  } finally {
    isSyncingPeopleGroups.value = false
  }
}

async function updatePrayerCounts() {
  isUpdatingPrayerCounts.value = true
  prayerCountsMessage.value = null

  try {
    await $fetch('/api/admin/campaigns/update-prayer-counts', {
      method: 'POST'
    })

    prayerCountsMessage.value = {
      text: 'Prayer counts updated successfully!',
      type: 'success'
    }
  } catch (error: any) {
    console.error('Prayer counts update error:', error)
    prayerCountsMessage.value = {
      text: error.data?.message || 'Failed to update prayer counts. Please try again.',
      type: 'error'
    }
  } finally {
    isUpdatingPrayerCounts.value = false
  }
}
</script>
