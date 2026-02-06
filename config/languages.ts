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
}

// Enable/disable languages by commenting/uncommenting entries
export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', deeplTarget: 'EN', deeplSource: 'EN' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', deeplTarget: 'ES', deeplSource: 'ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', deeplTarget: 'FR', deeplSource: 'FR' },
  // { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', deeplTarget: 'PT-BR', deeplSource: 'PT' },
  // { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', deeplTarget: 'DE', deeplSource: 'DE' },
  // { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', deeplTarget: 'IT', deeplSource: 'IT' },
  // { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', deeplTarget: 'ZH-HANS', deeplSource: 'ZH' },
  // { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl', deeplTarget: 'AR', deeplSource: 'AR' },
  // { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', deeplTarget: 'RU', deeplSource: 'RU' },
  // { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', deeplTarget: 'HI', deeplSource: 'HI' },
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
