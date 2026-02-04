import type { FieldDefinition } from '../types'

export const field: FieldDefinition = {
  key: 'imb_strategic_priority_index',
  labelKey: 'peopleGroups.fields.imb_strategic_priority_index',
  type: 'select',
  category: 'strategic',
  options: [
    { value: '0', labelKey: 'peopleGroups.options.strategicPriorityIndex.0' },
    { value: '1', labelKey: 'peopleGroups.options.strategicPriorityIndex.1' },
    { value: '2', labelKey: 'peopleGroups.options.strategicPriorityIndex.2' }
  ]
}
