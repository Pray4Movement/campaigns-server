/**
 * Vimeo Extension for TipTap
 * Based on @tiptap/extension-youtube pattern
 */

import { Node, mergeAttributes } from '@tiptap/core'

export interface VimeoOptions {
  inline: boolean
  width: number
  height: number
  allowFullscreen: boolean
  autoplay: boolean
  byline: boolean
  color: string
  portrait: boolean
  title: boolean
  controls: boolean
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    vimeo: {
      setVimeoVideo: (options: { src: string }) => ReturnType
    }
  }
}

/**
 * Extract Vimeo video ID from various URL formats
 */
const getVimeoVideoId = (url: string): string | null => {
  if (!url) return null

  // Handle various Vimeo URL formats
  const patterns = [
    /(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:[a-zA-Z0-9_\-]+)?/i,
    /vimeo\.com\/(\d+)/i
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

export const Vimeo = Node.create<VimeoOptions>({
  name: 'vimeo',

  addOptions() {
    return {
      inline: false,
      width: 640,
      height: 360,
      allowFullscreen: true,
      autoplay: false,
      byline: true,
      color: '00adef',
      portrait: true,
      title: true,
      controls: true,
      HTMLAttributes: {}
    }
  },

  inline() {
    return this.options.inline
  },

  group() {
    return this.options.inline ? 'inline' : 'block'
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null
      },
      width: {
        default: this.options.width
      },
      height: {
        default: this.options.height
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-vimeo-video]'
      }
    ]
  },

  addCommands() {
    return {
      setVimeoVideo: (options: { src: string }) => ({ commands }) => {
        const videoId = getVimeoVideoId(options.src)

        if (!videoId) {
          return false
        }

        return commands.insertContent({
          type: this.name,
          attrs: {
            src: videoId
          }
        })
      }
    }
  },

  renderHTML({ HTMLAttributes }) {
    const videoId = HTMLAttributes.src

    if (!videoId) {
      return ['div', {}, '']
    }

    const embedUrl = new URL(`https://player.vimeo.com/video/${videoId}`)

    // Add query parameters
    if (this.options.autoplay) embedUrl.searchParams.set('autoplay', '1')
    if (!this.options.byline) embedUrl.searchParams.set('byline', '0')
    if (this.options.color) embedUrl.searchParams.set('color', this.options.color)
    if (!this.options.portrait) embedUrl.searchParams.set('portrait', '0')
    if (!this.options.title) embedUrl.searchParams.set('title', '0')

    return [
      'div',
      mergeAttributes(
        this.options.HTMLAttributes,
        { 'data-vimeo-video': '' },
        HTMLAttributes
      ),
      [
        'iframe',
        {
          src: embedUrl.toString(),
          width: this.options.width,
          height: this.options.height,
          allowfullscreen: this.options.allowFullscreen ? 'true' : 'false',
          allow: 'autoplay; fullscreen; picture-in-picture',
          style: 'border: none;'
        }
      ]
    ]
  }
})
