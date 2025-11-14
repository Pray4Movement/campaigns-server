<template>
  <div class="admin-layout">
    <nav class="sidebar">
      <div class="sidebar-header">
        <h1 class="logo">Prayer.Tools Admin</h1>
      </div>

      <ul class="nav-menu">
        <li>
          <NuxtLink to="/admin" class="nav-link">
            Dashboard
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/admin/campaigns" class="nav-link">
            Campaigns
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/admin/users" class="nav-link">
            Users
          </NuxtLink>
        </li>
        <li v-if="isSuperAdmin">
          <NuxtLink to="/superadmin" class="nav-link">
            Superadmin
          </NuxtLink>
        </li>
      </ul>

      <div class="sidebar-footer">
        <button @click="toggleTheme" class="theme-toggle" :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
          {{ isDark ? '☀️' : '🌙' }} {{ isDark ? 'Light' : 'Dark' }}
        </button>
        <div class="user-info" v-if="user">
          <p class="user-name">{{ user.display_name || user.email }}</p>
          <p class="user-email">{{ user.email }}</p>
        </div>
        <button @click="logout" class="logout-btn">Logout</button>
      </div>
    </nav>

    <div class="main-wrapper">
      <main class="main-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const { toggleTheme, isDark } = useTheme()

const user = ref<any>(null)
const isSuperAdmin = computed(() => {
  return user.value?.user?.isSuperAdmin || false
})

onMounted(async () => {
  try {
    const response = await $fetch('/api/auth/me')
    user.value = response
  } catch (error) {
    // If not authenticated, redirect to login
    navigateTo('/')
  }
})

async function logout() {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    navigateTo('/')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--ui-bg);
  color: var(--ui-text);
}

.sidebar {
  width: 250px;
  background-color: var(--ui-bg-elevated);
  border-right: 1px solid var(--ui-border);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 1.5rem 1rem;
  border-bottom: 1px solid var(--ui-border);
}

.logo {
  font-size: 1.25rem;
  margin: 0;
  color: var(--ui-text);
}

.nav-menu {
  list-style: none;
  padding: 1rem 0;
  margin: 0;
  flex: 1;
}

.nav-menu li {
  margin: 0;
}

.nav-link {
  display: block;
  padding: 0.75rem 1rem;
  color: var(--ui-text);
  text-decoration: none;
  transition: background-color 0.2s;
}

.nav-link:hover {
  background-color: var(--ui-bg);
}

.nav-link.router-link-active {
  background-color: var(--ui-bg);
  border-right: 3px solid var(--ui-text);
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--ui-border);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.theme-toggle {
  width: 100%;
  padding: 0.5rem;
  background-color: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: 4px;
  color: var(--ui-text);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.theme-toggle:hover {
  border-color: var(--ui-border-accented);
  background-color: var(--ui-bg-accented);
}

.user-info {
  padding: 0.5rem 0;
}

.user-name {
  font-weight: 600;
  margin: 0 0 0.25rem;
  font-size: 0.875rem;
  color: var(--ui-text);
}

.user-email {
  margin: 0;
  font-size: 0.75rem;
  color: var(--ui-text-muted);
}

.logout-btn {
  width: 100%;
  padding: 0.5rem;
  background-color: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: 4px;
  color: var(--ui-text);
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  border-color: var(--ui-border-accented);
  background-color: var(--ui-bg-accented);
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--ui-bg);
}

.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}
</style>
