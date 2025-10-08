<template>
  <div class="language-switcher">
    <select v-model="currentLocale" @change="changeLocale" class="language-select">
      <option v-for="locale in availableLocales" :key="locale.code" :value="locale.code">
        {{ locale.name }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const currentLocale = ref(locale.value)
const availableLocales = computed(() => locales.value)

const changeLocale = async () => {
  await setLocale(currentLocale.value)
}
</script>

<style scoped>
.language-switcher {
  display: inline-block;
}

.language-select {
  padding: 0.5rem 1rem;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.language-select:hover {
  background-color: var(--bg-secondary);
}

.language-select:focus {
  outline: none;
  border-color: var(--text-primary);
}
</style>
