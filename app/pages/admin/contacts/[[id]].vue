<template>
  <CrmLayout :loading="loading" :error="error">
    <template #header>
      <div>
        <h1>Contacts</h1>
      </div>
      <UButton icon="i-lucide-plus" @click="openCreateModal">New Contact</UButton>
    </template>

    <template #list-header>
      <CrmListPanel
        v-model="searchQuery"
        search-placeholder="Search by name, email, or phone..."
        :total-count="filteredContacts.length"
      />
    </template>

    <template #list>
      <template v-if="filteredContacts.length === 0">
        <div class="empty-list">No contacts found</div>
      </template>
      <CrmListItem
        v-else
        v-for="contact in filteredContacts"
        :key="contact.id"
        :active="selectedContact?.id === contact.id"
        @click="selectContact(contact)"
      >
        <div class="contact-name">{{ contact.name }}</div>
        <div class="contact-info">
          {{ contact.email_address || contact.phone || 'No contact info' }}
        </div>
        <div class="contact-meta">
          <span class="date">{{ formatDate(contact.created_at) }}</span>
        </div>
      </CrmListItem>
    </template>

    <template #detail>
      <CrmDetailPanel :has-selection="!!selectedContact">
        <template #header>
          <h2>{{ selectedContact?.name }}</h2>
        </template>

        <template #actions>
          <UButton type="button" @click="resetForm" variant="outline">Reset</UButton>
          <UButton @click="openDeleteModal" color="error" variant="outline">Delete</UButton>
          <UButton @click="saveChanges" :loading="saving">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </UButton>
        </template>

        <form v-if="selectedContact" @submit.prevent="saveChanges">
          <CrmFormSection title="Contact Information">
            <UFormField label="Name" required>
              <UInput v-model="contactForm.name" type="text" class="w-full" />
            </UFormField>
            <UFormField label="Email">
              <UInput v-model="contactForm.email_address" type="email" class="w-full" />
            </UFormField>
            <UFormField label="Phone">
              <UInput v-model="contactForm.phone" type="text" class="w-full" />
            </UFormField>
            <UFormField label="Role">
              <UInput v-model="contactForm.role" type="text" class="w-full" placeholder="e.g. Pastor, Missions Director" />
            </UFormField>
          </CrmFormSection>

          <CrmFormSection title="Groups">
            <template #header-extra>
              <UButton size="xs" variant="outline" icon="i-lucide-plus" @click="openAddGroupModal">
                Add
              </UButton>
            </template>

            <div v-if="contactGroups.length === 0" class="empty-section">
              Not linked to any groups
            </div>
            <div v-else class="groups-list">
              <div v-for="g in contactGroups" :key="g.group_id" class="group-item">
                <div class="group-item-info">
                  <NuxtLink :to="`/admin/groups/${g.group_id}`" class="group-link">
                    {{ g.name }}
                  </NuxtLink>
                  <UBadge v-if="g.connection_type" :label="g.connection_type" variant="subtle" size="xs" />
                </div>
                <UButton
                  size="xs"
                  variant="ghost"
                  color="error"
                  icon="i-lucide-x"
                  @click="removeFromGroup(g.group_id)"
                />
              </div>
            </div>
          </CrmFormSection>

          <CrmFormSection title="Metadata">
            <div class="info-row">
              <span class="label">Contact ID:</span>
              <span class="value monospace">{{ selectedContact.id }}</span>
            </div>
            <div class="info-row">
              <span class="label">Created:</span>
              <span class="value">{{ formatDateTime(selectedContact.created_at) }}</span>
            </div>
          </CrmFormSection>
        </form>

        <template #empty>
          Select a contact to view details
        </template>
      </CrmDetailPanel>
    </template>
  </CrmLayout>

  <!-- Create Modal -->
  <UModal v-model:open="showCreateModal" title="New Contact">
    <template #body>
      <form @submit.prevent="createContact" class="modal-form">
        <UFormField label="Name" required>
          <UInput v-model="createForm.name" type="text" class="w-full" />
        </UFormField>
        <UFormField label="Email">
          <UInput v-model="createForm.email_address" type="email" class="w-full" />
        </UFormField>
        <UFormField label="Phone">
          <UInput v-model="createForm.phone" type="text" class="w-full" />
        </UFormField>
        <div class="modal-actions">
          <UButton variant="outline" @click="showCreateModal = false">Cancel</UButton>
          <UButton type="submit" :loading="creating">Create</UButton>
        </div>
      </form>
    </template>
  </UModal>

  <!-- Delete Modal -->
  <ConfirmModal
    v-model:open="showDeleteModal"
    title="Delete Contact"
    :message="selectedContact ? `Are you sure you want to delete &quot;${selectedContact.name}&quot;?` : ''"
    warning="This will remove all connections for this contact. This action cannot be undone."
    confirm-text="Delete"
    confirm-color="primary"
    :loading="deleting"
    @confirm="confirmDelete"
    @cancel="showDeleteModal = false"
  />

  <!-- Add to Group Modal -->
  <UModal v-model:open="showAddGroupModal" title="Add to Group">
    <template #body>
      <form @submit.prevent="addToGroup" class="modal-form">
        <UFormField label="Group">
          <USelectMenu
            v-model="addGroupId"
            :items="availableGroupOptions"
            value-key="value"
            placeholder="Select a group..."
            class="w-full"
          />
        </UFormField>
        <div class="modal-actions">
          <UButton variant="outline" @click="showAddGroupModal = false">Cancel</UButton>
          <UButton type="submit" :disabled="!addGroupId">Add</UButton>
        </div>
      </form>
    </template>
  </UModal>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

interface Contact {
  id: number
  name: string
  email_address: string | null
  phone: string | null
  role: string | null
  created_at: string
  updated_at: string
}

interface ContactGroup {
  group_id: number
  name: string
  connection_type: string | null
}

const route = useRoute()
const toast = useToast()

const contacts = ref<Contact[]>([])
const selectedContact = ref<Contact | null>(null)
const contactGroups = ref<ContactGroup[]>([])

const loading = ref(true)
const error = ref('')
const saving = ref(false)
const creating = ref(false)
const deleting = ref(false)

const searchQuery = ref('')
const contactForm = ref({ name: '', email_address: '', phone: '', role: '' })

const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const showAddGroupModal = ref(false)
const createForm = ref({ name: '', email_address: '', phone: '' })
const addGroupId = ref<number | null>(null)

interface GroupOption {
  id: number
  name: string
}
const allGroups = ref<GroupOption[]>([])

const filteredContacts = computed(() => {
  if (!searchQuery.value) return contacts.value
  const q = searchQuery.value.toLowerCase()
  return contacts.value.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.email_address?.toLowerCase().includes(q) ||
    c.phone?.includes(q)
  )
})

const availableGroupOptions = computed(() => {
  const linkedIds = new Set(contactGroups.value.map(g => g.group_id))
  return allGroups.value
    .filter(g => !linkedIds.has(g.id))
    .map(g => ({ label: g.name, value: g.id }))
})

async function loadData() {
  try {
    loading.value = true
    error.value = ''
    const [contactsRes, groupsRes] = await Promise.all([
      $fetch<{ contacts: Contact[] }>('/api/admin/contacts'),
      $fetch<{ groups: GroupOption[] }>('/api/admin/groups')
    ])
    contacts.value = contactsRes.contacts
    allGroups.value = groupsRes.groups
  } catch (err: any) {
    error.value = 'Failed to load contacts'
  } finally {
    loading.value = false
  }
}

async function selectContact(contact: Contact, updateUrl = true) {
  selectedContact.value = contact
  contactForm.value = {
    name: contact.name,
    email_address: contact.email_address || '',
    phone: contact.phone || '',
    role: contact.role || ''
  }
  if (updateUrl && import.meta.client) {
    window.history.replaceState({}, '', `/admin/contacts/${contact.id}`)
  }

  try {
    const res = await $fetch<{ groups: ContactGroup[] }>(`/api/admin/contacts/${contact.id}`)
    contactGroups.value = res.groups
  } catch {
    contactGroups.value = []
  }
}

async function saveChanges() {
  if (!selectedContact.value) return
  try {
    saving.value = true
    const res = await $fetch<{ contact: Contact }>(`/api/admin/contacts/${selectedContact.value.id}`, {
      method: 'PUT',
      body: {
        name: contactForm.value.name,
        email_address: contactForm.value.email_address || null,
        phone: contactForm.value.phone || null,
        role: contactForm.value.role || null
      }
    })
    const idx = contacts.value.findIndex(c => c.id === res.contact.id)
    if (idx >= 0) contacts.value[idx] = res.contact
    selectedContact.value = res.contact
    toast.add({ title: 'Saved', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.data?.statusMessage || 'Failed to save', color: 'error' })
  } finally {
    saving.value = false
  }
}

function resetForm() {
  if (selectedContact.value) selectContact(selectedContact.value, false)
}

function openCreateModal() {
  createForm.value = { name: '', email_address: '', phone: '' }
  showCreateModal.value = true
}

async function createContact() {
  if (!createForm.value.name.trim()) return
  try {
    creating.value = true
    const res = await $fetch<{ contact: Contact }>('/api/admin/contacts', {
      method: 'POST',
      body: createForm.value
    })
    contacts.value.unshift(res.contact)
    showCreateModal.value = false
    selectContact(res.contact)
    toast.add({ title: 'Contact created', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.data?.statusMessage || 'Failed to create', color: 'error' })
  } finally {
    creating.value = false
  }
}

function openDeleteModal() {
  if (selectedContact.value) showDeleteModal.value = true
}

async function confirmDelete() {
  if (!selectedContact.value) return
  try {
    deleting.value = true
    await $fetch(`/api/admin/contacts/${selectedContact.value.id}`, { method: 'DELETE' })
    contacts.value = contacts.value.filter(c => c.id !== selectedContact.value!.id)
    selectedContact.value = null
    showDeleteModal.value = false
    if (import.meta.client) window.history.replaceState({}, '', '/admin/contacts')
    toast.add({ title: 'Contact deleted', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.data?.statusMessage || 'Failed to delete', color: 'error' })
  } finally {
    deleting.value = false
  }
}

function openAddGroupModal() {
  addGroupId.value = null
  showAddGroupModal.value = true
}

async function addToGroup() {
  if (!selectedContact.value || !addGroupId.value) return
  try {
    await $fetch(`/api/admin/groups/${addGroupId.value}/contacts`, {
      method: 'POST',
      body: { contact_id: selectedContact.value.id }
    })
    showAddGroupModal.value = false
    addGroupId.value = null
    await selectContact(selectedContact.value, false)
    toast.add({ title: 'Added to group', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.data?.statusMessage || 'Failed to add', color: 'error' })
  }
}

async function removeFromGroup(groupId: number) {
  if (!selectedContact.value) return
  try {
    await $fetch(`/api/admin/groups/${groupId}/contacts?contact_id=${selectedContact.value.id}`, {
      method: 'DELETE'
    })
    await selectContact(selectedContact.value, false)
    toast.add({ title: 'Removed from group', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.data?.statusMessage || 'Failed to remove', color: 'error' })
  }
}

function formatDate(d: string) { return new Date(d).toLocaleDateString() }
function formatDateTime(d: string) { return new Date(d).toLocaleString() }

function handleUrlSelection() {
  const idParam = route.params.id as string | undefined
  if (!idParam) return
  const contact = contacts.value.find(c => c.id === parseInt(idParam))
  if (contact) selectContact(contact, false)
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

.contact-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.contact-info {
  font-size: 0.875rem;
  color: var(--ui-text-muted);
  margin-bottom: 0.25rem;
}

.contact-meta {
  font-size: 0.75rem;
}

.date {
  color: var(--ui-text-muted);
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background-color: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
}

.group-item-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.group-link {
  font-weight: 500;
  color: var(--ui-text);
  text-decoration: underline;
  text-underline-offset: 2px;
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
