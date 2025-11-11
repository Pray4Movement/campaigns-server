<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'

const { showError } = useModal()

const props = defineProps<{
  editor: Editor
}>()

const menuVisible = ref(false)
const menuStyle = ref({
  top: '0px',
  left: '0px'
})

const showColorPicker = ref(false)
const showHighlightPicker = ref(false)
const showLinkInput = ref(false)
const showBlockTypePicker = ref(false)
const linkUrl = ref('')

const colors = [
  { name: 'Default', value: null },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#10B981' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
]

const highlights = [
  { name: 'None', value: null },
  { name: 'Gray', value: '#F3F4F6' },
  { name: 'Red', value: '#FEE2E2' },
  { name: 'Orange', value: '#FFEDD5' },
  { name: 'Yellow', value: '#FEF3C7' },
  { name: 'Green', value: '#D1FAE5' },
  { name: 'Blue', value: '#DBEAFE' },
  { name: 'Purple', value: '#EDE9FE' },
  { name: 'Pink', value: '#FCE7F3' },
]

const convertToParagraph = () => {
  const editor = props.editor

  // If in any type of list, lift out of the list first, then convert to paragraph
  if (editor.isActive('bulletList') || editor.isActive('orderedList') || editor.isActive('taskList')) {
    editor.chain().focus().liftListItem('listItem').setParagraph().run()
  } else {
    editor.chain().focus().setParagraph().run()
  }
}

const convertToHeading = (level: 1 | 2 | 3) => {
  const editor = props.editor

  // If in any type of list, lift out of the list first, then convert to heading
  if (editor.isActive('bulletList') || editor.isActive('orderedList') || editor.isActive('taskList')) {
    editor.chain().focus().liftListItem('listItem').setHeading({ level }).run()
  } else {
    editor.chain().focus().setHeading({ level }).run()
  }
}

const convertToBlockquote = () => {
  const editor = props.editor

  // If in any type of list, lift out of the list first, then convert to blockquote
  if (editor.isActive('bulletList') || editor.isActive('orderedList') || editor.isActive('taskList')) {
    editor.chain().focus().liftListItem('listItem').setBlockquote().run()
  } else {
    editor.chain().focus().setBlockquote().run()
  }
}

const convertToCodeBlock = () => {
  const editor = props.editor

  // If in any type of list, lift out of the list first, then convert to code block
  if (editor.isActive('bulletList') || editor.isActive('orderedList') || editor.isActive('taskList')) {
    editor.chain().focus().liftListItem('listItem').setCodeBlock().run()
  } else {
    editor.chain().focus().setCodeBlock().run()
  }
}

const blockTypes = [
  { name: 'Paragraph', icon: 'lucide:text', command: convertToParagraph },
  { name: 'Heading 1', icon: 'lucide:heading-1', command: () => convertToHeading(1) },
  { name: 'Heading 2', icon: 'lucide:heading-2', command: () => convertToHeading(2) },
  { name: 'Heading 3', icon: 'lucide:heading-3', command: () => convertToHeading(3) },
  { name: 'Bullet List', icon: 'lucide:list', command: () => props.editor.chain().focus().toggleBulletList().run() },
  { name: 'Numbered List', icon: 'lucide:list-ordered', command: () => props.editor.chain().focus().toggleOrderedList().run() },
  { name: 'Checklist', icon: 'lucide:list-todo', command: () => props.editor.chain().focus().toggleTaskList().run() },
  { name: 'Quote', icon: 'lucide:text-quote', command: convertToBlockquote },
  { name: 'Code Block', icon: 'lucide:code', command: convertToCodeBlock },
]

const getCurrentBlockType = () => {
  if (props.editor.isActive('heading', { level: 1 })) return { name: 'H1', icon: 'lucide:heading-1' }
  if (props.editor.isActive('heading', { level: 2 })) return { name: 'H2', icon: 'lucide:heading-2' }
  if (props.editor.isActive('heading', { level: 3 })) return { name: 'H3', icon: 'lucide:heading-3' }
  if (props.editor.isActive('bulletList')) return { name: 'List', icon: 'lucide:list' }
  if (props.editor.isActive('orderedList')) return { name: 'List', icon: 'lucide:list-ordered' }
  if (props.editor.isActive('taskList')) return { name: 'List', icon: 'lucide:list-todo' }
  if (props.editor.isActive('blockquote')) return { name: 'Quote', icon: 'lucide:text-quote' }
  if (props.editor.isActive('codeBlock')) return { name: 'Code', icon: 'lucide:code' }
  return { name: 'Text', icon: 'lucide:text' }
}

const setBlockType = (command: () => void) => {
  command()
  showBlockTypePicker.value = false
}

const toggleLinkInput = () => {
  if (showLinkInput.value) {
    showLinkInput.value = false
  } else {
    linkUrl.value = props.editor.getAttributes('link').href || ''
    showLinkInput.value = true
    // Focus the input after it's rendered
    nextTick(() => {
      const input = document.querySelector('.link-input') as HTMLInputElement
      input?.focus()
    })
  }
}

const applyLink = async () => {
  if (linkUrl.value === '') {
    props.editor.chain().focus().unsetLink().run()
    showLinkInput.value = false
    return
  }

  const url = linkUrl.value.trim()

  // Validate URL to prevent XSS attacks
  // Check for dangerous protocols
  if (url.match(/^(javascript|data|vbscript|file|about):/i)) {
    await showError('Invalid URL: This protocol is not allowed for security reasons.')
    return
  }

  // Normalize URL - add https:// if no protocol specified
  let normalizedUrl = url
  if (!url.match(/^https?:\/\//i)) {
    // Check if user is trying to sneak in a protocol by encoding or other means
    if (url.includes(':')) {
      await showError('Invalid URL: Please use http:// or https:// protocol only.')
      return
    }
    normalizedUrl = `https://${url}`
  }

  // Final validation: Try to parse as URL
  try {
    const parsedUrl = new URL(normalizedUrl)
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      await showError('Invalid URL: Only http:// and https:// protocols are allowed.')
      return
    }
  } catch (error) {
    await showError('Invalid URL: Please enter a valid web address.')
    return
  }

  props.editor.chain().focus().setLink({ href: normalizedUrl }).run()
  showLinkInput.value = false
}

const removeLink = () => {
  props.editor.chain().focus().unsetLink().run()
  showLinkInput.value = false
  linkUrl.value = ''
}

const handleLinkKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    applyLink()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    showLinkInput.value = false
  }
}

const setColor = (color: string | null) => {
  if (color === null) {
    props.editor.chain().focus().unsetColor().run()
  } else {
    props.editor.chain().focus().setColor(color).run()
  }
  showColorPicker.value = false
}

const setHighlight = (color: string | null) => {
  if (color === null) {
    props.editor.chain().focus().unsetHighlight().run()
  } else {
    props.editor.chain().focus().setHighlight({ color }).run()
  }
  showHighlightPicker.value = false
}

const deleteCurrentBlock = () => {
  const { state } = props.editor
  const { $from } = state.selection

  // Find the block-level node to delete
  // Go up the tree to find the nearest block node
  let depth = $from.depth
  while (depth > 0) {
    const node = $from.node(depth)
    if (node.type.isBlock && node.type.name !== 'doc') {
      // Found a block node, delete it
      const pos = $from.before(depth)
      const end = $from.after(depth)
      props.editor.chain().focus().deleteRange({ from: pos, to: end }).run()
      return
    }
    depth--
  }

  // Fallback: just delete the selection
  props.editor.chain().focus().deleteSelection().run()
}

const shouldShowBlockTypePicker = () => {
  // Only show block type picker for text blocks, not for special blocks like images
  const { state } = props.editor
  const { $from } = state.selection
  const node = $from.parent

  // Don't show for image nodes or other media
  if (node.type.name === 'imageResize' || node.type.name === 'imageUpload') {
    return false
  }

  // Show for text-based blocks
  return true
}

const isImageSelected = () => {
  const { state } = props.editor
  const { from, to } = state.selection

  // Check if we're selecting an image node
  const node = state.doc.nodeAt(from)
  if (node && (node.type.name === 'imageResize' || node.type.name === 'imageUpload')) {
    return true
  }

  // Check if the selection is inside an image
  const $from = state.selection.$from
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth)
    if (node.type.name === 'imageResize' || node.type.name === 'imageUpload') {
      return true
    }
  }

  return false
}

const isSpacerOrDividerSelected = () => {
  const { state } = props.editor
  const { $from } = state.selection

  // Check if we're selecting a spacer or horizontal rule
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth)
    if (node.type.name === 'spacer' || node.type.name === 'horizontalRule') {
      return true
    }
  }

  // Check the node at selection
  const node = state.doc.nodeAt($from.pos)
  if (node && (node.type.name === 'spacer' || node.type.name === 'horizontalRule')) {
    return true
  }

  return false
}

const updateMenuPosition = () => {
  const { state } = props.editor
  const { from, to, $from } = state.selection

  // Keep menu visible if any popup is open
  const hasOpenPopup = showLinkInput.value || showColorPicker.value || showHighlightPicker.value || showBlockTypePicker.value

  // Hide menu if an image is selected
  if (isImageSelected()) {
    if (!hasOpenPopup) {
      menuVisible.value = false
      return
    }
  }

  // Hide menu if no text selected and no popup is open
  if (from === to && !hasOpenPopup) {
    menuVisible.value = false
    return
  }

  // Get the DOM selection
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    if (!hasOpenPopup) {
      menuVisible.value = false
      return
    }
    // If popup is open but no selection, keep current position
    return
  }

  // Get the bounding rect of the selection
  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()

  if (rect.width === 0 && rect.height === 0) {
    if (!hasOpenPopup) {
      menuVisible.value = false
      return
    }
    // If popup is open but no rect, keep current position
    return
  }

  // Position the menu above the selection
  // Note: Using position: absolute, so we add scrollY/scrollX
  let left = rect.left + window.scrollX + rect.width / 2
  const top = rect.top + window.scrollY - 50

  // Ensure menu stays within viewport bounds
  // The menu uses transform: translateX(-50%), which centers it
  // Assuming menu width ~300-400px, we need at least half that distance from edges
  const estimatedMenuHalfWidth = 200 // Estimate for safety
  const padding = 8
  const menuMinLeft = window.scrollX + estimatedMenuHalfWidth + padding
  const menuMaxLeft = window.scrollX + window.innerWidth - estimatedMenuHalfWidth - padding

  // Clamp the position to stay on screen
  left = Math.max(menuMinLeft, Math.min(left, menuMaxLeft))

  menuStyle.value = {
    top: `${top}px`,
    left: `${left}px`
  }

  menuVisible.value = true
}

onMounted(() => {
  props.editor.on('selectionUpdate', updateMenuPosition)
  props.editor.on('update', updateMenuPosition)
  document.addEventListener('selectionchange', updateMenuPosition)
})

onBeforeUnmount(() => {
  props.editor.off('selectionUpdate', updateMenuPosition)
  props.editor.off('update', updateMenuPosition)
  document.removeEventListener('selectionchange', updateMenuPosition)
})
</script>

<template>
  <div
    v-if="menuVisible"
    class="bubble-menu-content"
    :class="{ 'simple-menu': isSpacerOrDividerSelected() }"
    :style="menuStyle"
  >
    <!-- Block Type Selector (only show for text blocks) -->
    <template v-if="shouldShowBlockTypePicker() && !isSpacerOrDividerSelected()">
      <div class="relative">
        <button
          @click="showBlockTypePicker = !showBlockTypePicker"
          class="menu-btn block-type-btn"
          title="Change block type"
        >
          <Icon :name="getCurrentBlockType().icon" />
          <Icon name="lucide:chevron-down" class="chevron-icon" />
        </button>

        <div v-if="showBlockTypePicker" class="block-type-picker">
          <button
            v-for="blockType in blockTypes"
            :key="blockType.name"
            @click="setBlockType(blockType.command)"
            class="block-type-option"
          >
            <Icon :name="blockType.icon" />
            <span>{{ blockType.name }}</span>
          </button>
        </div>
      </div>

      <div class="divider"></div>
    </template>

    <!-- Text Formatting -->
    <template v-if="!isSpacerOrDividerSelected()">
    <button
      @click="editor.chain().focus().toggleBold().run()"
      :class="{ 'is-active': editor.isActive('bold') }"
      class="menu-btn"
      title="Bold (Cmd+B)"
    >
      <Icon name="lucide:bold" />
    </button>

    <button
      @click="editor.chain().focus().toggleItalic().run()"
      :class="{ 'is-active': editor.isActive('italic') }"
      class="menu-btn"
      title="Italic (Cmd+I)"
    >
      <Icon name="lucide:italic" />
    </button>

    <button
      @click="editor.chain().focus().toggleUnderline().run()"
      :class="{ 'is-active': editor.isActive('underline') }"
      class="menu-btn"
      title="Underline (Cmd+U)"
    >
      <Icon name="lucide:underline" />
    </button>

    <button
      @click="editor.chain().focus().toggleStrike().run()"
      :class="{ 'is-active': editor.isActive('strike') }"
      class="menu-btn"
      title="Strikethrough"
    >
      <Icon name="lucide:strikethrough" />
    </button>

    <div class="divider"></div>

    <!-- Text Alignment -->
    <button
      @click="editor.chain().focus().setTextAlign('left').run()"
      :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }"
      class="menu-btn"
      title="Align left"
    >
      <Icon name="lucide:align-left" />
    </button>

    <button
      @click="editor.chain().focus().setTextAlign('center').run()"
      :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
      class="menu-btn"
      title="Align center"
    >
      <Icon name="lucide:align-center" />
    </button>

    <button
      @click="editor.chain().focus().setTextAlign('right').run()"
      :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
      class="menu-btn"
      title="Align right"
    >
      <Icon name="lucide:align-right" />
    </button>

    <button
      @click="editor.chain().focus().setTextAlign('justify').run()"
      :class="{ 'is-active': editor.isActive({ textAlign: 'justify' }) }"
      class="menu-btn"
      title="Justify"
    >
      <Icon name="lucide:align-justify" />
    </button>

    <div class="divider"></div>

    <!-- Link -->
    <div class="relative">
      <button
        @mousedown.prevent
        @click="toggleLinkInput"
        :class="{ 'is-active': editor.isActive('link') || showLinkInput }"
        class="menu-btn"
        title="Add link"
      >
        <Icon name="lucide:link" />
      </button>

      <!-- Link Input Popup -->
      <div v-if="showLinkInput" class="link-popup">
        <input
          v-model="linkUrl"
          @keydown="handleLinkKeydown"
          type="text"
          class="link-input"
          placeholder="Paste or type a link..."
        />
        <div class="link-actions">
          <button
            v-if="editor.isActive('link')"
            @mousedown.prevent
            @click="removeLink"
            class="link-action-btn remove"
            title="Remove link"
          >
            <Icon name="lucide:trash-2" />
          </button>
          <button
            @mousedown.prevent
            @click="applyLink"
            class="link-action-btn apply"
            title="Apply link"
          >
            <Icon name="lucide:check" />
          </button>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Text Color -->
    <div class="relative">
      <button
        @click="showColorPicker = !showColorPicker"
        class="menu-btn"
        title="Text color"
      >
        <Icon name="lucide:palette" />
      </button>
      <div v-if="showColorPicker" class="color-picker">
        <div class="color-picker-title">Text color</div>
        <div class="color-grid">
          <button
            v-for="color in colors"
            :key="color.name"
            @click="setColor(color.value)"
            class="color-btn"
            :title="color.name"
          >
            <div
              class="color-swatch"
              :style="{ backgroundColor: color.value || '#000000' }"
            ></div>
          </button>
        </div>
      </div>
    </div>

    <!-- Highlight -->
    <div class="relative">
      <button
        @click="showHighlightPicker = !showHighlightPicker"
        class="menu-btn"
        title="Highlight"
      >
        <Icon name="lucide:highlighter" />
      </button>
      <div v-if="showHighlightPicker" class="color-picker">
        <div class="color-picker-title">Background</div>
        <div class="color-grid">
          <button
            v-for="highlight in highlights"
            :key="highlight.name"
            @click="setHighlight(highlight.value)"
            class="color-btn"
            :title="highlight.name"
          >
            <div
              class="color-swatch"
              :style="{ backgroundColor: highlight.value || '#FFFFFF', border: '1px solid #E5E7EB' }"
            ></div>
          </button>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Code -->
    <button
      @click="editor.chain().focus().toggleCode().run()"
      :class="{ 'is-active': editor.isActive('code') }"
      class="menu-btn"
      title="Inline code"
    >
      <Icon name="lucide:code" />
    </button>
    </template>

    <div v-if="!isSpacerOrDividerSelected()" class="divider"></div>

    <!-- Delete Block -->
    <button
      @click="deleteCurrentBlock"
      class="menu-btn delete-btn"
      title="Delete block"
    >
      <Icon name="lucide:trash-2" />
    </button>
  </div>
</template>

<style scoped>
.bubble-menu-content {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
              0 4px 6px -4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transform: translateX(-50%);
  pointer-events: auto;
}

.menu-btn {
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  transition: background-color 0.1s ease;
}

.menu-btn :deep(svg) {
  width: 16px;
  height: 16px;
}

.menu-btn:hover {
  background: #F3F4F6;
}

.menu-btn.is-active {
  background: #E5E7EB;
  color: #111827;
}

.divider {
  width: 1px;
  height: 20px;
  background: #E5E7EB;
  margin: 0 4px;
}

.relative {
  position: relative;
}

.color-picker {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
              0 4px 6px -4px rgba(0, 0, 0, 0.1);
  z-index: 101;
  min-width: 180px;
}

.color-picker-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6B7280;
  margin-bottom: 8px;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.color-btn {
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
}

.color-btn:hover {
  background: #F3F4F6;
}

.color-swatch {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.highlight-icon {
  font-size: 18px;
}

/* Link Input Popup */
.link-popup {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
              0 4px 6px -4px rgba(0, 0, 0, 0.1);
  z-index: 101;
  min-width: 300px;
  display: flex;
  gap: 8px;
}

.link-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
  font-family: inherit;
}

.link-input:focus {
  border-color: #3B82F6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.link-actions {
  display: flex;
  gap: 4px;
}

.link-action-btn {
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.link-action-btn :deep(svg) {
  width: 14px;
  height: 14px;
}

.link-action-btn.apply {
  color: #10B981;
}

.link-action-btn.apply:hover {
  background: #D1FAE5;
}

.link-action-btn.remove {
  color: #EF4444;
}

.link-action-btn.remove:hover {
  background: #FEE2E2;
}

/* Block Type Selector */
.block-type-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 6px;
}

.block-type-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.chevron-icon {
  width: 12px;
  height: 12px;
  color: #9CA3AF;
  transition: transform 0.15s ease;
}

.block-type-picker {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
              0 4px 6px -4px rgba(0, 0, 0, 0.1);
  z-index: 101;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.block-type-option {
  all: unset;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  transition: background-color 0.1s ease;
}

.block-type-option:hover {
  background: #F3F4F6;
}

.block-type-option :deep(svg) {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.block-type-option span {
  white-space: nowrap;
}

/* Delete Button */
.delete-btn {
  color: #374151;
}

.delete-btn:hover {
  background: #F3F4F6;
}

</style>
