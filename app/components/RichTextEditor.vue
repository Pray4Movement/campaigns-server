<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import BubbleMenuComponent from './BubbleMenu.vue'
import { DragHandle } from '@tiptap/extension-drag-handle-vue-3'
import { useEditorSetup } from '~/composables/editor/useEditorSetup'
import 'tippy.js/dist/tippy.css'

const props = defineProps<{
  modelValue: any // TipTap JSON object (or string for backward compatibility)
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any] // TipTap JSON object
}>()

const { showError } = useModal()

// Get editor setup utilities
const {
  createEditorExtensions,
  createEditorProps,
  parseContent,
  getReferencedVirtualElement,
  config
} = useEditorSetup()

// Create editor instance
const editor = useEditor({
  content: parseContent(props.modelValue),
  extensions: createEditorExtensions(
    async (error) => {
      console.error('Upload error:', error)
      await showError(`Upload failed: ${error.message}`)
    },
    (url) => {
      console.log('Upload successful:', url)
    }
  ),
  editorProps: createEditorProps(),
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getJSON())
  }
})

// Track the currently hovered node position for drag handle
const hoveredNodePos = ref<number | null>(null)

// Handle node change from drag handle
const onNodeChange = ({ node, editor, pos }: any) => {
  if (node) {
    hoveredNodePos.value = pos
  } else {
    hoveredNodePos.value = null
  }
}

// Handle plus button click to insert text and trigger slash command
const handlePlusClick = () => {
  if (!editor.value) return

  let insertPos: number

  // Use hovered node position if available, otherwise use selection position
  if (hoveredNodePos.value !== null) {
    const { state } = editor.value
    const node = state.doc.nodeAt(hoveredNodePos.value)

    if (node) {
      // Insert after the entire node (position + node size)
      insertPos = hoveredNodePos.value + node.nodeSize
    } else {
      // Fallback to after current position
      const resolvedPos = state.doc.resolve(hoveredNodePos.value)
      insertPos = resolvedPos.after()
    }
  } else {
    const { state } = editor.value
    const { $from } = state.selection
    // For selection, find the top-level block and insert after it
    const depth = $from.depth
    insertPos = $from.after(depth)
  }

  // Insert new paragraph with slash after current block to trigger the command menu
  editor.value.chain()
    .focus()
    .insertContentAt(insertPos, {
      type: 'paragraph',
      content: [{ type: 'text', text: '/' }]
    })
    .run()
}

// Handle clicks in the editor padding area to focus the editor
const handleEditorClick = (event: MouseEvent) => {
  if (!editor.value) return

  const target = event.target as HTMLElement

  if (target.classList.contains('editor-content') || target.classList.contains('editor-wrapper')) {
    editor.value.chain().focus('end').run()
  }
}

// Update editor content when modelValue changes externally
watch(() => props.modelValue, (value) => {
  if (!editor.value || !value) return

  const parsedValue = parseContent(value)
  if (!parsedValue) return

  const currentJson = JSON.stringify(editor.value.getJSON())
  const newJson = JSON.stringify(parsedValue)
  const isSame = currentJson === newJson

  if (!isSame) {
    editor.value.commands.setContent(parsedValue, { emitUpdate: false })
  }
})

// Cleanup editor on unmount
onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="editor-wrapper">
    <BubbleMenuComponent v-if="editor" :editor="editor" />

    <!-- Drag Handle -->
    <DragHandle
      v-if="editor"
      :editor="editor"
      :onNodeChange="onNodeChange"
      :getReferencedVirtualElement="getReferencedVirtualElement"
      :computePositionConfig="{ placement: 'left', strategy: 'absolute' }"
    >
      <div class="drag-handle-wrapper">
        <button class="drag-handle-button" type="button" @click="handlePlusClick">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="7" y1="3" x2="7" y2="11"/>
            <line x1="3" y1="7" x2="11" y2="7"/>
          </svg>
        </button>
        <div class="drag-handle-grip">
          <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
            <circle cx="2" cy="2" r="1.5"/>
            <circle cx="7" cy="2" r="1.5"/>
            <circle cx="2" cy="8" r="1.5"/>
            <circle cx="7" cy="8" r="1.5"/>
            <circle cx="2" cy="14" r="1.5"/>
            <circle cx="7" cy="14" r="1.5"/>
          </svg>
        </div>
      </div>
    </DragHandle>

    <!-- Editor -->
    <EditorContent :editor="editor" class="editor-content" @click="handleEditorClick" />
  </div>
</template>

<style scoped>
.editor-wrapper {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.15s ease;
}

.editor-wrapper:hover {
  border-color: #D1D5DB;
}

.editor-wrapper:focus-within {
  border-color: #9CA3AF;
  box-shadow: 0 0 0 3px rgba(156, 163, 175, 0.1);
}

.editor-content {
  padding: 40px 56px;
  min-height: 300px;
  cursor: text;
}

/* Base ProseMirror Styles */
:deep(.ProseMirror) {
  outline: none;
  font-size: 16px;
  line-height: 1.6;
  color: #111827;
}

/* Placeholder */
:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: #9CA3AF;
  pointer-events: none;
  font-style: italic;
  float: left;
  height: 0;
}

:deep(.ProseMirror.ProseMirror-focused p.is-editor-empty:first-child::before) {
  color: #6B7280;
}

:deep(.ProseMirror h1) {
  font-size: 2.5em;
  font-weight: 700;
  line-height: 1.2;
  margin-top: 2rem;
  margin-bottom: 0.5rem;
  color: #111827;
  position: relative;
}

:deep(.ProseMirror h1::after) {
  content: '';
  position: absolute;
  left: -60px;
  top: 0;
  width: 60px;
  height: 100%;
  cursor: pointer;
}

:deep(.ProseMirror h2) {
  font-size: 1.875em;
  font-weight: 700;
  line-height: 1.3;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color: #111827;
  position: relative;
}

:deep(.ProseMirror h2::after) {
  content: '';
  position: absolute;
  left: -60px;
  top: 0;
  width: 60px;
  height: 100%;
  cursor: pointer;
}

:deep(.ProseMirror h3) {
  font-size: 1.5em;
  font-weight: 600;
  line-height: 1.4;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  color: #111827;
  position: relative;
}

:deep(.ProseMirror h3::after) {
  content: '';
  position: absolute;
  left: -60px;
  top: 0;
  width: 60px;
  height: 100%;
  cursor: pointer;
}

:deep(.ProseMirror h1:first-child),
:deep(.ProseMirror h2:first-child),
:deep(.ProseMirror h3:first-child) {
  margin-top: 0;
}

/* Paragraphs */
:deep(.ProseMirror p) {
  margin: 0.75rem 0;
  line-height: 1.6;
  position: relative;
}

:deep(.ProseMirror p::after) {
  content: '';
  position: absolute;
  left: -60px;
  top: 0;
  width: 60px;
  height: 100%;
  cursor: pointer;
}

:deep(.ProseMirror p:first-child) {
  margin-top: 0;
}

:deep(.ProseMirror p:last-child) {
  margin-bottom: 0;
}

/* Lists */
:deep(.ProseMirror ul),
:deep(.ProseMirror ol) {
  padding-left: 1rem;
  position: relative;
}

:deep(.ProseMirror ul::after),
:deep(.ProseMirror ol::after) {
  content: '';
  position: absolute;
  left: -60px;
  top: 0;
  width: 60px;
  height: 100%;
  cursor: pointer;
}

:deep(.ProseMirror ul) {
  list-style-type: disc;
}

:deep(.ProseMirror ol) {
  list-style-type: decimal;
}

:deep(.ProseMirror li) {
  margin: 0.25rem 0;
}

:deep(.ProseMirror li p) {
  margin: 0.25rem 0;
}

/* Task Lists */
:deep(.ProseMirror ul[data-type="taskList"]) {
  list-style: none;
  padding-left: 0;
  position: relative;
}

:deep(.ProseMirror ul[data-type="taskList"] li) {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

:deep(.ProseMirror ul[data-type="taskList"] li > label) {
  margin-top: 0.1rem;
  flex-shrink: 0;
}

:deep(.ProseMirror ul[data-type="taskList"] li > div) {
  flex: 1;
}

:deep(.ProseMirror ul[data-type="taskList"] li input[type="checkbox"]) {
  flex: 0 0 auto;
  width: 1.125rem;
  height: 1.125rem;
  margin-right: 0;
  margin-top: 0.25rem;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  border: 2px solid #6b7280;
  border-radius: 0.25rem;
  background-color: white;
  background-image: none;
  position: relative;
  transition: all 0.15s ease;
  display: inline-block;
  z-index: 10;
}

:deep(.ProseMirror ul[data-type="taskList"] li input[type="checkbox"]:checked) {
  background-color: #000000;
  border-color: #000000;
  background-image: none;
}

:deep(.ProseMirror ul[data-type="taskList"] li input[type="checkbox"]:checked::after) {
  content: '';
  display: block;
  position: absolute;
  left: 0.25rem;
  top: 0.0625rem;
  width: 0.375rem;
  height: 0.625rem;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Strikethrough for checked items */
:deep(.ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div) {
  text-decoration: line-through;
  opacity: 0.6;
}

/* Blockquote */
:deep(.ProseMirror blockquote) {
  border-left: 3px solid #E5E7EB;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #6B7280;
  font-style: italic;
  position: relative;
}

:deep(.ProseMirror blockquote::after) {
  content: '';
  position: absolute;
  left: -60px;
  top: 0;
  width: 60px;
  height: 100%;
  cursor: pointer;
}

/* Code */
:deep(.ProseMirror code) {
  background: #F3F4F6;
  color: #EF4444;
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
}

/* Code Block */
:deep(.ProseMirror pre) {
  background: #1F2937;
  color: #F3F4F6;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  overflow-x: auto;
  overflow-y: visible;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 0.875rem;
  line-height: 1.7;
  position: relative;
}

:deep(.ProseMirror pre::after) {
  content: '';
  position: absolute;
  left: -60px;
  top: -1rem;
  width: 60px;
  height: calc(100% + 2rem);
  cursor: pointer;
  pointer-events: auto;
  z-index: 1;
}

:deep(.ProseMirror pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
  border-radius: 0;
  font-size: inherit;
}

/* Horizontal Rule */
:deep(.ProseMirror hr) {
  border: none;
  border-top: 1px solid #E5E7EB;
  margin: 2rem 0;
  position: relative;
  padding: 12px 0;
  cursor: pointer;
}

:deep(.ProseMirror hr::before) {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  cursor: pointer;
}

:deep(.ProseMirror hr::after) {
  content: '';
  position: absolute;
  left: -60px;
  top: 0;
  width: 60px;
  height: 100%;
  cursor: pointer;
}

/* Spacer */
:deep(.ProseMirror div[data-type="spacer"]) {
  position: relative;
  min-height: 12px;
  margin: 0.5rem 0;
  cursor: default;
  border: 2px dashed #E5E7EB;
  border-radius: 4px;
}

:deep(.ProseMirror div[data-type="spacer"].ProseMirror-selectednode) {
  border-color: #3B82F6;
  background: rgba(59, 130, 246, 0.05);
}

:deep(.ProseMirror div[data-type="spacer"]::after) {
  content: '';
  position: absolute;
  left: -60px;
  top: 0;
  width: 60px;
  height: 100%;
  cursor: pointer;
}

/* Images */
:deep(.ProseMirror img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1.5rem 0;
  display: block;
  position: relative;
}

/* YouTube Video Embeds */
:deep(.ProseMirror div[data-youtube-video]) {
  margin: 1.5rem 0;
  position: relative;
  cursor: pointer;
}

:deep(.ProseMirror div[data-youtube-video] iframe) {
  border-radius: 8px;
  border: none;
  max-width: 100%;
  display: block;
}

:deep(.ProseMirror div[data-youtube-video].ProseMirror-selectednode) {
  outline: 2px solid #3B82F6;
  border-radius: 8px;
}

:deep(.ProseMirror div[data-youtube-video]::after) {
  content: '';
  position: absolute;
  left: -60px;
  top: 0;
  width: 60px;
  height: 100%;
  cursor: pointer;
}

/* Vimeo Video Embeds */
:deep(.ProseMirror div[data-vimeo-video]) {
  margin: 1.5rem 0;
  position: relative;
  cursor: pointer;
}

:deep(.ProseMirror div[data-vimeo-video] iframe) {
  border-radius: 8px;
  border: none;
  max-width: 100%;
  display: block;
}

:deep(.ProseMirror div[data-vimeo-video].ProseMirror-selectednode) {
  outline: 2px solid #3B82F6;
  border-radius: 8px;
}

:deep(.ProseMirror div[data-vimeo-video]::after) {
  content: '';
  position: absolute;
  left: -60px;
  top: 0;
  width: 60px;
  height: 100%;
  cursor: pointer;
}

/* Links */
:deep(.ProseMirror a) {
  color: #3B82F6;
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.15s ease;
}

:deep(.ProseMirror a:hover) {
  color: #2563EB;
}

/* Text Alignment */
:deep(.ProseMirror [style*="text-align: left"]) {
  text-align: left;
}

:deep(.ProseMirror [style*="text-align: center"]) {
  text-align: center;
}

:deep(.ProseMirror [style*="text-align: right"]) {
  text-align: right;
}

:deep(.ProseMirror [style*="text-align: justify"]) {
  text-align: justify;
}

/* Highlight */
:deep(.ProseMirror mark) {
  background-color: #FEF3C7;
  padding: 0.1em 0.2em;
  border-radius: 2px;
}

/* Selection */
:deep(.ProseMirror ::selection) {
  background: #DBEAFE;
}

/* Override Tippy.js default styles */
:global(.tippy-box) {
  background-color: transparent !important;
  box-shadow: none !important;
}

:global(.tippy-content) {
  padding: 0 !important;
}

/* Ensure floating menu doesn't interfere */
:deep(.ProseMirror-focused) {
  outline: none;
}

/* Drag Handle Styles */
.drag-handle-wrapper {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-right: 8px;
}

.drag-handle-button {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  padding: 3px;
  transition: all 0.15s ease;
  outline: none;
}

.drag-handle-button:hover {
  background: #F3F4F6;
}

.drag-handle-button:active {
  background: #E5E7EB;
}

.drag-handle-button svg {
  width: 14px;
  height: 14px;
  color: #9CA3AF;
}

.drag-handle-button:hover svg {
  color: #374151;
}

.drag-handle-grip {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  padding: 4px;
  transition: all 0.15s ease;
}

.drag-handle-grip:hover {
  background: #F3F4F6;
}

.drag-handle-grip:active {
  cursor: grabbing;
  background: #E5E7EB;
}

.drag-handle-grip svg {
  width: 12px;
  height: 16px;
  color: #9CA3AF;
}

.drag-handle-grip:hover svg {
  color: #374151;
}
</style>
