<template>
  <div class="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
    <div v-if="pending" class="text-center">
      <UIcon name="i-lucide-loader" class="w-10 h-10 animate-spin mb-4" />
      <p>{{ $t('campaign.unsubscribe.processing') }}</p>
    </div>

    <UCard v-else class="max-w-md w-full text-center">
      <template v-if="error">
        <UIcon name="i-lucide-alert-circle" class="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h1 class="text-2xl font-bold mb-4">{{ $t('campaign.unsubscribe.error.title') }}</h1>
        <p class="text-[var(--ui-text-muted)] mb-6">
          {{ error.data?.statusMessage || $t('campaign.unsubscribe.error.message') }}
        </p>
        <UButton :to="localePath('/')">
          {{ $t('campaign.unsubscribe.error.goHome') }}
        </UButton>
      </template>

      <!-- Resubscribed successfully -->
      <template v-else-if="resubscribed">
        <UIcon name="i-lucide-check-circle" class="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h1 class="text-2xl font-bold mb-4">{{ $t('campaign.unsubscribe.resubscribed.title') }}</h1>
        <p class="text-[var(--ui-text-muted)] mb-6">
          {{ $t('campaign.unsubscribe.resubscribed.message') }}
        </p>
        <UButton :to="localePath(`/${data.campaign_slug}`)">
          {{ $t('campaign.unsubscribe.resubscribed.viewCampaign') }}
        </UButton>
      </template>

      <!-- Unsubscribed -->
      <template v-else-if="data">
        <UIcon name="i-lucide-check-circle" class="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h1 class="text-2xl font-bold mb-4">
          {{ data.already_unsubscribed ? $t('campaign.unsubscribe.alreadyDone.title') : $t('campaign.unsubscribe.success.title') }}
        </h1>
        <p class="text-[var(--ui-text-muted)] mb-6">
          {{ data.already_unsubscribed ? $t('campaign.unsubscribe.alreadyDone.message') : $t('campaign.unsubscribe.success.message') }}
        </p>
        <p class="text-sm text-[var(--ui-text-muted)] mb-6">
          {{ $t('campaign.unsubscribe.success.campaign', { title: data.campaign_title }) }}
        </p>
        <UButton @click="resubscribe" :loading="resubscribing">
          {{ resubscribing ? $t('campaign.unsubscribe.success.resubscribing') : $t('campaign.unsubscribe.success.resubscribe') }}
        </UButton>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const route = useRoute()
const slug = route.params.slug as string
const trackingId = route.query.id as string
const { t } = useI18n()
const localePath = useLocalePath()

// Call the unsubscribe API
const { data, pending, error } = await useFetch(`/api/campaigns/${slug}/unsubscribe`, {
  query: { id: trackingId }
})

// Resubscribe state
const resubscribing = ref(false)
const resubscribed = ref(false)

async function resubscribe() {
  try {
    resubscribing.value = true
    await $fetch(`/api/campaigns/${slug}/resubscribe`, {
      method: 'POST',
      body: { tracking_id: trackingId }
    })
    resubscribed.value = true
  } catch (err: any) {
    console.error('Resubscribe error:', err)
  } finally {
    resubscribing.value = false
  }
}

// Set page title
useHead({
  title: t('campaign.unsubscribe.pageTitle')
})
</script>
