<template>
  <div class="flex-1 flex flex-col bg-beige-50 dark:bg-elevated">
    <!-- Auth checking state -->
    <div v-if="authChecking" class="flex-1 flex justify-center items-center">
      <div class="text-center">
        <UIcon name="i-lucide-loader" class="w-10 h-10 animate-spin mx-auto mb-4" />
        <p>Loading...</p>
      </div>
    </div>

    <!-- Logged in - redirect to admin -->
    <div v-else-if="isLoggedIn" class="flex-1 flex justify-center items-center">
      <div class="text-center">
        <UIcon name="i-lucide-loader" class="w-10 h-10 animate-spin mx-auto mb-4" />
        <p>Redirecting...</p>
      </div>
    </div>

    <!-- Not logged in - show landing page -->
    <div v-else class="flex-1">
      <!-- Hero Section -->
      <section class="py-16 md:py-24">
        <div class="max-w-7xl mx-auto px-4 sm:px-6">
          <div class="text-center max-w-3xl mx-auto">
            <h1 class="text-3xl md:text-5xl font-bold uppercase tracking-wide mb-6">
              <span class="text-default">Prayer</span>
              <span class="text-muted">Tools</span>
            </h1>
            <p class="text-lg md:text-xl text-muted mb-8">
              Get started by creating an account or signing in.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <UButton
                to="/register"
                size="lg"
                class="rounded-full px-8 bg-forest-500 hover:bg-forest-600 text-white"
              >
                Get Started
              </UButton>
              <UButton
                to="/login"
                size="lg"
                variant="outline"
                class="rounded-full px-8"
              >
                Sign In
              </UButton>
            </div>
          </div>
        </div>
      </section>
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
})
</script>
