/**
 * Enhanced Drag Handle Composable
 * Provides context-aware menu items for the editor drag handle
 */

import { upperFirst } from 'scule'
import type { DropdownMenuItem, EditorCustomHandlers } from '@nuxt/ui'
import type { JSONContent } from '@tiptap/vue-3'
import { mapEditorItems } from '@nuxt/ui/utils/editor'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Editor = any

const CONVERTIBLE_TYPES = ['paragraph', 'heading', 'bulletList', 'orderedList', 'taskList', 'blockquote', 'codeBlock', 'listItem', 'taskItem', 'verse']

export function useEditorDragHandle<T extends EditorCustomHandlers>(customHandlers?: T) {
  const selectedNode = ref<{ node: JSONContent | null, pos: number }>()

  const getTypeSpecificItems = (editor: Editor, nodeType: string): DropdownMenuItem[] => {
    const pos = selectedNode.value?.pos

    if (CONVERTIBLE_TYPES.includes(nodeType)) {
      return [{
        label: 'Turn into',
        icon: 'i-lucide-repeat-2',
        children: [
          { kind: 'paragraph', label: 'Paragraph', icon: 'i-lucide-pilcrow' },
          { kind: 'heading', level: 1, label: 'Heading 1', icon: 'i-lucide-heading-1' },
          { kind: 'heading', level: 2, label: 'Heading 2', icon: 'i-lucide-heading-2' },
          { kind: 'heading', level: 3, label: 'Heading 3', icon: 'i-lucide-heading-3' },
          { kind: 'bulletList', label: 'Bullet List', icon: 'i-lucide-list' },
          { kind: 'orderedList', label: 'Ordered List', icon: 'i-lucide-list-ordered' },
          { kind: 'taskList', label: 'Task List', icon: 'i-lucide-list-check' },
          { kind: 'blockquote', label: 'Quote', icon: 'i-lucide-text-quote' },
          { kind: 'verse', label: 'Verse', icon: 'i-lucide-book-open' },
          { kind: 'codeBlock', label: 'Code Block', icon: 'i-lucide-square-code' }
        ]
      }, {
        kind: 'clearFormatting',
        pos,
        label: 'Reset formatting',
        icon: 'i-lucide-rotate-ccw'
      }]
    }

    if (nodeType === 'image' || nodeType === 'imageResize') {
      const node = pos !== undefined ? editor.state.doc.nodeAt(pos) : null
      return [{
        label: 'Download image',
        icon: 'i-lucide-download',
        to: node?.attrs?.src,
        download: true
      }]
    }

    if (nodeType === 'table') {
      return [{
        label: 'Clear all contents',
        icon: 'i-lucide-square-x',
        onSelect: () => {
          if (pos === undefined) return
          const tableNode = editor.state.doc.nodeAt(pos)
          if (!tableNode) return

          const cellRanges: { from: number, to: number }[] = []

          tableNode.descendants((node: any, nodePos: number) => {
            if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
              const cellStart = pos + 1 + nodePos + 1
              const cellEnd = cellStart + node.content.size
              if (node.content.size > 0) {
                cellRanges.push({ from: cellStart, to: cellEnd })
              }
            }
            return true
          })

          const { tr } = editor.state
          cellRanges.reverse().forEach(({ from, to }) => {
            tr.delete(from, to)
          })

          editor.view.dispatch(tr)
        }
      }]
    }

    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getItems = (editor: any): DropdownMenuItem[][] => {
    if (!selectedNode.value?.node?.type) {
      return []
    }

    const nodeType = selectedNode.value.node.type
    const typeSpecificItems = getTypeSpecificItems(editor, nodeType)

    // Cast to avoid version mismatch between @tiptap/vue-3 and @nuxt/ui's bundled version
    return (mapEditorItems as any)(editor, [[
      {
        type: 'label',
        label: upperFirst(nodeType)
      },
      ...typeSpecificItems
    ], [
      {
        kind: 'duplicate',
        pos: selectedNode.value?.pos,
        label: 'Duplicate',
        icon: 'i-lucide-copy'
      },
      {
        label: 'Copy to clipboard',
        icon: 'i-lucide-clipboard',
        onSelect: async () => {
          if (!selectedNode.value) return

          const pos = selectedNode.value.pos
          const node = editor.state.doc.nodeAt(pos)
          if (node) {
            await navigator.clipboard.writeText(node.textContent)
          }
        }
      }
    ], [
      {
        kind: 'moveUp',
        pos: selectedNode.value?.pos,
        label: 'Move up',
        icon: 'i-lucide-arrow-up'
      },
      {
        kind: 'moveDown',
        pos: selectedNode.value?.pos,
        label: 'Move down',
        icon: 'i-lucide-arrow-down'
      }
    ], [
      {
        kind: 'delete',
        pos: selectedNode.value?.pos,
        label: 'Delete',
        icon: 'i-lucide-trash'
      }
    ]], customHandlers) as DropdownMenuItem[][]
  }

  const onNodeChange = (event: { node: JSONContent | null, pos: number }) => {
    selectedNode.value = event
  }

  return {
    selectedNode,
    getItems,
    onNodeChange
  }
}
