<template>
  <div class="min-h-screen flex flex-col bg-default text-default">
    <!-- Header/Navbar -->
    <header class="bg-forest-500 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        <div class="flex justify-between items-center py-4">
          <!-- Logo / Back Navigation -->
          <NuxtLink v-if="isPrayerPage && slug" :to="localePath(`/${slug}`)" class="flex items-center gap-2">
            <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
            <span class="text-xl font-bold tracking-wider">{{ campaignTitle }}</span>
          </NuxtLink>
          <NuxtLink v-else-if="!isCampaignPage" :to="logoLink" class="flex items-center gap-2">
            <span class="text-xl font-bold tracking-wider">{{ config.public.appName }}</span>
          </NuxtLink>
          <div v-else></div>

          <!-- Navigation -->
          <div class="flex items-center gap-4 navbar-actions">
            <a
              v-if="isCampaignPage && !isPrayerPage"
              href="https://doxa.life"
              target="_blank"
              class="inline-flex items-center gap-1"
            >
              <span>Doxa</span>
              <UIcon name="i-lucide-external-link" class="w-4 h-4" />
            </a>
            <LanguageSwitcher />
            <ThemeToggle />
            <template v-if="isHomePage">
              <UButton
                v-if="isLoggedIn"
                to="/admin"
                variant="ghost"
              >
                Admin
              </UButton>
              <UButton
                v-else
                to="/login"
                variant="ghost"
              >
                Sign In
              </UButton>
            </template>
          </div>
        </div>
      </div>
    </header>

    <!-- Campaign Title -->
    <div v-if="shouldShowCampaignHeader" class="bg-beige-50 dark:bg-elevated py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <h1 class="text-3xl md:text-4xl font-bold uppercase tracking-wide">
          <span class="text-default">{{ $t('campaign.header.prayFor', { campaign: campaignTitle }) }}</span>
        </h1>
      </div>
    </div>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-forest-500 text-white py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        <div class="flex flex-col items-center gap-4 md:grid md:grid-cols-3">
          <span class="font-bold md:justify-self-start">{{ config.public.appName }}</span>
          <div class="flex items-center gap-4 text-sm md:justify-self-center">
            <a href="https://doxa.life" target="_blank" class="text-sage-300 hover:text-white transition-colors">About Doxa.Life</a>
            <a href="https://doxa.life/privacy-policy/" target="_blank" class="text-sage-300 hover:text-white transition-colors">Privacy Policy</a>
          </div>
          <p class="text-sm text-sage-300 md:justify-self-end">
            &copy; {{ currentYear }} {{ config.public.appName }}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()
const localePath = useLocalePath()
const currentYear = new Date().getFullYear()
const { campaignTitle, showCampaignHeader } = useCampaign()
const { isLoggedIn, checkAuth } = useAuth()

const slug = computed(() => route.params.slug as string | undefined)

const logoLink = computed(() => {
  return slug.value ? `/${slug.value}` : '/'
})

const isHomePage = computed(() => route.path === '/')

// Show campaign header when on a campaign route and title is set
const isCampaignPage = computed(() => !!slug.value)
const isPrayerPage = computed(() => route.path.includes('/prayer'))
const shouldShowCampaignHeader = computed(() => isCampaignPage.value && showCampaignHeader.value)

onMounted(() => {
  checkAuth()
})
</script>

<style scoped>
.navbar-actions :deep(button) {
  color: white !important;
}
.navbar-actions :deep(button:hover) {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.1) !important;
}
.navbar-actions :deep(svg),
.navbar-actions :deep(.i-lucide-sun),
.navbar-actions :deep(.i-lucide-moon),
.navbar-actions :deep([class*="i-lucide"]) {
  color: white !important;
}
</style>

<style>
/* Language switcher in navbar */
header .language-select {
  background-color: #D1D4CD !important;
  color: #3B463D !important;
  border-color: #D1D4CD !important;
}
header .language-select:hover {
  background-color: #b8bcb3 !important;
}
header .language-select option {
  background-color: #D1D4CD !important;
  color: #3B463D !important;
}
</style>
