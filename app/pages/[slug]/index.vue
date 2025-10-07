<template>
  <div class="campaign-landing">
    <div v-if="pending" class="loading">
      <div class="spinner"></div>
      <p>Loading campaign...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <h2>Campaign Not Found</h2>
      <p>The campaign you're looking for doesn't exist or is not available.</p>
      <NuxtLink to="/" class="btn-primary">Go Home</NuxtLink>
    </div>

    <div v-else-if="campaign" class="campaign-content">
      <!-- Hero Section -->
      <section class="hero">
        <div class="container">
          <h1 class="campaign-title">{{ campaign.title }}</h1>
          <p class="campaign-description">{{ campaign.description }}</p>
        </div>
      </section>

      <!-- Prayer Fuel Link Section -->
      <section class="prayer-fuel-section">
        <div class="container">
          <div class="card">
            <h2>Today's Prayer</h2>
            <p>Access today's prayer content and prompts</p>
            <NuxtLink
              :to="`/${campaign.slug}/prayer-fuel`"
              class="btn-primary btn-large"
            >
              View Prayer Fuel
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Reminder Signup Section (Placeholder) -->
      <section class="signup-section">
        <div class="container">
          <div class="card">
            <h2>Get Daily Reminders</h2>
            <p class="section-description">
              Sign up to receive daily prayer reminders via email, WhatsApp, or mobile app.
            </p>

            <!-- Placeholder for signup form -->
            <div class="placeholder-box">
              <p class="placeholder-text">Reminder signup form coming soon...</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Mobile App Links Section -->
      <section class="app-links-section">
        <div class="container">
          <div class="card">
            <h2>Get the Mobile App</h2>
            <p class="section-description">
              Download our mobile app for a better prayer experience
            </p>

            <div class="app-buttons">
              <a href="#" class="app-button" aria-label="Download on App Store">
                <div class="app-button-content">
                  <span class="app-button-label">Download on</span>
                  <span class="app-button-store">App Store</span>
                </div>
              </a>
              <a href="#" class="app-button" aria-label="Get it on Google Play">
                <div class="app-button-content">
                  <span class="app-button-label">Get it on</span>
                  <span class="app-button-store">Google Play</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const route = useRoute()
const slug = route.params.slug as string

// Fetch campaign data
const { data, pending, error } = await useFetch(`/api/campaigns/${slug}`)
const campaign = computed(() => data.value?.campaign)

// Set page title
useHead(() => ({
  title: campaign.value ? `${campaign.value.title} - Prayer Tools` : 'Campaign - Prayer Tools'
}))
</script>

<style scoped>
.campaign-landing {
  min-height: calc(100vh - 200px);
}

.loading,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border);
  border-top: 4px solid var(--text);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container h2 {
  margin-bottom: 1rem;
}

.error-container p {
  margin-bottom: 1.5rem;
  color: var(--text-muted, #666);
}

/* Container */
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Hero Section */
.hero {
  padding: 3rem 0 2rem;
  text-align: center;
  border-bottom: 1px solid var(--border);
}

.campaign-title {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.campaign-description {
  font-size: 1.125rem;
  color: var(--text-muted, #666);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Sections */
section {
  padding: 3rem 0;
}

.card {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
}

.card h2 {
  font-size: 1.75rem;
  margin-bottom: 0.75rem;
}

.section-description {
  color: var(--text-muted, #666);
  margin-bottom: 2rem;
  line-height: 1.6;
}

/* Buttons */
.btn-primary {
  display: inline-block;
  background: var(--text);
  color: var(--bg);
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  opacity: 0.85;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

/* Placeholder */
.placeholder-box {
  background: var(--bg);
  border: 2px dashed var(--border);
  border-radius: 8px;
  padding: 3rem 2rem;
  margin-top: 1.5rem;
}

.placeholder-text {
  color: var(--text-muted, #666);
  font-style: italic;
}

/* App Links */
.app-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.app-button {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: var(--text);
  color: var(--bg);
  border-radius: 8px;
  text-decoration: none;
  transition: opacity 0.2s;
  min-width: 180px;
}

.app-button:hover {
  opacity: 0.85;
}

.app-button-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.app-button-label {
  font-size: 0.75rem;
  opacity: 0.9;
}

.app-button-store {
  font-size: 1.125rem;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .campaign-title {
    font-size: 2rem;
  }

  .campaign-description {
    font-size: 1rem;
  }

  .card {
    padding: 1.5rem;
  }

  .card h2 {
    font-size: 1.5rem;
  }

  section {
    padding: 2rem 0;
  }
}
</style>
