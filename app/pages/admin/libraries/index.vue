<template>
  <div class="libraries-page">
    <div class="page-header">
      <div>
        <h1>Content Libraries</h1>
        <p class="subtitle">Manage centralized prayer content libraries</p>
      </div>
      <UButton @click="showCreateModal = true" size="lg">
        + Create Library
      </UButton>
    </div>

    <div v-if="loading" class="loading">Loading libraries...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="libraries.length === 0" class="empty-state">
      <p>No libraries yet. Create your first content library to get started.</p>
      <UButton @click="showCreateModal = true" size="lg">
        Create Library
      </UButton>
    </div>

    <div v-else class="libraries-table-container">
      <table class="libraries-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Days</th>
            <th>Languages</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="library in libraries" :key="library.id">
            <td class="name-cell">{{ library.name }}</td>
            <td class="stats-cell">{{ library.stats?.totalDays || 0 }}</td>
            <td class="stats-cell">
              <div class="language-flags">
                <span
                  v-for="(count, lang) in library.stats?.languageStats"
                  :key="lang"
                  :title="`${getLanguageName(lang)}: ${count} days`"
                >
                  {{ getLanguageFlag(lang) }}
                </span>
              </div>
            </td>
            <td class="date-cell">{{ formatDate(library.created_at) }}</td>
            <td class="actions-cell">
              <UButton
                @click="navigateToContent(library.id)"
                variant="link"
                size="sm"
                title="Manage Content"
              >
                Content
              </UButton>
              <UButton
                @click="editLibrary(library)"
                variant="link"
                size="sm"
                title="Edit"
              >
                Edit
              </UButton>
              <UButton
                @click="deleteLibrary(library)"
                variant="link"
                size="sm"
                color="neutral"
                title="Delete"
                class="delete-btn"
              >
                Delete
              </UButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <UModal
      v-model:open="isModalOpen"
      :title="editingLibrary ? 'Edit Library' : 'Create Library'"
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>
        <form @submit.prevent="saveLibrary" class="modal-content">
          <UFormField label="Library Name" required>
            <UInput
              v-model="form.name"
              placeholder="Enter library name"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Description">
            <UTextarea
              v-model="form.description"
              :rows="4"
              placeholder="Enter library description (optional)"
              class="w-full"
            />
          </UFormField>

          <div class="modal-footer">
            <UButton type="button" variant="outline" @click="closeModal">Cancel</UButton>
            <UButton type="submit" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Library' }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { getLanguageName, getLanguageFlag } from '~/utils/languages'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

interface Library {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
  stats?: {
    totalDays: number
    languageStats: { [key: string]: number }
  }
}

const libraries = ref<Library[]>([])
const loading = ref(true)
const error = ref('')
const showCreateModal = ref(false)
const editingLibrary = ref<Library | null>(null)
const saving = ref(false)

const isModalOpen = computed({
  get: () => showCreateModal.value || !!editingLibrary.value,
  set: (value: boolean) => {
    if (!value) {
      closeModal()
    }
  }
})

const form = ref({
  name: '',
  description: ''
})

async function loadLibraries() {
  try {
    loading.value = true
    error.value = ''
    const response = await $fetch<{ libraries: Library[] }>('/api/admin/libraries')
    libraries.value = response.libraries
  } catch (err: any) {
    error.value = 'Failed to load libraries'
    console.error(err)
  } finally {
    loading.value = false
  }
}

function navigateToContent(libraryId: number) {
  navigateTo(`/admin/libraries/${libraryId}/content`)
}

function editLibrary(library: Library) {
  editingLibrary.value = library
  form.value = {
    name: library.name,
    description: library.description
  }
}

async function saveLibrary() {
  if (!form.value.name.trim()) {
    alert('Library name is required')
    return
  }

  try {
    saving.value = true

    if (editingLibrary.value) {
      // Update existing library
      await $fetch(`/api/admin/libraries/${editingLibrary.value.id}`, {
        method: 'PUT',
        body: form.value
      })
    } else {
      // Create new library
      const response = await $fetch<{ library: Library }>('/api/admin/libraries', {
        method: 'POST',
        body: form.value
      })

      // Redirect to content editor for new library
      closeModal()
      navigateTo(`/admin/libraries/${response.library.id}/content`)
      return
    }

    closeModal()
    await loadLibraries()
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to save library')
  } finally {
    saving.value = false
  }
}

async function deleteLibrary(library: Library) {
  if (!confirm(`Are you sure you want to delete "${library.name}"? This will also delete all associated content.`)) {
    return
  }

  try {
    await $fetch(`/api/admin/libraries/${library.id}`, {
      method: 'DELETE'
    })
    await loadLibraries()
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to delete library')
  }
}

function closeModal() {
  showCreateModal.value = false
  editingLibrary.value = null
  form.value = {
    name: '',
    description: ''
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  loadLibraries()
})
</script>

<style scoped>
.libraries-page {
  max-width: 1200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

.libraries-table-container {
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  overflow: hidden;
}

.libraries-table {
  width: 100%;
  border-collapse: collapse;
}

.libraries-table thead {
  background-color: var(--ui-bg-elevated);
  border-bottom: 2px solid var(--ui-border);
}

.libraries-table th {
  text-align: left;
  padding: 1rem;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.libraries-table tbody tr {
  border-bottom: 1px solid var(--ui-border);
  transition: background-color 0.2s;
}

.libraries-table tbody tr:hover {
  background-color: var(--ui-bg-elevated);
}

.libraries-table tbody tr:last-child {
  border-bottom: none;
}

.libraries-table td {
  padding: 1rem;
  vertical-align: middle;
}

.name-cell {
  font-weight: 500;
}

.stats-cell {
  font-size: 0.875rem;
}

.language-flags {
  display: flex;
  gap: 0.25rem;
  font-size: 1.25rem;
}

.date-cell {
  font-size: 0.875rem;
  color: var(--ui-text-muted);
  white-space: nowrap;
}

.actions-cell {
  white-space: nowrap;
  display: flex;
  gap: 0.25rem;
}

.delete-btn {
  color: var(--ui-text-muted);
}

.modal-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 600px;
  margin: 0 auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1.5rem;
  border-top: 1px solid var(--color-border);
  margin-top: 0.5rem;
}
</style>
