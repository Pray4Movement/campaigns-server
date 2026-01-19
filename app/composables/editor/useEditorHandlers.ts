/**
 * Custom Editor Handlers for UEditor
 * Provides handlers for text color, highlight, verse, spacer, and vimeo
 */

import type { Editor } from '@tiptap/core'

export interface EditorHandler {
  canExecute: (editor: Editor, item?: any) => boolean
  execute: (editor: Editor, item?: any) => any
  isActive: (editor: Editor, item?: any) => boolean
  isDisabled?: (editor: Editor, item?: any) => boolean
}

/**
 * Text color palette - 9 colors matching BubbleMenu
 */
export const textColors = [
  { name: 'Default', value: null },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#10B981' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' }
] as const

/**
 * Highlight color palette - 9 colors matching BubbleMenu
 */
export const highlightColors = [
  { name: 'None', value: null },
  { name: 'Gray', value: '#F3F4F6' },
  { name: 'Red', value: '#FEE2E2' },
  { name: 'Orange', value: '#FFEDD5' },
  { name: 'Yellow', value: '#FEF3C7' },
  { name: 'Green', value: '#D1FAE5' },
  { name: 'Blue', value: '#DBEAFE' },
  { name: 'Purple', value: '#EDE9FE' },
  { name: 'Pink', value: '#FCE7F3' }
] as const

/**
 * Create text color handler
 */
export function createTextColorHandler(color: string | null): EditorHandler {
  return {
    canExecute: (editor: Editor) => {
      if (color === null) {
        return editor.can().unsetColor()
      }
      return editor.can().setColor(color)
    },
    execute: (editor: Editor) => {
      if (color === null) {
        return editor.chain().focus().unsetColor().run()
      }
      return editor.chain().focus().setColor(color).run()
    },
    isActive: (editor: Editor) => {
      if (color === null) {
        return !editor.getAttributes('textStyle').color
      }
      return editor.getAttributes('textStyle').color === color
    },
    isDisabled: (editor: Editor) => !editor.isEditable
  }
}

/**
 * Create highlight handler
 */
export function createHighlightHandler(color: string | null): EditorHandler {
  return {
    canExecute: (editor: Editor) => {
      if (color === null) {
        return editor.can().unsetHighlight()
      }
      return editor.can().setHighlight({ color })
    },
    execute: (editor: Editor) => {
      if (color === null) {
        return editor.chain().focus().unsetHighlight().run()
      }
      return editor.chain().focus().setHighlight({ color }).run()
    },
    isActive: (editor: Editor) => {
      if (color === null) {
        return !editor.isActive('highlight')
      }
      return editor.isActive('highlight', { color })
    },
    isDisabled: (editor: Editor) => !editor.isEditable
  }
}

/**
 * Verse block handler
 */
export const verseHandler: EditorHandler = {
  canExecute: (editor: Editor) => editor.can().setVerse(),
  execute: (editor: Editor) => editor.chain().focus().setVerse().run(),
  isActive: (editor: Editor) => editor.isActive('verse'),
  isDisabled: (editor: Editor) => !editor.isEditable
}

/**
 * Spacer block handler
 */
export const spacerHandler: EditorHandler = {
  canExecute: (editor: Editor) => editor.can().setSpacer(),
  execute: (editor: Editor) => editor.chain().focus().setSpacer().run(),
  isActive: () => false,
  isDisabled: (editor: Editor) => !editor.isEditable
}

/**
 * Create Vimeo handler with modal callback
 */
export function createVimeoHandler(showModal: (editor: Editor) => Promise<void>): EditorHandler {
  return {
    canExecute: () => true,
    execute: async (editor: Editor) => {
      await showModal(editor)
    },
    isActive: (editor: Editor) => editor.isActive('vimeo'),
    isDisabled: (editor: Editor) => !editor.isEditable
  }
}

/**
 * Composable for editor handlers
 */
export function useEditorHandlers() {
  const { showVideoUrlModal } = useVideoEmbed()

  /**
   * Create all custom handlers for UEditor
   */
  const createCustomHandlers = () => {
    const handlers: Record<string, EditorHandler> = {
      verse: verseHandler,
      spacer: spacerHandler,
      vimeo: createVimeoHandler(showVideoUrlModal)
    }

    // Add text color handlers
    textColors.forEach((color) => {
      const key = color.value ? `textColor_${color.name.toLowerCase()}` : 'textColor_default'
      handlers[key] = createTextColorHandler(color.value)
    })

    // Add highlight handlers
    highlightColors.forEach((color) => {
      const key = color.value ? `highlight_${color.name.toLowerCase()}` : 'highlight_none'
      handlers[key] = createHighlightHandler(color.value)
    })

    return handlers
  }

  return {
    createCustomHandlers,
    createTextColorHandler,
    createHighlightHandler,
    verseHandler,
    spacerHandler,
    createVimeoHandler,
    textColors,
    highlightColors
  }
}
