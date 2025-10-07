<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <div class="header-content">
        <h1>Dashboard</h1>
        <div class="header-actions">
          <span class="user-info">Welcome, {{ user?.display_name || user?.email }}</span>
          <button class="theme-toggle" @click="toggleTheme">
            {{ theme === 'light' ? '🌙' : '☀️' }}
          </button>
          <button class="logout-button" @click="handleLogout">
            Logout
          </button>
        </div>
      </div>
    </header>

    <main class="dashboard-main">
      <div class="dashboard-grid">
        <div class="dashboard-card">
          <h3>Welcome Back!</h3>
          <p>You are successfully logged in to your dashboard.</p>
        </div>
        
        <div class="dashboard-card">
          <h3>Account Info</h3>
          <p><strong>Name:</strong> {{ user?.display_name || 'Not set' }}</p>
          <p><strong>Email:</strong> {{ user?.email }}</p>
          <p><strong>Status:</strong> {{ user?.verified ? 'Verified' : 'Unverified' }}</p>
          <p v-if="user?.superadmin"><strong>Role:</strong> Super Admin</p>
        </div>
        
        <div class="dashboard-card">
          <h3>Quick Actions</h3>
          <button class="action-button">View Profile</button>
          <button class="action-button">Settings</button>
          <button class="action-button">Help</button>
        </div>
        
        <div class="dashboard-card">
          <h3>Recent Activity</h3>
          <p>No recent activity to display.</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
const { theme, toggleTheme, initTheme } = useTheme()
const { logout, user, isLoggedIn } = useAuth()
const router = useRouter()

const handleLogout = async () => {
  await logout()
  await router.push('/login')
}

// Redirect if not logged in (with a delay to avoid race conditions)
watchEffect(() => {
  if (!isLoggedIn.value) {
    nextTick(() => {
      router.push('/login')
    })
  }
})

onMounted(() => {
  initTheme()
})
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
}

.dashboard-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 1rem 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  margin: 0;
  color: var(--text);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.theme-toggle, .logout-button {
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.theme-toggle {
  padding: 0.5rem;
  font-size: 1.2rem;
}

.logout-button:hover, .theme-toggle:hover {
  background: var(--bg-hover);
}

.dashboard-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.dashboard-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.dashboard-card h3 {
  margin: 0 0 1rem 0;
  color: var(--text);
  font-size: 1.25rem;
}

.dashboard-card p {
  margin: 0.5rem 0;
  color: var(--text-muted);
  line-height: 1.5;
}

.action-button {
  background: var(--text);
  color: var(--bg);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.9rem;
  margin: 0.25rem 0.5rem 0.25rem 0;
}

.action-button:hover {
  background: var(--text-muted);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .header-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>