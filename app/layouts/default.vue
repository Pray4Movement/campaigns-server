<template>
  <div class="public-layout">
    <header class="header">
      <div class="container">
        <div class="header-content">
          <h1 class="logo">Prayer Tools</h1>
          <div class="language-selector">
            <label for="global-language-select" class="sr-only">Select Language</label>
            <select
              id="global-language-select"
              v-model="selectedLanguage"
              @change="onLanguageChange"
              class="language-select"
            >
              <option v-for="lang in LANGUAGES" :key="lang.code" :value="lang.code">
                {{ lang.flag }} {{ lang.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <slot />
    </main>

    <footer class="footer">
      <div class="container">
        <p>&copy; {{ currentYear }} Prayer Tools. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { LANGUAGES } from '~/utils/languages'

const currentYear = new Date().getFullYear()
const { currentLanguage, changeLanguage } = useLanguage()

const selectedLanguage = ref(currentLanguage.value)

// Watch for route changes to update selected language
watch(currentLanguage, (newLang) => {
  selectedLanguage.value = newLang
})

async function onLanguageChange() {
  await changeLanguage(selectedLanguage.value)
}
</script>

<style scoped>
.public-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
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
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.875rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.language-select:hover {
  border-color: var(--color-text-muted);
}

.language-select:focus {
  outline: none;
  border-color: var(--color-text);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.footer {
  background-color: var(--color-background-soft);
  border-top: 1px solid var(--color-border);
  padding: 1rem 0;
  text-align: center;
}

.footer p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
</style>
