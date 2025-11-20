export const useCampaign = () => {
  const config = useRuntimeConfig()
  const appName = config.public.appName || 'Base'

  const campaignTitle = useState<string>('campaignTitle', () => appName)

  const setCampaignTitle = (title: string) => {
    campaignTitle.value = title
  }

  const resetCampaignTitle = () => {
    campaignTitle.value = appName
  }

  return {
    campaignTitle: readonly(campaignTitle),
    setCampaignTitle,
    resetCampaignTitle
  }
}
