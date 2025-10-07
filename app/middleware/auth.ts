export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (process.server) return

  try {
    // Check if user is authenticated
    const user = await $fetch('/api/auth/me')

    if (!user) {
      return navigateTo('/')
    }
  } catch (error) {
    // Not authenticated, redirect to home
    return navigateTo('/')
  }
})
