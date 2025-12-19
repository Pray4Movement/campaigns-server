<template>
  <CrmLayout :loading="loading" :error="error">
    <template #header>
      <div>
        <NuxtLink to="/admin" class="back-link">← Back to Dashboard</NuxtLink>
        <h1>People Groups</h1>
      </div>
      <UButton @click="syncPeopleGroups" :loading="syncing" icon="i-lucide-refresh-cw">
        Sync from API
      </UButton>
    </template>

    <template #list-header>
      <CrmListPanel
        v-model="searchQuery"
        search-placeholder="Search by name..."
        :total-count="total"
        @update:model-value="debouncedSearch"
      />
    </template>

    <template #list>
      <template v-if="peopleGroups.length === 0">
        <div class="empty-list">No people groups found</div>
      </template>
      <CrmListItem
        v-else
        v-for="group in peopleGroups"
        :key="group.id"
        :active="selectedGroup?.id === group.id"
        @click="selectGroup(group)"
      >
        <template v-if="group.image_url" #image>
          <img :src="group.image_url" :alt="group.name" />
        </template>
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
      </CrmListItem>
    </template>

    <template #detail>
      <CrmDetailPanel :has-selection="!!selectedGroup">
        <template #header>
          <div class="header-info">
            <img
              v-if="selectedGroup?.image_url"
              :src="selectedGroup.image_url"
              :alt="selectedGroup?.name"
              class="header-image"
            />
            <div>
              <h2>{{ selectedGroup?.name }}</h2>
              <div class="header-meta">
                <span>DT ID: {{ selectedGroup?.dt_id }}</span>
              </div>
            </div>
          </div>
        </template>

        <template #actions>
          <UButton @click="resetForm" variant="outline">Reset</UButton>
          <UButton @click="saveChanges" :loading="saving">Save Changes</UButton>
        </template>

        <form @submit.prevent="saveChanges">
          <CrmFormSection
            v-for="category in fieldCategories"
            :key="category.key"
            :title="category.label"
            :default-open="category.key === 'basic'"
          >
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
          </CrmFormSection>
        </form>

        <template #empty>
          Select a people group to view and edit details
        </template>
      </CrmDetailPanel>
    </template>
  </CrmLayout>
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

const route = useRoute()
const toast = useToast()

// Data
const peopleGroups = ref<PeopleGroup[]>([])
const selectedGroup = ref<PeopleGroup | null>(null)
const total = ref(0)

// Form state
const formData = ref<Record<string, any>>({})

// Field options loaded from API
const fieldOptions = ref<Record<string, SelectOption[]>>({})

// UI state
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const syncing = ref(false)
const searchQuery = ref('')

// Field categories with loaded options merged in
const fieldCategories = computed<FieldCategory[]>(() => {
  return peopleGroupFieldCategories.map(category => ({
    ...category,
    fields: category.fields.map(field => {
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
function selectGroup(group: PeopleGroup, updateUrl = true) {
  selectedGroup.value = group
  initializeForm(group)
  if (updateUrl && import.meta.client) {
    window.history.replaceState({}, '', `/admin/people-groups/${group.id}`)
  }
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

    selectedGroup.value = response.peopleGroup
    initializeForm(response.peopleGroup)

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

    await loadPeopleGroups()

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

function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseInt(num) : num
  if (isNaN(n)) return '—'
  return n.toLocaleString()
}

// Handle URL-based selection
function handleUrlSelection() {
  const idParam = route.params.id as string | undefined
  if (!idParam) return

  const id = parseInt(idParam)
  const group = peopleGroups.value.find(g => g.id === id)
  if (group) {
    selectGroup(group, false)
  }
}

onMounted(async () => {
  await Promise.all([
    loadFieldOptions(),
    loadPeopleGroups(true)
  ])
  handleUrlSelection()
})
</script>

<style scoped>
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

.empty-list {
  padding: 2rem;
  text-align: center;
  color: var(--ui-text-muted);
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

.header-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--ui-text-muted);
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
  .fields-grid {
    grid-template-columns: 1fr;
  }
}
</style>
