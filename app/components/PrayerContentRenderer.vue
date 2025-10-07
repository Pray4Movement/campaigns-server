<template>
  <div class="prayer-content-renderer">
    <div v-for="block in blocks" :key="block.id" class="content-block">
      <!-- Header -->
      <component
        v-if="block.type === 'header'"
        :is="`h${block.data.level}`"
        class="header-block"
      >
        {{ block.data.text }}
      </component>

      <!-- Paragraph -->
      <p v-else-if="block.type === 'paragraph'" class="paragraph-block" v-html="block.data.text" />

      <!-- Checklist (list with checklist style) -->
      <div v-else-if="block.type === 'list' && block.data.style === 'checklist'" class="checklist-block">
        <div v-for="(item, idx) in block.data.items" :key="idx" class="checklist-item">
          <input type="checkbox" :checked="item.meta?.checked === true" disabled />
          <span v-html="getListItemContent(item)" />
        </div>
      </div>

      <!-- Regular list -->
      <component
        v-else-if="block.type === 'list'"
        :is="getListStyle(block.data) === 'ordered' ? 'ol' : 'ul'"
        class="list-block"
      >
        <li v-for="(item, idx) in block.data.items" :key="idx">
          <span v-html="getListItemContent(item)" />
          <component :is="getListItemChildren(item)" v-if="getListItemChildren(item)" />
        </li>
      </component>

      <!-- Quote -->
      <blockquote v-else-if="block.type === 'quote'" class="quote-block">
        <p v-html="block.data.text" />
        <cite v-if="block.data.caption" v-html="block.data.caption" />
      </blockquote>

      <!-- Image -->
      <figure v-else-if="block.type === 'image'" class="image-block" :class="{
        'with-border': block.data.withBorder,
        'with-background': block.data.withBackground,
        'stretched': block.data.stretched
      }">
        <img :src="block.data.file.url" :alt="block.data.caption || ''" />
        <figcaption v-if="block.data.caption" v-html="block.data.caption" />
      </figure>

      <!-- Video (embed) -->
      <div v-else-if="block.type === 'embed'" class="embed-block">
        <iframe
          :src="block.data.embed"
          :width="block.data.width"
          :height="block.data.height"
          frameborder="0"
          allowfullscreen
        />
        <p v-if="block.data.caption" class="embed-caption" v-html="block.data.caption" />
      </div>

      <!-- Table -->
      <div v-else-if="block.type === 'table'" class="table-block">
        <table>
          <thead v-if="block.data.withHeadings">
            <tr>
              <th v-for="(cell, idx) in block.data.content[0]" :key="idx" v-html="cell" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIdx) in (block.data.withHeadings ? block.data.content.slice(1) : block.data.content)" :key="rowIdx">
              <td v-for="(cell, cellIdx) in row" :key="cellIdx" v-html="cell" />
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Delimiter -->
      <div v-else-if="block.type === 'delimiter'" class="delimiter-block">
        <span>* * *</span>
      </div>

      <!-- Warning -->
      <div v-else-if="block.type === 'warning'" class="warning-block">
        <div class="warning-icon">⚠️</div>
        <div class="warning-content">
          <div class="warning-title" v-html="block.data.title" />
          <div class="warning-message" v-html="block.data.message" />
        </div>
      </div>

      <!-- Code -->
      <pre v-else-if="block.type === 'code'" class="code-block"><code>{{ block.data.code }}</code></pre>

      <!-- Link Tool -->
      <div v-else-if="block.type === 'linkTool'" class="link-block">
        <a :href="block.data.link" target="_blank" rel="noopener noreferrer" class="link-preview">
          <img v-if="block.data.meta.image?.url" :src="block.data.meta.image.url" :alt="block.data.meta.title" class="link-image" />
          <div class="link-info">
            <div class="link-title">{{ block.data.meta.title }}</div>
            <div v-if="block.data.meta.description" class="link-description">{{ block.data.meta.description }}</div>
            <div class="link-url">{{ block.data.link }}</div>
          </div>
        </a>
      </div>

      <!-- Raw (fallback) -->
      <div v-else-if="block.type === 'raw'" class="raw-block" v-html="block.data.html" />

      <!-- Unknown block type -->
      <div v-else class="unknown-block">
        <em>Unsupported block type: {{ block.type }}</em>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Block {
  id: string
  type: string
  data: any
}

interface EditorData {
  blocks?: Block[]
}

const props = defineProps<{
  content: EditorData | null
}>()

const blocks = computed(() => props.content?.blocks || [])

// Helper function to determine list style
function getListStyle(data: any): string {
  // Check for style property (simple list or nested list)
  if (data.style) {
    return data.style
  }
  // Default to unordered
  return 'unordered'
}

// Helper function to get list item content
function getListItemContent(item: any): string {
  // If item is a string, return it directly
  if (typeof item === 'string') {
    return item
  }
  // If item is an object with content property, return content
  if (typeof item === 'object' && item.content) {
    return item.content
  }
  // Fallback
  return String(item)
}

// Helper function to check if list item has nested items
function getListItemChildren(item: any): any {
  // If item is an object with items property, it has children
  if (typeof item === 'object' && item.items && Array.isArray(item.items) && item.items.length > 0) {
    // Return a render function for nested list
    return () => {
      const ListTag = item.style === 'ordered' ? 'ol' : 'ul'
      return h(ListTag, { class: 'list-block nested-list' },
        item.items.map((child: any, idx: number) =>
          h('li', { key: idx }, [
            h('span', { innerHTML: getListItemContent(child) }),
            getListItemChildren(child) ? getListItemChildren(child)() : null
          ])
        )
      )
    }
  }
  return null
}
</script>

<style scoped>
.prayer-content-renderer {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.content-block {
  margin-bottom: 1.5rem;
}

/* Headers */
.header-block {
  font-weight: bold;
  line-height: 1.3;
  margin: 1.5rem 0 1rem;
}

h2.header-block {
  font-size: 2rem;
}

h3.header-block {
  font-size: 1.5rem;
}

h4.header-block {
  font-size: 1.25rem;
}

h5.header-block {
  font-size: 1.125rem;
}

h6.header-block {
  font-size: 1rem;
}

/* Paragraph */
.paragraph-block {
  line-height: 1.7;
  margin: 0;
}

/* List */
.list-block {
  padding-left: 1.5rem;
  margin: 1rem 0;
}

.list-block li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.list-block.nested-list {
  margin: 0.5rem 0 0;
}

/* Checklist */
.checklist-block {
  margin: 1rem 0;
}

.checklist-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.checklist-item input[type="checkbox"] {
  margin-top: 0.25rem;
  cursor: default;
}

/* Quote */
.quote-block {
  border-left: 4px solid var(--border);
  padding: 1rem 1.5rem;
  margin: 1.5rem 0;
  background: var(--bg-soft);
  font-style: italic;
}

.quote-block p {
  margin: 0 0 0.5rem;
}

.quote-block cite {
  display: block;
  font-size: 0.875rem;
  color: var(--text-muted);
  font-style: normal;
}

/* Image */
.image-block {
  margin: 2rem 0;
  text-align: center;
}

.image-block img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.image-block.with-border img {
  border: 1px solid var(--border);
}

.image-block.with-background {
  padding: 1rem;
  background: var(--bg-soft);
}

.image-block.stretched img {
  width: 100%;
}

.image-block figcaption {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: var(--text-muted);
  font-style: italic;
}

/* Embed */
.embed-block {
  margin: 2rem 0;
}

.embed-block iframe {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 4px;
}

.embed-caption {
  margin-top: 0.75rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-muted);
}

/* Table */
.table-block {
  margin: 2rem 0;
  overflow-x: auto;
}

.table-block table {
  width: 100%;
  border-collapse: collapse;
}

.table-block th,
.table-block td {
  border: 1px solid var(--border);
  padding: 0.75rem;
  text-align: left;
}

.table-block th {
  background: var(--bg-soft);
  font-weight: 600;
}

/* Delimiter */
.delimiter-block {
  text-align: center;
  margin: 2rem 0;
  font-size: 1.5rem;
  letter-spacing: 0.5rem;
  color: var(--text-muted);
}

/* Warning */
.warning-block {
  display: flex;
  gap: 1rem;
  background: var(--bg-soft);
  border-left: 4px solid var(--text);
  border-radius: 4px;
  padding: 1.25rem 1.5rem;
  margin: 1.5rem 0;
}

.warning-icon {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
}

.warning-content {
  flex: 1;
  min-width: 0;
}

.warning-title {
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.warning-message {
  line-height: 1.6;
  font-size: 0.9375rem;
  opacity: 0.9;
}

/* Code */
.code-block {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1rem;
  overflow-x: auto;
  font-family: monospace;
  font-size: 0.875rem;
}

/* Link Preview */
.link-block {
  margin: 1.5rem 0;
}

.link-preview {
  display: flex;
  gap: 1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  text-decoration: none;
  color: var(--text);
  transition: background-color 0.2s;
}

.link-preview:hover {
  background: var(--bg-soft);
}

.link-image {
  width: 200px;
  height: 150px;
  object-fit: cover;
  flex-shrink: 0;
}

.link-info {
  padding: 1rem;
  flex: 1;
  min-width: 0;
}

.link-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.link-description {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.link-url {
  font-size: 0.75rem;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Raw HTML */
.raw-block {
  margin: 1rem 0;
}

/* Unknown block */
.unknown-block {
  padding: 1rem;
  background: var(--bg-soft);
  border: 1px dashed var(--border);
  border-radius: 4px;
  color: var(--text-muted);
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .prayer-content-renderer {
    padding: 1rem 0.5rem;
  }

  .link-preview {
    flex-direction: column;
  }

  .link-image {
    width: 100%;
    height: 200px;
  }

  h2.header-block {
    font-size: 1.75rem;
  }

  h3.header-block {
    font-size: 1.375rem;
  }
}
</style>
