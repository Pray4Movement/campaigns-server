<template>
  <section v-if="items && items.length > 0" class="bg-[var(--ui-bg-elevated)] border-t border-[var(--ui-border)] py-12 px-4">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-xl font-bold mb-6 text-center">{{ $t('prayerFuel.pastPrayers.title') }}</h2>
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink
          v-for="item in items"
          :key="item.id"
          :to="localePath(`/${slug}/prayer-fuel/${item.content_date}`)"
          class="flex flex-col gap-2 p-4 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-lg no-underline text-[var(--ui-text)] transition-all hover:border-[var(--ui-text-muted)] hover:shadow-sm"
        >
          <span class="text-sm text-[var(--ui-text-muted)] font-medium">{{ formatPastDate(item.content_date) }}</span>
          <span class="line-clamp-2">{{ item.title }}</span>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface PastPrayerItem {
  id: number | string
  content_date: string
  title: string
}

const props = defineProps<{
  items: PastPrayerItem[]
  slug: string
  language?: string
}>()

const localePath = useLocalePath()

function formatPastDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString(props.language || 'en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>
