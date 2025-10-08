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
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name, email, or phone..."
            class="search-input"
          />
          <select v-model="filterMethod" class="filter-select">
            <option value="">All Methods</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="app">Mobile App</option>
          </select>
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
              <span class="badge" :class="subscriber.delivery_method">
                {{ subscriber.delivery_method }}
              </span>
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
            <button @click="confirmDelete" class="btn-danger">Delete</button>
          </div>

          <form @submit.prevent="saveSubscriber" class="details-form">
            <div class="form-section">
              <h3>Contact Information</h3>

              <div class="form-group">
                <label for="name">Name</label>
                <input
                  id="name"
                  v-model="editForm.name"
                  type="text"
                  required
                />
              </div>

              <div class="form-group">
                <label for="email">Email</label>
                <input
                  id="email"
                  v-model="editForm.email"
                  type="email"
                  :disabled="editForm.delivery_method !== 'email'"
                />
              </div>

              <div class="form-group">
                <label for="phone">Phone</label>
                <input
                  id="phone"
                  v-model="editForm.phone"
                  type="tel"
                  :disabled="editForm.delivery_method !== 'whatsapp'"
                />
              </div>
            </div>

            <div class="form-section">
              <h3>Delivery Preferences</h3>

              <div class="form-group">
                <label for="delivery_method">Delivery Method</label>
                <select id="delivery_method" v-model="editForm.delivery_method" disabled>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="app">Mobile App</option>
                </select>
                <small>Cannot be changed after signup</small>
              </div>

              <div class="form-group">
                <label for="frequency">Frequency</label>
                <input
                  id="frequency"
                  v-model="editForm.frequency"
                  type="text"
                />
              </div>

              <div class="form-group">
                <label for="time_preference">Time Preference</label>
                <input
                  id="time_preference"
                  v-model="editForm.time_preference"
                  type="time"
                />
              </div>

              <div class="form-group">
                <label for="status">Status</label>
                <select id="status" v-model="editForm.status">
                  <option value="active">Active</option>
                  <option value="unsubscribed">Unsubscribed</option>
                </select>
              </div>
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
              <button type="button" @click="resetForm" class="btn-secondary">Reset</button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
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

const editForm = ref({
  name: '',
  email: '',
  phone: '',
  delivery_method: 'email' as 'email' | 'whatsapp' | 'app',
  frequency: '',
  time_preference: '',
  status: 'active' as 'active' | 'unsubscribed'
})

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

    alert('Subscriber updated successfully')
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to update subscriber')
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  if (!selectedSubscriber.value) return

  if (!confirm(`Are you sure you want to delete subscriber "${selectedSubscriber.value.name}"?`)) {
    return
  }

  try {
    await $fetch(`/api/admin/subscribers/${selectedSubscriber.value.id}`, {
      method: 'DELETE'
    })

    // Remove from local list
    subscribers.value = subscribers.value.filter(s => s.id !== selectedSubscriber.value!.id)
    selectedSubscriber.value = null
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to delete subscriber')
  }
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
  color: var(--color-text-muted);
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
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 250px);
}

.list-header {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-background-soft);
}

.search-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  margin-bottom: 0.5rem;
}

.filter-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
}

.empty-list {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted);
}

.list-items {
  overflow-y: auto;
  flex: 1;
}

.subscriber-item {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background-color 0.2s;
}

.subscriber-item:hover {
  background-color: var(--color-background-soft);
}

.subscriber-item.active {
  background-color: var(--color-background-soft);
  border-left: 3px solid var(--text);
}

.subscriber-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.subscriber-contact {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.subscriber-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  text-transform: uppercase;
}

.badge.email {
  background-color: var(--text);
  color: var(--bg);
}

.badge.whatsapp {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
}

.badge.app {
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
}

.date {
  color: var(--color-text-muted);
}

/* Right Column: Subscriber Details */
.subscriber-details {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 2rem;
  background-color: var(--color-background-soft);
  overflow-y: auto;
  max-height: calc(100vh - 250px);
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-muted);
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.details-header h2 {
  margin: 0;
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

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  font-size: 0.875rem;
}

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--text);
}

.form-group input:disabled,
.form-group select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-group small {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.875rem;
}

.info-row .label {
  font-weight: 500;
}

.info-row .value {
  color: var(--color-text-muted);
}

.monospace {
  font-family: monospace;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
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
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: var(--color-background-soft);
}
</style>
