import { readFileSync } from 'fs'
import { join } from 'path'

interface FieldOption {
  label: string
}

interface FieldDefinition {
  key: string
  options?: Record<string, FieldOption>
}

interface FieldOptionsData {
  fields: FieldDefinition[]
}

let fieldOptionsCache: FieldOptionsData | null = null

function loadFieldOptions(): FieldOptionsData {
  if (fieldOptionsCache) {
    return fieldOptionsCache
  }

  try {
    const filePath = join(process.cwd(), 'data', 'field_options.json')
    const content = readFileSync(filePath, 'utf-8')
    fieldOptionsCache = JSON.parse(content) as FieldOptionsData
    return fieldOptionsCache
  } catch (error) {
    console.error('Failed to load field_options.json:', error)
    return { fields: [] }
  }
}

export function getFieldOptionLabel(fieldKey: string, optionKey: string): string | null {
  const data = loadFieldOptions()
  const field = data.fields.find(f => f.key === fieldKey)

  if (!field?.options) {
    return null
  }

  const option = field.options[optionKey]
  return option?.label || null
}

export function getLanguageLabel(code: string): string | null {
  return getFieldOptionLabel('imb_reg_of_language', code)
}

export function getReligionLabel(code: string): string | null {
  return getFieldOptionLabel('imb_reg_of_religion_3', code)
}
