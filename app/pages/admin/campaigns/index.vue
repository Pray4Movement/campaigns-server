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

    <div v-else class="campaigns-grid">
      <div v-for="campaign in campaigns" :key="campaign.id" class="campaign-card">
        <div class="campaign-header">
          <h3>{{ campaign.title }}</h3>
          <span class="status-badge" :class="campaign.status">
            {{ campaign.status }}
          </span>
        </div>

        <p class="campaign-description">{{ campaign.description || 'No description' }}</p>

        <div class="campaign-meta">
          <span class="slug">/{{ campaign.slug }}</span>
          <span class="date">Created {{ formatDate(campaign.created_at) }}</span>
        </div>

        <div class="campaign-actions">
          <NuxtLink :to="`/admin/campaigns/${campaign.id}/content`" class="btn-secondary">
            Manage Content
          </NuxtLink>
          <button @click="editCampaign(campaign)" class="btn-secondary">Edit</button>
          <button @click="deleteCampaign(campaign)" class="btn-danger">Delete</button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || editingCampaign" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingCampaign ? 'Edit Campaign' : 'Create Campaign' }}</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>

        <form @submit.prevent="saveCampaign" class="modal-body">
          <div class="form-group">
            <label for="title">Title *</label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              required
              placeholder="Enter campaign title"
            />
          </div>

          <div class="form-group">
            <label for="slug">Slug</label>
            <input
              id="slug"
              v-model="form.slug"
              type="text"
              placeholder="auto-generated from title"
            />
            <small>Leave empty to auto-generate from title</small>
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              v-model="form.description"
              rows="4"
              placeholder="Enter campaign description"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="status">Status</label>
            <select id="status" v-model="form.status">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div class="modal-footer">
            <button type="button" @click="closeModal" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Campaign' }}
            </button>
          </div>
        </form>
      </div>
    </div>
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
  created_at: string
  updated_at: string
}

const campaigns = ref<Campaign[]>([])
const loading = ref(true)
const error = ref('')
const showCreateModal = ref(false)
const editingCampaign = ref<Campaign | null>(null)
const saving = ref(false)

const form = ref({
  title: '',
  slug: '',
  description: '',
  status: 'active' as 'active' | 'inactive'
})

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

function editCampaign(campaign: Campaign) {
  editingCampaign.value = campaign
  form.value = {
    title: campaign.title,
    slug: campaign.slug,
    description: campaign.description,
    status: campaign.status
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
    status: 'active'
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
  background-color: var(--color-primary, #42b883);
  color: white;
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
  background-color: #dc3545;
  color: white;
  border: none;
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
  color: #dc3545;
}

.empty-state {
  text-align: center;
  padding: 3rem;
}

.empty-state p {
  margin-bottom: 1.5rem;
  color: var(--color-text-muted);
}

.campaigns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.campaign-card {
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
}

.campaign-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.campaign-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.active {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background-color: #f8d7da;
  color: #721c24;
}

.campaign-description {
  margin: 0 0 1rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.campaign-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.slug {
  font-family: monospace;
  background-color: var(--color-background);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.campaign-actions {
  display: flex;
  gap: 0.5rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: var(--color-background);
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: var(--color-text-muted);
  line-height: 1;
}

.close-btn:hover {
  color: var(--color-text);
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background-soft);
  font-size: 1rem;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary, #42b883);
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1.5rem;
  border-top: 1px solid var(--color-border);
  margin-top: 1rem;
}
</style>
