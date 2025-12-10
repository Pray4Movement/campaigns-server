<template>
  <div class="min-h-[calc(100vh-200px)] flex items-center justify-center p-8">
    <div class="w-full max-w-md">
      <UCard>
        <!-- Loading State -->
        <div v-if="validating" class="text-center py-8">
          <UIcon name="i-lucide-loader" class="w-10 h-10 animate-spin mx-auto mb-4" />
          <p class="text-[var(--ui-text-muted)]">Validating invitation...</p>
        </div>

        <!-- Invalid Invitation -->
        <div v-else-if="!invitationValid" class="text-center py-8">
          <h2 class="text-2xl font-bold mb-4">Invalid Invitation</h2>
          <p class="text-[var(--ui-text-muted)] mb-6">{{ validationError }}</p>
          <UButton to="/login">Go to Login</UButton>
        </div>

        <!-- Valid Invitation - Show Form -->
        <div v-else>
          <h1 class="text-2xl font-bold text-center mb-2">Accept Invitation</h1>
          <p class="text-center text-[var(--ui-text-muted)] mb-8">Create your account to get started</p>

          <form @submit.prevent="handleAccept" class="space-y-6">
            <!-- Email (read-only) -->
            <UFormField label="Email">
              <UInput
                v-model="invitation.email"
                type="email"
                readonly
                disabled
              />
            </UFormField>

            <!-- Display Name -->
            <UFormField label="Display Name" required>
              <UInput
                v-model="acceptForm.display_name"
                type="text"
                required
                placeholder="Enter your name"
              />
            </UFormField>

            <!-- Password -->
            <UFormField label="Password" required>
              <UInput
                v-model="acceptForm.password"
                type="password"
                required
                minlength="8"
                placeholder="At least 8 characters"
              />
              <template #hint>
                Must be at least 8 characters long
              </template>
            </UFormField>

            <!-- Confirm Password -->
            <UFormField label="Confirm Password" required>
              <UInput
                v-model="acceptForm.confirm_password"
                type="password"
                required
                minlength="8"
                placeholder="Re-enter your password"
              />
            </UFormField>

            <!-- Error Message -->
            <UAlert v-if="acceptError" color="error" :title="acceptError" />

            <!-- Submit Button -->
            <UButton
              type="submit"
              size="lg"
              block
              :loading="submitting"
            >
              {{ submitting ? 'Creating Account...' : 'Create Account' }}
            </UButton>
          </form>
        </div>
      </UCard>
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
