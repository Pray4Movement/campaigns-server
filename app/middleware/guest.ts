export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (process.server) return

  try {
    // Check if user is authenticated
    const user = await $fetch('/api/auth/me')

    if (user) {
      // User is already logged in, redirect to admin
      return navigateTo('/admin')
    }
  } catch (error) {
    // Not authenticated, allow access
    // This is expected for guest pages
  }
})
