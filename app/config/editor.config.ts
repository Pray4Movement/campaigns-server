/**
 * TipTap Editor Configuration
 * Single source of truth for editor settings
 */

/**
 * Text color palette for the color picker
 * Mix of Doxa theme colors and standard accents
 */
export const textColors = [
  { name: 'Default', value: null },
  { name: 'Forest', value: '#3b463d' },      // Forest 500 - primary brand
  { name: 'Sage', value: '#92b195' },        // Forest 50 - light green
  { name: 'Beige', value: '#b4ada3' },       // Beige 500
  { name: 'Stone', value: '#5f594f' },       // Beige 800 / ui-text-muted
  { name: 'Plum', value: '#6b5b6e' },        // Muted purple
  { name: 'Red', value: '#EF4444' },         // Tailwind red-500
  { name: 'Green', value: '#10B981' },       // Tailwind emerald-500
  { name: 'Blue', value: '#3B82F6' }         // Tailwind blue-500
] as const

/**
 * Highlight color palette for the color picker
 * Light versions matching the text color palette
 */
export const highlightColors = [
  { name: 'None', value: null },
  { name: 'Forest', value: '#dce5dd' },      // Light forest green
  { name: 'Sage', value: '#e3e5e0' },        // Sage 200
  { name: 'Beige', value: '#f2f0ec' },       // Beige 100
  { name: 'Stone', value: '#e5e2db' },       // Gray 200
  { name: 'Plum', value: '#e8e4e9' },        // Light plum
  { name: 'Red', value: '#FEE2E2' },         // Tailwind red-100
  { name: 'Green', value: '#D1FAE5' },       // Tailwind emerald-100
  { name: 'Blue', value: '#DBEAFE' }         // Tailwind blue-100
] as const

export const editorConfig = {
  /**
   * Upload configuration
   */
  upload: {
    image: {
      maxSize: 10 * 1024 * 1024, // 10MB
      accept: 'image/*',
      limit: 1,
      endpoint: '/api/upload/image'
    }
  },

  /**
   * Placeholder text
   */
  placeholder: {
    default: 'Type "/" for commands or start writing...'
  }
} as const

export type EditorConfig = typeof editorConfig
