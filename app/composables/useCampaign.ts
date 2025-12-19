export const useCampaign = () => {
  const config = useRuntimeConfig()
  const appName = config.public.appName || 'Base'

  const campaignTitle = useState<string>('campaignTitle', () => appName)
  const showCampaignHeader = useState<boolean>('showCampaignHeader', () => false)

  const setCampaignTitle = (title: string) => {
    campaignTitle.value = title
    showCampaignHeader.value = true
  }

  const resetCampaignTitle = () => {
    campaignTitle.value = appName
    showCampaignHeader.value = false
  }

  return {
    campaignTitle: readonly(campaignTitle),
    showCampaignHeader: readonly(showCampaignHeader),
    setCampaignTitle,
    resetCampaignTitle
  }
}
