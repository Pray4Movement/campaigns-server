/**
 * Spacer Extension for TipTap
 * Adds vertical spacing between blocks
 */

import { Node, mergeAttributes } from '@tiptap/core'

export interface SpacerOptions {
  HTMLAttributes: Record<string, any>
  defaultHeight: number
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    spacer: {
      /**
       * Insert a spacer node
       */
      setSpacer: (height?: number) => ReturnType
    }
  }
}

export const Spacer = Node.create<SpacerOptions>({
  name: 'spacer',

  group: 'block',

  atom: true,

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      defaultHeight: 24
    }
  },

  addAttributes() {
    return {
      height: {
        default: this.options.defaultHeight,
        parseHTML: element => {
          const height = element.getAttribute('data-height')
          return height ? parseInt(height, 10) : this.options.defaultHeight
        },
        renderHTML: attributes => {
          return {
            'data-height': attributes.height
          }
        }
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="spacer"]'
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        {
          'data-type': 'spacer',
          'style': `height: ${HTMLAttributes['data-height'] || this.options.defaultHeight}px;`
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      )
    ]
  },

  addCommands() {
    return {
      setSpacer: (height?: number) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            height: height || this.options.defaultHeight
          }
        })
      }
    }
  }
})

export default Spacer
