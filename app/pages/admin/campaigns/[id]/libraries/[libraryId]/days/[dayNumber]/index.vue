<template>
  <LibraryDayOverview
    :library-id="libraryId"
    :day-number="dayNumber"
    :breadcrumbs="breadcrumbs"
    :calendar-url="`/admin/campaigns/${campaignId}/content`"
    :content-base-url="`/admin/campaigns/${campaignId}/libraries/${libraryId}/days/${dayNumber}/content`"
    @navigate-previous="navigateToPreviousDay"
    @navigate-next="navigateToNextDay"
    @create-translation="createTranslation"
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

const library = ref<{ name: string } | null>(null)

const breadcrumbs = computed(() => [
  { label: 'Campaign', to: `/admin/campaigns/${campaignId.value}` },
  { label: 'Content Libraries', to: `/admin/campaigns/${campaignId.value}/content` },
  { label: library.value?.name || 'Library' },
  { label: `Day ${dayNumber.value}` }
])

async function loadLibrary() {
  try {
    const response = await $fetch<{ library: { name: string } }>(`/api/admin/libraries/${libraryId.value}`)
    library.value = response.library
  } catch (err) {
    console.error('Failed to load library:', err)
  }
}

function navigateToPreviousDay() {
  if (dayNumber.value > 1) {
    navigateTo(`/admin/campaigns/${campaignId.value}/libraries/${libraryId.value}/days/${dayNumber.value - 1}`)
  }
}

function navigateToNextDay() {
  navigateTo(`/admin/campaigns/${campaignId.value}/libraries/${libraryId.value}/days/${dayNumber.value + 1}`)
}

function createTranslation(languageCode: string) {
  navigateTo(`/admin/campaigns/${campaignId.value}/libraries/${libraryId.value}/days/${dayNumber.value}/content/new?lang=${languageCode}`)
}

onMounted(() => {
  loadLibrary()
})
</script>
