<template>
  <div class="people-groups-page">
    <div class="page-header">
      <div>
        <NuxtLink to="/admin" class="back-link">← Back to Dashboard</NuxtLink>
        <h1>People Groups</h1>
      </div>
      <UButton @click="syncPeopleGroups" :loading="syncing" icon="i-lucide-refresh-cw">
        Sync from API
      </UButton>
    </div>

    <div v-if="loading" class="loading">Loading people groups...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="people-groups-layout">
      <!-- Left Column: People Group List (1/3 width) -->
      <div class="group-list">
        <div class="list-header">
          <UInput
            v-model="searchQuery"
            type="text"
            placeholder="Search by name..."
            class="search-input"
            @input="debouncedSearch"
          />
          <div class="list-count">{{ total }} groups</div>
        </div>

        <div v-if="peopleGroups.length === 0" class="empty-list">
          No people groups found
        </div>

        <div v-else class="list-items">
          <div
            v-for="group in peopleGroups"
            :key="group.id"
            class="group-item"
            :class="{ active: selectedGroup?.id === group.id }"
            @click="selectGroup(group)"
          >
            <div class="group-image" v-if="group.image_url">
              <img :src="group.image_url" :alt="group.name" />
            </div>
            <div class="group-info">
              <div class="group-name">{{ group.name }}</div>
              <div class="group-meta">
                <UBadge
                  v-if="group.metadata?.imb_engagement_status"
                  :label="group.metadata.imb_engagement_status"
                  :color="group.metadata.imb_engagement_status === 'engaged' ? 'success' : 'warning'"
                  variant="subtle"
                  size="xs"
                />
                <span v-if="group.metadata?.imb_population" class="population">
                  Pop: {{ formatNumber(group.metadata.imb_population) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: People Group Details (2/3 width) -->
      <div class="group-details">
        <div v-if="!selectedGroup" class="no-selection">
          Select a people group to view and edit details
        </div>

        <div v-else class="details-content">
          <div class="details-header">
            <div class="header-info">
              <img
                v-if="selectedGroup.image_url"
                :src="selectedGroup.image_url"
                :alt="selectedGroup.name"
                class="header-image"
              />
              <div>
                <h2>{{ selectedGroup.name }}</h2>
                <div class="header-meta">
                  <span>DT ID: {{ selectedGroup.dt_id }}</span>
                </div>
              </div>
            </div>
            <div class="header-actions">
              <UButton @click="resetForm" variant="outline">Reset</UButton>
              <UButton @click="saveChanges" :loading="saving">Save Changes</UButton>
            </div>
          </div>

          <form @submit.prevent="saveChanges" class="details-form">
            <!-- Collapsible sections for each category -->
            <div
              v-for="category in fieldCategories"
              :key="category.key"
              class="form-section"
            >
              <div
                class="section-header"
                @click="toggleSection(category.key)"
              >
                <h3>{{ category.label }}</h3>
                <UIcon
                  :name="expandedSections.has(category.key) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  class="section-icon"
                />
              </div>

              <div v-if="expandedSections.has(category.key)" class="section-content">
                <div class="fields-grid">
                  <UFormField
                    v-for="field in category.fields"
                    :key="field.key"
                    :label="field.label"
                    :hint="field.description"
                    :class="{ 'full-width': field.type === 'textarea' }"
                  >
                    <!-- Read-only field -->
                    <div v-if="field.readOnly" class="readonly-field">
                      {{ getFieldValue(field.key) || '—' }}
                    </div>

                    <!-- Text input -->
                    <UInput
                      v-else-if="field.type === 'text'"
                      :model-value="getFieldValue(field.key)"
                      @update:model-value="setFieldValue(field.key, $event)"
                      class="w-full"
                    />

                    <!-- Number input -->
                    <UInput
                      v-else-if="field.type === 'number'"
                      type="number"
                      :model-value="getFieldValue(field.key)"
                      @update:model-value="setFieldValue(field.key, $event)"
                      class="w-full"
                    />

                    <!-- Textarea -->
                    <UTextarea
                      v-else-if="field.type === 'textarea'"
                      :model-value="getFieldValue(field.key)"
                      @update:model-value="setFieldValue(field.key, $event)"
                      :rows="3"
                      class="w-full"
                    />

                    <!-- Select -->
                    <USelectMenu
                      v-else-if="field.type === 'select' && field.options"
                      :model-value="getFieldValue(field.key)"
                      @update:model-value="setFieldValue(field.key, $event)"
                      :items="field.options"
                      value-key="value"
                      searchable
                      :searchable-placeholder="'Search...'"
                      :virtualize="field.options.length > 50"
                      class="w-full"
                    />
                    <!-- Select loading placeholder -->
                    <UInput
                      v-else-if="field.type === 'select' && field.optionsKey && !field.options"
                      :model-value="getFieldValue(field.key)"
                      disabled
                      placeholder="Loading options..."
                      class="w-full"
                    />

                    <!-- Boolean -->
                    <UCheckbox
                      v-else-if="field.type === 'boolean'"
                      :model-value="getFieldValue(field.key) === true || getFieldValue(field.key) === '1'"
                      @update:model-value="setFieldValue(field.key, $event)"
                    />
                  </UFormField>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { peopleGroupFieldCategories, type FieldCategory, type SelectOption } from '~/utils/people-group-fields'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

interface PeopleGroup {
  id: number
  dt_id: string
  name: string
  image_url: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

const toast = useToast()

// Data
const peopleGroups = ref<PeopleGroup[]>([])
const selectedGroup = ref<PeopleGroup | null>(null)
const total = ref(0)

// Form state
const formData = ref<Record<string, any>>({})

// Field options loaded from API
const fieldOptions = ref<Record<string, SelectOption[]>>({})
const optionsLoaded = ref(false)

// UI state
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const syncing = ref(false)
const searchQuery = ref('')
const expandedSections = ref<Set<string>>(new Set(['basic']))

// Field categories with loaded options merged in
const fieldCategories = computed<FieldCategory[]>(() => {
  return peopleGroupFieldCategories.map(category => ({
    ...category,
    fields: category.fields.map(field => {
      // If field has optionsKey, load options from fieldOptions
      if (field.optionsKey && fieldOptions.value[field.optionsKey]) {
        return {
          ...field,
          options: fieldOptions.value[field.optionsKey]
        }
      }
      return field
    })
  }))
})

// Load field options from API
async function loadFieldOptions() {
  try {
    const response = await $fetch<{ options: Record<string, SelectOption[]> }>(
      '/api/admin/people-groups/field-options'
    )
    fieldOptions.value = response.options
    optionsLoaded.value = true
  } catch (err) {
    console.error('Failed to load field options:', err)
  }
}

// Load people groups
async function loadPeopleGroups(isInitialLoad = false) {
  try {
    if (isInitialLoad) {
      loading.value = true
    }
    error.value = ''

    const params: Record<string, string> = {}
    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    const response = await $fetch<{ peopleGroups: PeopleGroup[]; total: number }>(
      '/api/admin/people-groups',
      { params }
    )

    peopleGroups.value = response.peopleGroups
    total.value = response.total
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to load people groups'
    console.error(err)
  } finally {
    loading.value = false
  }
}

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null
function debouncedSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    loadPeopleGroups()
  }, 300)
}

// Select a people group
function selectGroup(group: PeopleGroup) {
  selectedGroup.value = group
  initializeForm(group)
}

// Initialize form with group data
function initializeForm(group: PeopleGroup) {
  formData.value = {
    name: group.name,
    image_url: group.image_url,
    dt_id: group.dt_id,
    ...group.metadata
  }
}

// Get field value from form data
function getFieldValue(key: string): any {
  return formData.value[key] ?? ''
}

// Set field value in form data
function setFieldValue(key: string, value: any) {
  formData.value[key] = value
}

// Toggle section expansion
function toggleSection(key: string) {
  if (expandedSections.value.has(key)) {
    expandedSections.value.delete(key)
  } else {
    expandedSections.value.add(key)
  }
}

// Reset form to original values
function resetForm() {
  if (selectedGroup.value) {
    initializeForm(selectedGroup.value)
  }
}

// Save changes
async function saveChanges() {
  if (!selectedGroup.value) return

  try {
    saving.value = true

    // Separate table fields from metadata fields
    const { name, image_url, dt_id, ...metadataFields } = formData.value

    const response = await $fetch<{ success: boolean; peopleGroup: PeopleGroup }>(
      `/api/admin/people-groups/${selectedGroup.value.id}`,
      {
        method: 'PUT',
        body: {
          name,
          image_url,
          metadata: metadataFields
        }
      }
    )

    // Update local state
    selectedGroup.value = response.peopleGroup
    initializeForm(response.peopleGroup)

    // Update in list
    const index = peopleGroups.value.findIndex(g => g.id === response.peopleGroup.id)
    if (index !== -1) {
      peopleGroups.value[index] = response.peopleGroup
    }

    toast.add({
      title: 'Success',
      description: 'People group updated successfully',
      color: 'success'
    })
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.statusMessage || 'Failed to save changes',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

// Sync people groups from API
async function syncPeopleGroups() {
  try {
    syncing.value = true

    const response = await $fetch<{ success: boolean; message: string; stats: any }>(
      '/api/admin/people-groups/sync',
      { method: 'POST' }
    )

    toast.add({
      title: 'Sync Complete',
      description: response.message,
      color: 'success'
    })

    // Reload the list
    await loadPeopleGroups()

    // If a group was selected, refresh its data
    if (selectedGroup.value) {
      const updated = peopleGroups.value.find(g => g.id === selectedGroup.value!.id)
      if (updated) {
        selectGroup(updated)
      }
    }
  } catch (err: any) {
    toast.add({
      title: 'Sync Failed',
      description: err.data?.statusMessage || 'Failed to sync people groups',
      color: 'error'
    })
  } finally {
    syncing.value = false
  }
}

// Format large numbers
function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseInt(num) : num
  if (isNaN(n)) return '—'
  return n.toLocaleString()
}

onMounted(() => {
  // Load field options and people groups in parallel
  Promise.all([
    loadFieldOptions(),
    loadPeopleGroups(true)
  ])
})
</script>

<style scoped>
.people-groups-page {
  max-width: 1400px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

.people-groups-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  min-height: 600px;
}

/* Left Column: Group List */
.group-list {
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 150px);
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

.list-count {
  font-size: 0.75rem;
  color: var(--ui-text-muted);
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

.group-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--ui-border);
  cursor: pointer;
  transition: background-color 0.2s;
}

.group-item:hover {
  background-color: var(--ui-bg-elevated);
}

.group-item.active {
  background-color: var(--ui-bg-elevated);
  border-left: 3px solid var(--text);
}

.group-image {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.group-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.group-info {
  flex: 1;
  min-width: 0;
}

.group-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.population {
  color: var(--ui-text-muted);
}

/* Right Column: Group Details */
.group-details {
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background-color: var(--ui-bg-elevated);
  overflow-y: auto;
  max-height: calc(100vh - 150px);
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  color: var(--ui-text-muted);
}

.details-content {
  padding: 1.5rem;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--ui-border);
}

.header-info {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.header-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
}

.details-header h2 {
  margin: 0 0 0.25rem;
}

.header-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--ui-text-muted);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.details-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-section {
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: var(--ui-bg);
  cursor: pointer;
  transition: background-color 0.2s;
}

.section-header:hover {
  background-color: var(--ui-bg-elevated);
}

.section-header h3 {
  margin: 0;
  font-size: 0.9375rem;
}

.section-icon {
  width: 1rem;
  height: 1rem;
  color: var(--ui-text-muted);
}

.section-content {
  padding: 1rem;
  border-top: 1px solid var(--ui-border);
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.fields-grid .full-width {
  grid-column: 1 / -1;
}

.readonly-field {
  padding: 0.5rem 0.75rem;
  background-color: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}

@media (max-width: 1024px) {
  .people-groups-layout {
    grid-template-columns: 1fr;
  }

  .group-list {
    max-height: 300px;
  }

  .group-details {
    max-height: none;
  }

  .fields-grid {
    grid-template-columns: 1fr;
  }
}
</style>
