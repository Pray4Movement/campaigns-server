import { Node, mergeAttributes, type NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ImageUploadNode from '~/components/ImageUploadNode.vue'

export type UploadFunction = (
  file: File,
  onProgress?: (event: { progress: number }) => void,
  abortSignal?: AbortSignal
) => Promise<string>

export interface ImageUploadNodeOptions {
  /**
   * The type of node to replace with after upload.
   * @default 'image'
   */
  type?: string
  /**
   * Acceptable file types for upload.
   * @default 'image/*'
   */
  accept?: string
  /**
   * Maximum number of files that can be uploaded.
   * @default 1
   */
  limit?: number
  /**
   * Maximum file size in bytes (0 for unlimited).
   * @default 0
   */
  maxSize?: number
  /**
   * Function to handle the upload process.
   */
  upload?: UploadFunction
  /**
   * Callback for upload errors.
   */
  onError?: (error: Error) => void
  /**
   * Callback for successful uploads.
   */
  onSuccess?: (url: string) => void
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageUpload: {
      setImageUploadNode: (options?: ImageUploadNodeOptions) => ReturnType
    }
  }
}

export const ImageUploadExtension = Node.create<ImageUploadNodeOptions>({
  name: 'imageUpload',

  group: 'block',

  draggable: true,

  selectable: true,

  atom: true,

  addOptions() {
    return {
      type: 'image',
      accept: 'image/*',
      limit: 1,
      maxSize: 10485760, // 10MB default
      upload: undefined,
      onError: undefined,
      onSuccess: undefined,
    }
  },

  addAttributes() {
    return {
      accept: {
        default: this.options.accept,
      },
      limit: {
        default: this.options.limit,
      },
      maxSize: {
        default: this.options.maxSize,
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="image-upload"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({ 'data-type': 'image-upload' }, HTMLAttributes),
    ]
  },

  addNodeView(): NodeViewRenderer {
    return VueNodeViewRenderer(ImageUploadNode)
  },

  addCommands() {
    return {
      setImageUploadNode:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})

export default ImageUploadExtension
