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
import { ImageUploadExtension } from '~/utils/imageUploadExtension'
import { Spacer } from '~/extensions/spacer'
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
 * Create editor props configuration
 */
export const createEditorProps = () => {
  return {
    attributes: {
      class: 'rich-editor focus:outline-none'
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
