import type { FieldDefinition } from '../types'

export const field: FieldDefinition = {
  key: 'doxa_wagf_region',
  labelKey: 'peopleGroups.fields.doxa_wagf_region',
  type: 'select',
  category: 'wagf',
  options: [
    { value: 'africa', labelKey: 'peopleGroups.options.wagfRegion.africa' },
    { value: 'asia', labelKey: 'peopleGroups.options.wagfRegion.asia' },
    { value: 'europe', labelKey: 'peopleGroups.options.wagfRegion.europe' },
    { value: 'latin_america_&_caribbean', labelKey: 'peopleGroups.options.wagfRegion.latin_america_caribbean' },
    { value: 'middle_east', labelKey: 'peopleGroups.options.wagfRegion.middle_east' },
    { value: 'na', labelKey: 'peopleGroups.options.wagfRegion.na' },
    { value: 'north_america_&_non-spanish_caribbean', labelKey: 'peopleGroups.options.wagfRegion.north_america_caribbean' },
    { value: 'oceania', labelKey: 'peopleGroups.options.wagfRegion.oceania' }
  ]
}
