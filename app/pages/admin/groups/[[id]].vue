<template>
  <CrmLayout :loading="loading" :error="error">
    <template #header>
      <div>
        <h1>Groups</h1>
      </div>
      <UButton icon="i-lucide-plus" @click="openCreateModal">New Group</UButton>
    </template>

    <template #list-header>
      <CrmListPanel
        v-model="searchQuery"
        search-placeholder="Search by name..."
        :total-count="filteredGroups.length"
      />
    </template>

    <template #list>
      <template v-if="filteredGroups.length === 0">
        <div class="empty-list">No groups found</div>
      </template>
      <CrmListItem
        v-else
        v-for="group in filteredGroups"
        :key="group.id"
        :active="selectedGroup?.id === group.id"
        @click="selectGroup(group)"
      >
        <div class="group-name">{{ group.name }}</div>
        <div class="group-info">
          {{ group.primary_contact_name || 'No primary contact' }}
        </div>
        <div class="group-meta">
          <UBadge v-if="group.adoption_count > 0" :label="`${group.adoption_count} adoption${group.adoption_count > 1 ? 's' : ''}`" variant="subtle" color="success" size="xs" />
          <UBadge v-if="group.contact_count > 0" :label="`${group.contact_count} contact${group.contact_count > 1 ? 's' : ''}`" variant="subtle" size="xs" />
          <span class="date">{{ formatDate(group.created_at) }}</span>
        </div>
      </CrmListItem>
    </template>

    <template #detail>
      <CrmDetailPanel :has-selection="!!selectedGroup">
        <template #header>
          <h2>{{ selectedGroup?.name }}</h2>
        </template>

        <template #actions>
          <UButton type="button" @click="resetForm" variant="outline">Reset</UButton>
          <UButton @click="openDeleteGroupModal" color="error" variant="outline">Delete</UButton>
          <UButton @click="saveGroupChanges" :loading="saving">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </UButton>
        </template>

        <form v-if="selectedGroup" @submit.prevent="saveGroupChanges">
          <CrmFormSection title="Group Information">
            <UFormField label="Name" required>
              <UInput v-model="groupForm.name" type="text" class="w-full" />
            </UFormField>
            <UFormField label="Primary Contact">
              <USelectMenu
                v-model="groupForm.primary_contact_id"
                :items="primaryContactOptions"
                value-key="value"
                placeholder="Select primary contact..."
                class="w-full"
              />
            </UFormField>
            <UFormField label="Country">
              <USelectMenu
                v-model="groupForm.country"
                :items="countryOptions"
                value-key="value"
                placeholder="Select country..."
                virtualize
                class="w-full"
              />
            </UFormField>
          </CrmFormSection>

          <!-- Contacts Section -->
          <CrmFormSection title="Contacts">
            <template #header-extra>
              <UButton size="xs" variant="outline" icon="i-lucide-plus" @click="showAddContactModal = true">
                Add
              </UButton>
            </template>

            <div v-if="groupContacts.length === 0" class="empty-section">
              No contacts linked
            </div>
            <div v-else class="contacts-list">
              <div v-for="c in groupContacts" :key="c.contact_id" class="contact-row">
                <div class="contact-row-info">
                  <NuxtLink :to="`/admin/contacts/${c.contact_id}`" class="contact-link">
                    {{ c.name }}
                  </NuxtLink>
                  <span v-if="c.email_address" class="contact-email">{{ c.email_address }}</span>
                </div>
                <UButton
                  size="xs"
                  variant="ghost"
                  color="error"
                  icon="i-lucide-x"
                  @click="removeContact(c.contact_id)"
                />
              </div>
            </div>
          </CrmFormSection>

          <!-- Adoptions Section -->
          <CrmFormSection title="Adoptions">
            <template #header-extra>
              <UButton size="xs" variant="outline" icon="i-lucide-plus" @click="showAddAdoptionModal = true">
                Add
              </UButton>
            </template>

            <div v-if="groupAdoptions.length === 0" class="empty-section">
              No adoptions
            </div>
            <div v-else class="adoptions-list">
              <AdoptionCard
                v-for="adoption in groupAdoptions"
                :key="adoption.id"
                :adoption="adoption"
                :label="adoption.people_group_name"
                @change="refreshGroup"
                @delete="deleteAdoption"
              />
            </div>
          </CrmFormSection>

          <CrmFormSection title="Metadata">
            <div class="info-row">
              <span class="label">Group ID:</span>
              <span class="value monospace">{{ selectedGroup.id }}</span>
            </div>
            <div class="info-row">
              <span class="label">Created:</span>
              <span class="value">{{ formatDateTime(selectedGroup.created_at) }}</span>
            </div>
          </CrmFormSection>
        </form>

        <template #empty>
          Select a group to view details
        </template>
      </CrmDetailPanel>
    </template>
  </CrmLayout>

  <!-- Create Group Modal -->
  <UModal v-model:open="showCreateModal" title="New Group">
    <template #body>
      <form @submit.prevent="createGroup" class="modal-form">
        <UFormField label="Name" required>
          <UInput v-model="createGroupForm.name" type="text" class="w-full" />
        </UFormField>
        <div class="modal-actions">
          <UButton variant="outline" @click="showCreateModal = false">Cancel</UButton>
          <UButton type="submit" :loading="creating">Create</UButton>
        </div>
      </form>
    </template>
  </UModal>

  <!-- Add Contact Modal -->
  <UModal v-model:open="showAddContactModal" title="Add Contact to Group">
    <template #body>
      <form @submit.prevent="addContactToGroup" class="modal-form">
        <UFormField label="Contact">
          <USelectMenu
            v-model="addContactId"
            :items="allContactOptions"
            value-key="value"
            placeholder="Select a contact..."
            class="w-full"
          />
        </UFormField>
        <div class="modal-actions">
          <UButton variant="outline" @click="showAddContactModal = false">Cancel</UButton>
          <UButton type="submit" :disabled="!addContactId">Add</UButton>
        </div>
      </form>
    </template>
  </UModal>

  <!-- Add Adoption Modal -->
  <UModal v-model:open="showAddAdoptionModal" title="Add Adoption">
    <template #body>
      <form @submit.prevent="addAdoption" class="modal-form">
        <UFormField label="People Group">
          <USelectMenu
            v-model="addAdoptionPeopleGroupId"
            :items="peopleGroupOptions"
            value-key="value"
            placeholder="Select a people group..."
            virtualize
            class="w-full"
          />
        </UFormField>
        <div class="modal-actions">
          <UButton variant="outline" @click="showAddAdoptionModal = false">Cancel</UButton>
          <UButton type="submit" :disabled="!addAdoptionPeopleGroupId">Add</UButton>
        </div>
      </form>
    </template>
  </UModal>

  <!-- Delete Group Modal -->
  <ConfirmModal
    v-model:open="showDeleteModal"
    title="Delete Group"
    :message="selectedGroup ? `Are you sure you want to delete &quot;${selectedGroup.name}&quot;?` : ''"
    warning="This will remove all connections and adoptions for this group. This action cannot be undone."
    confirm-text="Delete"
    confirm-color="primary"
    :loading="deleting"
    @confirm="confirmDeleteGroup"
    @cancel="showDeleteModal = false"
  />
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

interface GroupWithDetails {
  id: number
  name: string
  primary_contact_id: number | null
  country: string | null
  primary_contact_name: string | null
  primary_contact_email: string | null
  contact_count: number
  adoption_count: number
  created_at: string
  updated_at: string
}

interface GroupContact {
  contact_id: number
  name: string
  email_address: string | null
  phone: string | null
  connection_type: string | null
}

interface Adoption {
  id: number
  people_group_id: number
  group_id: number
  status: 'pending' | 'active' | 'inactive'
  update_token: string
  show_publicly: boolean
  adopted_at: string | null
  people_group_name: string
  people_group_slug: string | null
  group_name: string
  report_count: number
  created_at: string
}

interface ContactOption {
  id: number
  name: string
  email_address: string | null
}

interface PeopleGroupOption {
  id: number
  name: string
}

const route = useRoute()
const toast = useToast()
const { countryOptions } = useLocalizedOptions()

const groups = ref<GroupWithDetails[]>([])
const selectedGroup = ref<GroupWithDetails | null>(null)
const groupContacts = ref<GroupContact[]>([])
const groupAdoptions = ref<Adoption[]>([])
const allContacts = ref<ContactOption[]>([])
const allPeopleGroups = ref<PeopleGroupOption[]>([])

const loading = ref(true)
const error = ref('')
const saving = ref(false)
const creating = ref(false)
const deleting = ref(false)

const searchQuery = ref('')
const groupForm = ref({ name: '', primary_contact_id: null as number | null, country: null as string | null })

const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const showAddContactModal = ref(false)
const showAddAdoptionModal = ref(false)
const createGroupForm = ref({ name: '' })
const addContactId = ref<number | null>(null)
const addAdoptionPeopleGroupId = ref<number | null>(null)

const filteredGroups = computed(() => {
  if (!searchQuery.value) return groups.value
  const q = searchQuery.value.toLowerCase()
  return groups.value.filter(g => g.name.toLowerCase().includes(q))
})

const primaryContactOptions = computed(() => {
  return [
    { label: 'None', value: null },
    ...groupContacts.value.map(c => ({
      label: `${c.name}${c.email_address ? ` (${c.email_address})` : ''}`,
      value: c.contact_id
    }))
  ]
})

const allContactOptions = computed(() => {
  const linkedIds = new Set(groupContacts.value.map(c => c.contact_id))
  return allContacts.value
    .filter(c => !linkedIds.has(c.id))
    .map(c => ({
      label: `${c.name}${c.email_address ? ` (${c.email_address})` : ''}`,
      value: c.id
    }))
})

const peopleGroupOptions = computed(() => {
  const adoptedIds = new Set(groupAdoptions.value.map(a => a.people_group_id))
  return allPeopleGroups.value
    .filter(pg => !adoptedIds.has(pg.id))
    .map(pg => ({ label: pg.name, value: pg.id }))
})

async function loadData() {
  try {
    loading.value = true
    error.value = ''
    const [groupsRes, contactsRes, pgRes] = await Promise.all([
      $fetch<{ groups: GroupWithDetails[] }>('/api/admin/groups'),
      $fetch<{ contacts: ContactOption[] }>('/api/admin/contacts'),
      $fetch<{ peopleGroups: PeopleGroupOption[] }>('/api/admin/people-groups')
    ])
    groups.value = groupsRes.groups
    allContacts.value = contactsRes.contacts
    allPeopleGroups.value = pgRes.peopleGroups
  } catch (err: any) {
    error.value = 'Failed to load groups'
  } finally {
    loading.value = false
  }
}

async function selectGroup(group: GroupWithDetails, updateUrl = true) {
  selectedGroup.value = group
  groupForm.value = {
    name: group.name,
    primary_contact_id: group.primary_contact_id,
    country: group.country
  }
  if (updateUrl && import.meta.client) {
    window.history.replaceState({}, '', `/admin/groups/${group.id}`)
  }

  try {
    const res = await $fetch<{ group: any; contacts: GroupContact[]; adoptions: Adoption[] }>(`/api/admin/groups/${group.id}`)
    groupContacts.value = res.contacts
    groupAdoptions.value = res.adoptions
  } catch {
    groupContacts.value = []
    groupAdoptions.value = []
  }
}

async function saveGroupChanges() {
  if (!selectedGroup.value) return
  try {
    saving.value = true
    await $fetch(`/api/admin/groups/${selectedGroup.value.id}`, {
      method: 'PUT',
      body: {
        name: groupForm.value.name,
        primary_contact_id: groupForm.value.primary_contact_id,
        country: groupForm.value.country
      }
    })
    await refreshGroup()
    toast.add({ title: 'Saved', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.data?.statusMessage || 'Failed to save', color: 'error' })
  } finally {
    saving.value = false
  }
}

function resetForm() {
  if (selectedGroup.value) selectGroup(selectedGroup.value, false)
}

function openCreateModal() {
  createGroupForm.value = { name: '' }
  showCreateModal.value = true
}

async function createGroup() {
  if (!createGroupForm.value.name.trim()) return
  try {
    creating.value = true
    const res = await $fetch<{ group: any }>('/api/admin/groups', {
      method: 'POST',
      body: createGroupForm.value
    })
    await loadData()
    showCreateModal.value = false
    const created = groups.value.find(g => g.id === res.group.id)
    if (created) selectGroup(created)
    toast.add({ title: 'Group created', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.data?.statusMessage || 'Failed to create', color: 'error' })
  } finally {
    creating.value = false
  }
}

function openDeleteGroupModal() {
  if (selectedGroup.value) showDeleteModal.value = true
}

async function confirmDeleteGroup() {
  if (!selectedGroup.value) return
  try {
    deleting.value = true
    await $fetch(`/api/admin/groups/${selectedGroup.value.id}`, { method: 'DELETE' })
    groups.value = groups.value.filter(g => g.id !== selectedGroup.value!.id)
    selectedGroup.value = null
    showDeleteModal.value = false
    if (import.meta.client) window.history.replaceState({}, '', '/admin/groups')
    toast.add({ title: 'Group deleted', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.data?.statusMessage || 'Failed to delete', color: 'error' })
  } finally {
    deleting.value = false
  }
}

async function addContactToGroup() {
  if (!selectedGroup.value || !addContactId.value) return
  try {
    await $fetch(`/api/admin/groups/${selectedGroup.value.id}/contacts`, {
      method: 'POST',
      body: { contact_id: addContactId.value }
    })
    showAddContactModal.value = false
    addContactId.value = null
    await refreshGroup()
    toast.add({ title: 'Contact added', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.data?.statusMessage || 'Failed to add contact', color: 'error' })
  }
}

async function removeContact(contactId: number) {
  if (!selectedGroup.value) return
  try {
    await $fetch(`/api/admin/groups/${selectedGroup.value.id}/contacts?contact_id=${contactId}`, {
      method: 'DELETE'
    })
    await refreshGroup()
    toast.add({ title: 'Contact removed', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.data?.statusMessage || 'Failed to remove', color: 'error' })
  }
}

async function addAdoption() {
  if (!selectedGroup.value || !addAdoptionPeopleGroupId.value) return
  try {
    await $fetch(`/api/admin/groups/${selectedGroup.value.id}/adoptions`, {
      method: 'POST',
      body: { people_group_id: addAdoptionPeopleGroupId.value }
    })
    showAddAdoptionModal.value = false
    addAdoptionPeopleGroupId.value = null
    await refreshGroup()
    toast.add({ title: 'Adoption added', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.data?.statusMessage || 'Failed to add adoption', color: 'error' })
  }
}

async function deleteAdoption(adoptionId: number) {
  if (!selectedGroup.value) return
  try {
    await $fetch(`/api/admin/groups/${selectedGroup.value.id}/adoptions/${adoptionId}`, {
      method: 'DELETE'
    })
    await refreshGroup()
    toast.add({ title: 'Adoption removed', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.data?.statusMessage || 'Failed to remove', color: 'error' })
  }
}

async function refreshGroup() {
  if (!selectedGroup.value) return
  await loadData()
  const updated = groups.value.find(g => g.id === selectedGroup.value!.id)
  if (updated) await selectGroup(updated, false)
}

function formatDate(d: string) { return new Date(d).toLocaleDateString() }
function formatDateTime(d: string) { return new Date(d).toLocaleString() }

function handleUrlSelection() {
  const idParam = route.params.id as string | undefined
  if (!idParam) return
  const group = groups.value.find(g => g.id === parseInt(idParam))
  if (group) selectGroup(group, false)
}

onMounted(async () => {
  await loadData()
  handleUrlSelection()
})
</script>

<style scoped>
.empty-list,
.empty-section {
  padding: 1rem;
  text-align: center;
  color: var(--ui-text-muted);
  font-size: 0.875rem;
}

.group-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.group-info {
  font-size: 0.875rem;
  color: var(--ui-text-muted);
  margin-bottom: 0.25rem;
}

.group-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.75rem;
}

.date {
  color: var(--ui-text-muted);
}

.contacts-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.contact-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background-color: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
}

.contact-row-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.contact-link {
  font-weight: 500;
  color: var(--ui-text);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.contact-email {
  font-size: 0.75rem;
  color: var(--ui-text-muted);
}

.adoptions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--ui-border);
  font-size: 0.875rem;
}

.info-row .label { font-weight: 500; }
.info-row .value { color: var(--ui-text-muted); }
.monospace { font-family: monospace; }

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
</style>
