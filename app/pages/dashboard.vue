<template>
  <div></div>
</template>

<script setup lang="ts">
// Redirect /dashboard to /admin since we only use /admin in this project
definePageMeta({
  middleware: 'auth'
})

// Redirect to admin on mount
navigateTo('/admin', { replace: true })
</script>
