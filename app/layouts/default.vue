<template>
  <div class="public-layout">
    <header class="header">
      <div class="container">
        <div class="header-content">
          <h1 class="logo">{{ campaignTitle }}</h1>
          <div class="header-actions">
            <LanguageSwitcher />
            <ThemeToggle />
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
const currentYear = new Date().getFullYear()
const { campaignTitle } = useCampaign()
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
