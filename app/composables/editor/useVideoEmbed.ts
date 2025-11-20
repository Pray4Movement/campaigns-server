/**
 * Video Embed Composable
 * Handles video URL input and embedding for YouTube and Vimeo
 */

export const useVideoEmbed = () => {
  // Call useModal at the top level during setup
  const { showPrompt, showError } = useModal()

  /**
   * Detect video platform from URL
   */
  const detectVideoPlatform = (url: string): 'youtube' | 'vimeo' | null => {
    if (!url) return null

    const urlLower = url.toLowerCase()

    // Check for YouTube
    if (
      urlLower.includes('youtube.com') ||
      urlLower.includes('youtu.be') ||
      urlLower.includes('youtube-nocookie.com')
    ) {
      return 'youtube'
    }

    // Check for Vimeo
    if (urlLower.includes('vimeo.com')) {
      return 'vimeo'
    }

    return null
  }

  /**
   * Show video URL input modal and embed the video
   */
  const showVideoUrlModal = async (editor: any): Promise<boolean> => {
    try {
      const url = await showPrompt({
        title: 'Embed Video',
        message: 'Enter a YouTube or Vimeo video URL:',
        placeholder: 'https://www.youtube.com/watch?v=...',
        confirmText: 'Embed',
        cancelText: 'Cancel'
      })

      if (!url || url.trim() === '') {
        return false
      }

      const trimmedUrl = url.trim()
      const platform = detectVideoPlatform(trimmedUrl)

      if (!platform) {
        await showError('Invalid URL: Please enter a valid YouTube or Vimeo URL.')
        return false
      }

      // Embed the video based on platform
      if (platform === 'youtube') {
        editor.chain().focus().setYoutubeVideo({ src: trimmedUrl }).run()
      } else if (platform === 'vimeo') {
        editor.chain().focus().setVimeoVideo({ src: trimmedUrl }).run()
      }

      return true
    } catch (error) {
      // User cancelled
      return false
    }
  }

  return {
    detectVideoPlatform,
    showVideoUrlModal
  }
}
