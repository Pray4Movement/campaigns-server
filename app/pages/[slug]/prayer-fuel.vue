<template>
  <div class="prayer-fuel-page">
    <div v-if="pending" class="loading">
      <div class="spinner"></div>
      <p>Loading today's prayer...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <h2>Unable to Load Prayer</h2>
      <p>{{ error }}</p>
      <NuxtLink :to="`/${slug}`" class="btn-primary">Back to Campaign</NuxtLink>
    </div>

    <div v-else-if="data" class="prayer-fuel-content">
      <!-- Campaign Header -->
      <header class="prayer-header">
        <div class="container">
          <NuxtLink :to="`/${slug}`" class="back-link">← Back to {{ data.campaign.title }}</NuxtLink>
          <h1 class="page-title">Today's Prayer</h1>
          <p class="prayer-date">{{ formatDate(data.date) }}</p>
        </div>
      </header>

      <!-- Content or No Content Message -->
      <main class="prayer-main">
        <div class="container">
          <div v-if="data.content" class="prayer-content-wrapper">
            <h2 class="content-title">{{ data.content.title }}</h2>
            <PrayerContentRenderer :content="data.content.content_json" />
          </div>

          <div v-else class="no-content">
            <div class="no-content-icon">📖</div>
            <h2>No Prayer Content Today</h2>
            <p>{{ data.message || 'Check back tomorrow for new prayer content.' }}</p>
          </div>
        </div>
      </main>

      <!-- I Prayed Button (only show if content exists) -->
      <footer v-if="data.content" class="prayer-footer">
        <div class="container">
          <button
            @click="markAsPrayed"
            :disabled="prayedMarked || submitting"
            class="btn-prayed"
          >
            {{ prayedMarked ? '✓ Prayer Recorded' : submitting ? 'Recording...' : 'I Prayed' }}
          </button>
          <p v-if="prayedMarked" class="prayed-message">
            Thank you for praying! Your prayer has been recorded.
          </p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const route = useRoute()
const slug = route.params.slug as string

// Get tracking ID from URL if present (from email/WhatsApp links)
const trackingId = route.query.uid as string | undefined

// Track page open time for duration calculation
const pageOpenTime = ref(Date.now())

// Get current date in user's timezone
const currentDate = new Date().toISOString()

// Fetch prayer content
const { data, pending, error: fetchError } = await useFetch(`/api/campaigns/${slug}/prayer-fuel`, {
  query: {
    userDate: currentDate
  }
})

const error = computed(() => fetchError.value?.message || null)

// Prayer tracking state
const prayedMarked = ref(false)
const submitting = ref(false)

// Format date for display
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Mark as prayed
async function markAsPrayed() {
  if (prayedMarked.value || submitting.value) return

  submitting.value = true

  try {
    // Calculate duration (time spent on page)
    const duration = Math.floor((Date.now() - pageOpenTime.value) / 1000) // in seconds
    const timestamp = new Date().toISOString()

    await $fetch(`/api/campaigns/${slug}/prayed`, {
      method: 'POST',
      body: {
        userId: trackingId || null,
        duration,
        timestamp
      }
    })

    prayedMarked.value = true
  } catch (err: any) {
    console.error('Failed to record prayer:', err)
    alert('Failed to record prayer. Please try again.')
  } finally {
    submitting.value = false
  }
}

// Set page title
useHead(() => ({
  title: data.value?.content
    ? `${data.value.content.title} - ${data.value.campaign.title}`
    : `Prayer Fuel - ${data.value?.campaign.title || 'Loading...'}`
}))

// Update page open time when component mounts
onMounted(() => {
  pageOpenTime.value = Date.now()
})
</script>

<style scoped>
.prayer-fuel-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Header */
.prayer-header {
  border-bottom: 1px solid var(--border);
  padding: 2rem 0 1.5rem;
}

.back-link {
  display: inline-block;
  color: var(--text-muted, #666);
  text-decoration: none;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--text);
}

.page-title {
  font-size: 2rem;
  font-weight: bold;
  margin: 0 0 0.5rem;
}

.prayer-date {
  color: var(--text-muted, #666);
  margin: 0;
  font-size: 1rem;
}

/* Main Content */
.prayer-main {
  flex: 1;
  padding: 2rem 0;
}

.content-title {
  font-size: 1.75rem;
  font-weight: bold;
  margin-bottom: 2rem;
  text-align: center;
}

/* No Content */
.no-content {
  text-align: center;
  padding: 4rem 2rem;
}

.no-content-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.no-content h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.no-content p {
  color: var(--text-muted, #666);
  font-size: 1.125rem;
}

/* Footer with Button */
.prayer-footer {
  border-top: 1px solid var(--border);
  padding: 2rem 0;
  background: var(--bg-soft);
  text-align: center;
}

.btn-prayed {
  background: var(--text);
  color: var(--bg);
  border: none;
  padding: 1rem 3rem;
  border-radius: 8px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  min-width: 200px;
}

.btn-prayed:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-prayed:active:not(:disabled) {
  transform: translateY(0);
}

.btn-prayed:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.prayed-message {
  margin-top: 1rem;
  color: var(--text-muted, #666);
  font-size: 0.875rem;
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

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }

  .content-title {
    font-size: 1.5rem;
  }

  .btn-prayed {
    width: 100%;
    max-width: 100%;
  }

  .prayer-header,
  .prayer-main,
  .prayer-footer {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
