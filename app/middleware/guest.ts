export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (process.server) return

  const { user, isLoggedIn, hasRole, checkAuth } = useAuthUser()

  // Fetch user if not already loaded
  if (!user.value) {
    await checkAuth()
  }

  if (isLoggedIn.value) {
    // User is logged in, redirect based on role
    if (hasRole.value) {
      return navigateTo('/admin')
    } else {
      return navigateTo('/admin/pending-approval')
    }
  }
})
