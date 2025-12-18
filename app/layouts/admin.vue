<template>
  <div class="admin-layout">
    <nav class="sidebar">
      <div class="sidebar-header">
        <h1 class="logo">{{ config.public.appName || 'Base' }} Admin</h1>
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
          <NuxtLink to="/admin/subscribers" class="nav-link">
            Subscribers
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/admin/marketing" class="nav-link">
            Marketing
          </NuxtLink>
        </li>
        <li v-if="isAdmin">
          <NuxtLink to="/admin/libraries" class="nav-link">
            Libraries
          </NuxtLink>
        </li>
        <li v-if="isAdmin">
          <NuxtLink to="/admin/prayer-fuel-order" class="nav-link">
            Prayer Fuel Order
          </NuxtLink>
        </li>
        <li v-if="isAdmin">
          <NuxtLink to="/admin/people-groups" class="nav-link">
            People Groups
          </NuxtLink>
        </li>
        <li v-if="isAdmin">
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
        <NuxtLink to="/profile" class="user-name-link" v-if="user">
          {{ user.display_name || user.email }}
        </NuxtLink>
        <ThemeToggle />
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
const config = useRuntimeConfig()
const { user, isAdmin, isSuperAdmin, checkAuth } = useAuthUser()

onMounted(async () => {
  // Only fetch if we don't have user data yet
  if (!user.value) {
    try {
      await checkAuth()
    } catch (error) {
      // If not authenticated, redirect to login
      navigateTo('/')
    }
  }
})
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
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-header {
  padding: 1.5rem 1rem;
  border-bottom: 1px solid var(--ui-border);
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.user-name-link {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--ui-text);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: opacity 0.2s;
}

.user-name-link:hover {
  opacity: 0.7;
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
