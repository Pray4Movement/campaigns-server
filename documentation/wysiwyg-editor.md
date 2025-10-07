# WYSIWYG Rich Text Editor - Tiptap

## Overview

We use **Tiptap** as our WYSIWYG rich text editor for prayer fuel content creation. Tiptap is a headless, framework-agnostic text editor based on ProseMirror, with excellent Vue 3 and Nuxt 4 support.

## Why Tiptap?

- **Modern & Flexible** - Built on ProseMirror, highly customizable
- **Vue 3 Native** - First-class Vue 3 support with official Nuxt module
- **Headless** - Full control over UI and styling
- **Extensible** - Rich ecosystem of extensions
- **TypeScript** - Full TypeScript support
- **Active Development** - Well-maintained with regular updates

## Installation

```bash
npm install @tiptap/vue-3 @tiptap/starter-kit @tiptap/pm
```

## Basic Usage

### In Nuxt Components

```vue
<template>
  <ClientOnly>
    <EditorContent :editor="editor" />
  </ClientOnly>
</template>

<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

const editor = useEditor({
  content: '<p>Start typing...</p>',
  extensions: [
    StarterKit,
  ],
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>
```

### Important: Client-Only Rendering

Tiptap must be wrapped in `<ClientOnly>` in Nuxt to avoid SSR issues:

```vue
<ClientOnly>
  <EditorContent :editor="editor" />
</ClientOnly>
```

## Recommended Extensions

### StarterKit (Included by default)
- Bold, Italic, Strike
- Headings (H1-H6)
- Paragraph
- Bullet list, Ordered list
- Blockquote
- Code block
- Hard break
- History (undo/redo)

### Additional Extensions

```bash
# Images
npm install @tiptap/extension-image

# YouTube videos
npm install @tiptap/extension-youtube

# Text alignment
npm install @tiptap/extension-text-align

# Highlight
npm install @tiptap/extension-highlight

# Link
npm install @tiptap/extension-link
```

## Prayer Fuel Editor Implementation

For prayer fuel content, we'll use:

1. **Title Field** - Regular input for title
2. **Rich Content Editor** - Tiptap with:
   - Text formatting (bold, italic, underline)
   - Headings (H2, H3)
   - Lists (bullet, numbered)
   - Images
   - Scripture quotes (blockquote)
   - Prayer prompts (custom styling)

### Example Configuration

```javascript
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [2, 3], // Only H2 and H3
      },
    }),
    Image,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Highlight,
  ],
  content: prayerContent.value,
})
```

## Storing Content

Tiptap can export content as:

1. **HTML** - For display (recommended)
2. **JSON** - For storage and restoration
3. **Markdown** - For simple text

### Recommended Storage Format

Store as **JSON** in database, render as **HTML** on frontend:

```javascript
// Get JSON for storage
const contentJSON = editor.getJSON()

// Get HTML for preview
const contentHTML = editor.getHTML()

// Restore from JSON
editor.commands.setContent(storedJSON)
```

## Styling

Tiptap is headless, so you control all styling:

```css
/* Basic editor styling */
.ProseMirror {
  min-height: 200px;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.ProseMirror:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Content styling */
.ProseMirror h2 {
  font-size: 1.5rem;
  margin: 1.5rem 0 0.5rem;
}

.ProseMirror p {
  margin: 0.5rem 0;
}

.ProseMirror blockquote {
  border-left: 3px solid var(--color-primary);
  padding-left: 1rem;
  font-style: italic;
}
```

## Toolbar Implementation

Create a custom toolbar with Vue components:

```vue
<div class="toolbar">
  <button @click="editor.chain().focus().toggleBold().run()">
    Bold
  </button>
  <button @click="editor.chain().focus().toggleItalic().run()">
    Italic
  </button>
  <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">
    H2
  </button>
  <!-- More buttons... -->
</div>
```

## Best Practices

1. **Always wrap in ClientOnly** - Prevents SSR issues
2. **Destroy on unmount** - Clean up editor instance
3. **Store as JSON** - Better for data integrity
4. **Customize toolbar** - Only show needed features
5. **Style consistently** - Match your app's design
6. **Validate content** - Sanitize HTML before saving

## Resources

- [Tiptap Documentation](https://tiptap.dev/)
- [Nuxt Integration Guide](https://tiptap.dev/docs/editor/getting-started/install/nuxt)
- [Vue 3 Examples](https://tiptap.dev/docs/editor/examples/default)
- [Extension Library](https://tiptap.dev/docs/editor/extensions/overview)

## Migration Path

For existing prayer content:

1. Keep current `body_text` field as fallback
2. Add new `content_json` field for Tiptap
3. Migrate existing text to Tiptap JSON format
4. Render from JSON with HTML fallback
