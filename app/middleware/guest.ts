export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (process.server) return

  const { user, isLoggedIn, checkAuth } = useAuthUser()

  // Fetch user if not already loaded
  if (!user.value) {
    await checkAuth()
  }

  if (isLoggedIn.value) {
    // User is already logged in, redirect to admin
    return navigateTo('/admin')
  }
})
