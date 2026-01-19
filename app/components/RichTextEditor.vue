<script setup lang="ts">
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
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Youtube from '@tiptap/extension-youtube'
import { ImageUploadExtension } from '~/utils/imageUploadExtension'
import { Spacer } from '~/extensions/spacer'
import { Vimeo } from '~/extensions/vimeo'
import { Verse } from '~/extensions/verse'
import { editorConfig } from '~/config/editor.config'
import { uploadImage } from '~/composables/editor/useImageUpload'
import { useEditorHandlers, textColors, highlightColors } from '~/composables/editor/useEditorHandlers'
import type { Editor } from '@tiptap/core'

const props = defineProps<{
  modelValue: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const { showError } = useModal()
const { createCustomHandlers } = useEditorHandlers()

const content = computed({
  get: () => parseContent(props.modelValue),
  set: (value) => emit('update:modelValue', value)
})

function parseContent(value: any) {
  const emptyDoc = {
    type: 'doc',
    content: [{ type: 'paragraph' }]
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

const customExtensions = [
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
  HorizontalRule,
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
    onError: async (error: Error) => {
      console.error('Upload error:', error)
      await showError(`Upload failed: ${error.message}`)
    },
    onSuccess: (url: string) => {
      console.log('Upload successful:', url)
    }
  })
]

const customHandlers = createCustomHandlers()

const bubbleToolbarItems = computed(() => [
  [
    { kind: 'heading', level: 1 },
    { kind: 'heading', level: 2 },
    { kind: 'heading', level: 3 }
  ],
  [
    { kind: 'mark', mark: 'bold' },
    { kind: 'mark', mark: 'italic' },
    { kind: 'mark', mark: 'underline' },
    { kind: 'mark', mark: 'strike' }
  ],
  [
    { kind: 'textAlign', align: 'left' },
    { kind: 'textAlign', align: 'center' },
    { kind: 'textAlign', align: 'right' },
    { kind: 'textAlign', align: 'justify' }
  ],
  [
    { kind: 'link' }
  ],
  [
    { kind: 'mark', mark: 'code' }
  ]
])

const slashCommandItems = [
  {
    label: 'Basic Blocks',
    commands: [
      {
        label: 'Text',
        description: 'Plain paragraph text',
        icon: 'i-lucide-text',
        handler: (editor: Editor) => editor.chain().focus().setNode('paragraph').run()
      },
      {
        label: 'Heading 1',
        description: 'Large section heading',
        icon: 'i-lucide-heading-1',
        handler: (editor: Editor) => editor.chain().focus().setNode('heading', { level: 1 }).run()
      },
      {
        label: 'Heading 2',
        description: 'Medium section heading',
        icon: 'i-lucide-heading-2',
        handler: (editor: Editor) => editor.chain().focus().setNode('heading', { level: 2 }).run()
      },
      {
        label: 'Heading 3',
        description: 'Small section heading',
        icon: 'i-lucide-heading-3',
        handler: (editor: Editor) => editor.chain().focus().setNode('heading', { level: 3 }).run()
      },
      {
        label: 'Quote',
        description: 'Add a blockquote',
        icon: 'i-lucide-text-quote',
        handler: (editor: Editor) => editor.chain().focus().setBlockquote().run()
      },
      {
        label: 'Verse',
        description: 'Scripture or quoted verse',
        icon: 'i-lucide-book-open',
        handler: (editor: Editor) => editor.chain().focus().setVerse().run()
      },
      {
        label: 'Code Block',
        description: 'Code with syntax highlighting',
        icon: 'i-lucide-code',
        handler: (editor: Editor) => editor.chain().focus().setCodeBlock().run()
      }
    ]
  },
  {
    label: 'Lists',
    commands: [
      {
        label: 'Bullet List',
        description: 'Create a simple bullet list',
        icon: 'i-lucide-list',
        handler: (editor: Editor) => editor.chain().focus().toggleBulletList().run()
      },
      {
        label: 'Numbered List',
        description: 'Create a numbered list',
        icon: 'i-lucide-list-ordered',
        handler: (editor: Editor) => editor.chain().focus().toggleOrderedList().run()
      },
      {
        label: 'Checkboxes',
        description: 'Create a checklist',
        icon: 'i-lucide-list-todo',
        handler: (editor: Editor) => editor.chain().focus().toggleTaskList().run()
      }
    ]
  },
  {
    label: 'Media',
    commands: [
      {
        label: 'Divider',
        description: 'Add a horizontal line',
        icon: 'i-lucide-minus',
        handler: (editor: Editor) => editor.chain().focus().setHorizontalRule().run()
      },
      {
        label: 'Spacer',
        description: 'Add vertical spacing',
        icon: 'i-lucide-separator-vertical',
        handler: (editor: Editor) => editor.chain().focus().setSpacer().run()
      },
      {
        label: 'Image',
        description: 'Upload an image',
        icon: 'i-lucide-image',
        handler: (editor: Editor) => editor.chain().focus().setImageUploadNode().run()
      },
      {
        label: 'Video',
        description: 'Embed YouTube or Vimeo video',
        icon: 'i-lucide-video',
        handler: async (editor: Editor) => {
          const { showVideoUrlModal } = useVideoEmbed()
          await showVideoUrlModal(editor)
        }
      }
    ]
  }
]

const showColorPicker = ref(false)
const showHighlightPicker = ref(false)
const editorRef = ref<{ editor: Editor | undefined }>()

const setColor = (color: string | null) => {
  const editor = editorRef.value?.editor
  if (!editor) return

  if (color === null) {
    editor.chain().focus().unsetColor().run()
  } else {
    editor.chain().focus().setColor(color).run()
  }
  showColorPicker.value = false
}

const setHighlight = (color: string | null) => {
  const editor = editorRef.value?.editor
  if (!editor) return

  if (color === null) {
    editor.chain().focus().unsetHighlight().run()
  } else {
    editor.chain().focus().setHighlight({ color }).run()
  }
  showHighlightPicker.value = false
}
</script>

<template>
  <div class="editor-wrapper">
    <UEditor
      ref="editorRef"
      v-model="content"
      content-type="json"
      :extensions="customExtensions"
      :handlers="customHandlers"
      :placeholder="editorConfig.placeholder.default"
      class="editor-content"
    >
      <template #default="{ editor }">
        <UEditorToolbar
          v-if="editor"
          mode="bubble"
          :editor="editor"
          :items="bubbleToolbarItems"
        >
          <template #trailing>
            <UDivider orientation="vertical" class="h-5" />

            <UPopover v-model:open="showColorPicker">
              <UButton
                variant="ghost"
                size="xs"
                icon="i-lucide-palette"
                class="text-gray-600"
              />
              <template #content>
                <div class="p-2">
                  <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Text color</div>
                  <div class="grid grid-cols-3 gap-1">
                    <button
                      v-for="color in textColors"
                      :key="color.name"
                      class="w-6 h-6 rounded hover:ring-2 hover:ring-gray-300"
                      :style="{ backgroundColor: color.value || '#000000' }"
                      :title="color.name"
                      @click="setColor(color.value)"
                    />
                  </div>
                </div>
              </template>
            </UPopover>

            <UPopover v-model:open="showHighlightPicker">
              <UButton
                variant="ghost"
                size="xs"
                icon="i-lucide-highlighter"
                class="text-gray-600"
              />
              <template #content>
                <div class="p-2">
                  <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Background</div>
                  <div class="grid grid-cols-3 gap-1">
                    <button
                      v-for="highlight in highlightColors"
                      :key="highlight.name"
                      class="w-6 h-6 rounded border border-gray-200 hover:ring-2 hover:ring-gray-300"
                      :style="{ backgroundColor: highlight.value || '#FFFFFF' }"
                      :title="highlight.name"
                      @click="setHighlight(highlight.value)"
                    />
                  </div>
                </div>
              </template>
            </UPopover>
          </template>
        </UEditorToolbar>

        <UEditorDragHandle v-if="editor" :editor="editor" />

        <UEditorSuggestionMenu
          v-if="editor"
          :editor="editor"
          :items="slashCommandItems"
        />
      </template>
    </UEditor>
  </div>
</template>

<style scoped>
.editor-wrapper {
  background: white;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.15s ease;
}

.editor-wrapper:hover {
  border-color: var(--ui-border-hover);
}

.editor-wrapper:focus-within {
  border-color: var(--ui-border-accented);
  box-shadow: 0 0 0 3px rgba(156, 163, 175, 0.1);
}

.editor-content {
  padding: 40px 56px;
  min-height: 300px;
  cursor: text;
}

:deep(.ProseMirror) {
  outline: none;
  font-size: 16px;
  line-height: 1.6;
  color: var(--ui-text);
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: var(--ui-text-muted);
  pointer-events: none;
  font-style: italic;
  float: left;
  height: 0;
}

:deep(.ProseMirror h1) {
  font-size: 2.5em;
  font-weight: 700;
  line-height: 1.2;
  margin-top: 2rem;
  margin-bottom: 0.5rem;
  color: var(--ui-text);
}

:deep(.ProseMirror h1:first-child) {
  margin-top: 0;
}

:deep(.ProseMirror h2) {
  font-size: 1.875em;
  font-weight: 700;
  line-height: 1.3;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--ui-text);
}

:deep(.ProseMirror h2:first-child) {
  margin-top: 0;
}

:deep(.ProseMirror h3) {
  font-size: 1.5em;
  font-weight: 600;
  line-height: 1.4;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  color: var(--ui-text);
}

:deep(.ProseMirror h3:first-child) {
  margin-top: 0;
}

:deep(.ProseMirror p) {
  margin: 0.75rem 0;
  line-height: 1.6;
}

:deep(.ProseMirror p:first-child) {
  margin-top: 0;
}

:deep(.ProseMirror p:last-child) {
  margin-bottom: 0;
}

:deep(.ProseMirror ul),
:deep(.ProseMirror ol) {
  padding-left: 1rem;
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

:deep(.ProseMirror ul[data-type="taskList"]) {
  list-style: none;
  padding-left: 0;
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
  position: relative;
  transition: all 0.15s ease;
  display: inline-block;
  z-index: 10;
}

:deep(.ProseMirror ul[data-type="taskList"] li input[type="checkbox"]:checked) {
  background-color: #000000;
  border-color: #000000;
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

:deep(.ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div) {
  text-decoration: line-through;
  opacity: 0.6;
}

:deep(.ProseMirror blockquote) {
  border-left: 3px solid var(--ui-border);
  padding-left: 1rem;
  margin: 1rem 0;
  color: var(--ui-text-muted);
  font-style: italic;
}

:deep(.ProseMirror code) {
  background: var(--ui-bg-muted);
  color: #EF4444;
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
}

:deep(.ProseMirror pre) {
  background: #1F2937;
  color: #F3F4F6;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 0.875rem;
  line-height: 1.7;
}

:deep(.ProseMirror pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
  border-radius: 0;
  font-size: inherit;
}

:deep(.ProseMirror hr) {
  border: none;
  border-top: 1px solid var(--ui-border);
  margin: 2rem 0;
  padding: 12px 0;
  cursor: pointer;
}

:deep(.ProseMirror div[data-type="spacer"]) {
  position: relative;
  min-height: 12px;
  margin: 0.5rem 0;
  cursor: default;
  border: 2px dashed var(--ui-border);
  border-radius: 4px;
}

:deep(.ProseMirror div[data-type="spacer"].ProseMirror-selectednode) {
  border-color: var(--ui-primary);
  background: rgba(59, 130, 246, 0.05);
}

:deep(.ProseMirror div[data-type="verse"]) {
  background-color: var(--ui-primary);
  border-radius: 5px;
  padding: 1rem;
  margin: 1rem 0;
}

:deep(.ProseMirror div[data-type="verse"] p) {
  text-align: center;
  color: white;
  margin: 0.5rem 0;
}

:deep(.ProseMirror div[data-type="verse"] p:first-child) {
  margin-top: 0;
}

:deep(.ProseMirror div[data-type="verse"] p:last-child) {
  margin-bottom: 0;
}

:deep(.ProseMirror div[data-type="verse"].ProseMirror-selectednode) {
  outline: 2px solid var(--ui-primary);
  outline-offset: 2px;
}

:deep(.ProseMirror img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1.5rem 0;
  display: block;
}

:deep(.ProseMirror div[data-youtube-video]) {
  margin: 1.5rem 0;
  cursor: pointer;
}

:deep(.ProseMirror div[data-youtube-video] iframe) {
  border-radius: 8px;
  border: none;
  max-width: 100%;
  display: block;
}

:deep(.ProseMirror div[data-youtube-video].ProseMirror-selectednode) {
  outline: 2px solid var(--ui-primary);
  border-radius: 8px;
}

:deep(.ProseMirror div[data-vimeo-video]) {
  margin: 1.5rem 0;
  cursor: pointer;
}

:deep(.ProseMirror div[data-vimeo-video] iframe) {
  border-radius: 8px;
  border: none;
  max-width: 100%;
  display: block;
}

:deep(.ProseMirror div[data-vimeo-video].ProseMirror-selectednode) {
  outline: 2px solid var(--ui-primary);
  border-radius: 8px;
}

:deep(.ProseMirror a) {
  color: var(--ui-primary);
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.15s ease;
}

:deep(.ProseMirror a:hover) {
  color: var(--ui-primary-hover);
}

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

:deep(.ProseMirror mark) {
  background-color: #FEF3C7;
  padding: 0.1em 0.2em;
  border-radius: 2px;
}

:deep(.ProseMirror ::selection) {
  background: #DBEAFE;
}
</style>
