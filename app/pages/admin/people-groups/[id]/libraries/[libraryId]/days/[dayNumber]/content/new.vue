<template>
  <LibraryContentEditor
    :library-id="libraryId"
    :day-number="dayNumber"
    :language-code="languageCode"
    :back-url="`/admin/people-groups/${peopleGroupId}/libraries/${libraryId}/days/${dayNumber}`"
    mode="new"
  />
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const route = useRoute()
const peopleGroupId = computed(() => parseInt(route.params.id as string))
const libraryId = computed(() => parseInt(route.params.libraryId as string))
const dayNumber = computed(() => parseInt(route.params.dayNumber as string))
const languageCode = computed(() => route.query.lang as string || 'en')
</script>
