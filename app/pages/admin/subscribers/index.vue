<template>
  <div class="subscribers-page">
    <div class="page-header">
      <div>
        <NuxtLink to="/admin" class="back-link">← Back to Dashboard</NuxtLink>
        <h1>All Subscribers</h1>
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
            v-model="filterCampaignId"
            :items="campaignOptions"
            value-key="value"
            placeholder="All Campaigns"
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
              {{ subscriber.primary_email || subscriber.primary_phone || 'No contact' }}
            </div>
            <div class="subscriber-meta">
              <div class="meta-badges">
                <UBadge
                  :label="`${subscriber.subscriptions.length} subscription${subscriber.subscriptions.length !== 1 ? 's' : ''}`"
                  variant="outline"
                  color="neutral"
                  size="xs"
                />
              </div>
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
            <div class="header-actions">
              <UButton @click="openDeleteModal" color="neutral" variant="outline">Delete</UButton>
            </div>
          </div>

          <form @submit.prevent="saveChanges" class="details-form">
            <div class="form-section">
              <h3>Contact Information</h3>

              <UFormField label="Name" required>
                <UInput
                  v-model="subscriberForm.name"
                  type="text"
                  class="w-full"
                />
              </UFormField>

              <UFormField v-if="selectedSubscriber.primary_email" label="Email">
                <div class="contact-display">{{ selectedSubscriber.primary_email }}</div>
              </UFormField>

              <UFormField v-if="selectedSubscriber.primary_phone" label="Phone">
                <div class="contact-display">{{ selectedSubscriber.primary_phone }}</div>
              </UFormField>
            </div>

            <div class="form-section">
              <h3>Subscriptions ({{ selectedSubscriber.subscriptions.length }})</h3>

              <div v-if="selectedSubscriber.subscriptions.length === 0" class="no-subscriptions">
                No active subscriptions
              </div>

              <div v-else class="subscriptions-list">
                <div
                  v-for="subscription in selectedSubscriber.subscriptions"
                  :key="subscription.id"
                  class="subscription-card"
                >
                  <div
                    class="subscription-header"
                    @click="toggleSubscription(subscription.id)"
                  >
                    <div class="subscription-title">
                      <span class="campaign-name">{{ subscription.campaign_title }}</span>
                      <UBadge
                        :label="subscription.status"
                        variant="outline"
                        :color="subscription.status === 'active' ? 'success' : 'error'"
                        size="xs"
                      />
                    </div>
                    <UIcon
                      :name="expandedSubscriptions.has(subscription.id) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                      class="expand-icon"
                    />
                  </div>

                  <div
                    v-if="expandedSubscriptions.has(subscription.id)"
                    class="subscription-details"
                  >
                    <UFormField label="Delivery Method">
                      <div class="field-display">
                        <UBadge
                          :label="subscription.delivery_method"
                          :variant="subscription.delivery_method === 'email' ? 'solid' : 'outline'"
                          :color="subscription.delivery_method === 'email' ? 'primary' : 'neutral'"
                          size="xs"
                        />
                      </div>
                    </UFormField>

                    <UFormField label="Frequency">
                      <USelect
                        v-model="getSubscriptionForm(subscription.id).frequency"
                        :items="frequencyOptions"
                        value-key="value"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField v-if="subscription.frequency !== 'daily' && subscription.days_of_week" label="Days of Week">
                      <div class="field-display">{{ formatDaysOfWeek(subscription.days_of_week) }}</div>
                    </UFormField>

                    <UFormField label="Time Preference">
                      <UInput
                        v-model="getSubscriptionForm(subscription.id).time_preference"
                        type="time"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField v-if="subscription.timezone" label="Timezone">
                      <div class="field-display">{{ subscription.timezone }}</div>
                    </UFormField>

                    <UFormField label="Prayer Duration">
                      <div class="field-display">{{ formatDuration(subscription.prayer_duration) }}</div>
                    </UFormField>

                    <UFormField v-if="subscription.next_reminder_utc" label="Next Reminder">
                      <div class="field-display">{{ formatDateTime(subscription.next_reminder_utc) }}</div>
                    </UFormField>

                    <UFormField label="Status">
                      <USelect
                        v-model="getSubscriptionForm(subscription.id).status"
                        :items="statusOptions"
                        value-key="value"
                        class="w-full"
                      />
                    </UFormField>

                    <!-- Email History for this subscription -->
                    <div class="subscription-email-history">
                      <h4>Email History</h4>
                      <div v-if="loadingEmailHistory[subscription.id]" class="email-history-loading">
                        Loading...
                      </div>
                      <div v-else-if="!emailHistories[subscription.id] || emailHistories[subscription.id].length === 0" class="email-history-empty">
                        No emails sent yet
                      </div>
                      <div v-else class="email-history-list">
                        <div v-for="sent in emailHistories[subscription.id]" :key="sent.id" class="email-history-item">
                          <span class="email-date">{{ sent.sent_date }}</span>
                          <span class="email-time">{{ formatDateTime(sent.sent_at) }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="subscription-actions">
                      <UButton
                        size="xs"
                        variant="outline"
                        :loading="sendingReminder[subscription.id]"
                        :disabled="subscription.delivery_method !== 'email'"
                        @click="sendReminder(subscription)"
                      >
                        Send Reminder
                      </UButton>
                      <UButton
                        size="xs"
                        variant="ghost"
                        @click="filterByCampaign(subscription)"
                      >
                        Filter by Campaign
                      </UButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-section">
              <h3>Metadata</h3>

              <div class="info-row">
                <span class="label">Tracking ID:</span>
                <span class="value monospace">{{ selectedSubscriber.tracking_id }}</span>
              </div>

              <div class="info-row">
                <span class="label">Profile Link:</span>
                <div class="profile-link-container">
                  <span class="value profile-link-text">{{ getProfileUrl(selectedSubscriber) }}</span>
                  <UButton
                    size="xs"
                    variant="ghost"
                    icon="i-lucide-copy"
                    @click="copyProfileLink(selectedSubscriber)"
                  />
                </div>
              </div>

              <div class="info-row">
                <span class="label">Subscriber Since:</span>
                <span class="value">{{ formatDateTime(selectedSubscriber.created_at) }}</span>
              </div>
            </div>

            <div class="form-section">
              <h3>Activity Log</h3>
              <div v-if="loadingActivityLog" class="activity-loading">
                Loading...
              </div>
              <div v-else-if="activityLog.length === 0" class="activity-empty">
                No activity recorded yet
              </div>
              <div v-else class="activity-list">
                <div v-for="activity in activityLog" :key="activity.id" class="activity-item">
                  <div class="activity-header">
                    <UBadge
                      :label="formatEventType(activity.eventType)"
                      :color="getEventColor(activity.eventType)"
                      size="xs"
                    />
                    <span class="activity-time">{{ formatTimestamp(activity.timestamp) }}</span>
                  </div>
                  <div class="activity-user">
                    <template v-if="activity.metadata?.source === 'self_service'">
                      by subscriber (self-service)
                    </template>
                    <template v-else-if="activity.userName">
                      by {{ activity.userName }}
                    </template>
                  </div>
                  <div v-if="activity.metadata?.changes" class="activity-changes">
                    <div
                      v-for="(change, field) in activity.metadata.changes"
                      :key="field"
                      class="change-item"
                    >
                      <span class="change-field">{{ formatFieldName(field as string) }}:</span>
                      <span class="change-from">{{ formatValue(change.from) }}</span>
                      <span class="change-arrow">→</span>
                      <span class="change-to">{{ formatValue(change.to) }}</span>
                    </div>
                  </div>
                </div>
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
      warning="This will delete all subscriptions for this subscriber. This action cannot be undone."
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

interface Contact {
  id: number
  type: 'email' | 'phone'
  value: string
  verified: boolean
}

interface Subscription {
  id: number
  campaign_id: number
  campaign_title: string
  campaign_slug: string
  delivery_method: 'email' | 'whatsapp' | 'app'
  frequency: string
  days_of_week: string | null
  time_preference: string
  timezone: string
  prayer_duration: number
  next_reminder_utc: string | null
  status: 'active' | 'inactive' | 'unsubscribed'
  created_at: string
  updated_at: string
}

interface GeneralSubscriber {
  id: number
  tracking_id: string
  profile_id: string
  name: string
  created_at: string
  updated_at: string
  contacts: Contact[]
  primary_email: string | null
  primary_phone: string | null
  subscriptions: Subscription[]
}

interface Campaign {
  id: number
  title: string
  slug: string
}

interface SubscriptionForm {
  frequency: string
  time_preference: string
  status: 'active' | 'inactive' | 'unsubscribed'
}

const router = useRouter()
const route = useRoute()
const toast = useToast()

// Data
const subscribers = ref<GeneralSubscriber[]>([])
const campaigns = ref<Campaign[]>([])
const selectedSubscriber = ref<GeneralSubscriber | null>(null)

// Loading states
const loading = ref(true)
const error = ref('')
const saving = ref(false)

// Filters
const searchQuery = ref('')
const filterCampaignId = ref<number | null>(null)

// Form state
const subscriberForm = ref({ name: '' })
const subscriptionForms = ref<Map<number, SubscriptionForm>>(new Map())

// Expansion state for subscription cards
const expandedSubscriptions = ref<Set<number>>(new Set())

// Delete modal state
const showDeleteModal = ref(false)
const subscriberToDelete = ref<GeneralSubscriber | null>(null)
const deleting = ref(false)

// Email history state (per subscription)
interface EmailSent {
  id: number
  signup_id: number
  sent_date: string
  sent_at: string
}
const emailHistories = ref<Record<number, EmailSent[]>>({})
const loadingEmailHistory = ref<Record<number, boolean>>({})

// Activity log state (per subscription)
interface ActivityLogEntry {
  id: string
  timestamp: number
  eventType: string
  tableName: string
  userId: string | null
  userName: string | null
  metadata: {
    changes?: Record<string, { from: any; to: any }>
    deletedRecord?: Record<string, any>
    source?: string
  }
}
// Activity log state (subscriber-level, aggregated from all subscriptions)
const activityLog = ref<ActivityLogEntry[]>([])
const loadingActivityLog = ref(false)

// Send reminder state (per subscription)
const sendingReminder = ref<Record<number, boolean>>({})

// Options
const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Unsubscribed', value: 'unsubscribed' }
]

const frequencyOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' }
]

const campaignOptions = computed(() => {
  return [
    { label: 'All Campaigns', value: null },
    ...campaigns.value.map(c => ({ label: c.title, value: c.id }))
  ]
})

const filteredSubscribers = computed(() => {
  let filtered = subscribers.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.primary_email?.toLowerCase().includes(query) ||
      s.primary_phone?.includes(query)
    )
  }

  // Filter by campaign
  if (filterCampaignId.value) {
    filtered = filtered.filter(s =>
      s.subscriptions.some(sub => sub.campaign_id === filterCampaignId.value)
    )
  }

  return filtered
})

async function loadData() {
  try {
    loading.value = true
    error.value = ''

    // Load campaigns for the filter dropdown
    const campaignsResponse = await $fetch<{ campaigns: Campaign[] }>('/api/admin/campaigns')
    campaigns.value = campaignsResponse.campaigns

    // Load all subscribers
    const subscribersResponse = await $fetch<{ subscribers: GeneralSubscriber[] }>('/api/admin/subscribers')
    subscribers.value = subscribersResponse.subscribers
  } catch (err: any) {
    error.value = 'Failed to load subscribers'
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function selectSubscriber(subscriber: GeneralSubscriber) {
  selectedSubscriber.value = subscriber
  subscriberForm.value = { name: subscriber.name }

  // Initialize subscription forms
  subscriptionForms.value = new Map()
  for (const sub of subscriber.subscriptions) {
    subscriptionForms.value.set(sub.id, {
      frequency: sub.frequency,
      time_preference: sub.time_preference,
      status: sub.status
    })
  }

  // Expand first subscription by default if any exist
  expandedSubscriptions.value = new Set()
  const firstSubscription = subscriber.subscriptions[0]
  if (firstSubscription) {
    expandedSubscriptions.value.add(firstSubscription.id)
    // Load email history for first subscription
    await loadEmailHistory(firstSubscription.id)
  }

  // Load activity log for the subscriber (all subscriptions)
  await loadActivityLog(subscriber)
}

function getSubscriptionForm(subscriptionId: number): SubscriptionForm {
  let form = subscriptionForms.value.get(subscriptionId)
  if (!form) {
    // Create default form if not found
    const subscription = selectedSubscriber.value?.subscriptions.find(s => s.id === subscriptionId)
    form = {
      frequency: subscription?.frequency || '',
      time_preference: subscription?.time_preference || '',
      status: subscription?.status || 'active'
    }
    subscriptionForms.value.set(subscriptionId, form)
  }
  return form
}

async function toggleSubscription(subscriptionId: number) {
  if (expandedSubscriptions.value.has(subscriptionId)) {
    expandedSubscriptions.value.delete(subscriptionId)
  } else {
    expandedSubscriptions.value.add(subscriptionId)
    // Load email history when expanding
    await loadEmailHistory(subscriptionId)
  }
}

async function loadEmailHistory(subscriptionId: number) {
  if (emailHistories.value[subscriptionId]) return // Already loaded

  try {
    loadingEmailHistory.value[subscriptionId] = true
    const response = await $fetch<{ history: EmailSent[] }>(`/api/admin/subscribers/${subscriptionId}/email-history`)
    emailHistories.value[subscriptionId] = response.history
  } catch (err: any) {
    console.error('Failed to load email history:', err)
    emailHistories.value[subscriptionId] = []
  } finally {
    loadingEmailHistory.value[subscriptionId] = false
  }
}

async function loadActivityLog(subscriber: GeneralSubscriber) {
  if (!subscriber.subscriptions.length) {
    activityLog.value = []
    return
  }

  try {
    loadingActivityLog.value = true
    // Load activity for all subscriptions and merge them
    const allActivities: ActivityLogEntry[] = []

    for (const subscription of subscriber.subscriptions) {
      try {
        const response = await $fetch<{ activities: ActivityLogEntry[] }>(`/api/admin/subscribers/${subscription.id}/activity`)
        allActivities.push(...response.activities)
      } catch (err) {
        console.error(`Failed to load activity for subscription ${subscription.id}:`, err)
      }
    }

    // Sort by timestamp descending and remove duplicates
    activityLog.value = allActivities
      .sort((a, b) => b.timestamp - a.timestamp)
      .filter((activity, index, self) =>
        index === self.findIndex(a => a.id === activity.id)
      )
  } catch (err: any) {
    console.error('Failed to load activity:', err)
    activityLog.value = []
  } finally {
    loadingActivityLog.value = false
  }
}

async function sendReminder(subscription: Subscription) {
  if (sendingReminder.value[subscription.id]) return

  try {
    sendingReminder.value[subscription.id] = true
    await $fetch(`/api/admin/subscribers/${subscription.id}/send-reminder`, {
      method: 'POST'
    })

    toast.add({
      title: 'Reminder Sent',
      description: `Prayer reminder email sent for ${subscription.campaign_title}`,
      color: 'success'
    })

    // Refresh email history
    emailHistories.value[subscription.id] = undefined as any
    await loadEmailHistory(subscription.id)
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.statusMessage || 'Failed to send reminder',
      color: 'error'
    })
  } finally {
    sendingReminder.value[subscription.id] = false
  }
}

async function saveChanges() {
  if (!selectedSubscriber.value) return

  try {
    saving.value = true
    const subscriber = selectedSubscriber.value
    const nameChanged = subscriberForm.value.name !== subscriber.name

    // Find changed subscriptions
    const changedSubscriptions: number[] = []
    for (const [subId, form] of subscriptionForms.value.entries()) {
      const original = subscriber.subscriptions.find(s => s.id === subId)
      if (original) {
        if (
          form.frequency !== original.frequency ||
          form.time_preference !== original.time_preference ||
          form.status !== original.status
        ) {
          changedSubscriptions.push(subId)
        }
      }
    }

    // If name changed, include it in the first subscription update
    if (changedSubscriptions.length > 0) {
      const firstSubId = changedSubscriptions[0]
      const form = subscriptionForms.value.get(firstSubId)
      if (!form) return

      await $fetch(`/api/admin/subscribers/${firstSubId}`, {
        method: 'PUT',
        body: {
          name: subscriberForm.value.name,
          ...form
        }
      })

      // Update remaining subscriptions
      for (const subId of changedSubscriptions.slice(1)) {
        const subForm = subscriptionForms.value.get(subId)
        if (!subForm) continue
        await $fetch(`/api/admin/subscribers/${subId}`, {
          method: 'PUT',
          body: subForm
        })
      }
    } else if (nameChanged && subscriber.subscriptions.length > 0) {
      // Only name changed, update via first subscription
      const firstSub = subscriber.subscriptions[0]
      if (!firstSub) return
      const form = subscriptionForms.value.get(firstSub.id) || {
        frequency: firstSub.frequency,
        time_preference: firstSub.time_preference,
        status: firstSub.status
      }

      await $fetch(`/api/admin/subscribers/${firstSub.id}`, {
        method: 'PUT',
        body: {
          name: subscriberForm.value.name,
          ...form
        }
      })
    }

    // Refresh data
    await loadData()

    // Re-select the subscriber to refresh form
    const updated = subscribers.value.find(s => s.id === subscriber.id)
    if (updated) {
      selectSubscriber(updated)
    }

    toast.add({
      title: 'Success',
      description: 'Changes saved successfully',
      color: 'green'
    })
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.statusMessage || 'Failed to save changes',
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}

function resetForm() {
  if (selectedSubscriber.value) {
    selectSubscriber(selectedSubscriber.value)
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

    // Delete all subscriptions for this subscriber
    for (const subscription of subscriberToDelete.value.subscriptions) {
      await $fetch(`/api/admin/subscribers/${subscription.id}`, {
        method: 'DELETE'
      })
    }

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

function filterByCampaign(subscription: Subscription) {
  filterCampaignId.value = subscription.campaign_id
  // Update URL to reflect the filter
  router.push({ query: { campaign: subscription.campaign_id } })
}

// Formatting functions
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString()
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatDaysOfWeek(daysJson: string | null): string {
  if (!daysJson) return ''
  try {
    const days = JSON.parse(daysJson) as number[]
    return days.sort((a, b) => a - b).map(d => dayNames[d]).join(', ')
  } catch {
    return ''
  }
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return '10 min'
  if (minutes >= 60) return `${minutes / 60} hour${minutes > 60 ? 's' : ''}`
  return `${minutes} min`
}

// Profile URL functions
function getProfileUrl(subscriber: GeneralSubscriber): string {
  const baseUrl = window.location.origin
  return `${baseUrl}/profile?id=${subscriber.profile_id}`
}

async function copyProfileLink(subscriber: GeneralSubscriber) {
  const url = getProfileUrl(subscriber)
  try {
    await navigator.clipboard.writeText(url)
    toast.add({
      title: 'Copied!',
      description: 'Profile link copied to clipboard',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Error',
      description: 'Failed to copy link',
      color: 'error'
    })
  }
}

// Activity log formatting functions
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

function formatEventType(eventType: string): string {
  const types: Record<string, string> = {
    'CREATE': 'Created',
    'UPDATE': 'Updated',
    'DELETE': 'Deleted'
  }
  return types[eventType] || eventType
}

function getEventColor(eventType: string): 'success' | 'warning' | 'error' | 'neutral' {
  const colors: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
    'CREATE': 'success',
    'UPDATE': 'warning',
    'DELETE': 'error'
  }
  return colors[eventType] || 'neutral'
}

function formatFieldName(field: string): string {
  const names: Record<string, string> = {
    'name': 'Name',
    'email': 'Email',
    'phone': 'Phone',
    'frequency': 'Frequency',
    'time_preference': 'Time',
    'status': 'Status',
    'delivery_method': 'Delivery Method',
    'prayer_duration': 'Prayer Duration',
    'timezone': 'Timezone',
    'days_of_week': 'Days of Week'
  }
  return names[field] || field.replace(/_/g, ' ')
}

function formatValue(value: any): string {
  if (value === null || value === undefined || value === '') {
    return '(empty)'
  }
  return String(value)
}

onMounted(() => {
  // Check for campaign filter in URL query params
  const campaignParam = route.query.campaign
  if (campaignParam) {
    filterCampaignId.value = parseInt(campaignParam as string)
  }
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
  margin: 0;
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

.meta-badges {
  display: flex;
  gap: 0.375rem;
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

.header-actions {
  display: flex;
  gap: 0.5rem;
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

.contact-display,
.field-display {
  padding: 0.5rem 0.75rem;
  background-color: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  font-size: 0.875rem;
}

.no-subscriptions {
  padding: 1rem;
  text-align: center;
  color: var(--ui-text-muted);
  background-color: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
}

.subscriptions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.subscription-card {
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  overflow: hidden;
}

.subscription-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: var(--ui-bg);
  cursor: pointer;
  transition: background-color 0.2s;
}

.subscription-header:hover {
  background-color: var(--ui-bg-elevated);
}

.subscription-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.campaign-name {
  font-weight: 500;
}

.expand-icon {
  width: 1rem;
  height: 1rem;
  color: var(--ui-text-muted);
}

.subscription-details {
  padding: 1rem;
  border-top: 1px solid var(--ui-border);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.subscription-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--ui-border);
  margin-top: 0.5rem;
}

/* Email History Styles */
.subscription-email-history,
.subscription-activity {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--ui-border);
}

.subscription-email-history h4,
.subscription-activity h4 {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.email-history-loading,
.email-history-empty,
.activity-loading,
.activity-empty {
  padding: 0.75rem;
  text-align: center;
  color: var(--ui-text-muted);
  font-size: 0.8125rem;
  background-color: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: 4px;
}

.email-history-list {
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid var(--ui-border);
  border-radius: 4px;
}

.email-history-item {
  display: flex;
  justify-content: space-between;
  padding: 0.375rem 0.5rem;
  border-bottom: 1px solid var(--ui-border);
  font-size: 0.8125rem;
}

.email-history-item:last-child {
  border-bottom: none;
}

.email-date {
  font-weight: 500;
}

.email-time {
  color: var(--ui-text-muted);
  font-size: 0.75rem;
}

/* Activity Log Styles */
.activity-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--ui-border);
  border-radius: 4px;
}

.activity-item {
  padding: 0.5rem;
  border-bottom: 1px solid var(--ui-border);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.activity-time {
  color: var(--ui-text-muted);
  font-size: 0.7rem;
}

.activity-user {
  color: var(--ui-text-muted);
  font-size: 0.7rem;
  margin-bottom: 0.25rem;
}

.activity-changes {
  margin-top: 0.25rem;
  padding: 0.375rem;
  background-color: var(--ui-bg);
  border-radius: 4px;
  font-size: 0.75rem;
}

.change-item {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.125rem 0;
}

.change-field {
  font-weight: 500;
  margin-right: 0.25rem;
}

.change-from {
  color: var(--ui-text-muted);
  text-decoration: line-through;
}

.change-arrow {
  color: var(--ui-text-muted);
  margin: 0 0.25rem;
}

.change-to {
  font-weight: 500;
}

/* Profile Link Styles */
.profile-link-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.profile-link-text {
  font-size: 0.75rem;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
