import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetMocks } from './setup'
import { usePeopleGroup } from '~/composables/usePeopleGroup'

// Mock useRuntimeConfig
const mockConfig = {
  public: {
    appName: 'DOXA Prayer'
  }
}
vi.stubGlobal('useRuntimeConfig', () => mockConfig)

describe('usePeopleGroup', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('initial state', () => {
    it('returns app name as default people group title', () => {
      const { peopleGroupTitle } = usePeopleGroup()
      expect(peopleGroupTitle.value).toBe('DOXA Prayer')
    })

    it('returns false for showPeopleGroupHeader initially', () => {
      const { showPeopleGroupHeader } = usePeopleGroup()
      expect(showPeopleGroupHeader.value).toBe(false)
    })
  })

  describe('setPeopleGroupTitle', () => {
    it('updates the people group title', () => {
      const { peopleGroupTitle, setPeopleGroupTitle } = usePeopleGroup()

      setPeopleGroupTitle('My People Group')

      expect(peopleGroupTitle.value).toBe('My People Group')
    })

    it('sets showPeopleGroupHeader to true', () => {
      const { showPeopleGroupHeader, setPeopleGroupTitle } = usePeopleGroup()

      setPeopleGroupTitle('My People Group')

      expect(showPeopleGroupHeader.value).toBe(true)
    })
  })

  describe('resetPeopleGroupTitle', () => {
    it('resets title to app name', () => {
      const { peopleGroupTitle, setPeopleGroupTitle, resetPeopleGroupTitle } = usePeopleGroup()

      setPeopleGroupTitle('Custom Title')
      resetPeopleGroupTitle()

      expect(peopleGroupTitle.value).toBe('DOXA Prayer')
    })

    it('sets showPeopleGroupHeader to false', () => {
      const { showPeopleGroupHeader, setPeopleGroupTitle, resetPeopleGroupTitle } = usePeopleGroup()

      setPeopleGroupTitle('Custom Title')
      resetPeopleGroupTitle()

      expect(showPeopleGroupHeader.value).toBe(false)
    })
  })

  describe('state sharing', () => {
    it('shares state between multiple calls', () => {
      const first = usePeopleGroup()
      const second = usePeopleGroup()

      first.setPeopleGroupTitle('Shared Title')

      expect(second.peopleGroupTitle.value).toBe('Shared Title')
    })
  })
})
