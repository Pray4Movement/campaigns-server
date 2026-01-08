<template>
  <LibraryContentEditor
    :library-id="libraryId"
    :day-number="dayNumber"
    :back-url="`/admin/libraries/${libraryId}/days/${dayNumber}`"
    :content-id="contentId"
    mode="edit"
  />
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const route = useRoute()
const libraryId = computed(() => parseInt(route.params.id as string))
const dayNumber = computed(() => parseInt(route.params.dayNumber as string))
const contentId = computed(() => parseInt(route.params.contentId as string))
</script>
