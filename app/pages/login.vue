<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Prayer Tools</h1>
      <p class="subtitle">Admin Login</p>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="Enter your email"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="Enter your password"
          />
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true

  try {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    })

    // Redirect to admin dashboard
    navigateTo('/admin')
  } catch (err: any) {
    error.value = err.data?.message || 'Login failed. Please check your credentials.'
  } finally {
    loading.value = false
  }
}

// Check for OAuth errors in URL
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const urlError = urlParams.get('error')

  if (urlError === 'google_auth_failed') {
    error.value = 'Google authentication failed. Please try again.'
  } else if (urlError === 'email_not_verified') {
    error.value = 'Your Google email is not verified.'
  }
})
</script>

<style scoped>
.login-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  position: relative;
}

.theme-toggle {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 1.2rem;
}

.login-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.login-card h1 {
  text-align: center;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.subtitle {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group label {
  font-weight: 500;
  color: var(--text);
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  background: var(--bg);
  color: var(--text);
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: var(--text);
}

.btn-primary {
  padding: 0.75rem;
  background: var(--text);
  color: var(--bg);
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  margin-top: 0.5rem;
  transition: opacity 0.15s;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.8;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-button {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: underline;
  margin-top: 1rem;
  padding: 0;
}

.toggle-button:hover {
  color: var(--text);
}

.error-message {
  color: var(--text);
  text-align: center;
  margin-top: 0.5rem;
  font-weight: 500;
}

.success-message {
  color: var(--text);
  text-align: center;
  margin-top: 0.5rem;
  font-weight: 500;
}

.verification-message {
  text-align: center;
  padding: 2rem 1rem;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.verification-message h3 {
  margin: 0 0 1rem 0;
  color: var(--text);
  font-size: 1.5rem;
}

.verification-message p {
  margin: 0.5rem 0;
  color: var(--text);
  line-height: 1.5;
}

.verification-note {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 1.5rem 0 2rem 0 !important;
}

.close-message-button {
  background: var(--text);
  color: var(--bg);
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  margin-top: 1rem;
}

.close-message-button:hover {
  background: var(--text-muted);
}
</style>