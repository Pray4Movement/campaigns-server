<template>
  <div class="accept-invitation-page">
    <div class="container">
      <div class="card">
        <!-- Loading State -->
        <div v-if="validating" class="loading">
          <div class="spinner"></div>
          <p>Validating invitation...</p>
        </div>

        <!-- Invalid Invitation -->
        <div v-else-if="!invitationValid" class="error-state">
          <h2>Invalid Invitation</h2>
          <p>{{ validationError }}</p>
          <NuxtLink to="/login" class="btn-primary">Go to Login</NuxtLink>
        </div>

        <!-- Valid Invitation - Show Form -->
        <div v-else>
          <h1>Accept Invitation</h1>
          <p class="subtitle">Create your account to get started</p>

          <form @submit.prevent="handleAccept" class="accept-form">
            <!-- Email (read-only) -->
            <div class="form-group">
              <label for="email">Email</label>
              <input
                id="email"
                v-model="invitation.email"
                type="email"
                readonly
                disabled
                class="form-input"
              />
            </div>

            <!-- Display Name -->
            <div class="form-group">
              <label for="display_name">Display Name</label>
              <input
                id="display_name"
                v-model="acceptForm.display_name"
                type="text"
                required
                placeholder="Enter your name"
                class="form-input"
              />
            </div>

            <!-- Password -->
            <div class="form-group">
              <label for="password">Password</label>
              <input
                id="password"
                v-model="acceptForm.password"
                type="password"
                required
                minlength="8"
                placeholder="At least 8 characters"
                class="form-input"
              />
              <small class="form-hint">Must be at least 8 characters long</small>
            </div>

            <!-- Confirm Password -->
            <div class="form-group">
              <label for="confirm_password">Confirm Password</label>
              <input
                id="confirm_password"
                v-model="acceptForm.confirm_password"
                type="password"
                required
                minlength="8"
                placeholder="Re-enter your password"
                class="form-input"
              />
            </div>

            <!-- Error Message -->
            <div v-if="acceptError" class="error-message">
              {{ acceptError }}
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              class="btn-primary btn-full"
              :disabled="submitting"
            >
              {{ submitting ? 'Creating Account...' : 'Create Account' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['guest']
})

const route = useRoute()
const router = useRouter()

const token = computed(() => route.query.token as string)

const validating = ref(true)
const invitationValid = ref(false)
const validationError = ref('')

const invitation = ref({
  email: '',
  expires_at: ''
})

const acceptForm = ref({
  display_name: '',
  password: '',
  confirm_password: ''
})

const submitting = ref(false)
const acceptError = ref('')

// Validate invitation on mount
async function validateInvitation() {
  if (!token.value) {
    invitationValid.value = false
    validationError.value = 'No invitation token provided'
    validating.value = false
    return
  }

  try {
    const response = await $fetch<{ valid: boolean; invitation: { email: string; expires_at: string } }>(
      `/api/auth/invitation/${token.value}`
    )

    if (response.valid) {
      invitationValid.value = true
      invitation.value = response.invitation
    } else {
      invitationValid.value = false
      validationError.value = 'This invitation is invalid or has expired'
    }
  } catch (err: any) {
    invitationValid.value = false
    validationError.value = err.data?.statusMessage || 'Invalid invitation'
  } finally {
    validating.value = false
  }
}

// Handle form submission
async function handleAccept() {
  acceptError.value = ''

  // Validate passwords match
  if (acceptForm.value.password !== acceptForm.value.confirm_password) {
    acceptError.value = 'Passwords do not match'
    return
  }

  // Validate password length
  if (acceptForm.value.password.length < 8) {
    acceptError.value = 'Password must be at least 8 characters long'
    return
  }

  // Validate display name
  if (!acceptForm.value.display_name.trim()) {
    acceptError.value = 'Display name is required'
    return
  }

  submitting.value = true

  try {
    await $fetch('/api/auth/accept-invitation', {
      method: 'POST',
      body: {
        token: token.value,
        display_name: acceptForm.value.display_name,
        password: acceptForm.value.password
      }
    })

    // Redirect to admin dashboard
    router.push('/admin')
  } catch (err: any) {
    acceptError.value = err.data?.statusMessage || 'Failed to create account. Please try again.'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  validateInvitation()
})

// Set page title
const config = useRuntimeConfig()
useHead({
  title: `Accept Invitation - ${config.public.appName || 'Base'}`
})
</script>

<style scoped>
.accept-invitation-page {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.container {
  width: 100%;
  max-width: 500px;
}

.card {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 2rem;
}

/* Loading State */
.loading {
  text-align: center;
  padding: 2rem 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border);
  border-top: 4px solid var(--text);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading p {
  color: var(--text-muted);
}

/* Error State */
.error-state {
  text-align: center;
  padding: 2rem 0;
}

.error-state h2 {
  margin: 0 0 1rem;
  color: var(--text);
}

.error-state p {
  margin: 0 0 1.5rem;
  color: var(--text-muted);
}

/* Form */
h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  text-align: center;
}

.subtitle {
  text-align: center;
  color: var(--text-muted);
  margin: 0 0 2rem;
}

.accept-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background-color: var(--bg);
  color: var(--text);
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--text);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: var(--bg-soft);
}

.form-hint {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.error-message {
  padding: 0.75rem;
  background-color: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 0.875rem;
}

/* Buttons */
.btn-primary {
  display: inline-block;
  background: var(--text);
  color: var(--bg);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  text-align: center;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-full {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  h1 {
    font-size: 1.5rem;
  }

  .card {
    padding: 1.5rem;
  }
}
</style>
