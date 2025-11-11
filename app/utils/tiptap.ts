import type { Editor } from '@tiptap/vue-3'

/**
 * Check if a position is valid in the editor
 */
export function isValidPosition(pos: number | undefined): pos is number {
  return typeof pos === 'number' && pos >= 0
}

/**
 * Focus the next node after the current position
 */
export function focusNextNode(editor: Editor) {
  try {
    const { state } = editor
    const { selection } = state

    // Try to get position after current node
    const nextPos = selection.$to.after()

    if (nextPos && nextPos < state.doc.content.size) {
      editor.commands.focus(nextPos)
    } else {
      // If no next position, focus at the end of document
      editor.commands.focus('end')
    }
  } catch (error) {
    // If after() throws (no position after top-level node), focus at end
    editor.commands.focus('end')
  }
}
