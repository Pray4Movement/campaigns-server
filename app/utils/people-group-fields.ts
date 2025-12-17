export type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'boolean'

export interface SelectOption {
  value: string
  label: string
}

export interface FieldDefinition {
  key: string
  label: string
  type: FieldType
  description?: string
  options?: SelectOption[]
  optionsKey?: string // Key to load options from field_options.json
  readOnly?: boolean
}

export interface FieldCategory {
  key: string
  label: string
  fields: FieldDefinition[]
}

// Field categories with their field definitions
// Options will be loaded dynamically from data/field_options.json
export const peopleGroupFieldCategories: FieldCategory[] = [
  {
    key: 'basic',
    label: 'Basic Info',
    fields: [
      { key: 'name', label: 'People Group Name', type: 'text' },
      { key: 'imb_display_name', label: 'Display Name', type: 'text' },
      { key: 'imb_alternate_name', label: 'Alternate Name', type: 'text' },
      { key: 'imb_people_name', label: 'People Name (ROP3)', type: 'text' },
      { key: 'imb_people_description', label: 'Description', type: 'textarea' },
      { key: 'imb_location_description', label: 'Location Description', type: 'textarea' }
    ]
  },
  {
    key: 'identifiers',
    label: 'Identifiers',
    fields: [
      { key: 'dt_id', label: 'Disciple Tools ID', type: 'text', readOnly: true },
      { key: 'doxa_masteruid', label: 'Doxa Master UID', type: 'text' },
      { key: 'doxa_wagf_uid', label: 'WAGF UID', type: 'text' },
      { key: 'imb_uid', label: 'IMB UID', type: 'text' },
      { key: 'imb_pgid', label: 'People Group ID (PGID)', type: 'text' },
      { key: 'imb_peid', label: 'IMB PEID', type: 'text' }
    ]
  },
  {
    key: 'geography',
    label: 'Geography',
    fields: [
      { key: 'imb_isoalpha3', label: 'ISO Alpha 3 Country Code', type: 'select', optionsKey: 'imb_isoalpha3' },
      { key: 'imb_region', label: 'Region', type: 'select', optionsKey: 'imb_region' },
      { key: 'imb_subregion', label: 'Sub Region', type: 'select', optionsKey: 'imb_subregion' },
      { key: 'imb_lat', label: 'Latitude', type: 'number' },
      { key: 'imb_lng', label: 'Longitude', type: 'number' },
      { key: 'imb_is_indigenous', label: 'Indigenous Status', type: 'select', options: [
        { value: '0', label: 'Diaspora' },
        { value: '1', label: 'Indigenous' }
      ]}
    ]
  },
  {
    key: 'population',
    label: 'Population & Engagement',
    fields: [
      { key: 'imb_population', label: 'Population', type: 'number' },
      { key: 'imb_population_class', label: 'Population Class', type: 'select', optionsKey: 'imb_population_class' },
      { key: 'imb_evangelical_percentage', label: 'Evangelical %', type: 'number' },
      { key: 'imb_evangelical_level', label: 'Evangelical Level', type: 'select', optionsKey: 'imb_evangelical_level' },
      { key: 'imb_engagement_status', label: 'Engagement Status', type: 'select', optionsKey: 'imb_engagement_status' },
      { key: 'imb_congregation_existing', label: 'Congregation Exists', type: 'select', optionsKey: 'imb_congregation_existing' },
      { key: 'imb_church_planting', label: 'Church Planting Status', type: 'select', optionsKey: 'imb_church_planting' }
    ]
  },
  {
    key: 'strategic',
    label: 'Strategic Metrics',
    fields: [
      { key: 'imb_gsec', label: 'GSEC', type: 'select', optionsKey: 'imb_gsec', description: 'Global Status of Evangelical Christianity' },
      { key: 'imb_strategic_priority_index', label: 'Strategic Priority Index', type: 'select', optionsKey: 'imb_strategic_priority_index' },
      { key: 'imb_lostness_priority_index', label: 'Lostness Priority Index', type: 'select', optionsKey: 'imb_lostness_priority_index' },
      { key: 'imb_affinity_code', label: 'Affinity Code', type: 'select', optionsKey: 'imb_affinity_code' }
    ]
  },
  {
    key: 'language',
    label: 'Language',
    fields: [
      { key: 'imb_reg_of_language', label: 'Registry of Language', type: 'select', optionsKey: 'imb_reg_of_language' },
      { key: 'imb_language_family', label: 'Language Family', type: 'select', optionsKey: 'imb_language_family' },
      { key: 'imb_language_class', label: 'Language Class', type: 'select', optionsKey: 'imb_language_class' },
      { key: 'imb_language_speakers', label: 'Language Speakers', type: 'number' }
    ]
  },
  {
    key: 'religion',
    label: 'Religion',
    fields: [
      { key: 'imb_reg_of_religion', label: 'Registry of Religion', type: 'select', optionsKey: 'imb_reg_of_religion' },
      { key: 'imb_reg_of_religion_3', label: 'ROR3', type: 'select', optionsKey: 'imb_reg_of_religion_3' },
      { key: 'imb_reg_of_religion_4', label: 'ROR4', type: 'select', optionsKey: 'imb_reg_of_religion_4' }
    ]
  },
  {
    key: 'rop',
    label: 'People Classification (ROP)',
    fields: [
      { key: 'imb_reg_of_people_3', label: 'ROP3 ID', type: 'number' },
      { key: 'imb_reg_of_people_2', label: 'ROP2 People Cluster', type: 'select', optionsKey: 'imb_reg_of_people_2' },
      { key: 'imb_reg_of_people_1', label: 'ROP1 Affinity Block', type: 'select', optionsKey: 'imb_reg_of_people_1' },
      { key: 'imb_reg_of_people_25', label: 'ROP25 Ethne', type: 'select', optionsKey: 'imb_reg_of_people_25' }
    ]
  },
  {
    key: 'resources',
    label: 'Resources Available',
    fields: [
      { key: 'imb_bible_available', label: 'Bible Translation Status', type: 'select', optionsKey: 'imb_bible_available' },
      { key: 'imb_jesus_film_available', label: 'Jesus Film Status', type: 'select', optionsKey: 'imb_jesus_film_available' },
      { key: 'imb_radio_broadcast_available', label: 'Radio Broadcast Status', type: 'select', optionsKey: 'imb_radio_broadcast_available' },
      { key: 'imb_gospel_recordings_available', label: 'Gospel Translation Status', type: 'select', optionsKey: 'imb_gospel_recordings_available' },
      { key: 'imb_audio_scripture_available', label: 'Audio Bible Status', type: 'select', optionsKey: 'imb_audio_scripture_available' },
      { key: 'imb_bible_stories_available', label: 'Bible Stories Status', type: 'select', optionsKey: 'imb_bible_stories_available' },
      { key: 'imb_total_resources_available', label: 'Total Resources', type: 'number' },
      { key: 'imb_bible_translation_level', label: 'Bible Translation Level', type: 'select', optionsKey: 'imb_bible_translation_level' },
      { key: 'imb_bible_year_published', label: 'Year of Bible Publication', type: 'text' }
    ]
  },
  {
    key: 'wagf',
    label: 'WAGF/Doxa',
    fields: [
      { key: 'doxa_wagf_region', label: 'WAGF Region', type: 'select', optionsKey: 'doxa_wagf_region' },
      { key: 'doxa_wagf_block', label: 'WAGF Block', type: 'select', optionsKey: 'doxa_wagf_block' },
      { key: 'doxa_wagf_member', label: 'WAGF Member', type: 'select', optionsKey: 'doxa_wagf_member' }
    ]
  },
  {
    key: 'media',
    label: 'Media',
    fields: [
      { key: 'image_url', label: 'Picture URL', type: 'text' },
      { key: 'imb_picture_credit_html', label: 'Picture Credit', type: 'textarea' },
      { key: 'imb_has_photo', label: 'Has Photo', type: 'boolean' },
      { key: 'imb_people_search_text', label: 'People Search Text', type: 'text' }
    ]
  }
]

// Helper to get a flat list of all fields
export function getAllFields(): FieldDefinition[] {
  return peopleGroupFieldCategories.flatMap(cat => cat.fields)
}

// Helper to get a field by key
export function getFieldByKey(key: string): FieldDefinition | undefined {
  return getAllFields().find(f => f.key === key)
}

// Fields stored directly on the people_groups table (not in metadata)
export const tableFields = ['name', 'image_url', 'dt_id']

// Helper to determine if a field is in metadata
export function isMetadataField(key: string): boolean {
  return !tableFields.includes(key)
}
