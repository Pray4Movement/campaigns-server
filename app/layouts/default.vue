<template>
  <div class="public-layout">
    <header class="header">
      <div class="container">
        <div class="header-content">
          <h1 class="logo">{{ campaignTitle }}</h1>
          <div class="header-actions">
            <div class="language-selector">
              <label for="global-language-select" class="sr-only">{{ $t('language') }}</label>
              <select
                id="global-language-select"
                v-model="selectedLanguage"
                @change="onLanguageChange"
                class="language-select"
              >
                <option v-for="lang in availableLocales" :key="lang.code" :value="lang.code">
                  {{ getLanguageFlag(lang.code) }} {{ lang.name }}
                </option>
              </select>
            </div>
            <button @click="toggleTheme" class="theme-toggle" :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
              {{ isDark ? '☀️' : '🌙' }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <slot />
    </main>

    <footer class="footer">
      <div class="container">
        <p>&copy; {{ currentYear }} Prayer.Tools {{ $t('footer.allRightsReserved') }}</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { getLanguageFlag } from '~/utils/languages'

const currentYear = new Date().getFullYear()
const { locale, setLocale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const router = useRouter()
const { campaignTitle } = useCampaign()
const { toggleTheme, isDark } = useTheme()

const selectedLanguage = ref(locale.value)
const availableLocales = computed(() => locales.value)

// Watch for locale changes to update selected language
watch(locale, (newLang) => {
  selectedLanguage.value = newLang
})

async function onLanguageChange() {
  const newPath = switchLocalePath(selectedLanguage.value)
  await router.push(newPath)
}
</script>

<style scoped>
.public-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--ui-bg);
  color: var(--ui-text);
}

.header {
  background-color: var(--ui-bg-elevated);
  border-bottom: 1px solid var(--ui-border);
  padding: 1rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.logo {
  font-size: 1.5rem;
  margin: 0;
  color: var(--ui-text);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.language-selector {
  flex-shrink: 0;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.language-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  background: var(--ui-bg);
  color: var(--ui-text);
  font-size: 0.875rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.language-select:hover {
  border-color: var(--ui-border-accented);
}

.language-select:focus {
  outline: none;
  border-color: var(--ui-ring);
}

.theme-toggle {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  background: var(--ui-bg);
  color: var(--ui-text);
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
}

.theme-toggle:hover {
  border-color: var(--ui-border-accented);
  background: var(--ui-bg-elevated);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.footer {
  background-color: var(--ui-bg-elevated);
  border-top: 1px solid var(--ui-border);
  padding: 1rem 0;
  text-align: center;
}

.footer p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}
</style>
