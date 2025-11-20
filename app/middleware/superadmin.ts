export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (process.server) return

  const { user, isSuperAdmin, checkAuth } = useAuthUser()

  // Fetch user if not already loaded
  if (!user.value) {
    await checkAuth()
  }

  if (!user.value) {
    return navigateTo('/')
  }

  // Check if user has superadmin flag
  if (!isSuperAdmin.value) {
    // Redirect to admin dashboard if not superadmin
    return navigateTo('/admin')
  }
})
