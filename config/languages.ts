// Single source of truth for language configuration
// Used by both nuxt.config.ts (i18n) and app/server code

export interface Language {
  code: string
  name: string           // English name
  nativeName: string     // Name in the language itself
  flag: string
  dir?: 'ltr' | 'rtl'    // Text direction (defaults to 'ltr')
  deeplTarget: string    // DeepL target language code
  deeplSource: string    // DeepL source language code (sometimes different)
  bibleId?: string       // Bolls.life translation ID for verse lookups
}

// Enable/disable languages by commenting/uncommenting entries
export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', deeplTarget: 'EN', deeplSource: 'EN', bibleId: 'NKJV' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', deeplTarget: 'ES', deeplSource: 'ES', bibleId: 'RV1960' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', deeplTarget: 'FR', deeplSource: 'FR', bibleId: 'BDS' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', deeplTarget: 'PT-BR', deeplSource: 'PT', bibleId: 'NAA' },
  // { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', deeplTarget: 'DE', deeplSource: 'DE', bibleId: 'S00' },
  // { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', deeplTarget: 'IT', deeplSource: 'IT', bibleId: 'NR06' },
  // { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', deeplTarget: 'ZH-HANS', deeplSource: 'ZH', bibleId: 'CUNPS' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl', deeplTarget: 'AR', deeplSource: 'AR', bibleId: 'SVD' }, // NAV (New Arabic Version) would be better but not on Bolls
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', deeplTarget: 'RU', deeplSource: 'RU', bibleId: 'SYNOD' }, // NRT (New Russian Translation) is a modern alternative
  // { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', deeplTarget: 'HI', deeplSource: 'HI', bibleId: 'HIOV' },
  // { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴', deeplTarget: 'RO', deeplSource: 'RO', bibleId: 'NTR' },
]

// Language codes array derived from enabled languages
export const LANGUAGE_CODES = LANGUAGES.map(lang => lang.code)

// Generate i18n locale config from LANGUAGES
export function generateI18nLocales() {
  return LANGUAGES.map(lang => ({
    code: lang.code,
    name: lang.nativeName,
    ...(lang.dir && { dir: lang.dir }),
    files: [
      `${lang.code}/common.json`,
      `${lang.code}/people-groups.json`,
      `${lang.code}/languages.json`
    ]
  }))
}
