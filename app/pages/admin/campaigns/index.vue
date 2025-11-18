<template>
  <div class="campaigns-page">
    <div class="page-header">
      <div>
        <h1>Campaigns</h1>
        <p class="subtitle">Manage your prayer campaigns</p>
      </div>
      <button @click="showCreateModal = true" class="btn-primary">
        + Create Campaign
      </button>
    </div>

    <div v-if="loading" class="loading">Loading campaigns...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="campaigns.length === 0" class="empty-state">
      <p>No campaigns yet. Create your first campaign to get started.</p>
      <button @click="showCreateModal = true" class="btn-primary">
        Create Campaign
      </button>
    </div>

    <div v-else class="campaigns-table-container">
      <table class="campaigns-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Slug</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="campaign in campaigns" :key="campaign.id">
            <td class="title-cell">{{ campaign.title }}</td>
            <td class="slug-cell">
              <a :href="`/${campaign.slug}`" target="_blank" rel="noopener noreferrer">/{{ campaign.slug }}</a>
            </td>
            <td>
              <span class="status-badge" :class="campaign.status">
                {{ campaign.status }}
              </span>
            </td>
            <td class="date-cell">{{ formatDate(campaign.created_at) }}</td>
            <td class="actions-cell">
              <button @click="navigateToContent(campaign.id)" class="btn-action" title="Manage Content">
                Content
              </button>
              <button @click="navigateToSubscribers(campaign.id)" class="btn-action" title="Subscribers">
                Subscribers
              </button>
              <button @click="editCampaign(campaign)" class="btn-action" title="Edit">
                Edit
              </button>
              <button @click="deleteCampaign(campaign)" class="btn-action btn-delete" title="Delete">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <UModal
      v-model:open="isModalOpen"
      :title="editingCampaign ? 'Edit Campaign' : 'Create Campaign'"
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>
        <form @submit.prevent="saveCampaign" class="modal-content">
          <UFormField label="Title" required>
            <UInput
              v-model="form.title"
              placeholder="Enter campaign title"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Slug"
            description="Leave empty to auto-generate from title"
          >
            <UInput
              v-model="form.slug"
              placeholder="auto-generated from title"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Description">
            <UTextarea
              v-model="form.description"
              :rows="4"
              placeholder="Enter campaign description"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Status">
            <USelect
              v-model="form.status"
              :items="statusOptions"
              value-key="value"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Default Language"
            description="Primary language for this campaign"
          >
            <USelect
              v-model="form.default_language"
              :items="languageOptions"
              value-key="value"
              class="w-full"
            />
          </UFormField>

          <div class="modal-footer">
            <UButton type="button" variant="outline" @click="closeModal">Cancel</UButton>
            <UButton type="submit" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Campaign' }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

interface Campaign {
  id: number
  slug: string
  title: string
  description: string
  status: 'active' | 'inactive'
  default_language: string
  created_at: string
  updated_at: string
}

const campaigns = ref<Campaign[]>([])
const loading = ref(true)
const error = ref('')
const showCreateModal = ref(false)
const editingCampaign = ref<Campaign | null>(null)
const saving = ref(false)

const isModalOpen = computed({
  get: () => showCreateModal.value || !!editingCampaign.value,
  set: (value: boolean) => {
    if (!value) {
      closeModal()
    }
  }
})

const form = ref({
  title: '',
  slug: '',
  description: '',
  status: 'active' as 'active' | 'inactive',
  default_language: 'en'
})

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' }
]

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Spanish (Español)', value: 'es' },
  { label: 'French (Français)', value: 'fr' },
  { label: 'Portuguese (Português)', value: 'pt' },
  { label: 'German (Deutsch)', value: 'de' },
  { label: 'Italian (Italiano)', value: 'it' },
  { label: 'Chinese (中文)', value: 'zh' },
  { label: 'Arabic (العربية)', value: 'ar' },
  { label: 'Russian (Русский)', value: 'ru' },
  { label: 'Hindi (हिन्दी)', value: 'hi' }
]

async function loadCampaigns() {
  try {
    loading.value = true
    error.value = ''
    const response = await $fetch<{ campaigns: Campaign[] }>('/api/admin/campaigns')
    campaigns.value = response.campaigns
  } catch (err: any) {
    error.value = 'Failed to load campaigns'
    console.error(err)
  } finally {
    loading.value = false
  }
}

function navigateToContent(campaignId: number) {
  navigateTo(`/admin/campaigns/${campaignId}/content`)
}

function navigateToSubscribers(campaignId: number) {
  navigateTo(`/admin/campaigns/${campaignId}/subscribers`)
}

function editCampaign(campaign: Campaign) {
  editingCampaign.value = campaign
  form.value = {
    title: campaign.title,
    slug: campaign.slug,
    description: campaign.description,
    status: campaign.status,
    default_language: campaign.default_language
  }
}

async function saveCampaign() {
  try {
    saving.value = true

    if (editingCampaign.value) {
      // Update existing campaign
      await $fetch(`/api/admin/campaigns/${editingCampaign.value.id}`, {
        method: 'PUT',
        body: form.value
      })
    } else {
      // Create new campaign
      await $fetch('/api/admin/campaigns', {
        method: 'POST',
        body: form.value
      })
    }

    closeModal()
    await loadCampaigns()
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to save campaign')
  } finally {
    saving.value = false
  }
}

async function deleteCampaign(campaign: Campaign) {
  if (!confirm(`Are you sure you want to delete "${campaign.title}"? This will also delete all associated prayer content.`)) {
    return
  }

  try {
    await $fetch(`/api/admin/campaigns/${campaign.id}`, {
      method: 'DELETE'
    })
    await loadCampaigns()
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to delete campaign')
  }
}

function closeModal() {
  showCreateModal.value = false
  editingCampaign.value = null
  form.value = {
    title: '',
    slug: '',
    description: '',
    status: 'active',
    default_language: 'en'
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  loadCampaigns()
})
</script>

<style scoped>
.campaigns-page {
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
  color: var(--color-text-muted);
}

.btn-primary {
  background-color: var(--text);
  color: var(--bg);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.2s;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: var(--color-background-soft);
}

.btn-danger {
  background-color: var(--text);
  color: var(--bg);
  border: 1px solid var(--border);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
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
  color: var(--color-text-muted);
}

.campaigns-table-container {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.campaigns-table {
  width: 100%;
  border-collapse: collapse;
}

.campaigns-table thead {
  background-color: var(--color-background-soft);
  border-bottom: 2px solid var(--color-border);
}

.campaigns-table th {
  text-align: left;
  padding: 1rem;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.campaigns-table tbody tr {
  border-bottom: 1px solid var(--color-border);
  transition: background-color 0.2s;
}

.campaigns-table tbody tr:hover {
  background-color: var(--color-background-soft);
}

.campaigns-table tbody tr:last-child {
  border-bottom: none;
}

.campaigns-table td {
  padding: 1rem;
  vertical-align: middle;
}

.title-cell {
  font-weight: 500;
}

.slug-cell {
  font-family: monospace;
  font-size: 0.875rem;
}

.slug-cell a {
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color 0.2s;
}

.slug-cell a:hover {
  color: var(--text);
  text-decoration: underline;
}

.date-cell {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.active {
  background-color: var(--text);
  color: var(--bg);
}

.status-badge.inactive {
  background-color: var(--color-background);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.actions-cell {
  white-space: nowrap;
}

.btn-action {
  background: none;
  border: none;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  color: var(--text);
  text-decoration: underline;
  transition: opacity 0.2s;
}

.btn-action:hover {
  opacity: 0.7;
}

.btn-action.btn-delete {
  color: var(--color-text-muted);
}

.btn-action.btn-delete:hover {
  color: var(--text);
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
