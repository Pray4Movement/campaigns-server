<template>
  <div class="flex-1 flex flex-col">
    <!-- Content -->
    <main class="flex-1 py-8 px-8">
      <div class="max-w-4xl mx-auto">
        <div v-if="hasContent">
          <div v-for="(contentItem, index) in content" :key="contentItem.id" :class="index > 0 ? 'mt-24' : ''">
            <!-- People Group content -->
            <template v-if="contentItem.content_type === 'people_group' && contentItem.people_group_data">
              <h2 v-if="contentItem.id === -1" class="text-2xl font-bold mb-8">{{ $t('prayerFuel.meetThePeople') }}</h2>
              <h2 v-else-if="contentItem.id === -2" class="text-2xl font-bold mb-8">{{ $t('prayerFuel.peopleGroupOfTheDay') }}</h2>
              <PeopleGroupCard :people-group="contentItem.people_group_data" />
            </template>

            <!-- Static library content -->
            <template v-else>
              <h2 v-if="contentItem.title" class="text-2xl font-bold mb-8">{{ contentItem.title }}</h2>
              <RichTextViewer :content="contentItem.content_json as Record<string, any> | null" :item-id="String(contentItem.id)" />
            </template>
          </div>
        </div>

        <div v-else class="text-center py-16">
          <div class="text-6xl mb-4">📖</div>
          <h2 class="text-xl font-bold mb-4">{{ $t('prayerFuel.noContent.title') }}</h2>
          <p class="text-[var(--ui-text-muted)] text-lg">{{ $t('prayerFuel.noContent.message') }}</p>
        </div>
      </div>
    </main>

    <!-- Footer with I Prayed Button -->
    <footer v-if="hasContent" class="border-t border-[var(--ui-border)] py-8 px-4 bg-[var(--ui-bg-elevated)] text-center">
      <div class="max-w-4xl mx-auto">
        <UButton
          @click="$emit('pray')"
          :disabled="prayedMarked"
          :loading="submitting"
          size="xl"
          class="min-w-[200px] justify-center rounded-full"
        >
          {{ prayedMarked ? $t('prayerFuel.button.recorded') : submitting ? $t('prayerFuel.button.recording') : $t('prayerFuel.button.amen') }}
        </UButton>
        <p v-if="!prayedMarked" class="mt-4 text-sm text-[var(--ui-text-muted)]">
          {{ $t('prayerFuel.button.hint') }}
        </p>
        <p v-else class="mt-4 text-sm text-[var(--ui-text-muted)]">
          {{ $t('prayerFuel.thankYou') }}
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
interface ContentItem {
  id: number
  content_type?: string
  people_group_data?: Record<string, any> | null
  title?: string
  content_json?: Record<string, any> | string | null
}

defineProps<{
  content: ContentItem[]
  hasContent: boolean
  prayedMarked: boolean
  submitting: boolean
}>()

defineEmits<{
  pray: []
}>()
</script>

<style scoped>
:deep(h2) {
  text-transform: uppercase;
  font-size: 1.5rem;
  font-weight: 700;
}
:deep(p) {
  font-size: 1rem;
}
</style>
