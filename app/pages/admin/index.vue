<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Dashboard</h1>

    <div v-if="status === 'pending'" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="animate-spin text-3xl text-[var(--ui-text-dimmed)]" />
    </div>

    <div v-else-if="data" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-book-open" class="text-[var(--ui-primary)] text-lg" />
            <span class="font-semibold">People Groups with Prayer</span>
          </div>
        </template>
        <AdminDashboardBar
          :active-value="data.prayer.withPrayer"
          :inactive-value="data.prayer.withoutPrayer"
          active-label="With Prayer"
          inactive-label="Without"
          active-color="#3b82f6"
        />
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-users" class="text-[var(--ui-primary)] text-lg" />
            <span class="font-semibold">People Group Adoption</span>
          </div>
        </template>
        <AdminDashboardBar
          :active-value="data.adoption.adopted"
          :inactive-value="data.adoption.notAdopted"
          active-label="Adopted"
          inactive-label="Not Adopted"
          active-color="#a855f7"
        />
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-heart-handshake" class="text-[var(--ui-primary)] text-lg" />
            <span class="font-semibold">People Group Engagement</span>
          </div>
        </template>
        <AdminDashboardBar
          :active-value="data.engagement.engaged"
          :inactive-value="data.engagement.unengaged"
          active-label="Engaged"
          inactive-label="Unengaged"
          active-color="#22c55e"
        />
      </UCard>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <UCard>
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-clock" class="text-[var(--ui-primary)] text-2xl" />
            <div>
              <p class="text-sm text-[var(--ui-text-dimmed)]">Total Prayer Time Committed</p>
              <p class="text-2xl font-bold">{{ formatMinutes(data.prayerTime.committed) }}</p>
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-calendar-check" class="text-[var(--ui-primary)] text-2xl" />
            <div>
              <p class="text-sm text-[var(--ui-text-dimmed)]">Daily Prayer Time Committed</p>
              <p class="text-2xl font-bold">{{ formatMinutes(data.prayerTime.dailyCommitted) }}</p>
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-timer" class="text-[var(--ui-primary)] text-2xl" />
            <div>
              <p class="text-sm text-[var(--ui-text-dimmed)]">Total Prayer Time Recorded</p>
              <p class="text-2xl font-bold">{{ formatMinutes(data.prayerTime.recorded) }}</p>
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-activity" class="text-[var(--ui-primary)] text-2xl" />
            <div>
              <p class="text-sm text-[var(--ui-text-dimmed)]">Last 24h Prayer Time Recorded</p>
              <p class="text-2xl font-bold">{{ formatMinutes(data.prayerTime.last24h) }}</p>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const { data, status } = useFetch('/api/admin/dashboard/stats')

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remaining = Math.round(minutes % 60)
  if (remaining === 0) return `${hours.toLocaleString()}h`
  return `${hours.toLocaleString()}h ${remaining}m`
}
</script>
