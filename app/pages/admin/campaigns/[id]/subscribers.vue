<template>
  <div class="subscribers-page">
    <div class="page-header">
      <div>
        <NuxtLink to="/admin/campaigns" class="back-link">← Back to Campaigns</NuxtLink>
        <h1>Subscribers</h1>
        <p class="subtitle">{{ campaign?.title }}</p>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading subscribers...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="subscribers-layout">
      <!-- Left Column: Subscriber List (1/3 width) -->
      <div class="subscriber-list">
        <div class="list-header">
          <UInput
            v-model="searchQuery"
            type="text"
            placeholder="Search by name, email, or phone..."
            class="search-input"
          />
          <USelect
            v-model="filterMethod"
            :items="deliveryMethodOptions"
            value-key="value"
            placeholder="All Methods"
            class="filter-select"
          />
        </div>

        <div v-if="filteredSubscribers.length === 0" class="empty-list">
          No subscribers found
        </div>

        <div v-else class="list-items">
          <div
            v-for="subscriber in filteredSubscribers"
            :key="subscriber.id"
            class="subscriber-item"
            :class="{ active: selectedSubscriber?.id === subscriber.id }"
            @click="selectSubscriber(subscriber)"
          >
            <div class="subscriber-name">{{ subscriber.name }}</div>
            <div class="subscriber-contact">
              {{ subscriber.email || subscriber.phone }}
            </div>
            <div class="subscriber-meta">
              <UBadge
                :label="subscriber.delivery_method"
                :variant="subscriber.delivery_method === 'email' ? 'solid' : 'outline'"
                :color="subscriber.delivery_method === 'email' ? 'primary' : 'neutral'"
                size="xs"
              />
              <span class="date">{{ formatDate(subscriber.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Subscriber Details (2/3 width) -->
      <div class="subscriber-details">
        <div v-if="!selectedSubscriber" class="no-selection">
          Select a subscriber to view details
        </div>

        <div v-else class="details-content">
          <div class="details-header">
            <h2>{{ selectedSubscriber.name }}</h2>
            <UButton @click="openDeleteModal" color="neutral" variant="outline">Delete</UButton>
          </div>

          <form @submit.prevent="saveSubscriber" class="details-form">
            <div class="form-section">
              <h3>Contact Information</h3>

              <UFormField label="Name" required>
                <UInput
                  v-model="editForm.name"
                  type="text"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Email">
                <UInput
                  v-model="editForm.email"
                  type="email"
                  :disabled="editForm.delivery_method !== 'email'"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Phone">
                <UInput
                  v-model="editForm.phone"
                  type="tel"
                  :disabled="editForm.delivery_method !== 'whatsapp'"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="form-section">
              <h3>Delivery Preferences</h3>

              <UFormField
                label="Delivery Method"
                description="Cannot be changed after signup"
              >
                <USelect
                  v-model="editForm.delivery_method"
                  :items="deliveryMethodSelectOptions"
                  value-key="value"
                  disabled
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Frequency">
                <UInput
                  v-model="editForm.frequency"
                  type="text"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Time Preference">
                <UInput
                  v-model="editForm.time_preference"
                  type="time"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Status">
                <USelect
                  v-model="editForm.status"
                  :items="statusOptions"
                  value-key="value"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="form-section">
              <h3>Metadata</h3>

              <div class="info-row">
                <span class="label">Tracking ID:</span>
                <span class="value monospace">{{ selectedSubscriber.tracking_id }}</span>
              </div>

              <div class="info-row">
                <span class="label">Subscribed:</span>
                <span class="value">{{ formatDateTime(selectedSubscriber.created_at) }}</span>
              </div>

              <div class="info-row">
                <span class="label">Last Updated:</span>
                <span class="value">{{ formatDateTime(selectedSubscriber.updated_at) }}</span>
              </div>
            </div>

            <div class="form-actions">
              <UButton type="button" @click="resetForm" variant="outline">Reset</UButton>
              <UButton type="submit" :disabled="saving">
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </UButton>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-model:open="showDeleteModal"
      title="Delete Subscriber"
      :message="subscriberToDelete ? `Are you sure you want to delete &quot;${subscriberToDelete.name}&quot;?` : ''"
      warning="This action cannot be undone."
      confirm-text="Delete"
      confirm-color="primary"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

interface Subscriber {
  id: number
  campaign_id: number
  name: string
  email: string | null
  phone: string | null
  delivery_method: 'email' | 'whatsapp' | 'app'
  frequency: string
  time_preference: string
  status: 'active' | 'unsubscribed'
  tracking_id: string
  created_at: string
  updated_at: string
}

interface Campaign {
  id: number
  title: string
  slug: string
}

const route = useRoute()
const campaignId = computed(() => parseInt(route.params.id as string))

const campaign = ref<Campaign | null>(null)
const subscribers = ref<Subscriber[]>([])
const selectedSubscriber = ref<Subscriber | null>(null)
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const searchQuery = ref('')
const filterMethod = ref('')

// Delete confirmation modal state
const showDeleteModal = ref(false)
const subscriberToDelete = ref<Subscriber | null>(null)
const deleting = ref(false)

// Toast
const toast = useToast()

const editForm = ref({
  name: '',
  email: '',
  phone: '',
  delivery_method: 'email' as 'email' | 'whatsapp' | 'app',
  frequency: '',
  time_preference: '',
  status: 'active' as 'active' | 'unsubscribed'
})

const deliveryMethodOptions = [
  { label: 'Email', value: 'email' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Mobile App', value: 'app' }
]

const deliveryMethodSelectOptions = [
  { label: 'Email', value: 'email' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Mobile App', value: 'app' }
]

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Unsubscribed', value: 'unsubscribed' }
]

const filteredSubscribers = computed(() => {
  let filtered = subscribers.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.email?.toLowerCase().includes(query) ||
      s.phone?.includes(query)
    )
  }

  // Filter by delivery method
  if (filterMethod.value) {
    filtered = filtered.filter(s => s.delivery_method === filterMethod.value)
  }

  return filtered
})

async function loadData() {
  try {
    loading.value = true
    error.value = ''

    // Load campaign info
    const campaignResponse = await $fetch<{ campaign: Campaign }>(`/api/admin/campaigns/${campaignId.value}`)
    campaign.value = campaignResponse.campaign

    // Load subscribers
    const subscribersResponse = await $fetch<{ subscribers: Subscriber[] }>(`/api/admin/campaigns/${campaignId.value}/subscribers`)
    subscribers.value = subscribersResponse.subscribers
  } catch (err: any) {
    error.value = 'Failed to load subscribers'
    console.error(err)
  } finally {
    loading.value = false
  }
}

function selectSubscriber(subscriber: Subscriber) {
  selectedSubscriber.value = subscriber
  editForm.value = {
    name: subscriber.name,
    email: subscriber.email || '',
    phone: subscriber.phone || '',
    delivery_method: subscriber.delivery_method,
    frequency: subscriber.frequency,
    time_preference: subscriber.time_preference,
    status: subscriber.status
  }
}

async function saveSubscriber() {
  if (!selectedSubscriber.value) return

  try {
    saving.value = true

    await $fetch(`/api/admin/subscribers/${selectedSubscriber.value.id}`, {
      method: 'PUT',
      body: editForm.value
    })

    // Update local data
    const index = subscribers.value.findIndex(s => s.id === selectedSubscriber.value!.id)
    if (index !== -1) {
      subscribers.value[index] = {
        ...subscribers.value[index],
        ...editForm.value
      }
      selectedSubscriber.value = subscribers.value[index]
    }

    toast.add({
      title: 'Success',
      description: 'Subscriber updated successfully',
      color: 'green'
    })
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.statusMessage || 'Failed to update subscriber',
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}

function openDeleteModal() {
  if (!selectedSubscriber.value) return
  subscriberToDelete.value = selectedSubscriber.value
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!subscriberToDelete.value) return

  try {
    deleting.value = true
    await $fetch(`/api/admin/subscribers/${subscriberToDelete.value.id}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Success',
      description: `Subscriber "${subscriberToDelete.value.name}" has been deleted.`,
      color: 'green'
    })

    // Remove from local list
    subscribers.value = subscribers.value.filter(s => s.id !== subscriberToDelete.value!.id)
    selectedSubscriber.value = null
    showDeleteModal.value = false
    subscriberToDelete.value = null
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.statusMessage || 'Failed to delete subscriber',
      color: 'red'
    })
  } finally {
    deleting.value = false
  }
}

function cancelDelete() {
  showDeleteModal.value = false
  subscriberToDelete.value = null
}

function resetForm() {
  if (selectedSubscriber.value) {
    selectSubscriber(selectedSubscriber.value)
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.subscribers-page {
  max-width: 1400px;
}

.page-header {
  margin-bottom: 2rem;
}

.back-link {
  display: inline-block;
  margin-bottom: 1rem;
  color: var(--text);
  text-decoration: none;
  font-size: 0.875rem;
  transition: opacity 0.2s;
}

.back-link:hover {
  opacity: 0.7;
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

.subscribers-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  min-height: 600px;
}

/* Left Column: Subscriber List */
.subscriber-list {
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 50px);
}

.list-header {
  padding: 1rem;
  border-bottom: 1px solid var(--ui-border);
  background-color: var(--ui-bg-elevated);
}

.search-input {
  width: 100%;
  margin-bottom: 0.5rem;
}

.filter-select {
  width: 100%;
}

.empty-list {
  padding: 2rem;
  text-align: center;
  color: var(--ui-text-muted);
}

.list-items {
  overflow-y: auto;
  flex: 1;
}

.subscriber-item {
  padding: 1rem;
  border-bottom: 1px solid var(--ui-border);
  cursor: pointer;
  transition: background-color 0.2s;
}

.subscriber-item:hover {
  background-color: var(--ui-bg-elevated);
}

.subscriber-item.active {
  background-color: var(--ui-bg-elevated);
  border-left: 3px solid var(--text);
}

.subscriber-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.subscriber-contact {
  font-size: 0.875rem;
  color: var(--ui-text-muted);
  margin-bottom: 0.5rem;
}

.subscriber-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.date {
  color: var(--ui-text-muted);
}

/* Right Column: Subscriber Details */
.subscriber-details {
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  padding: 2rem;
  background-color: var(--ui-bg-elevated);
  overflow-y: auto;
  max-height: calc(100vh - 50px);
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--ui-text-muted);
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--ui-border);
}

.details-header h2 {
  margin: 0;
}

.details-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-section h3 {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--ui-border);
  font-size: 0.875rem;
}

.info-row .label {
  font-weight: 500;
}

.info-row .value {
  color: var(--ui-text-muted);
}

.monospace {
  font-family: monospace;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--ui-border);
}
</style>
