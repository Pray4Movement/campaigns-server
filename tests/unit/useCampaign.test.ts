import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetMocks } from './setup'
import { useCampaign } from '~/composables/useCampaign'

// Mock useRuntimeConfig
const mockConfig = {
  public: {
    appName: 'DOXA Prayer'
  }
}
vi.stubGlobal('useRuntimeConfig', () => mockConfig)

describe('useCampaign', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('initial state', () => {
    it('returns app name as default campaign title', () => {
      const { campaignTitle } = useCampaign()
      expect(campaignTitle.value).toBe('DOXA Prayer')
    })

    it('returns false for showCampaignHeader initially', () => {
      const { showCampaignHeader } = useCampaign()
      expect(showCampaignHeader.value).toBe(false)
    })
  })

  describe('setCampaignTitle', () => {
    it('updates the campaign title', () => {
      const { campaignTitle, setCampaignTitle } = useCampaign()

      setCampaignTitle('My Custom Campaign')

      expect(campaignTitle.value).toBe('My Custom Campaign')
    })

    it('sets showCampaignHeader to true', () => {
      const { showCampaignHeader, setCampaignTitle } = useCampaign()

      setCampaignTitle('My Custom Campaign')

      expect(showCampaignHeader.value).toBe(true)
    })
  })

  describe('resetCampaignTitle', () => {
    it('resets title to app name', () => {
      const { campaignTitle, setCampaignTitle, resetCampaignTitle } = useCampaign()

      setCampaignTitle('Custom Title')
      resetCampaignTitle()

      expect(campaignTitle.value).toBe('DOXA Prayer')
    })

    it('sets showCampaignHeader to false', () => {
      const { showCampaignHeader, setCampaignTitle, resetCampaignTitle } = useCampaign()

      setCampaignTitle('Custom Title')
      resetCampaignTitle()

      expect(showCampaignHeader.value).toBe(false)
    })
  })

  describe('state sharing', () => {
    it('shares state between multiple calls', () => {
      const first = useCampaign()
      const second = useCampaign()

      first.setCampaignTitle('Shared Title')

      expect(second.campaignTitle.value).toBe('Shared Title')
    })
  })
})
