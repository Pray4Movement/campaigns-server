<template>
  <div>
    <p>Welcome to the {{ config.public.appName || 'Base' }} admin panel.</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const config = useRuntimeConfig()
</script>

<style scoped>
</style>
