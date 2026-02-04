import type { FieldDefinition } from '../types'

export const field: FieldDefinition = {
  key: 'imb_bible_translation_level',
  labelKey: 'peopleGroups.fields.imb_bible_translation_level',
  type: 'select',
  category: 'resources',
  options: [
    { value: '0', labelKey: 'peopleGroups.options.bibleTranslationLevel.0' },
    { value: '1', labelKey: 'peopleGroups.options.bibleTranslationLevel.1' },
    { value: '2', labelKey: 'peopleGroups.options.bibleTranslationLevel.2' },
    { value: '3', labelKey: 'peopleGroups.options.bibleTranslationLevel.3' },
    { value: '4', labelKey: 'peopleGroups.options.bibleTranslationLevel.4' }
  ]
}
