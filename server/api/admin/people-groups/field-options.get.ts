import { readFileSync } from 'fs'
import { join } from 'path'

interface FieldOption {
  label: string
}

interface FieldDefinition {
  key: string
  type: string
  options?: Record<string, FieldOption> | FieldOption[]
}

interface FieldOptionsFile {
  fields: FieldDefinition[]
}

// Cache the processed options
let cachedOptions: Record<string, { value: string; label: string }[]> | null = null

function loadFieldOptions(): Record<string, { value: string; label: string }[]> {
  if (cachedOptions) {
    return cachedOptions
  }

  const filePath = join(process.cwd(), 'data', 'field_options.json')
  const fileContent = readFileSync(filePath, 'utf-8')
  const data: FieldOptionsFile = JSON.parse(fileContent)

  const options: Record<string, { value: string; label: string }[]> = {}

  for (const field of data.fields) {
    if (field.type === 'key_select' && field.options) {
      if (Array.isArray(field.options)) {
        // Array format: [{"label": "No"}, {"label": "Yes"}]
        // Use index as value
        options[field.key] = field.options.map((opt, index) => ({
          value: String(index),
          label: opt.label
        }))
      } else {
        // Object format: {"key": {"label": "Label"}}
        options[field.key] = Object.entries(field.options).map(([key, opt]) => ({
          value: key,
          label: opt.label
        }))
      }
    }
  }

  cachedOptions = options
  return options
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const fieldKey = query.field as string | undefined

  const allOptions = loadFieldOptions()

  if (fieldKey) {
    // Return options for a specific field
    return {
      options: allOptions[fieldKey] || []
    }
  }

  // Return all field options
  return {
    options: allOptions
  }
})
