<template>
  <div>
    <h1>Users</h1>
    <p>Manage admin users (Phase 7 implementation)</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})
</script>
