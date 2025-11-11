/**
 * TipTap Editor Configuration
 * Centralized configuration for colors, limits, and constants
 */

/**
 * Base color palette - Define colors once and reuse throughout
 *
 * Benefits:
 * - Single source of truth for color values
 * - Easy to update theme colors
 * - Prevents color duplication
 * - Follows Tailwind CSS naming convention
 */
export const palette = {
  // Grayscale
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Brand colors
  blue: {
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },

  // Semantic colors
  red: {
    500: '#EF4444',
  },
  yellow: {
    100: '#FEF3C7',
  },
  blue_light: {
    100: '#DBEAFE',
  },
} as const

export const editorConfig = {
  /**
   * Color palette for the editor
   */
  colors: {
    // Border colors
    border: {
      default: palette.gray[200],
      hover: palette.gray[300],
      focus: palette.gray[400],
    },

    // Text colors
    text: {
      primary: palette.gray[900],
      secondary: palette.gray[500],
      placeholder: palette.gray[400],
      code: palette.red[500],
      codeBlock: palette.gray[100],
    },

    // Background colors
    background: {
      default: palette.white,
      code: palette.gray[100],
      codeBlock: palette.gray[800],
      hover: palette.gray[100],
      active: palette.gray[200],
      highlight: palette.yellow[100],
      selection: palette.blue_light[100],
    },

    // Link colors
    link: {
      default: palette.blue[500],
      hover: palette.blue[600],
    },

    // Checkbox colors
    checkbox: {
      border: palette.gray[500],
      checked: palette.black,
      checkedMark: palette.white,
    },

    // Blockquote colors
    blockquote: {
      border: palette.gray[200],
      text: palette.gray[500],
    },

    // Horizontal rule
    hr: {
      border: palette.gray[200],
    },

    // Selection/focus
    selected: {
      outline: palette.blue[500],
    },

    // Drag handle
    dragHandle: {
      border: palette.gray[200],
      icon: palette.gray[400],
      iconHover: palette.gray[700],
    },
  },

  /**
   * Layout dimensions and spacing
   */
  layout: {
    // Editor container
    padding: {
      top: '40px',
      right: '56px',
      bottom: '40px',
      left: '56px',
    },
    minHeight: '300px',
    borderRadius: '8px',
    borderWidth: '1px',

    // Focus shadow
    focusRing: {
      spread: '3px',
      opacity: 0.1,
    },

    // Drag handle positioning
    dragHandleOffset: '-60px',
  },

  /**
   * Typography settings
   */
  typography: {
    // Base text
    base: {
      fontSize: '16px',
      lineHeight: 1.6,
    },

    // Headings
    headings: {
      h1: {
        fontSize: '2.5em',
        fontWeight: 700,
        lineHeight: 1.2,
        marginTop: '2rem',
        marginBottom: '0.5rem',
      },
      h2: {
        fontSize: '1.875em',
        fontWeight: 700,
        lineHeight: 1.3,
        marginTop: '1.5rem',
        marginBottom: '0.5rem',
      },
      h3: {
        fontSize: '1.5em',
        fontWeight: 600,
        lineHeight: 1.4,
        marginTop: '1rem',
        marginBottom: '0.5rem',
      },
    },

    // Code
    code: {
      fontSize: '0.9em',
      fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace",
    },

    // Code block
    codeBlock: {
      fontSize: '0.875rem',
      lineHeight: 1.7,
      padding: '1rem',
      borderRadius: '8px',
    },
  },

  /**
   * Upload configuration
   */
  upload: {
    image: {
      // Maximum file size in bytes (10MB)
      maxSize: 10 * 1024 * 1024,

      // Accepted MIME types
      accept: 'image/*',

      // Maximum number of files
      limit: 1,

      // API endpoint
      endpoint: '/api/upload/image',
    },
  },

  /**
   * Editor extensions configuration
   */
  extensions: {
    // Heading levels to enable
    headingLevels: [1, 2, 3],

    // Text alignment options
    textAlignTypes: ['heading', 'paragraph'],

    // Image configuration
    image: {
      inline: true,
      allowBase64: true,
      resize: {
        enabled: true,
        directions: ['top', 'bottom', 'left', 'right'],
        minWidth: 50,
        minHeight: 50,
        alwaysPreserveAspectRatio: true,
      },
    },

    // Task item configuration
    taskItem: {
      nested: true,
    },

    // Highlight configuration
    highlight: {
      multicolor: true,
    },
  },

  /**
   * Placeholder text
   */
  placeholder: {
    default: 'Type "/" for commands or start writing...',
    heading: 'Heading',
  },

  /**
   * Slash commands menu configuration
   */
  slashCommand: {
    trigger: '/',
    startOfLine: false,
    maxResults: 15,

    // Tippy.js menu placement
    menu: {
      placement: 'bottom-start',
      theme: 'light',
      arrow: false,
      interactive: true,
    },
  },

  /**
   * Drag handle configuration
   */
  dragHandle: {
    placement: 'left',
    strategy: 'absolute',
    gap: '2px',
    marginRight: '8px',
  },

  /**
   * Checkbox dimensions
   */
  checkbox: {
    size: '1.125rem',
    borderWidth: '2px',
    borderRadius: '0.25rem',
    marginTop: '0.25rem',

    // Checkmark positioning
    checkmark: {
      left: '0.25rem',
      top: '0.0625rem',
      width: '0.375rem',
      height: '0.625rem',
      borderWidth: '0 2px 2px 0',
    },
  },

  /**
   * Spacing values
   */
  spacing: {
    paragraph: {
      margin: '0.75rem 0',
    },
    list: {
      paddingLeft: '1rem',
      itemMargin: '0.25rem 0',
    },
    taskList: {
      gap: '0.5rem',
    },
    blockquote: {
      paddingLeft: '1rem',
      margin: '1rem 0',
      borderWidth: '3px',
    },
    image: {
      margin: '1.5rem 0',
      borderRadius: '8px',
    },
    hr: {
      margin: '2rem 0',
    },
  },

  /**
   * Transitions
   */
  transitions: {
    default: '0.15s ease',
  },
} as const

/**
 * Type exports for use in other modules
 */
export type Palette = typeof palette
export type EditorConfig = typeof editorConfig
