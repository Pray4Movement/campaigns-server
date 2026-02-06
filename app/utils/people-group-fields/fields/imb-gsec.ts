import type { FieldDefinition } from '../types'

export const field: FieldDefinition = {
  key: 'imb_gsec',
  labelKey: 'peopleGroups.fields.imb_gsec',
  type: 'select',
  category: 'strategic',
  description: 'Global Status of Evangelical Christianity',
  options: [
    { value: '0', labelKey: 'peopleGroups.options.gsec.0' },
    { value: '1', labelKey: 'peopleGroups.options.gsec.1' },
    { value: '2', labelKey: 'peopleGroups.options.gsec.2' },
    { value: '3', labelKey: 'peopleGroups.options.gsec.3' },
    { value: '4', labelKey: 'peopleGroups.options.gsec.4' },
    { value: '5', labelKey: 'peopleGroups.options.gsec.5' },
    { value: '6', labelKey: 'peopleGroups.options.gsec.6' }
  ]
}
