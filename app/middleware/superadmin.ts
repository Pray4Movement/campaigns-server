export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (process.server) return

  try {
    // Check if user is authenticated
    const response = await $fetch('/api/auth/me')
    const user = response?.user

    if (!user) {
      return navigateTo('/')
    }

    // Check if user has superadmin flag
    if (!user.isSuperAdmin) {
      // Redirect to admin dashboard if not superadmin
      return navigateTo('/admin')
    }
  } catch (error) {
    // Not authenticated, redirect to home
    return navigateTo('/')
  }
})
