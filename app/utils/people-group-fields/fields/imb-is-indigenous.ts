import type { FieldDefinition } from '../types'

export const field: FieldDefinition = {
  key: 'imb_is_indigenous',
  labelKey: 'peopleGroups.fields.imb_is_indigenous',
  type: 'select',
  category: 'geography',
  options: [
    { value: '0', labelKey: 'peopleGroups.options.indigenous.diaspora' },
    { value: '1', labelKey: 'peopleGroups.options.indigenous.indigenous' }
  ]
}
