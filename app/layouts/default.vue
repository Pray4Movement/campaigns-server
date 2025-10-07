<template>
  <div class="public-layout">
    <header class="header">
      <div class="container">
        <h1 class="logo">Prayer Tools</h1>
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
const currentYear = new Date().getFullYear()
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

.logo {
  font-size: 1.5rem;
  margin: 0;
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
