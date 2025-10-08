<template>
  <div>
    <p>Welcome to the Prayer Tools admin panel.</p>

    <div class="dashboard-grid">
      <div class="card">
        <h3>Campaigns</h3>
        <p>Manage your prayer campaigns</p>
        <NuxtLink to="/admin/campaigns" class="btn">View Campaigns</NuxtLink>
      </div>

      <div class="card">
        <h3>Users</h3>
        <p>Manage admin users</p>
        <NuxtLink to="/admin/users" class="btn">View Users</NuxtLink>
      </div>

      <div class="card">
        <h3>Roles</h3>
        <p>Manage roles and permissions</p>
        <NuxtLink to="/admin/roles" class="btn">View Roles</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})
</script>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.card {
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
}

.card h3 {
  margin: 0 0 0.5rem;
}

.card p {
  margin: 0 0 1rem;
  color: var(--color-text-muted);
}

.btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  text-decoration: none;
  transition: background-color 0.2s;
}

.btn:hover {
  background-color: var(--color-background-soft);
}
</style>
