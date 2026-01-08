<template>
  <UModal
    v-model:open="isOpen"
    title="Translation Progress"
    :closable="isComplete"
  >
    <template #body>
      <div class="progress-body">
        <!-- Progress Bar -->
        <div class="progress-container">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${progressPercent}%` }"
              :class="{ 'has-errors': stats.failed > 0 }"
            />
          </div>
          <div class="progress-text">
            {{ completedCount }} of {{ stats.total }} translations
          </div>
        </div>

        <!-- Status Breakdown -->
        <div class="status-breakdown">
          <div class="status-item">
            <span class="status-dot pending" />
            <span>Pending: {{ stats.pending }}</span>
          </div>
          <div class="status-item">
            <span class="status-dot processing" />
            <span>Processing: {{ stats.processing }}</span>
          </div>
          <div class="status-item">
            <span class="status-dot completed" />
            <span>Completed: {{ stats.completed }}</span>
          </div>
          <div v-if="stats.failed > 0" class="status-item">
            <span class="status-dot failed" />
            <span>Failed: {{ stats.failed }}</span>
          </div>
          <div v-if="stats.cancelled > 0" class="status-item">
            <span class="status-dot cancelled" />
            <span>Cancelled: {{ stats.cancelled }}</span>
          </div>
        </div>

        <!-- Status Message -->
        <div class="status-message">
          <template v-if="!isComplete">
            <p>Translation in progress. This may take a few minutes...</p>
          </template>
          <template v-else-if="stats.failed > 0">
            <p class="warning">
              Translation completed with {{ stats.failed }} error(s).
            </p>
          </template>
          <template v-else-if="stats.cancelled > 0">
            <p class="info">
              Translation was cancelled. {{ stats.completed }} translation(s) completed.
            </p>
          </template>
          <template v-else>
            <p class="success">
              All translations completed successfully!
            </p>
          </template>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="progress-modal-actions">
        <template v-if="!isComplete">
          <UButton
            @click="handleCancel"
            variant="outline"
            color="error"
            :loading="cancelling"
          >
            {{ cancelling ? 'Cancelling...' : 'Cancel' }}
          </UButton>
        </template>
        <template v-else>
          <UButton @click="handleClose">
            Close
          </UButton>
        </template>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
interface TranslationStats {
  total: number
  pending: number
  processing: number
  completed: number
  failed: number
  cancelled: number
}

interface Props {
  open?: boolean
  batchId: string
}

const props = withDefaults(defineProps<Props>(), {
  open: false
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  close: []
  cancelled: []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const stats = ref<TranslationStats>({
  total: 0,
  pending: 0,
  processing: 0,
  completed: 0,
  failed: 0,
  cancelled: 0
})

const isComplete = ref(false)
const cancelling = ref(false)
const pollInterval = ref<NodeJS.Timeout | null>(null)

const completedCount = computed(() => {
  return stats.value.completed + stats.value.failed + stats.value.cancelled
})

const progressPercent = computed(() => {
  if (stats.value.total === 0) return 0
  return Math.round((completedCount.value / stats.value.total) * 100)
})

// Start polling when modal opens
watch(() => props.open, async (newVal) => {
  if (newVal && props.batchId) {
    isComplete.value = false
    cancelling.value = false
    await fetchStatus()
    startPolling()
  } else {
    stopPolling()
  }
})

// Cleanup on unmount
onUnmounted(() => {
  stopPolling()
})

async function fetchStatus() {
  try {
    const response = await $fetch(`/api/admin/translation-jobs/${props.batchId}/status`)
    stats.value = {
      total: response.total,
      pending: response.pending,
      processing: response.processing,
      completed: response.completed,
      failed: response.failed,
      cancelled: response.cancelled
    }
    isComplete.value = response.isComplete

    if (isComplete.value) {
      stopPolling()
    }
  } catch (error) {
    console.error('Failed to fetch translation status:', error)
  }
}

function startPolling() {
  stopPolling()
  pollInterval.value = setInterval(fetchStatus, 2000)
}

function stopPolling() {
  if (pollInterval.value) {
    clearInterval(pollInterval.value)
    pollInterval.value = null
  }
}

async function handleCancel() {
  cancelling.value = true
  try {
    await $fetch(`/api/admin/translation-jobs/${props.batchId}/cancel`, {
      method: 'POST'
    })
    await fetchStatus()
    emit('cancelled')
  } catch (error) {
    console.error('Failed to cancel translation:', error)
  } finally {
    cancelling.value = false
  }
}

function handleClose() {
  stopPolling()
  emit('close')
  isOpen.value = false
}
</script>

<style scoped>
.progress-body {
  padding: 1.5rem;
}

.progress-container {
  margin-bottom: 1.5rem;
}

.progress-bar {
  height: 8px;
  background: var(--ui-bg-muted);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: var(--ui-color-primary);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill.has-errors {
  background: linear-gradient(90deg, var(--ui-color-primary), var(--ui-color-warning));
}

.progress-text {
  text-align: center;
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}

.status-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--ui-bg-muted);
  border-radius: 0.5rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.pending {
  background: var(--ui-text-muted);
}

.status-dot.processing {
  background: var(--ui-color-info);
  animation: pulse 1s infinite;
}

.status-dot.completed {
  background: var(--ui-color-success);
}

.status-dot.failed {
  background: var(--ui-color-error);
}

.status-dot.cancelled {
  background: var(--ui-color-warning);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-message {
  text-align: center;
}

.status-message p {
  margin: 0;
}

.status-message .warning {
  color: var(--ui-color-warning);
}

.status-message .success {
  color: var(--ui-color-success);
}

.status-message .info {
  color: var(--ui-text-muted);
}

.progress-modal-actions {
  display: flex;
  justify-content: center;
  width: 100%;
}
</style>
