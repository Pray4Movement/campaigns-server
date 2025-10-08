<template>
  <div class="loading-container">
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>{{ $t('common.loading') }}</p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default'
})

onMounted(async () => {
  try {
    // Check if user is authenticated
    await $fetch('/api/auth/me')
    // If authenticated, redirect to admin
    navigateTo('/admin')
  } catch (error) {
    // Not authenticated, redirect to login
    navigateTo('/login')
  }
})
</script>

<style scoped>
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: var(--bg);
}

.loading-spinner {
  text-align: center;
  color: var(--text);
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
</style>