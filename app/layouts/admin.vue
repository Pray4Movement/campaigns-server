<template>
  <div class="admin-layout">
    <nav class="sidebar">
      <div class="sidebar-header">
        <h1 class="logo">Prayer.Tools Admin</h1>
        <LanguageSwitcher />
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
}

.sidebar {
  width: 250px;
  background-color: var(--color-background-soft);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 1.5rem 1rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.logo {
  font-size: 1.25rem;
  margin: 0;
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
  color: inherit;
  text-decoration: none;
  transition: background-color 0.2s;
}

.nav-link:hover {
  background-color: var(--color-background);
}

.nav-link.router-link-active {
  background-color: var(--color-background);
  border-right: 3px solid var(--text);
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--color-border);
}

.user-info {
  margin-bottom: 1rem;
}

.user-name {
  font-weight: 600;
  margin: 0 0 0.25rem;
  font-size: 0.875rem;
}

.user-email {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.logout-btn {
  width: 100%;
  padding: 0.5rem;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background-color: var(--color-background-soft);
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}
</style>
