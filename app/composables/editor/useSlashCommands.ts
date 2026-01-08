/**
 * Slash Commands Configuration
 * Defines all available slash commands for the TipTap editor
 */

import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { VueRenderer } from '@tiptap/vue-3'
import SlashCommandMenu from '~/components/SlashCommandMenu.vue'
import tippy from 'tippy.js'
import type { Instance as TippyInstance } from 'tippy.js'
import { editorConfig } from '~/config/editor.config'
import { useVideoEmbed } from './useVideoEmbed'

/**
 * Command item interface
 */
export interface CommandItem {
  title: string
  description: string
  icon: string
  group: string
  aliases?: string[]
  command: (props: { editor: any; range: any }) => void
}

/**
 * Get all available command items, filtered by query
 */
export const getCommandItems = ({ query }: { query: string }): CommandItem[] => {
  const commands: CommandItem[] = [
    {
      title: 'Text',
      description: 'Plain paragraph text',
      icon: 'lucide:text',
      group: 'Basic Blocks',
      aliases: ['paragraph', 'p'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('paragraph').run()
      }
    },
    {
      title: 'Heading 1',
      description: 'Large section heading',
      icon: 'lucide:heading-1',
      group: 'Basic Blocks',
      aliases: ['h1', 'title'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
      }
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: 'lucide:heading-2',
      group: 'Basic Blocks',
      aliases: ['h2', 'subtitle'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
      }
    },
    {
      title: 'Heading 3',
      description: 'Small section heading',
      icon: 'lucide:heading-3',
      group: 'Basic Blocks',
      aliases: ['h3', 'subheading'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
      }
    },
    {
      title: 'Bullet List',
      description: 'Create a simple bullet list',
      icon: 'lucide:list',
      group: 'Lists',
      aliases: ['ul', 'unordered'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run()
      }
    },
    {
      title: 'Numbered List',
      description: 'Create a numbered list',
      icon: 'lucide:list-ordered',
      group: 'Lists',
      aliases: ['ol', 'ordered'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run()
      }
    },
    {
      title: 'Checkboxes',
      description: 'Create a checklist',
      icon: 'lucide:list-todo',
      group: 'Lists',
      aliases: ['todo', 'task', 'checklist'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run()
      }
    },
    {
      title: 'Quote',
      description: 'Add a blockquote',
      icon: 'lucide:text-quote',
      group: 'Basic Blocks',
      aliases: ['blockquote', 'citation'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setBlockquote().run()
      }
    },
    {
      title: 'Verse',
      description: 'Scripture or quoted verse',
      icon: 'lucide:book-open',
      group: 'Basic Blocks',
      aliases: ['verse', 'scripture', 'bible'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setVerse().run()
      }
    },
    {
      title: 'Code Block',
      description: 'Code with syntax highlighting',
      icon: 'lucide:code',
      group: 'Basic Blocks',
      aliases: ['code', 'pre'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setCodeBlock().run()
      }
    },
    {
      title: 'Divider',
      description: 'Add a horizontal line',
      icon: 'lucide:minus',
      group: 'Media',
      aliases: ['hr', 'line', 'separator'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run()
      }
    },
    {
      title: 'Spacer',
      description: 'Add vertical spacing',
      icon: 'lucide:separator-vertical',
      group: 'Media',
      aliases: ['space', 'gap', 'padding'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setSpacer().run()
      }
    },
    {
      title: 'Image',
      description: 'Upload an image',
      icon: 'lucide:image',
      group: 'Media',
      aliases: ['picture', 'photo', 'img'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setImageUploadNode().run()
      }
    },
    {
      title: 'Video',
      description: 'Embed YouTube or Vimeo video',
      icon: 'lucide:video',
      group: 'Media',
      aliases: ['youtube', 'vimeo', 'embed', 'yt'],
      command: async ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run()

        // Use modal for video URL input
        const { showVideoUrlModal } = useVideoEmbed()
        await showVideoUrlModal(editor)
      }
    }
  ]

  const queryLower = query.toLowerCase()

  return commands
    .filter(item => {
      // Match against title
      if (item.title.toLowerCase().includes(queryLower)) {
        return true
      }
      // Match against aliases
      if (item.aliases && item.aliases.some(alias => alias.toLowerCase().includes(queryLower))) {
        return true
      }
      return false
    })
    .slice(0, editorConfig.slashCommand.maxResults)
}

/**
 * Create the slash command suggestion configuration
 */
export const createSuggestionConfig = () => {
  return {
    items: getCommandItems,

    render: () => {
      let component: VueRenderer
      let popup: TippyInstance[]

      return {
        onStart: (props: any) => {
          component = new VueRenderer(SlashCommandMenu, {
            props,
            editor: props.editor
          })

          if (!props.clientRect || !component.element) {
            return
          }

          popup = [tippy(document.body, {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: editorConfig.slashCommand.menu.interactive,
            trigger: 'manual',
            placement: editorConfig.slashCommand.menu.placement as any,
            theme: editorConfig.slashCommand.menu.theme,
            arrow: editorConfig.slashCommand.menu.arrow
          })]
        },

        onUpdate(props: any) {
          component.updateProps(props)

          if (!props.clientRect) {
            return
          }

          popup[0]?.setProps({
            getReferenceClientRect: props.clientRect
          })
        },

        onKeyDown(props: any) {
          if (props.event.key === 'Escape') {
            popup[0]?.hide()
            return true
          }

          return component.ref?.onKeyDown(props.event)
        },

        onExit() {
          popup[0]?.destroy()
          component.destroy()
        }
      }
    }
  }
}

/**
 * Create the slash command extension
 */
export const createSlashCommandExtension = () => {
  return Extension.create({
    name: 'slashCommand',

    addOptions() {
      return {
        suggestion: {
          char: editorConfig.slashCommand.trigger,
          startOfLine: editorConfig.slashCommand.startOfLine,
          command: ({ editor, range, props }: any) => {
            props.command({ editor, range })
          }
        }
      }
    },

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          ...this.options.suggestion
        })
      ]
    }
  })
}

/**
 * Composable for slash commands functionality
 */
export const useSlashCommands = () => {
  const suggestion = createSuggestionConfig()
  const SlashCommand = createSlashCommandExtension()

  return {
    suggestion,
    SlashCommand: SlashCommand.configure({ suggestion }),
    getCommandItems
  }
}
