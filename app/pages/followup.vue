<template>
  <div class="min-h-[calc(100vh-200px)] py-8 px-4">
    <div v-if="loading" class="flex items-center justify-center min-h-[50vh]">
      <div class="text-center">
        <UIcon name="i-lucide-loader" class="w-10 h-10 animate-spin mb-4" />
        <p>Recording your response...</p>
      </div>
    </div>

    <div v-else-if="error" class="flex items-center justify-center min-h-[50vh]">
      <UCard class="max-w-md w-full text-center">
        <UIcon name="i-lucide-alert-circle" class="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h1 class="text-2xl font-bold mb-4">Something went wrong</h1>
        <p class="text-[var(--ui-text-muted)] mb-6">
          {{ error }}
        </p>
        <UButton :to="localePath('/')">
          Go Home
        </UButton>
      </UCard>
    </div>

    <!-- Committed Response -->
    <div v-else-if="response === 'committed'" class="flex items-center justify-center min-h-[50vh]">
      <UCard class="max-w-md w-full text-center">
        <UIcon name="i-lucide-heart" class="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h1 class="text-2xl font-bold mb-4">Thank you for your commitment!</h1>
        <p class="text-[var(--ui-text-muted)] mb-6">
          We're so glad to hear that you're staying faithful in prayer. Your dedication is making a difference!
        </p>
        <p class="text-sm text-[var(--ui-text-muted)] mb-6">
          We'll check in again in a few months.
        </p>
        <UButton v-if="campaignSlug" :to="localePath(`/${campaignSlug}`)">
          Continue to Campaign
        </UButton>
      </UCard>
    </div>

    <!-- Sometimes Response -->
    <div v-else-if="response === 'sometimes'" class="flex items-center justify-center min-h-[50vh]">
      <UCard class="max-w-md w-full text-center">
        <UIcon name="i-lucide-clock" class="w-16 h-16 mx-auto mb-4 text-amber-500" />
        <h1 class="text-2xl font-bold mb-4">Thanks for being honest!</h1>
        <p class="text-[var(--ui-text-muted)] mb-6">
          Life can be busy, and it's okay if you haven't been able to pray as often as you'd like.
        </p>
        <p class="text-[var(--ui-text-muted)] mb-6">
          Would you like to adjust your prayer schedule to something more manageable?
        </p>
        <div class="flex flex-col gap-3">
          <UButton v-if="profileId" :to="localePath(`/subscriber?id=${profileId}`)">
            Adjust My Schedule
          </UButton>
          <UButton v-if="campaignSlug" variant="outline" :to="localePath(`/${campaignSlug}`)">
            Continue to Campaign
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Not Praying Response -->
    <div v-else-if="response === 'not_praying'" class="flex items-center justify-center min-h-[50vh]">
      <UCard class="max-w-md w-full text-center">
        <UIcon name="i-lucide-pause-circle" class="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h1 class="text-2xl font-bold mb-4">We understand</h1>
        <p class="text-[var(--ui-text-muted)] mb-6">
          Your subscription has been paused. You won't receive prayer reminders for now.
        </p>
        <p class="text-[var(--ui-text-muted)] mb-6">
          If you'd like to resume praying in the future, you can reactivate your subscription anytime from your profile.
        </p>
        <div class="flex flex-col gap-3">
          <UButton v-if="profileId" :to="localePath(`/subscriber?id=${profileId}`)">
            View My Profile
          </UButton>
          <UButton v-if="campaignSlug" variant="outline" :to="localePath(`/${campaignSlug}`)">
            Visit Campaign
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const route = useRoute()
const localePath = useLocalePath()

const subscriptionId = route.query.sid as string
const responseParam = route.query.response as string

const loading = ref(true)
const error = ref<string | null>(null)
const response = ref<string | null>(null)
const profileId = ref<string | null>(null)
const campaignSlug = ref<string | null>(null)

async function recordResponse() {
  if (!subscriptionId || !responseParam) {
    error.value = 'Invalid link. Missing required parameters.'
    loading.value = false
    return
  }

  const validResponses = ['committed', 'sometimes', 'not_praying']
  if (!validResponses.includes(responseParam)) {
    error.value = 'Invalid response type.'
    loading.value = false
    return
  }

  try {
    const result = await $fetch<{
      success: boolean
      message: string
      profile_id: string
      campaign_slug: string
    }>(`/api/subscriptions/${subscriptionId}/followup-response`, {
      method: 'POST',
      body: { response: responseParam }
    })

    response.value = responseParam
    profileId.value = result.profile_id
    campaignSlug.value = result.campaign_slug
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to record your response. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  recordResponse()
})

useHead({
  title: 'Prayer Check-In'
})
</script>
