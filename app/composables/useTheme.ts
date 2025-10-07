export const useTheme = () => {
  const theme = ref('light')

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    updateTheme()
  }

  const updateTheme = () => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme.value)
      localStorage.setItem('theme', theme.value)
    }
  }

  const initTheme = () => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      
      theme.value = savedTheme || (prefersDark ? 'dark' : 'light')
      updateTheme()
    }
  }

  return {
    theme: readonly(theme),
    toggleTheme,
    initTheme
  }
}