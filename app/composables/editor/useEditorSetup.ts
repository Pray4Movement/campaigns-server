/**
 * Editor Setup and Configuration
 * Configures TipTap editor extensions and options
 */

import StarterKit from '@tiptap/starter-kit'
import ImageResize from 'tiptap-extension-resize-image'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Typography from '@tiptap/extension-typography'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Youtube from '@tiptap/extension-youtube'
import { DOMParser } from '@tiptap/pm/model'
import { ImageUploadExtension } from '~/utils/imageUploadExtension'
import { Spacer } from '~/extensions/spacer'
import { Vimeo } from '~/extensions/vimeo'
import { editorConfig } from '~/config/editor.config'
import { uploadImage } from './useImageUpload'
import { useSlashCommands } from './useSlashCommands'
import type { Editor } from '@tiptap/core'

/**
 * Helper to parse content (handles both strings and objects)
 */
export const parseContent = (value: any) => {
  // Default empty document with one paragraph for placeholder
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

  // If value has empty content array, add empty paragraph
  if (value.type === 'doc' && (!value.content || value.content.length === 0)) {
    return emptyDoc
  }

  return value
}

/**
 * Create placeholder configuration
 */
export const createPlaceholderConfig = () => {
  return Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === 'heading') {
        return editorConfig.placeholder.heading
      }
      return editorConfig.placeholder.default
    }
  })
}

/**
 * Create editor extensions array
 *
 * @param onError - Callback for upload errors
 * @param onSuccess - Callback for successful uploads
 * @returns Array of TipTap extensions
 */
export const createEditorExtensions = (
  onError?: (error: Error) => void | Promise<void>,
  onSuccess?: (url: string) => void
) => {
  const { SlashCommand } = useSlashCommands()

  return [
    StarterKit.configure({
      heading: {
        levels: editorConfig.extensions.headingLevels as [1, 2, 3]
      },
      horizontalRule: false,
    }),
    ImageResize.configure({
      inline: false,
    }),
    TaskList,
    TaskItem.configure(editorConfig.extensions.taskItem),
    TextAlign.configure({
      types: [...editorConfig.extensions.textAlignTypes]
    }),
    TextStyle,
    Color,
    Highlight.configure(editorConfig.extensions.highlight),
    Typography,
    Subscript,
    Superscript,
    HorizontalRule,
    Spacer.configure({
      defaultHeight: 24
    }),
    Youtube.configure({
      inline: false,
      width: 640,
      height: 360,
      ccLanguage: 'en',
      interfaceLanguage: 'en',
      allowFullscreen: true,
      autoplay: false,
      controls: true,
      nocookie: true,
      enableIFrameApi: false,
      origin: '',
    }),
    Vimeo.configure({
      inline: false,
      width: 640,
      height: 360,
      allowFullscreen: true,
      autoplay: false,
      byline: true,
      color: '00adef',
      portrait: true,
      title: true,
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
    }),
    createPlaceholderConfig(),
    SlashCommand
  ]
}

/**
 * Normalize pasted HTML to ensure TipTap can parse it correctly.
 * Strips framework-specific attributes and normalizes elements.
 */
const transformPastedHTML = (html: string): string => {
  // Create a temporary container to parse the HTML
  const container = document.createElement('div')
  container.innerHTML = html

  // Remove meta charset tags and other non-content elements
  container.querySelectorAll('meta, style, script, noscript').forEach((el) => el.remove())

  // Remove WordPress spacer blocks
  container.querySelectorAll('.wp-block-spacer, [aria-hidden="true"]').forEach((el) => el.remove())

  // Unwrap section-header divs - extract the heading
  container.querySelectorAll('.section-header').forEach((div) => {
    const heading = div.querySelector('h1, h2, h3, h4, h5, h6')
    if (heading) {
      div.replaceWith(heading)
    }
  })

  // Remove figure wrappers around images, keep just the img
  container.querySelectorAll('figure').forEach((figure) => {
    const img = figure.querySelector('img')
    if (img) {
      figure.replaceWith(img)
    }
  })

  // Convert mark elements to just their text content (or keep if highlight is desired)
  container.querySelectorAll('mark').forEach((mark) => {
    const span = document.createElement('span')
    span.innerHTML = mark.innerHTML
    mark.replaceWith(span)
  })

  // Unwrap WordPress notice/block divs - keep their content
  container.querySelectorAll('.gb-notice-title, .gb-notice-text, .wp-block-genesis-blocks-gb-notice').forEach((div) => {
    const fragment = document.createDocumentFragment()
    while (div.firstChild) {
      fragment.appendChild(div.firstChild)
    }
    div.replaceWith(fragment)
  })

  // Unwrap generic wrapper divs that just contain block content
  container.querySelectorAll('div.wp-block-image, div[class^="wp-block"]').forEach((div) => {
    // Only unwrap if it contains meaningful content
    const hasBlockContent = div.querySelector('p, h1, h2, h3, h4, h5, h6, ul, ol, img, blockquote')
    if (hasBlockContent || div.children.length === 0) {
      const fragment = document.createDocumentFragment()
      while (div.firstChild) {
        fragment.appendChild(div.firstChild)
      }
      div.replaceWith(fragment)
    }
  })

  // Remove framework-specific attributes (Vue, React, Angular, etc.)
  const allElements = container.querySelectorAll('*')
  allElements.forEach((el) => {
    // Get all attributes to check
    const attrsToRemove: string[] = []
    for (const attr of el.attributes) {
      // Remove data-v-*, data-reactid, ng-*, etc.
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

    // Convert span elements with font-weight bold to strong
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

    // Convert b to strong (TipTap prefers strong)
    if (el.tagName === 'B') {
      const strong = document.createElement('strong')
      strong.innerHTML = el.innerHTML
      el.replaceWith(strong)
    }

    // Convert i to em (TipTap prefers em)
    if (el.tagName === 'I' && !el.classList.contains('icon')) {
      const em = document.createElement('em')
      em.innerHTML = el.innerHTML
      el.replaceWith(em)
    }
  })

  // Ensure headings are clean (re-query after potential replacements)
  container.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
    // Remove all classes from headings to ensure they match parseHTML rules
    heading.removeAttribute('class')

    // Convert h4-h6 to h3 since editor only supports h1-h3
    if (['H4', 'H5', 'H6'].includes(heading.tagName)) {
      const h3 = document.createElement('h3')
      h3.innerHTML = heading.innerHTML
      heading.replaceWith(h3)
    }
  })

  // Clean up lists
  container.querySelectorAll('ul, ol, li').forEach((el) => {
    el.removeAttribute('class')
    el.removeAttribute('style')
  })

  // Clean up links - preserve href but remove tracking attributes
  container.querySelectorAll('a').forEach((link) => {
    const href = link.getAttribute('href')
    // Remove all attributes except href
    while (link.attributes.length > 0) {
      link.removeAttribute(link.attributes[0].name)
    }
    if (href) {
      link.setAttribute('href', href)
    }
  })

  // Clean up paragraphs
  container.querySelectorAll('p').forEach((p) => {
    p.removeAttribute('class')
    // Preserve text-align style if present
    const style = p.getAttribute('style')
    if (style && !style.includes('text-align')) {
      p.removeAttribute('style')
    }
  })

  // Remove empty elements that might cause issues
  container.querySelectorAll('span:empty, div:empty').forEach((el) => {
    if (!el.hasChildNodes()) {
      el.remove()
    }
  })

  return container.innerHTML
}

/**
 * Create editor props configuration
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

      // Check if HTML is available
      const html = clipboardData.getData('text/html')
      if (html) {
        // Transform the HTML first
        const cleanedHTML = transformPastedHTML(html)

        // Insert the HTML content
        const { state, dispatch } = view
        const parser = DOMParser.fromSchema(state.schema)
        const container = document.createElement('div')
        container.innerHTML = cleanedHTML

        const slice = parser.parseSlice(container)
        const tr = state.tr.replaceSelection(slice)
        dispatch(tr)

        // Prevent default handling
        return true
      }

      // Fall back to default handling for plain text
      return false
    }
  }
}

/**
 * Custom positioning for drag handle to better align with text
 */
export const getReferencedVirtualElement = (node: any, editor: Editor) => {
  const dom = editor.view.nodeDOM(node.pos) as HTMLElement | null
  if (!dom || !(dom instanceof HTMLElement)) return null

  const rect = dom.getBoundingClientRect()

  // For headings, adjust to align with the text baseline rather than the top
  if (node.node.type.name.startsWith('heading')) {
    const fontSize = parseFloat(getComputedStyle(dom).fontSize)
    const lineHeight = parseFloat(getComputedStyle(dom).lineHeight)
    const offset = (lineHeight - fontSize) / 2

    return {
      getBoundingClientRect: () => ({
        ...rect,
        top: rect.top + offset,
        bottom: rect.bottom - offset,
        height: rect.height - offset * 2
      })
    }
  }

  return null
}

/**
 * Composable for editor setup
 */
export const useEditorSetup = () => {
  return {
    createEditorExtensions,
    createEditorProps,
    parseContent,
    getReferencedVirtualElement,
    config: editorConfig
  }
}
