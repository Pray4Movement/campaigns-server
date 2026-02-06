import { vi } from 'vitest'
import { ref, computed, readonly } from 'vue'

// Shared mock state
export const mockState: Record<string, any> = {}
export const mockRoute = { query: {} as Record<string, string>, params: {} as Record<string, string> }
export const mockRouter = { push: vi.fn(), replace: vi.fn() }
export const mockNavigateTo = vi.fn()
export const mockColorMode = {
  value: 'light' as string,
  preference: 'light' as string
}

// Reset function
export function resetMocks() {
  Object.keys(mockState).forEach(key => delete mockState[key])
  mockRoute.query = {}
  mockRoute.params = {}
  mockRouter.push.mockClear()
  mockRouter.replace.mockClear()
  mockNavigateTo.mockClear()
  mockColorMode.value = 'light'
  mockColorMode.preference = 'light'
}

// Stub Nuxt auto-imports as globals
vi.stubGlobal('useState', (key: string, init: () => any) => {
  if (!(key in mockState)) {
    mockState[key] = ref(init())
  }
  return mockState[key]
})

vi.stubGlobal('useRoute', () => mockRoute)
vi.stubGlobal('useRouter', () => mockRouter)
vi.stubGlobal('navigateTo', mockNavigateTo)
vi.stubGlobal('useColorMode', () => mockColorMode)
vi.stubGlobal('computed', computed)
vi.stubGlobal('readonly', readonly)
vi.stubGlobal('ref', ref)

// Stub i18n
vi.stubGlobal('useI18n', () => ({
  t: (key: string) => key,
  locale: ref('en'),
}))

vi.stubGlobal('useLocalePath', () => (path: string) => path)
