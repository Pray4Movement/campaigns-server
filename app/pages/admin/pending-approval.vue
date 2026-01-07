<template>
  <UCard>
    <div class="text-center py-4">
      <div class="mb-6">
        <UIcon name="i-lucide-clock" class="w-16 h-16 text-amber-500 mx-auto" />
      </div>

      <h1 class="text-2xl font-bold mb-2">Account Pending Approval</h1>

      <p class="text-muted mb-6">
        Hi {{ user?.display_name || user?.email }}, your account has been created but you have not yet been assigned a role.
      </p>

      <p class="text-muted mb-8">
        An administrator will review your account and assign you the appropriate access level.
        You will be able to access the system once your role has been assigned.
      </p>

      <div class="space-y-3">
        <UButton
          @click="checkStatus"
          :loading="checking"
          block
          variant="outline"
          icon="i-lucide-refresh-cw"
        >
          Check Status
        </UButton>

        <UButton
          @click="handleLogout"
          :loading="loggingOut"
          block
          color="neutral"
          variant="ghost"
        >
          Sign Out
        </UButton>
      </div>

      <UAlert
        v-if="statusMessage"
        :color="statusColor"
        :title="statusMessage"
        class="mt-6"
      />
    </div>
  </UCard>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const { user, hasRole, checkAuth, logout } = useAuthUser()

const checking = ref(false)
const loggingOut = ref(false)
const statusMessage = ref('')
const statusColor = ref<'info' | 'success' | 'error'>('info')

async function checkStatus() {
  checking.value = true
  statusMessage.value = ''

  try {
    await checkAuth()

    if (hasRole.value) {
      statusMessage.value = 'Your account has been approved! Redirecting...'
      statusColor.value = 'success'

      setTimeout(() => {
        navigateTo('/admin')
      }, 1500)
    } else {
      statusMessage.value = 'Your account is still pending approval.'
      statusColor.value = 'info'
    }
  } catch (error) {
    statusMessage.value = 'Failed to check status. Please try again.'
    statusColor.value = 'error'
  } finally {
    checking.value = false
  }
}

async function handleLogout() {
  loggingOut.value = true
  await logout()
}

onMounted(async () => {
  if (hasRole.value) {
    navigateTo('/admin')
  }
})

const config = useRuntimeConfig()
useHead({
  title: `Pending Approval - ${config.public.appName || 'Prayer Tools'}`
})
</script>
