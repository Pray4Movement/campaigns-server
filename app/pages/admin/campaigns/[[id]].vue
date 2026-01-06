<template>
  <CrmLayout :loading="loading" :error="error">
    <template #header>
      <div>
        <h1>Campaigns</h1>
        <p class="subtitle">Manage your prayer campaigns</p>
      </div>
      <UButton @click="createNew" size="lg">
        + Create Campaign
      </UButton>
    </template>

    <template #list-header>
      <CrmListPanel
        v-model="searchQuery"
        search-placeholder="Search campaigns..."
        :total-count="filteredCampaigns.length"
      />
    </template>

    <template #list>
      <template v-if="filteredCampaigns.length === 0">
        <div class="empty-list">No campaigns found</div>
      </template>
      <CrmListItem
        v-else
        v-for="campaign in filteredCampaigns"
        :key="campaign.id"
        :active="selectedCampaign?.id === campaign.id"
        @click="selectCampaign(campaign)"
      >
        <div class="campaign-title">{{ campaign.title }}</div>
        <div class="campaign-slug">/{{ campaign.slug }}</div>
        <div class="campaign-meta">
          <UBadge
            :label="campaign.status"
            :variant="campaign.status === 'active' ? 'solid' : 'outline'"
            :color="campaign.status === 'active' ? 'primary' : 'neutral'"
            size="xs"
          />
          <span class="praying-count" :title="`${campaign.people_praying} praying daily (7-day avg)`">
            {{ campaign.people_praying }} praying
          </span>
        </div>
      </CrmListItem>
    </template>

    <template #detail>
      <CrmDetailPanel :has-selection="!!selectedCampaign || isCreating">
        <template #header>
          <h2>{{ isCreating ? 'Create Campaign' : selectedCampaign?.title }}</h2>
          <div v-if="!isCreating && selectedCampaign" class="header-meta">
            <a :href="`/${selectedCampaign.slug}`" target="_blank" rel="noopener noreferrer" class="slug-link">
              /{{ selectedCampaign.slug }}
            </a>
            <span class="date">Created {{ formatDate(selectedCampaign.created_at) }}</span>
          </div>
        </template>

        <template #actions>
          <UButton type="button" variant="outline" @click="cancelEdit">
            {{ isCreating ? 'Cancel' : 'Reset' }}
          </UButton>
          <UButton v-if="!isCreating" @click="openDeleteModal" color="error" variant="outline">
            Delete
          </UButton>
          <UButton @click="saveCampaign" :loading="saving">
            {{ isCreating ? 'Create Campaign' : 'Save Changes' }}
          </UButton>
        </template>

        <template v-if="!isCreating && selectedCampaign" #secondary-actions>
          <UButton @click="navigateToSubscribers(selectedCampaign.id)" variant="outline">
            View Subscribers
          </UButton>
          <UButton
            :to="`/${selectedCampaign.slug}`"
            target="_blank"
            variant="outline"
          >
            Open Camapaign
          </UButton>
        </template>

        <form @submit.prevent="saveCampaign">
          <CrmFormSection title="Campaign Details" :collapsible="false">
            <div class="form-fields">
              <UFormField label="Title" required>
                <UInput
                  v-model="form.title"
                  placeholder="Enter campaign title"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Slug"
                hint="Leave empty to auto-generate from title"
              >
                <UInput
                  v-model="form.slug"
                  placeholder="auto-generated from title"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Description" class="full-width">
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
                hint="Primary language for this campaign"
              >
                <USelect
                  v-model="form.default_language"
                  :items="languageOptions"
                  value-key="value"
                  class="w-full"
                />
              </UFormField>
            </div>
          </CrmFormSection>
        </form>

        <template #empty>
          Select a campaign to edit or create a new one
        </template>
      </CrmDetailPanel>
    </template>
  </CrmLayout>

  <!-- Delete Confirmation Modal -->
  <ConfirmModal
    v-model:open="showDeleteModal"
    title="Delete Campaign"
    :message="selectedCampaign ? `Are you sure you want to delete &quot;${selectedCampaign.title}&quot;?` : ''"
    warning="This will also delete all associated prayer content. This action cannot be undone."
    confirm-text="Delete"
    confirm-color="primary"
    :loading="deleting"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
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
  people_praying: number
}

const route = useRoute()
const toast = useToast()

// Data
const campaigns = ref<Campaign[]>([])
const selectedCampaign = ref<Campaign | null>(null)
const isCreating = ref(false)

// UI state
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const searchQuery = ref('')

// Delete modal state
const showDeleteModal = ref(false)
const deleting = ref(false)

// Form
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

const filteredCampaigns = computed(() => {
  if (!searchQuery.value) return campaigns.value

  const query = searchQuery.value.toLowerCase()
  return campaigns.value.filter(c =>
    c.title.toLowerCase().includes(query) ||
    c.slug.toLowerCase().includes(query) ||
    c.description?.toLowerCase().includes(query)
  )
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

function selectCampaign(campaign: Campaign, updateUrl = true) {
  isCreating.value = false
  selectedCampaign.value = campaign
  form.value = {
    title: campaign.title,
    slug: campaign.slug,
    description: campaign.description,
    status: campaign.status,
    default_language: campaign.default_language
  }
  if (updateUrl && import.meta.client) {
    window.history.replaceState({}, '', `/admin/campaigns/${campaign.id}`)
  }
}

function createNew() {
  selectedCampaign.value = null
  isCreating.value = true
  form.value = {
    title: '',
    slug: '',
    description: '',
    status: 'active',
    default_language: 'en'
  }
  if (import.meta.client) {
    window.history.replaceState({}, '', '/admin/campaigns/new')
  }
}

function cancelEdit() {
  if (isCreating.value) {
    isCreating.value = false
    selectedCampaign.value = null
    if (import.meta.client) {
      window.history.replaceState({}, '', '/admin/campaigns')
    }
  } else if (selectedCampaign.value) {
    selectCampaign(selectedCampaign.value, false)
  }
}

async function saveCampaign() {
  try {
    saving.value = true

    if (isCreating.value) {
      const response = await $fetch<{ campaign: Campaign }>('/api/admin/campaigns', {
        method: 'POST',
        body: form.value
      })

      toast.add({
        title: 'Campaign created',
        description: `"${response.campaign.title}" has been created successfully.`,
        color: 'success'
      })

      await loadCampaigns()
      selectCampaign(response.campaign)
    } else if (selectedCampaign.value) {
      await $fetch(`/api/admin/campaigns/${selectedCampaign.value.id}`, {
        method: 'PUT',
        body: form.value
      })

      toast.add({
        title: 'Campaign updated',
        description: 'Changes saved successfully.',
        color: 'success'
      })

      await loadCampaigns()

      const updated = campaigns.value.find(c => c.id === selectedCampaign.value!.id)
      if (updated) {
        selectCampaign(updated)
      }
    }
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.statusMessage || 'Failed to save campaign',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

function navigateToSubscribers(campaignId: number) {
  navigateTo(`/admin/subscribers?campaign=${campaignId}&from=campaign&campaignId=${campaignId}`)
}

function openDeleteModal() {
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!selectedCampaign.value) return

  try {
    deleting.value = true
    await $fetch(`/api/admin/campaigns/${selectedCampaign.value.id}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Campaign deleted',
      description: `"${selectedCampaign.value.title}" has been deleted successfully.`,
      color: 'success'
    })

    showDeleteModal.value = false
    selectedCampaign.value = null
    isCreating.value = false
    if (import.meta.client) {
      window.history.replaceState({}, '', '/admin/campaigns')
    }
    await loadCampaigns()
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.statusMessage || 'Failed to delete campaign',
      color: 'error'
    })
  } finally {
    deleting.value = false
  }
}

function cancelDelete() {
  showDeleteModal.value = false
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

// Handle URL-based selection
function handleUrlSelection() {
  const idParam = route.params.id as string | undefined
  if (!idParam) return

  if (idParam === 'new') {
    isCreating.value = true
    form.value = {
      title: '',
      slug: '',
      description: '',
      status: 'active',
      default_language: 'en'
    }
  } else {
    const id = parseInt(idParam)
    const campaign = campaigns.value.find(c => c.id === id)
    if (campaign) {
      selectCampaign(campaign, false)
    }
  }
}

watch(() => campaigns.value, () => {
  if (campaigns.value.length > 0 && !selectedCampaign.value && !isCreating.value) {
    handleUrlSelection()
  }
})

onMounted(async () => {
  await loadCampaigns()
  handleUrlSelection()
})
</script>

<style scoped>
.subtitle {
  margin: 0;
  color: var(--ui-text-muted);
}

.empty-list {
  padding: 2rem;
  text-align: center;
  color: var(--ui-text-muted);
}

.campaign-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.campaign-slug {
  font-family: monospace;
  font-size: 0.8125rem;
  color: var(--ui-text-muted);
  margin-bottom: 0.5rem;
}

.campaign-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.75rem;
}

.praying-count {
  color: var(--ui-text-muted);
}

.header-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8125rem;
  color: var(--ui-text-muted);
  margin-top: 0.25rem;
}

.slug-link {
  font-family: monospace;
  color: var(--ui-text-muted);
  text-decoration: none;
}

.slug-link:hover {
  color: var(--text);
  text-decoration: underline;
}

.date {
  color: var(--ui-text-muted);
}

.form-fields {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-fields .full-width {
  grid-column: 1 / -1;
}

@media (max-width: 768px) {
  .form-fields {
    grid-template-columns: 1fr;
  }
}
</style>
