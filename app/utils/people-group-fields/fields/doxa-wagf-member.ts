import type { FieldDefinition } from '../types'

export const field: FieldDefinition = {
  key: 'doxa_wagf_member',
  labelKey: 'peopleGroups.fields.doxa_wagf_member',
  type: 'select',
  category: 'wagf',
  options: [
    { value: 'no', labelKey: 'peopleGroups.options.yesNo.no' },
    { value: 'yes', labelKey: 'peopleGroups.options.yesNo.yes' },
    { value: 'na', labelKey: 'peopleGroups.options.yesNo.na' }
  ]
}
