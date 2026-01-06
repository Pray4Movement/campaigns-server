<template>
  <div class="min-h-screen flex flex-col bg-default text-default">
    <!-- Header/Navbar -->
    <header class="bg-forest-500 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        <div class="flex justify-between items-center py-4">
          <!-- Logo -->
          <NuxtLink :to="logoLink" class="flex items-center gap-2">
            <span class="text-xl font-bold tracking-wider">{{ config.public.appName }}</span>
          </NuxtLink>

          <!-- Navigation -->
          <div class="flex items-center gap-4 navbar-actions">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>

    <!-- Campaign Title -->
    <div v-if="showCampaignHeader" class="bg-beige-50 dark:bg-elevated py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <h1 class="text-3xl md:text-4xl font-bold uppercase tracking-wide">
          <span class="text-default">{{ campaignTitle }}</span>
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
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <span class="font-bold">{{ config.public.appName }}</span>
          <p class="text-sm text-sage-300">
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
const currentYear = new Date().getFullYear()
const { campaignTitle, showCampaignHeader } = useCampaign()

const logoLink = computed(() => {
  const slug = route.params.slug as string | undefined
  return slug ? `/${slug}` : '/'
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
