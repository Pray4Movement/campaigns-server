/**
 * Verse Extension for TipTap
 * A styled block for scripture or quoted verses
 */

import { Node, mergeAttributes } from '@tiptap/core'

export interface VerseOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    verse: {
      /**
       * Set a verse block
       */
      setVerse: () => ReturnType
      /**
       * Toggle a verse block
       */
      toggleVerse: () => ReturnType
    }
  }
}

export const Verse = Node.create<VerseOptions>({
  name: 'verse',

  group: 'block',

  content: 'block+',

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {}
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="verse"]'
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        {
          'data-type': 'verse'
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      0
    ]
  },

  addCommands() {
    return {
      setVerse: () => ({ commands }) => {
        return commands.wrapIn(this.name)
      },
      toggleVerse: () => ({ commands }) => {
        return commands.toggleWrap(this.name)
      }
    }
  }
})

export default Verse
