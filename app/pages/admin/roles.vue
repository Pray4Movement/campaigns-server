<template>
  <div>
    <h1>Roles & Permissions</h1>
    <p>Manage roles and permissions (Phase 7 implementation)</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})
</script>
