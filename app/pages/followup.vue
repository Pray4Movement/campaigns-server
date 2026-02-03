<template>
  <div class="min-h-[calc(100vh-200px)] py-8 px-4">
    <div v-if="loading" class="flex items-center justify-center min-h-[50vh]">
      <div class="text-center">
        <UIcon name="i-lucide-loader" class="w-10 h-10 animate-spin mb-4" />
        <p>{{ $t('followupPage.recording') }}</p>
      </div>
    </div>

    <div v-else-if="error" class="flex items-center justify-center min-h-[50vh]">
      <UCard class="max-w-md w-full text-center">
        <UIcon name="i-lucide-alert-circle" class="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h1 class="text-2xl font-bold mb-4">{{ $t('followupPage.error.title') }}</h1>
        <p class="text-[var(--ui-text-muted)] mb-6">
          {{ error }}
        </p>
        <UButton :to="localePath('/')">
          {{ $t('followupPage.goHome') }}
        </UButton>
      </UCard>
    </div>

    <!-- Committed Response -->
    <div v-else-if="response === 'committed'" class="flex items-center justify-center min-h-[50vh]">
      <UCard class="max-w-md w-full text-center">
        <UIcon name="i-lucide-heart" class="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h1 class="text-2xl font-bold mb-4">{{ $t('followupPage.committed.title') }}</h1>
        <p class="text-[var(--ui-text-muted)] mb-6">
          {{ $t('followupPage.committed.message') }}
        </p>
        <p class="text-sm text-[var(--ui-text-muted)] mb-6">
          {{ $t('followupPage.committed.checkInNotice') }}
        </p>
        <UButton v-if="campaignSlug" :to="localePath(`/${campaignSlug}`)">
          {{ $t('followupPage.committed.continueButton') }}
        </UButton>
      </UCard>
    </div>

    <!-- Sometimes Response -->
    <div v-else-if="response === 'sometimes'" class="flex items-center justify-center min-h-[50vh]">
      <UCard class="max-w-md w-full text-center">
        <UIcon name="i-lucide-clock" class="w-16 h-16 mx-auto mb-4 text-amber-500" />
        <h1 class="text-2xl font-bold mb-4">{{ $t('followupPage.sometimes.title') }}</h1>
        <p class="text-[var(--ui-text-muted)] mb-6">
          {{ $t('followupPage.sometimes.message') }}
        </p>
        <p class="text-[var(--ui-text-muted)] mb-6">
          {{ $t('followupPage.sometimes.suggestion') }}
        </p>
        <div class="flex flex-col gap-3">
          <UButton v-if="profileId" :to="localePath(`/subscriber?id=${profileId}`)">
            {{ $t('followupPage.sometimes.adjustButton') }}
          </UButton>
          <UButton v-if="campaignSlug" variant="outline" :to="localePath(`/${campaignSlug}`)">
            {{ $t('followupPage.sometimes.continueButton') }}
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Not Praying Response -->
    <div v-else-if="response === 'not_praying'" class="flex items-center justify-center min-h-[50vh]">
      <UCard class="max-w-md w-full text-center">
        <UIcon name="i-lucide-pause-circle" class="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h1 class="text-2xl font-bold mb-4">{{ $t('followupPage.notPraying.title') }}</h1>
        <p class="text-[var(--ui-text-muted)] mb-6">
          {{ $t('followupPage.notPraying.message') }}
        </p>
        <p class="text-[var(--ui-text-muted)] mb-6">
          {{ $t('followupPage.notPraying.reactivateNotice') }}
        </p>
        <div class="flex flex-col gap-3">
          <UButton v-if="profileId" :to="localePath(`/subscriber?id=${profileId}`)">
            {{ $t('followupPage.notPraying.profileButton') }}
          </UButton>
          <UButton v-if="campaignSlug" variant="outline" :to="localePath(`/${campaignSlug}`)">
            {{ $t('followupPage.notPraying.visitButton') }}
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

const { t } = useI18n()
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
    error.value = t('followupPage.error.invalidLink')
    loading.value = false
    return
  }

  const validResponses = ['committed', 'sometimes', 'not_praying']
  if (!validResponses.includes(responseParam)) {
    error.value = t('followupPage.error.invalidResponse')
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
    error.value = err.data?.statusMessage || t('followupPage.error.failed')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  recordResponse()
})

useHead({
  title: t('followupPage.pageTitle')
})
</script>
