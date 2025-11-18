<template>
  <div class="prayer-fuel-editor">
    <div ref="editorElement" class="editor-container"></div>
  </div>
</template>

<script setup>
import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import Image from '@editorjs/image'
import Quote from '@editorjs/quote'
import Delimiter from '@editorjs/delimiter'
import Embed from '@editorjs/embed'
import Table from '@editorjs/table'
import Checklist from '@editorjs/checklist'
import Warning from '@editorjs/warning'
import CodeTool from '@editorjs/code'
import LinkTool from '@editorjs/link'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const editorElement = ref(null)
let editor = null
let isUpdating = false

onMounted(() => {
  if (!editorElement.value) return

  // Use a unique ID instead of element reference
  const holderId = 'editorjs-' + Math.random().toString(36).substring(7)
  editorElement.value.id = holderId

  // Ensure data is in correct format and convert from Vue Proxy to plain object
  const rawData = props.modelValue ? JSON.parse(JSON.stringify(props.modelValue)) : {
    time: Date.now(),
    blocks: []
  }

  console.log('Editor.js initializing with data:', rawData)

  editor = new EditorJS({
    holder: holderId,

    data: rawData,

    onChange: async (api, event) => {
      isUpdating = true
      const data = await editor.save()
      emit('update:modelValue', data)
      setTimeout(() => { isUpdating = false }, 100)
    },

    tools: {
      header: {
        class: Header,
        config: {
          levels: [2, 3, 4],
          defaultLevel: 2
        }
      },

      list: {
        class: List,
        inlineToolbar: true
      },

      image: {
        class: Image,
        config: {
          endpoints: {
            byFile: '/api/upload/image',
            byUrl: '/api/upload/image-by-url'
          },
          additionalRequestHeaders: {
            // Add auth headers if needed
          }
        }
      },

      quote: {
        class: Quote,
        inlineToolbar: true,
        config: {
          quotePlaceholder: 'Enter scripture or quote',
          captionPlaceholder: 'Reference (e.g., John 3:16)'
        }
      },

      delimiter: Delimiter,

      embed: {
        class: Embed,
        config: {
          services: {
            youtube: true,
            vimeo: true,
            twitter: true,
            instagram: true
          }
        }
      },

      table: {
        class: Table,
        inlineToolbar: true
      },

      checklist: {
        class: Checklist,
        inlineToolbar: true
      },

      warning: {
        class: Warning,
        inlineToolbar: true,
        config: {
          titlePlaceholder: 'Prayer Prompt',
          messagePlaceholder: 'Enter prayer prompt text...'
        }
      },

      code: CodeTool,

      linkTool: {
        class: LinkTool,
        config: {
          endpoint: '/api/fetch-url-meta'
        }
      }
    },

    placeholder: 'Start writing your prayer content...',

    autofocus: false,

    minHeight: 300
  })
})

onBeforeUnmount(() => {
  if (editor && editor.destroy) {
    editor.destroy()
  }
})

// Watch for external changes to modelValue
watch(() => props.modelValue, async (newValue) => {
  // Skip if we're currently updating from onChange
  if (isUpdating || !editor || !editor.render || !newValue) return

  // Convert Vue Proxy to plain object
  const plainData = JSON.parse(JSON.stringify(newValue))

  // Only update if the content is different
  const currentData = await editor.save()
  if (JSON.stringify(currentData) !== JSON.stringify(plainData)) {
    console.log('External data change detected, re-rendering editor')
    editor.render(plainData)
  }
}, { deep: true, flush: 'post' })
</script>

<style>
/* Editor.js core styles */
@import url('https://cdn.jsdelivr.net/npm/@editorjs/editorjs@latest/dist/editor.css');

.prayer-fuel-editor {
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg);
}

.editor-container {
  min-height: 400px;
  padding: 2rem;
}

/* Customize Editor.js styles */
.codex-editor__redactor {
  padding-bottom: 100px !important;
}

.ce-block__content,
.ce-toolbar__content {
  max-width: 650px !important;
  margin: 0 auto !important;
}

.ce-toolbar__plus {
  color: var(--text);
}

.ce-toolbar__plus:hover {
  background-color: var(--bg-hover);
}

.ce-inline-toolbar {
  background: var(--bg);
  border: 1px solid var(--border);
  box-shadow: 0 4px 6px -1px var(--shadow);
}

.ce-inline-tool:hover {
  background-color: var(--bg-hover);
}

/* Block styles */
.ce-block {
  margin-bottom: 0.5rem;
}

.ce-header {
  font-weight: 600;
  color: var(--text);
}

.cdx-block {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text);
}

/* Quote block for scripture */
.cdx-quote {
  border-left: 3px solid var(--text-muted);
  padding-left: 1.5rem;
  font-style: italic;
}

.cdx-quote__text {
  color: var(--text-muted);
  font-size: 1.125rem;
  line-height: 1.75;
}

.cdx-quote__caption {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

/* Warning block for prayer prompts */
.cdx-warning {
  background: var(--bg-secondary);
  border-left: 3px solid var(--text-muted);
  padding: 1rem;
  border-radius: 4px;
}

.cdx-warning__title {
  color: var(--text);
  font-weight: 600;
}

.cdx-warning__message {
  color: var(--text);
  margin-top: 0.5rem;
}

/* List styles */
.cdx-list {
  padding-left: 1.5rem;
}

.cdx-list__item {
  padding: 0.25rem 0;
  line-height: 1.6;
}

/* Checklist */
.cdx-checklist__item {
  display: flex;
  align-items: flex-start;
  padding: 0.5rem 0;
}

.cdx-checklist__item-checkbox {
  margin-right: 0.75rem;
  accent-color: var(--text);
}

/* Image block */
.cdx-block.image-tool {
  margin: 1.5rem 0;
}

.image-tool__image-picture {
  border-radius: 8px;
  overflow: hidden;
}

.cdx-input.image-tool__caption {
  border: none;
  border-top: 1px solid var(--border);
  padding: 0.75rem 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.875rem;
}

/* Embed block */
.embed-tool {
  margin: 1.5rem 0;
}

/* Table */
.tc-table {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
}

.tc-table__cell {
  border: 1px solid var(--border);
  padding: 0.75rem;
}

/* Delimiter */
.ce-delimiter {
  line-height: 1.6;
  width: 100%;
  text-align: center;
  margin: 2rem 0;
}

.ce-delimiter::before {
  content: '***';
  font-size: 1.5rem;
  color: var(--text-muted);
}

/* Code block */
.ce-code__textarea {
  background: var(--bg-secondary);
  color: var(--text);
  padding: 1rem;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  border: 1px solid var(--border);
  min-height: 100px;
}
</style>
