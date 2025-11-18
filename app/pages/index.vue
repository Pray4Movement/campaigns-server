<template>
  <div class="min-h-screen bg-white">

    <!-- Auth checking state -->
    <div v-if="authChecking" class="loading-container">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    </div>

    <!-- Not logged in - show landing page -->
    <div v-else-if="!isLoggedIn" class="text-center py-16 px-4">
      <h1 class="text-4xl font-bold text-black mb-4">Welcome</h1>
      <p class="text-gray-600 mb-8 max-w-lg mx-auto">
        Get started by creating an account or signing in.
      </p>
      <div class="flex gap-4 justify-center">
        <NuxtLink to="/register">
          <button class="landing-btn landing-btn-primary">
            Get Started
          </button>
        </NuxtLink>
        <NuxtLink to="/login">
          <button class="landing-btn landing-btn-secondary">
            Sign In
          </button>
        </NuxtLink>
      </div>
    </div>

    <!-- Logged in - redirect to admin -->
    <div v-else-if="isLoggedIn" class="loading-container">
      <div class="loading-spinner">
        <div class="spinner"></div>
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

<style scoped>
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: var(--ui-bg);
}

.loading-spinner {
  text-align: center;
  color: var(--ui-text);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--ui-border);
  border-top: 4px solid var(--ui-text);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.landing-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
  font-weight: 500;
  cursor: pointer;
}

.landing-btn-primary {
  background: rgba(0, 0, 0, 0.75);
  color: white;
  border: 2px solid rgba(0, 0, 0, 0.75);
}

.landing-btn-primary:hover {
  background: rgba(0, 0, 0, 0.85);
  border-color: rgba(0, 0, 0, 0.85);
}

.landing-btn-secondary {
  background: transparent;
  color: var(--ui-text);
  border: 2px solid var(--ui-text);
}

.landing-btn-secondary:hover {
  background: var(--ui-bg-elevated);
}
</style>
