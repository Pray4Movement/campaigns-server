export function useLanguage() {
  const route = useRoute()
  const router = useRouter()

  // Get current language from query param or localStorage
  const currentLanguage = computed(() => {
    return (route.query.lang as string) || getStoredLanguage() || 'en'
  })

  // Get stored language preference
  function getStoredLanguage(): string | null {
    if (import.meta.client) {
      return localStorage.getItem('preferred_language')
    }
    return null
  }

  // Set language preference
  function setStoredLanguage(lang: string) {
    if (import.meta.client) {
      localStorage.setItem('preferred_language', lang)
    }
  }

  // Change language
  async function changeLanguage(lang: string) {
    setStoredLanguage(lang)

    // Update query param
    await router.push({
      query: {
        ...route.query,
        lang
      }
    })

    // Reload page to apply language change
    if (import.meta.client) {
      window.location.reload()
    }
  }

  return {
    currentLanguage,
    changeLanguage,
    getStoredLanguage,
    setStoredLanguage
  }
}
