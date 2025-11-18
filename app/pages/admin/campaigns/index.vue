<template>
  <div class="campaigns-page">
    <div class="page-header">
      <div>
        <h1>Campaigns</h1>
        <p class="subtitle">Manage your prayer campaigns</p>
      </div>
      <UButton @click="showCreateModal = true" size="lg">
        + Create Campaign
      </UButton>
    </div>

    <div v-if="loading" class="loading">Loading campaigns...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="campaigns.length === 0" class="empty-state">
      <p>No campaigns yet. Create your first campaign to get started.</p>
      <UButton @click="showCreateModal = true" size="lg">
        Create Campaign
      </UButton>
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
              <UBadge
                :label="campaign.status"
                :variant="campaign.status === 'active' ? 'solid' : 'outline'"
                :color="campaign.status === 'active' ? 'primary' : 'neutral'"
              />
            </td>
            <td class="date-cell">{{ formatDate(campaign.created_at) }}</td>
            <td class="actions-cell">
              <UButton
                @click="navigateToContent(campaign.id)"
                variant="link"
                size="sm"
                title="Manage Content"
              >
                Content
              </UButton>
              <UButton
                @click="navigateToLibraries(campaign.id)"
                variant="link"
                size="sm"
                title="Configure Libraries"
              >
                Libraries
              </UButton>
              <UButton
                @click="navigateToSubscribers(campaign.id)"
                variant="link"
                size="sm"
                title="Subscribers"
              >
                Subscribers
              </UButton>
              <UButton
                @click="editCampaign(campaign)"
                variant="link"
                size="sm"
                title="Edit"
              >
                Edit
              </UButton>
              <UButton
                @click="deleteCampaign(campaign)"
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

function navigateToLibraries(campaignId: number) {
  navigateTo(`/admin/campaigns/${campaignId}/libraries`)
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

.campaigns-table-container {
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  overflow: hidden;
}

.campaigns-table {
  width: 100%;
  border-collapse: collapse;
}

.campaigns-table thead {
  background-color: var(--ui-bg-elevated);
  border-bottom: 2px solid var(--ui-border);
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
  border-bottom: 1px solid var(--ui-border);
  transition: background-color 0.2s;
}

.campaigns-table tbody tr:hover {
  background-color: var(--ui-bg-elevated);
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
  color: var(--ui-text-muted);
  text-decoration: none;
  transition: color 0.2s;
}

.slug-cell a:hover {
  color: var(--text);
  text-decoration: underline;
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
