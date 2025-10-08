export const useCampaign = () => {
  const campaignTitle = useState<string>('campaignTitle', () => 'Prayer Tools')

  const setCampaignTitle = (title: string) => {
    campaignTitle.value = title
  }

  const resetCampaignTitle = () => {
    campaignTitle.value = 'Prayer Tools'
  }

  return {
    campaignTitle: readonly(campaignTitle),
    setCampaignTitle,
    resetCampaignTitle
  }
}
