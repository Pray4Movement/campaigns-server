// Language definitions for multi-language support

export interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
  deeplTarget: string  // DeepL target language code
  deeplSource: string  // DeepL source language code (sometimes different)
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', deeplTarget: 'EN', deeplSource: 'EN' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', deeplTarget: 'ES', deeplSource: 'ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', deeplTarget: 'FR', deeplSource: 'FR' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', deeplTarget: 'PT-BR', deeplSource: 'PT' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', deeplTarget: 'DE', deeplSource: 'DE' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', deeplTarget: 'IT', deeplSource: 'IT' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', deeplTarget: 'ZH-HANS', deeplSource: 'ZH' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', deeplTarget: 'AR', deeplSource: 'AR' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', deeplTarget: 'RU', deeplSource: 'RU' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', deeplTarget: 'HI', deeplSource: 'HI' },
]

// Language codes array - single source of truth for supported languages
export const LANGUAGE_CODES = LANGUAGES.map(lang => lang.code)

// Get DeepL target language code from app language code
export function getDeeplTargetCode(code: string): string {
  const lang = getLanguageByCode(code)
  return lang?.deeplTarget || code.toUpperCase()
}

// Get DeepL source language code from app language code
export function getDeeplSourceCode(code: string): string {
  const lang = getLanguageByCode(code)
  return lang?.deeplSource || code.toUpperCase()
}

export function getLanguageByCode(code: string): Language | undefined {
  return LANGUAGES.find(lang => lang.code === code)
}

export function getLanguageName(code: string): string {
  const language = getLanguageByCode(code)
  return language ? language.name : code
}

export function getLanguageFlag(code: string): string {
  const language = getLanguageByCode(code)
  return language ? language.flag : '🌐'
}
