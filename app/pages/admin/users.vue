<template>
  <div class="users-page">
    <div class="page-header">
      <h1>User Management</h1>
      <button @click="showInviteModal = true" class="btn-primary">
        Invite User
      </button>
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
              <th>Status</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.email }}</td>
              <td>{{ user.display_name || '—' }}</td>
              <td>
                <span class="badge" :class="{ verified: user.verified, unverified: !user.verified }">
                  {{ user.verified ? 'Verified' : 'Unverified' }}
                </span>
                <span v-if="user.superadmin" class="badge superadmin">Superadmin</span>
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
            <small class="form-hint">Invitation will expire in 7 days</small>
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
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

interface User {
  id: number
  email: string
  display_name: string
  verified: boolean
  superadmin: boolean
  created_at: string
}

interface Invitation {
  id: number
  email: string
  token: string
  invited_by: number
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
const showInviteModal = ref(false)

const inviteForm = ref({
  email: ''
})

const inviteSubmitting = ref(false)
const inviteError = ref('')
const inviteSuccess = ref(false)

const pendingInvitations = computed(() => {
  return allInvitations.value.filter(inv => {
    if (inv.status !== 'pending') return false
    const now = new Date()
    const expires = new Date(inv.expires_at)
    return expires > now
  })
})

async function loadData() {
  try {
    loading.value = true
    error.value = ''

    // Load users and invitations in parallel
    const [usersResponse, invitationsResponse] = await Promise.all([
      $fetch<{ users: User[] }>('/api/admin/users'),
      $fetch<{ invitations: Invitation[] }>('/api/admin/users/invitations')
    ])

    users.value = usersResponse.users
    allInvitations.value = invitationsResponse.invitations
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
        email: inviteForm.value.email
      }
    })

    inviteSuccess.value = true
    inviteForm.value.email = ''

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

async function resendInvitation(id: number) {
  if (!confirm('Resend this invitation?')) return

  try {
    await $fetch(`/api/admin/users/invitations/${id}/resend`, {
      method: 'POST'
    })

    alert('Invitation resent successfully')
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to resend invitation')
  }
}

async function revokeInvitation(id: number) {
  if (!confirm('Are you sure you want to revoke this invitation?')) return

  try {
    await $fetch(`/api/admin/users/invitations/${id}`, {
      method: 'DELETE'
    })

    // Reload data
    await loadData()
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to revoke invitation')
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
</style>
