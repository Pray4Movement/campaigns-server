/**
 * DeepL Translation Utility
 *
 * Provides translation services using the DeepL API.
 * Handles both plain text and Tiptap JSON content.
 */

// All supported language codes for translation
export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'pt', 'de', 'it', 'zh', 'ar', 'ru', 'hi']

// Map app language codes to DeepL language codes
const DEEPL_LANGUAGE_MAP: Record<string, string> = {
  en: 'EN',
  es: 'ES',
  fr: 'FR',
  pt: 'PT-BR', // Using Brazilian Portuguese as default
  de: 'DE',
  it: 'IT',
  zh: 'ZH-HANS', // Simplified Chinese
  ar: 'AR',
  ru: 'RU',
  hi: 'HI'
}

// Map DeepL source language codes (some are different)
const DEEPL_SOURCE_LANGUAGE_MAP: Record<string, string> = {
  en: 'EN',
  es: 'ES',
  fr: 'FR',
  pt: 'PT',
  de: 'DE',
  it: 'IT',
  zh: 'ZH',
  ar: 'AR',
  ru: 'RU',
  hi: 'HI'
}

interface DeepLTranslation {
  detected_source_language: string
  text: string
}

interface DeepLResponse {
  translations: DeepLTranslation[]
}

/**
 * Translate text using DeepL API
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<string> {
  const config = useRuntimeConfig()
  const apiKey = config.deeplApiKey

  if (!apiKey) {
    throw new Error('DEEPL_API_KEY is not configured')
  }

  const targetLang = DEEPL_LANGUAGE_MAP[targetLanguage] || targetLanguage.toUpperCase()
  const sourceLang = sourceLanguage
    ? DEEPL_SOURCE_LANGUAGE_MAP[sourceLanguage] || sourceLanguage.toUpperCase()
    : undefined

  const params = new URLSearchParams({
    text,
    target_lang: targetLang
  })

  if (sourceLang) {
    params.append('source_lang', sourceLang)
  }

  // Use quality_optimized model for best translation quality
  params.append('model', 'quality_optimized')

  const apiUrl = config.deeplApiUrl || 'https://api-free.deepl.com'

  const response = await fetch(`${apiUrl}/v2/translate`, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DeepL API error: ${response.status} - ${errorText}`)
  }

  const data: DeepLResponse = await response.json()

  if (!data.translations || data.translations.length === 0) {
    throw new Error('No translation returned from DeepL')
  }

  return data.translations[0].text
}

/**
 * Translate multiple texts in a single API call (more efficient)
 */
export async function translateTexts(
  texts: string[],
  targetLanguage: string,
  sourceLanguage?: string
): Promise<string[]> {
  if (texts.length === 0) return []

  const config = useRuntimeConfig()
  const apiKey = config.deeplApiKey

  if (!apiKey) {
    throw new Error('DEEPL_API_KEY is not configured')
  }

  const targetLang = DEEPL_LANGUAGE_MAP[targetLanguage] || targetLanguage.toUpperCase()
  const sourceLang = sourceLanguage
    ? DEEPL_SOURCE_LANGUAGE_MAP[sourceLanguage] || sourceLanguage.toUpperCase()
    : undefined

  const params = new URLSearchParams({
    target_lang: targetLang
  })

  // Add each text as a separate 'text' parameter
  for (const text of texts) {
    params.append('text', text)
  }

  if (sourceLang) {
    params.append('source_lang', sourceLang)
  }

  // Use quality_optimized model for best translation quality
  params.append('model', 'quality_optimized')

  const apiUrl = config.deeplApiUrl || 'https://api-free.deepl.com'

  const response = await fetch(`${apiUrl}/v2/translate`, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DeepL API error: ${response.status} - ${errorText}`)
  }

  const data: DeepLResponse = await response.json()

  if (!data.translations) {
    throw new Error('No translations returned from DeepL')
  }

  return data.translations.map(t => t.text)
}

/**
 * Interface for Tiptap JSON node
 */
interface TiptapNode {
  type: string
  content?: TiptapNode[]
  text?: string
  marks?: any[]
  attrs?: Record<string, any>
}

/**
 * Extract all text content from Tiptap JSON
 * Returns array of { path, text } for reconstruction
 */
function extractTexts(node: TiptapNode, path: number[] = []): Array<{ path: number[]; text: string }> {
  const results: Array<{ path: number[]; text: string }> = []

  if (node.type === 'text' && node.text) {
    results.push({ path: [...path], text: node.text })
  }

  if (node.content && Array.isArray(node.content)) {
    node.content.forEach((child, index) => {
      results.push(...extractTexts(child, [...path, index]))
    })
  }

  return results
}

/**
 * Set text at a specific path in the Tiptap JSON tree
 */
function setTextAtPath(node: TiptapNode, path: number[], text: string): void {
  if (path.length === 0) {
    node.text = text
    return
  }

  const [index, ...rest] = path
  if (node.content && node.content[index]) {
    setTextAtPath(node.content[index], rest, text)
  }
}

/**
 * Translate Tiptap JSON content
 * Preserves structure, marks, and attributes while translating text nodes
 */
export async function translateTiptapContent(
  contentJson: TiptapNode,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<TiptapNode> {
  // Deep clone the content to avoid mutating the original
  const cloned: TiptapNode = JSON.parse(JSON.stringify(contentJson))

  // Extract all text nodes with their paths
  const textEntries = extractTexts(cloned)

  if (textEntries.length === 0) {
    return cloned
  }

  // Get all texts to translate
  const textsToTranslate = textEntries.map(e => e.text)

  // Translate all texts in batch
  const translatedTexts = await translateTexts(textsToTranslate, targetLanguage, sourceLanguage)

  // Put translated texts back into the cloned structure
  textEntries.forEach((entry, index) => {
    setTextAtPath(cloned, entry.path, translatedTexts[index])
  })

  return cloned
}

/**
 * Check if DeepL API is configured
 */
export function isDeepLConfigured(): boolean {
  const config = useRuntimeConfig()
  return !!config.deeplApiKey
}

/**
 * Get DeepL usage statistics
 */
export async function getDeepLUsage(): Promise<{ character_count: number; character_limit: number }> {
  const config = useRuntimeConfig()
  const apiKey = config.deeplApiKey

  if (!apiKey) {
    throw new Error('DEEPL_API_KEY is not configured')
  }

  const apiUrl = config.deeplApiUrl || 'https://api-free.deepl.com'

  const response = await fetch(`${apiUrl}/v2/usage`, {
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DeepL API error: ${response.status} - ${errorText}`)
  }

  return await response.json()
}
