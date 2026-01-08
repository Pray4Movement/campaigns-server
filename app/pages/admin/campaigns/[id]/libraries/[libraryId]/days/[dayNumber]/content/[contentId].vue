<template>
  <LibraryContentEditor
    :library-id="libraryId"
    :day-number="dayNumber"
    :back-url="`/admin/campaigns/${campaignId}/libraries/${libraryId}/days/${dayNumber}`"
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
const campaignId = computed(() => parseInt(route.params.id as string))
const libraryId = computed(() => parseInt(route.params.libraryId as string))
const dayNumber = computed(() => parseInt(route.params.dayNumber as string))
const contentId = computed(() => parseInt(route.params.contentId as string))
</script>
