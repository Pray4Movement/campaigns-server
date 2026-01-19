/**
 * Editor Setup and Configuration
 * Provides utilities and configuration for the TipTap/UEditor
 */

import ImageResize from 'tiptap-extension-resize-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Typography from '@tiptap/extension-typography'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Youtube from '@tiptap/extension-youtube'
import { DOMParser } from '@tiptap/pm/model'
import { ImageUploadExtension } from '~/utils/imageUploadExtension'
import { Spacer } from '~/extensions/spacer'
import { Vimeo } from '~/extensions/vimeo'
import { Verse } from '~/extensions/verse'
import { editorConfig } from '~/config/editor.config'
import { uploadImage } from './useImageUpload'

/**
 * Helper to parse content (handles both strings and objects)
 */
export const parseContent = (value: any) => {
  const emptyDoc = {
    type: 'doc',
    content: [
      {
        type: 'paragraph'
      }
    ]
  }

  if (!value) return emptyDoc
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return emptyDoc
    }
  }

  if (value.type === 'doc' && (!value.content || value.content.length === 0)) {
    return emptyDoc
  }

  return value
}

/**
 * Create custom extensions array for UEditor
 *
 * @param onError - Callback for upload errors
 * @param onSuccess - Callback for successful uploads
 * @returns Array of TipTap extensions
 */
export const createCustomExtensions = (
  onError?: (error: Error) => void | Promise<void>,
  onSuccess?: (url: string) => void
) => {
  return [
    ImageResize.configure({ inline: false }),
    TaskList,
    TaskItem.configure({ nested: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    Typography,
    Subscript,
    Superscript,
    Spacer.configure({ defaultHeight: 24 }),
    Verse,
    Youtube.configure({
      inline: false,
      width: 640,
      height: 360,
      allowFullscreen: true,
      autoplay: false,
      controls: true,
      nocookie: true
    }),
    Vimeo.configure({
      inline: false,
      width: 640,
      height: 360,
      allowFullscreen: true,
      autoplay: false,
      controls: true
    }),
    ImageUploadExtension.configure({
      type: 'imageResize',
      accept: editorConfig.upload.image.accept,
      limit: editorConfig.upload.image.limit,
      maxSize: editorConfig.upload.image.maxSize,
      upload: uploadImage,
      onError: onError || ((error) => {
        console.error('Upload error:', error)
      }),
      onSuccess: onSuccess || ((url) => {
        console.log('Upload successful:', url)
      })
    })
  ]
}

/**
 * Normalize pasted HTML to ensure TipTap can parse it correctly.
 * Strips framework-specific attributes and normalizes elements.
 */
const transformPastedHTML = (html: string): string => {
  const container = document.createElement('div')
  container.innerHTML = html

  container.querySelectorAll('meta, style, script, noscript').forEach((el) => el.remove())

  container.querySelectorAll('.wp-block-spacer, [aria-hidden="true"]').forEach((el) => el.remove())

  container.querySelectorAll('.section-header').forEach((div) => {
    const heading = div.querySelector('h1, h2, h3, h4, h5, h6')
    if (heading) {
      div.replaceWith(heading)
    }
  })

  container.querySelectorAll('figure').forEach((figure) => {
    const img = figure.querySelector('img')
    if (img) {
      figure.replaceWith(img)
    }
  })

  container.querySelectorAll('mark').forEach((mark) => {
    const span = document.createElement('span')
    span.innerHTML = mark.innerHTML
    mark.replaceWith(span)
  })

  container.querySelectorAll('.gb-notice-title, .gb-notice-text, .wp-block-genesis-blocks-gb-notice').forEach((div) => {
    const fragment = document.createDocumentFragment()
    while (div.firstChild) {
      fragment.appendChild(div.firstChild)
    }
    div.replaceWith(fragment)
  })

  container.querySelectorAll('div.wp-block-image, div[class^="wp-block"]').forEach((div) => {
    const hasBlockContent = div.querySelector('p, h1, h2, h3, h4, h5, h6, ul, ol, img, blockquote')
    if (hasBlockContent || div.children.length === 0) {
      const fragment = document.createDocumentFragment()
      while (div.firstChild) {
        fragment.appendChild(div.firstChild)
      }
      div.replaceWith(fragment)
    }
  })

  const allElements = container.querySelectorAll('*')
  allElements.forEach((el) => {
    const attrsToRemove: string[] = []
    for (const attr of el.attributes) {
      if (
        attr.name.startsWith('data-v-') ||
        attr.name.startsWith('data-react') ||
        attr.name.startsWith('data-ng-') ||
        attr.name.startsWith('ng-') ||
        attr.name.startsWith('_ngcontent') ||
        attr.name.startsWith('_nghost')
      ) {
        attrsToRemove.push(attr.name)
      }
    }
    attrsToRemove.forEach((attr) => el.removeAttribute(attr))

    if (el.tagName === 'SPAN') {
      const style = (el as HTMLElement).style
      if (style.fontWeight === 'bold' || style.fontWeight === '700' || style.fontWeight === '600') {
        const strong = document.createElement('strong')
        strong.innerHTML = el.innerHTML
        el.replaceWith(strong)
      } else if (style.fontStyle === 'italic') {
        const em = document.createElement('em')
        em.innerHTML = el.innerHTML
        el.replaceWith(em)
      }
    }

    if (el.tagName === 'B') {
      const strong = document.createElement('strong')
      strong.innerHTML = el.innerHTML
      el.replaceWith(strong)
    }

    if (el.tagName === 'I' && !el.classList.contains('icon')) {
      const em = document.createElement('em')
      em.innerHTML = el.innerHTML
      el.replaceWith(em)
    }
  })

  container.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
    heading.removeAttribute('class')

    if (['H4', 'H5', 'H6'].includes(heading.tagName)) {
      const h3 = document.createElement('h3')
      h3.innerHTML = heading.innerHTML
      heading.replaceWith(h3)
    }
  })

  container.querySelectorAll('ul, ol, li').forEach((el) => {
    el.removeAttribute('class')
    el.removeAttribute('style')
  })

  container.querySelectorAll('a').forEach((link) => {
    const href = link.getAttribute('href')
    while (link.attributes.length > 0) {
      const attr = link.attributes[0]
      if (attr) link.removeAttribute(attr.name)
    }
    if (href) {
      link.setAttribute('href', href)
    }
  })

  container.querySelectorAll('p').forEach((p) => {
    p.removeAttribute('class')
    const style = p.getAttribute('style')
    if (style && !style.includes('text-align')) {
      p.removeAttribute('style')
    }
  })

  container.querySelectorAll('span:empty, div:empty').forEach((el) => {
    if (!el.hasChildNodes()) {
      el.remove()
    }
  })

  return container.innerHTML
}

/**
 * Create editor props configuration for paste handling
 */
export const createEditorProps = () => {
  return {
    attributes: {
      class: 'rich-editor focus:outline-none'
    },
    transformPastedHTML,
    handlePaste(view: any, event: ClipboardEvent) {
      const clipboardData = event.clipboardData
      if (!clipboardData) return false

      const html = clipboardData.getData('text/html')
      if (html) {
        const cleanedHTML = transformPastedHTML(html)

        const { state, dispatch } = view
        const parser = DOMParser.fromSchema(state.schema)
        const container = document.createElement('div')
        container.innerHTML = cleanedHTML

        const slice = parser.parseSlice(container)
        const tr = state.tr.replaceSelection(slice)
        dispatch(tr)

        return true
      }

      return false
    }
  }
}

/**
 * Composable for editor setup
 */
export const useEditorSetup = () => {
  return {
    createCustomExtensions,
    createEditorProps,
    parseContent,
    config: editorConfig
  }
}
