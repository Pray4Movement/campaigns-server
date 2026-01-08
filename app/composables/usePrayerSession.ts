import type { ComputedRef, Ref } from 'vue'

const ANON_STORAGE_KEY = 'prayertools_anon_id'

function getAnonymousTrackingId(): string {
  if (import.meta.server) return ''
  let anonId = localStorage.getItem(ANON_STORAGE_KEY)
  if (!anonId) {
    anonId = `anon-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem(ANON_STORAGE_KEY, anonId)
  }
  return anonId
}

export function usePrayerSession(slug: string, contentDate: ComputedRef<string> | Ref<string>) {
  const route = useRoute()
  const toast = useToast()
  const { t } = useI18n()

  const trackingId = computed(() => {
    return (route.query.uid as string) || getAnonymousTrackingId()
  })

  const pageOpenTime = ref(Date.now())
  const sessionId = ref(`${Date.now()}-${Math.random().toString(36).substring(2, 9)}`)
  const autoSaveTimeouts = ref<ReturnType<typeof setTimeout>[]>([])
  const autoSaveComplete = ref(false)
  const prayedMarked = ref(false)
  const submitting = ref(false)

  async function autoSavePrayerSession() {
    if (prayedMarked.value || autoSaveComplete.value) return

    try {
      const duration = Math.floor((Date.now() - pageOpenTime.value) / 1000)
      const timestamp = new Date().toISOString()

      await $fetch(`/api/campaigns/${slug}/prayer-session`, {
        method: 'POST',
        body: {
          sessionId: sessionId.value,
          trackingId: trackingId.value || null,
          duration,
          timestamp,
          contentDate: contentDate.value
        }
      })
    } catch (err: any) {
      console.error('Failed to auto-save prayer session:', err)
    }
  }

  function cancelAutoSaveTimeouts() {
    autoSaveTimeouts.value.forEach(timeout => clearTimeout(timeout))
    autoSaveTimeouts.value = []
    autoSaveComplete.value = true
  }

  async function markAsPrayed() {
    if (prayedMarked.value || submitting.value) return

    submitting.value = true
    cancelAutoSaveTimeouts()

    try {
      const MAX_DURATION = 2 * 60 * 60
      const rawDuration = Math.floor((Date.now() - pageOpenTime.value) / 1000)
      const duration = Math.min(rawDuration, MAX_DURATION)
      const timestamp = new Date().toISOString()

      await $fetch(`/api/campaigns/${slug}/prayer-session`, {
        method: 'POST',
        body: {
          sessionId: sessionId.value,
          trackingId: trackingId.value || null,
          duration,
          timestamp,
          contentDate: contentDate.value
        }
      })

      prayedMarked.value = true
    } catch (err: any) {
      console.error('Failed to record prayer:', err)
      toast.add({
        title: 'Error',
        description: t('prayerFuel.error.recordFailed'),
        color: 'error'
      })
    } finally {
      submitting.value = false
    }
  }

  function formatDate(dateString: string, language: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString(language || 'en', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  function setupAutoSave() {
    pageOpenTime.value = Date.now()
    const autoSaveIntervals = [5 * 60 * 1000, 10 * 60 * 1000, 15 * 60 * 1000]

    autoSaveIntervals.forEach((interval) => {
      const timeout = setTimeout(() => {
        autoSavePrayerSession()
      }, interval)
      autoSaveTimeouts.value.push(timeout)
    })
  }

  onMounted(() => {
    setupAutoSave()
  })

  onUnmounted(() => {
    cancelAutoSaveTimeouts()
  })

  return {
    prayedMarked,
    submitting,
    trackingId,
    markAsPrayed,
    formatDate
  }
}
