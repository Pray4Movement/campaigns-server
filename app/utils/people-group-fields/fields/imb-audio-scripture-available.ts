import type { FieldDefinition } from '../types'

export const field: FieldDefinition = {
  key: 'imb_audio_scripture_available',
  labelKey: 'peopleGroups.fields.imb_audio_scripture_available',
  type: 'select',
  category: 'resources',
  options: [
    { value: '0', labelKey: 'peopleGroups.options.availability.notAvailable' },
    { value: '1', labelKey: 'peopleGroups.options.availability.available' },
    { value: '2', labelKey: 'peopleGroups.options.availability.none' }
  ]
}
