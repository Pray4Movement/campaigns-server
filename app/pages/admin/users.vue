<template>
  <div class="max-w-6xl">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-2xl font-bold">User Management</h1>
      <UButton @click="showInviteModal = true" icon="i-lucide-user-plus">
        Invite User
      </UButton>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader" class="w-6 h-6 animate-spin" />
      <span class="ml-2">Loading...</span>
    </div>

    <!-- Error State -->
    <UAlert v-else-if="error" color="error" :title="error" class="mb-6" />

    <!-- Content -->
    <div v-else class="flex flex-col gap-8">
      <!-- Users Section -->
      <section>
        <h2 class="text-xl font-semibold mb-4">Active Users</h2>

        <div v-if="users.length === 0" class="text-center py-8 text-[var(--ui-text-muted)] border border-dashed border-[var(--ui-border)] rounded-lg">
          No users found
        </div>

        <UTable v-else :data="users" :columns="userColumns">
          <template #email-cell="{ row }">
            {{ (row.original as User).email }}
          </template>
          <template #display_name-cell="{ row }">
            {{ (row.original as User).display_name || '—' }}
          </template>
          <template #role-cell="{ row }">
            <USelect
              v-if="availableRoles.length > 0"
              :model-value="(row.original as User).role?.name || 'none'"
              @update:model-value="(val: string) => updateUserRole((row.original as User).id, val === 'none' ? null : val)"
              :items="roleOptions"
              class="w-40"
              size="sm"
            />
            <span v-else>{{ (row.original as User).role ? formatRoleName((row.original as User).role!.name) : 'No role' }}</span>
          </template>
          <template #status-cell="{ row }">
            <UBadge :color="(row.original as User).verified ? 'success' : 'neutral'" variant="subtle">
              {{ (row.original as User).verified ? 'Verified' : 'Unverified' }}
            </UBadge>
          </template>
          <template #campaigns-cell="{ row }">
            <UButton
              v-if="(row.original as User).role?.name === 'campaign_editor'"
              @click="openCampaignModal(row.original as User)"
              variant="outline"
              size="xs"
            >
              Manage
            </UButton>
            <span v-else class="text-[var(--ui-text-muted)]">—</span>
          </template>
          <template #created-cell="{ row }">
            {{ formatDate((row.original as User).created) }}
          </template>
        </UTable>
      </section>

      <!-- Invitations Section -->
      <section>
        <h2 class="text-xl font-semibold mb-4">Invitations</h2>

        <div v-if="pendingInvitations.length === 0" class="text-center py-8 text-[var(--ui-text-muted)] border border-dashed border-[var(--ui-border)] rounded-lg">
          No pending invitations
        </div>

        <UTable v-else :data="pendingInvitations" :columns="invitationColumns">
          <template #email-cell="{ row }">
            {{ (row.original as Invitation).email }}
          </template>
          <template #inviter-cell="{ row }">
            {{ (row.original as Invitation).inviter_name || (row.original as Invitation).inviter_email }}
          </template>
          <template #status-cell="{ row }">
            <UBadge :color="getStatusColor((row.original as Invitation).status)" variant="subtle">
              {{ (row.original as Invitation).status }}
            </UBadge>
          </template>
          <template #expires_at-cell="{ row }">
            {{ formatDateTime((row.original as Invitation).expires_at) }}
          </template>
          <template #actions-cell="{ row }">
            <div class="flex gap-2">
              <UButton
                @click="resendInvitation((row.original as Invitation).id)"
                variant="outline"
                size="xs"
                :disabled="(row.original as Invitation).status !== 'pending'"
              >
                Resend
              </UButton>
              <UButton
                @click="revokeInvitation((row.original as Invitation).id)"
                color="error"
                variant="outline"
                size="xs"
                :disabled="(row.original as Invitation).status !== 'pending'"
              >
                Revoke
              </UButton>
            </div>
          </template>
        </UTable>
      </section>
    </div>

    <!-- Manage Campaigns Modal -->
    <UModal v-model:open="showCampaignModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h2 class="text-lg font-semibold">Manage Campaign Access</h2>
              <UButton @click="closeCampaignModal" variant="ghost" icon="i-lucide-x" size="sm" />
            </div>
          </template>

          <p class="mb-4">
            Select which campaigns <strong>{{ selectedUser?.display_name || selectedUser?.email }}</strong> can access:
          </p>

          <div v-if="campaignModalLoading" class="flex items-center justify-center py-8">
            <UIcon name="i-lucide-loader" class="w-5 h-5 animate-spin" />
            <span class="ml-2">Loading campaigns...</span>
          </div>

          <UAlert v-else-if="campaignModalError" color="error" :title="campaignModalError" class="mb-4" />

          <div v-else class="max-h-96 overflow-y-auto space-y-2 p-2 border border-[var(--ui-border)] rounded-lg">
            <label
              v-for="campaign in availableCampaigns"
              :key="campaign.id"
              class="flex items-center gap-3 p-3 border border-[var(--ui-border)] rounded-lg cursor-pointer hover:bg-[var(--ui-bg-elevated)] transition-colors"
            >
              <UCheckbox
                :model-value="campaign.hasAccess"
                @update:model-value="toggleCampaignAccess(campaign.id)"
              />
              <div class="flex flex-col flex-1">
                <strong>{{ campaign.title }}</strong>
                <span class="text-sm text-[var(--ui-text-muted)]">{{ campaign.slug }}</span>
              </div>
            </label>

            <div v-if="availableCampaigns.length === 0" class="text-center py-4 text-[var(--ui-text-muted)]">
              No campaigns available
            </div>
          </div>

          <UAlert v-if="campaignModalSuccess" color="success" title="Campaign access updated successfully!" class="mt-4" />

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton @click="closeCampaignModal" variant="outline">
                Cancel
              </UButton>
              <UButton
                @click="saveCampaignAccess"
                :loading="campaignModalSubmitting"
              >
                Save Changes
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- Invite User Modal -->
    <UModal v-model:open="showInviteModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h2 class="text-lg font-semibold">Invite User</h2>
              <UButton @click="showInviteModal = false" variant="ghost" icon="i-lucide-x" size="sm" />
            </div>
          </template>

          <form @submit.prevent="handleInvite" class="space-y-4">
            <UFormField label="Email Address" required>
              <UInput
                v-model="inviteForm.email"
                type="email"
                required
                placeholder="user@example.com"
              />
            </UFormField>

            <UFormField label="Role">
              <USelect
                v-model="inviteForm.role"
                :items="inviteRoleOptions"
                placeholder="Select a role"
              />
              <template #hint>
                Select the role for this user. Invitation will expire in 7 days.
              </template>
            </UFormField>

            <UAlert v-if="inviteError" color="error" :title="inviteError" />
            <UAlert v-if="inviteSuccess" color="success" title="Invitation sent successfully!" />

            <div class="flex justify-end gap-2 pt-4">
              <UButton @click="showInviteModal = false" variant="outline" type="button">
                Cancel
              </UButton>
              <UButton type="submit" :loading="inviteSubmitting">
                Send Invitation
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>

    <!-- Resend Invitation Confirmation Modal -->
    <ConfirmModal
      v-model:open="showResendConfirm"
      title="Resend Invitation"
      message="Are you sure you want to resend this invitation?"
      confirm-text="Resend"
      confirm-color="primary"
      :loading="resending"
      @confirm="confirmResendInvitation"
      @cancel="cancelResendInvitation"
    />

    <!-- Revoke Invitation Confirmation Modal -->
    <ConfirmModal
      v-model:open="showRevokeConfirm"
      title="Revoke Invitation"
      message="Are you sure you want to revoke this invitation?"
      warning="This action cannot be undone."
      confirm-text="Revoke"
      confirm-color="primary"
      :loading="revoking"
      @confirm="confirmRevokeInvitation"
      @cancel="cancelRevokeInvitation"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

interface Role {
  name: string
  description: string
}

interface User {
  id: string
  email: string
  display_name: string
  verified: boolean
  created: string
  role: { name: string; description: string } | null
}

interface Campaign {
  id: number
  slug: string
  title: string
  description: string
  status: string
  hasAccess?: boolean
}

interface Invitation {
  id: number
  email: string
  token: string
  invited_by: number
  role: string | null
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  expires_at: string
  accepted_at: string | null
  created_at: string
  inviter_name: string
  inviter_email: string
}

const loading = ref(true)
const error = ref('')
const users = ref<User[]>([])
const allInvitations = ref<Invitation[]>([])
const availableRoles = ref<Role[]>([])
const showInviteModal = ref(false)

const inviteForm = ref({
  email: '',
  role: 'none'
})

const inviteSubmitting = ref(false)
const inviteError = ref('')
const inviteSuccess = ref(false)

// Campaign modal state
const showCampaignModal = ref(false)
const selectedUser = ref<User | null>(null)
const availableCampaigns = ref<Campaign[]>([])
const campaignModalLoading = ref(false)
const campaignModalError = ref('')
const campaignModalSubmitting = ref(false)
const campaignModalSuccess = ref(false)

// Confirm modals state
const showResendConfirm = ref(false)
const resendInvitationId = ref<number | null>(null)
const showRevokeConfirm = ref(false)
const revokeInvitationId = ref<number | null>(null)
const resending = ref(false)
const revoking = ref(false)

// Toast
const toast = useToast()

// Table columns
const userColumns = [
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'display_name', header: 'Display Name' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'campaigns', header: 'Campaigns' },
  { accessorKey: 'created', header: 'Joined' }
]

const invitationColumns = [
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'inviter', header: 'Invited By' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'expires_at', header: 'Expires' },
  { accessorKey: 'actions', header: 'Actions' }
]

// Computed role options for select
const roleOptions = computed(() => [
  { value: 'none', label: 'No Role' },
  ...availableRoles.value.map(role => ({
    value: role.name,
    label: formatRoleName(role.name)
  }))
])

const inviteRoleOptions = computed(() => [
  { value: 'none', label: 'No Role (must be assigned later)' },
  ...availableRoles.value.map(role => ({
    value: role.name,
    label: `${formatRoleName(role.name)} - ${role.description}`
  }))
])

const pendingInvitations = computed(() => {
  return allInvitations.value.filter(inv => {
    if (inv.status !== 'pending') return false
    const now = new Date()
    const expires = new Date(inv.expires_at)
    return expires > now
  })
})

// Convert database role names to display names
function formatRoleName(roleName: string): string {
  const roleDisplayNames: Record<string, string> = {
    'admin': 'Admin',
    'campaign_editor': 'Campaign Editor'
  }
  return roleDisplayNames[roleName] || roleName
}

function getStatusColor(status: string): 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'accepted': return 'success'
    case 'pending': return 'warning'
    case 'expired':
    case 'revoked': return 'neutral'
    default: return 'neutral'
  }
}

async function loadData() {
  try {
    loading.value = true
    error.value = ''

    // Load users, invitations, and roles in parallel
    const [usersResponse, invitationsResponse, rolesResponse] = await Promise.all([
      $fetch<{ users: User[] }>('/api/admin/users'),
      $fetch<{ invitations: Invitation[] }>('/api/admin/users/invitations'),
      $fetch<{ roles: Role[] }>('/api/admin/roles')
    ])

    users.value = usersResponse.users
    allInvitations.value = invitationsResponse.invitations
    availableRoles.value = rolesResponse.roles
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to load data'
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function handleInvite() {
  inviteSubmitting.value = true
  inviteError.value = ''
  inviteSuccess.value = false

  try {
    await $fetch('/api/admin/users/invite', {
      method: 'POST',
      body: {
        email: inviteForm.value.email,
        role: inviteForm.value.role === 'none' ? null : inviteForm.value.role
      }
    })

    inviteSuccess.value = true
    inviteForm.value.email = ''
    inviteForm.value.role = 'none'

    // Reload invitations
    await loadData()

    // Close modal after a delay
    setTimeout(() => {
      showInviteModal.value = false
      inviteSuccess.value = false
    }, 2000)
  } catch (err: any) {
    inviteError.value = err.data?.statusMessage || 'Failed to send invitation'
  } finally {
    inviteSubmitting.value = false
  }
}

async function updateUserRole(userId: string, roleName: string | null) {
  try {
    const response = await $fetch<{ success: boolean; message: string }>(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      body: {
        role: roleName
      }
    })

    toast.add({
      title: 'Success',
      description: response.message || 'Role updated successfully',
      color: 'success'
    })

    // Reload users to show updated role
    await loadData()
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.statusMessage || 'Failed to update user role',
      color: 'error'
    })
    // Reload to reset the dropdown
    await loadData()
  }
}

function resendInvitation(id: number) {
  resendInvitationId.value = id
  showResendConfirm.value = true
}

async function confirmResendInvitation() {
  if (!resendInvitationId.value) return

  try {
    resending.value = true
    await $fetch(`/api/admin/users/invitations/${resendInvitationId.value}/resend`, {
      method: 'POST'
    })

    toast.add({
      title: 'Success',
      description: 'Invitation resent successfully',
      color: 'success'
    })

    showResendConfirm.value = false
    resendInvitationId.value = null
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.statusMessage || 'Failed to resend invitation',
      color: 'error'
    })
  } finally {
    resending.value = false
  }
}

function cancelResendInvitation() {
  showResendConfirm.value = false
  resendInvitationId.value = null
}

function revokeInvitation(id: number) {
  revokeInvitationId.value = id
  showRevokeConfirm.value = true
}

async function confirmRevokeInvitation() {
  if (!revokeInvitationId.value) return

  try {
    revoking.value = true
    await $fetch(`/api/admin/users/invitations/${revokeInvitationId.value}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Success',
      description: 'Invitation revoked successfully',
      color: 'success'
    })

    showRevokeConfirm.value = false
    revokeInvitationId.value = null

    // Reload data
    await loadData()
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.statusMessage || 'Failed to revoke invitation',
      color: 'error'
    })
  } finally {
    revoking.value = false
  }
}

function cancelRevokeInvitation() {
  showRevokeConfirm.value = false
  revokeInvitationId.value = null
}

// Campaign modal functions
async function openCampaignModal(user: User) {
  selectedUser.value = user
  showCampaignModal.value = true
  campaignModalError.value = ''
  campaignModalSuccess.value = false
  campaignModalLoading.value = true

  try {
    const response = await $fetch<{ campaigns: Campaign[] }>(`/api/admin/users/${user.id}/campaigns`)
    availableCampaigns.value = response.campaigns
  } catch (err: any) {
    campaignModalError.value = err.data?.statusMessage || 'Failed to load campaigns'
  } finally {
    campaignModalLoading.value = false
  }
}

function closeCampaignModal() {
  showCampaignModal.value = false
  selectedUser.value = null
  availableCampaigns.value = []
  campaignModalError.value = ''
  campaignModalSuccess.value = false
}

function toggleCampaignAccess(campaignId: number) {
  const campaign = availableCampaigns.value.find(c => c.id === campaignId)
  if (campaign) {
    campaign.hasAccess = !campaign.hasAccess
  }
}

async function saveCampaignAccess() {
  if (!selectedUser.value) return

  campaignModalSubmitting.value = true
  campaignModalError.value = ''
  campaignModalSuccess.value = false

  try {
    const selectedCampaignIds = availableCampaigns.value
      .filter(c => c.hasAccess)
      .map(c => c.id)

    await $fetch(`/api/admin/users/${selectedUser.value.id}/campaigns`, {
      method: 'PUT',
      body: {
        campaign_ids: selectedCampaignIds
      }
    })

    campaignModalSuccess.value = true
    toast.add({
      title: 'Success',
      description: 'Campaign access updated successfully',
      color: 'success'
    })

    // Close modal after a delay
    setTimeout(() => {
      closeCampaignModal()
    }, 1500)
  } catch (err: any) {
    campaignModalError.value = err.data?.statusMessage || 'Failed to update campaign access'
  } finally {
    campaignModalSubmitting.value = false
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString()
}

onMounted(() => {
  loadData()
})
</script>
