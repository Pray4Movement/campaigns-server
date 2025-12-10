<template>
  <div class="min-h-screen bg-[var(--ui-bg)]">

    <!-- Auth checking state -->
    <div v-if="authChecking" class="flex justify-center items-center h-screen">
      <div class="text-center">
        <UIcon name="i-lucide-loader" class="w-10 h-10 animate-spin mx-auto mb-4" />
        <p>Loading...</p>
      </div>
    </div>

    <!-- Not logged in - show landing page -->
    <div v-else-if="!isLoggedIn" class="text-center py-16 px-4">
      <h1 class="text-4xl font-bold mb-4">Welcome</h1>
      <p class="text-[var(--ui-text-muted)] mb-8 max-w-lg mx-auto">
        Get started by creating an account or signing in.
      </p>
      <div class="flex gap-4 justify-center">
        <UButton to="/register" size="lg">
          Get Started
        </UButton>
        <UButton to="/login" variant="outline" size="lg">
          Sign In
        </UButton>
      </div>
    </div>

    <!-- Logged in - redirect to admin -->
    <div v-else-if="isLoggedIn" class="flex justify-center items-center h-screen">
      <div class="text-center">
        <UIcon name="i-lucide-loader" class="w-10 h-10 animate-spin mx-auto mb-4" />
        <p>Redirecting...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const { isLoggedIn, checkAuth } = useAuth()
const { initTheme } = useTheme()
const router = useRouter()

// Auth loading state
const authChecking = ref(true)

// Check auth on mount
onMounted(async () => {
  initTheme()
  const authResult = await checkAuth()
  authChecking.value = false

  if (authResult) {
    // User is logged in, redirect to admin
    await router.push('/admin')
  }

  // If not logged in, landing page will show automatically
})
</script>
