// Global state for auth
const isLoggedIn = ref(false)
const user = ref<{ 
  id: number; 
  email: string; 
  display_name?: string;
  verified?: boolean;
  superadmin?: boolean;
} | null>(null)
let initialized = false

export const useAuth = () => {
  const login = async (email: string, password: string) => {
    try {
      const data = await $fetch<{ success: boolean; user: { id: number; email: string; display_name: string; verified: boolean; superadmin: boolean } }>('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })
      
      if (data.success) {
        isLoggedIn.value = true
        user.value = data.user
        return { success: true }
      }
      
      return { success: false, error: 'Login failed' }
    } catch (error: any) {
      console.error('Login error:', error)
      return { success: false, error: error.data?.message || 'Login failed' }
    }
  }

  const register = async (email: string, password: string, display_name?: string) => {
    try {
      const data = await $fetch<{ 
        success: boolean; 
        requiresVerification?: boolean;
        message?: string;
        user: { id: number; email: string; display_name: string; verified: boolean; superadmin: boolean } 
      }>('/api/auth/register', {
        method: 'POST',
        body: { email, password, display_name }
      })
      
      if (data.success) {
        if (data.requiresVerification) {
          // Don't log in user yet - they need to verify email
          return { 
            success: true, 
            requiresVerification: true,
            message: data.message || 'Please check your email to verify your account.'
          }
        } else {
          // Immediate login (if verification not required)
          isLoggedIn.value = true
          user.value = data.user
          return { success: true }
        }
      }
      
      return { success: false, error: 'Registration failed' }
    } catch (error: any) {
      console.error('Registration error:', error)
      return { success: false, error: error.data?.message || 'Registration failed' }
    }
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST'
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    isLoggedIn.value = false
    user.value = null
  }

  const initAuth = async () => {
    if (!initialized) {
      try {
        const data = await $fetch<{ user: { id: number; email: string; display_name: string } }>('/api/auth/me')
        
        if (data.user) {
          isLoggedIn.value = true
          user.value = data.user
        }
      } catch (error) {
        // User is not authenticated
        isLoggedIn.value = false
        user.value = null
      }
      
      initialized = true
    }
  }

  return {
    isLoggedIn: readonly(isLoggedIn),
    user: readonly(user),
    login,
    register,
    logout,
    initAuth
  }
}