<template>
  <div class="users-page">
    <div class="page-header">
      <h1>User Management</h1>
      <button @click="showInviteModal = true" class="btn-primary">
        Invite User
      </button>
    </div>

    <!-- Success Toast -->
    <div v-if="successMessage" class="toast toast-success">
      {{ successMessage }}
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">Loading...</div>

    <!-- Error State -->
    <div v-else-if="error" class="error">{{ error }}</div>

    <!-- Content -->
    <div v-else class="content">
      <!-- Users Section -->
      <section class="section">
        <h2>Active Users</h2>

        <div v-if="users.length === 0" class="empty-state">
          No users found
        </div>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Display Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Campaigns</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.email }}</td>
              <td>{{ user.display_name || '—' }}</td>
              <td>
                <select
                  v-if="availableRoles.length > 0"
                  :value="user.roles[0]?.id || ''"
                  @change="(e) => updateUserRole(user.id, parseInt((e.target as HTMLSelectElement).value) || null)"
                  class="role-select"
                >
                  <option value="">No Role</option>
                  <option
                    v-for="role in availableRoles"
                    :key="role.id"
                    :value="role.id"
                  >
                    {{ formatRoleName(role.name) }}
                  </option>
                </select>
                <span v-else>{{ user.roles[0] ? formatRoleName(user.roles[0].name) : 'No role' }}</span>
              </td>
              <td>
                <span class="badge" :class="{ verified: user.verified, unverified: !user.verified }">
                  {{ user.verified ? 'Verified' : 'Unverified' }}
                </span>
              </td>
              <td>
                <button
                  v-if="user.roles[0]?.name === 'campaign_editor'"
                  @click="openCampaignModal(user)"
                  class="btn-small btn-secondary"
                >
                  Manage
                </button>
                <span v-else class="text-muted">—</span>
              </td>
              <td>{{ formatDate(user.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Invitations Section -->
      <section class="section">
        <h2>Invitations</h2>

        <div v-if="pendingInvitations.length === 0" class="empty-state">
          No pending invitations
        </div>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Invited By</th>
              <th>Status</th>
              <th>Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="invitation in pendingInvitations" :key="invitation.id">
              <td>{{ invitation.email }}</td>
              <td>{{ invitation.inviter_name || invitation.inviter_email }}</td>
              <td>
                <span class="badge" :class="invitation.status">
                  {{ invitation.status }}
                </span>
              </td>
              <td>{{ formatDateTime(invitation.expires_at) }}</td>
              <td class="actions">
                <button
                  @click="resendInvitation(invitation.id)"
                  class="btn-small btn-secondary"
                  :disabled="invitation.status !== 'pending'"
                >
                  Resend
                </button>
                <button
                  @click="revokeInvitation(invitation.id)"
                  class="btn-small btn-danger"
                  :disabled="invitation.status !== 'pending'"
                >
                  Revoke
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <!-- Manage Campaigns Modal -->
    <div v-if="showCampaignModal" class="modal-overlay" @click.self="closeCampaignModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Manage Campaign Access</h2>
          <button @click="closeCampaignModal" class="close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <p class="modal-intro">
            Select which campaigns <strong>{{ selectedUser?.display_name || selectedUser?.email }}</strong> can access:
          </p>

          <div v-if="campaignModalLoading" class="loading">Loading campaigns...</div>

          <div v-else-if="campaignModalError" class="error-message">
            {{ campaignModalError }}
          </div>

          <div v-else class="campaigns-list">
            <label
              v-for="campaign in availableCampaigns"
              :key="campaign.id"
              class="campaign-checkbox"
            >
              <input
                type="checkbox"
                :checked="campaign.hasAccess"
                @change="toggleCampaignAccess(campaign.id)"
              />
              <span class="campaign-info">
                <strong>{{ campaign.title }}</strong>
                <span class="campaign-slug">{{ campaign.slug }}</span>
              </span>
            </label>

            <div v-if="availableCampaigns.length === 0" class="empty-state">
              No campaigns available
            </div>
          </div>

          <div v-if="campaignModalSuccess" class="success-message">
            Campaign access updated successfully!
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeCampaignModal" class="btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              @click="saveCampaignAccess"
              class="btn-primary"
              :disabled="campaignModalSubmitting"
            >
              {{ campaignModalSubmitting ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Invite User Modal -->
    <div v-if="showInviteModal" class="modal-overlay" @click.self="showInviteModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Invite User</h2>
          <button @click="showInviteModal = false" class="close-btn">&times;</button>
        </div>

        <form @submit.prevent="handleInvite" class="modal-body">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              id="email"
              v-model="inviteForm.email"
              type="email"
              required
              placeholder="user@example.com"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="role">Role</label>
            <select
              id="role"
              v-model="inviteForm.role_id"
              class="form-input"
            >
              <option :value="null">No Role (must be assigned later)</option>
              <option
                v-for="role in availableRoles"
                :key="role.id"
                :value="role.id"
              >
                {{ formatRoleName(role.name) }} - {{ role.description }}
              </option>
            </select>
            <small class="form-hint">Select the role for this user. Invitation will expire in 7 days.</small>
          </div>

          <div v-if="inviteError" class="error-message">
            {{ inviteError }}
          </div>

          <div v-if="inviteSuccess" class="success-message">
            Invitation sent successfully!
          </div>

          <div class="modal-actions">
            <button type="button" @click="showInviteModal = false" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary" :disabled="inviteSubmitting">
              {{ inviteSubmitting ? 'Sending...' : 'Send Invitation' }}
            </button>
          </div>
        </form>
      </div>
    </div>

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
  id: number
  name: string
  description: string
}

interface User {
  id: number
  email: string
  display_name: string
  verified: boolean
  created_at: string
  roles: Role[]
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
  role_id: number | null
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
  role_id: null as number | null
})

const inviteSubmitting = ref(false)
const inviteError = ref('')
const inviteSuccess = ref(false)
const successMessage = ref('')

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
        role_id: inviteForm.value.role_id
      }
    })

    inviteSuccess.value = true
    inviteForm.value.email = ''
    inviteForm.value.role_id = null

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

async function updateUserRole(userId: number, roleId: number | null) {
  try {
    const response = await $fetch<{ success: boolean; message: string }>(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      body: {
        role_id: roleId
      }
    })

    // Show success message
    successMessage.value = response.message || 'Role updated successfully'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)

    // Reload users to show updated role
    await loadData()
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.statusMessage || 'Failed to update user role',
      color: 'red'
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
      color: 'green'
    })

    showResendConfirm.value = false
    resendInvitationId.value = null
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.statusMessage || 'Failed to resend invitation',
      color: 'red'
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
      color: 'green'
    })

    showRevokeConfirm.value = false
    revokeInvitationId.value = null

    // Reload data
    await loadData()
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.statusMessage || 'Failed to revoke invitation',
      color: 'red'
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
    successMessage.value = 'Campaign access updated successfully'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)

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
.users-page {
  max-width: 1200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0;
}

.loading,
.error {
  text-align: center;
  padding: 2rem;
}

.error {
  color: var(--text-muted);
}

.content {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.section h2 {
  margin: 0 0 1rem;
  font-size: 1.25rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
  border: 1px dashed var(--border);
  border-radius: 8px;
}

/* Table Styles */
.data-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.data-table thead {
  background-color: var(--bg-soft);
}

.data-table th,
.data-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background-color: var(--bg-soft);
}

/* Badges */
.badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  margin-right: 0.5rem;
}

.badge.verified {
  background-color: var(--text);
  color: var(--bg);
}

.badge.unverified {
  background-color: var(--bg-soft);
  border: 1px solid var(--border);
}

.badge.superadmin {
  background-color: var(--text);
  color: var(--bg);
}

.badge.pending {
  background-color: var(--bg-soft);
  border: 1px solid var(--border);
}

.badge.accepted {
  background-color: var(--text);
  color: var(--bg);
}

.badge.expired,
.badge.revoked {
  background-color: var(--bg-soft);
  border: 1px solid var(--border);
  opacity: 0.6;
}

/* Actions */
.actions {
  display: flex;
  gap: 0.5rem;
}

/* Buttons */
.btn-primary,
.btn-secondary,
.btn-danger,
.btn-small {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary {
  background-color: var(--text);
  color: var(--bg);
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: var(--bg-soft);
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--bg);
}

.btn-danger {
  background-color: var(--text);
  color: var(--bg);
}

.btn-danger:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-small {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.btn-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal */
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
  background-color: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  color: var(--text);
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  opacity: 0.7;
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

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background-color: var(--bg);
  color: var(--text);
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: var(--text);
}

.form-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.error-message {
  padding: 0.75rem;
  background-color: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  margin-bottom: 1rem;
}

.success-message {
  padding: 0.75rem;
  background-color: var(--text);
  color: var(--bg);
  border-radius: 6px;
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

/* Role Select */
.role-select {
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background-color: var(--bg);
  color: var(--text);
  font-size: 0.875rem;
  cursor: pointer;
}

.role-select:hover {
  border-color: var(--text);
}

.role-select:focus {
  outline: none;
  border-color: var(--text);
}

/* Toast Notification */
.toast {
  position: fixed;
  top: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  z-index: 9999;
  animation: slideIn 0.3s ease-out;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast-success {
  background-color: var(--text);
  color: var(--bg);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Campaign Modal */
.modal-intro {
  margin-bottom: 1.5rem;
  color: var(--text);
}

.campaigns-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
}

.campaign-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.campaign-checkbox:hover {
  background-color: var(--bg-soft);
}

.campaign-checkbox input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

.campaign-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.campaign-slug {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.text-muted {
  color: var(--text-muted);
}
</style>
