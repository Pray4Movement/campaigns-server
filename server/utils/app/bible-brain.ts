/**
 * Bible Brain (DBP v4) API client
 * Fetches verse text from the Digital Bible Platform API.
 *
 * The `bibleId` stored in language config is a bible abbreviation (e.g., "ENGNKJV").
 * The API requires a full fileset ID for verse lookups, so we resolve it
 * by querying the bible's filesets and finding the plain-text ones.
 * Some bibles have a single complete fileset; others are split into OT and NT.
 */

import { useRuntimeConfig } from '#imports'

interface FetchVerseParams {
  bibleId: string
  bookId: string
  chapter: number
  verseStart?: number
  verseEnd?: number
}

interface BibleBrainVerse {
  verse_start: number
  verse_end: number
  verse_text: string
}

interface BibleBrainVerseResponse {
  data: BibleBrainVerse[]
}

interface BibleBrainFileset {
  id: string
  type: string
  size: string
}

interface BibleBrainBibleResponse {
  data: {
    filesets: Record<string, BibleBrainFileset[]>
  }
}

// Cache resolved fileset IDs per bible abbreviation
// Stores an ordered list: complete first, then NT, then OT
const filesetCache = new Map<string, string[]>()

export function isBibleBrainConfigured(): boolean {
  const config = useRuntimeConfig()
  return !!config.bibleBrainApiKey
}

/**
 * Resolve a bible abbreviation to its plain-text fileset IDs.
 * Returns an ordered array: complete ("C") first, then NT, then OT.
 */
async function resolveTextFilesetIds(bibleId: string, apiKey: string): Promise<string[]> {
  const cached = filesetCache.get(bibleId)
  if (cached) return cached

  const url = new URL(`https://4.dbt.io/api/bibles/${bibleId}`)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('v', '4')

  const response = await fetch(url.toString())

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Bible Brain API error looking up bible "${bibleId}": ${response.status} - ${errorText}`)
  }

  const result: BibleBrainBibleResponse = await response.json()
  const filesets = result.data?.filesets

  if (!filesets) {
    throw new Error(`No filesets found for bible "${bibleId}"`)
  }

  // Collect all plain-text filesets, ordered by preference: C > NT > OT > other
  const sizeOrder: Record<string, number> = { C: 0, NT: 1, OT: 2 }
  const textFilesets: BibleBrainFileset[] = []

  for (const group of Object.values(filesets)) {
    for (const fs of group) {
      if (fs.type === 'text_plain') {
        textFilesets.push(fs)
      }
    }
  }

  if (textFilesets.length === 0) {
    throw new Error(`No plain-text fileset found for bible "${bibleId}"`)
  }

  textFilesets.sort((a, b) => (sizeOrder[a.size] ?? 3) - (sizeOrder[b.size] ?? 3))
  const ids = textFilesets.map(fs => fs.id)

  filesetCache.set(bibleId, ids)
  return ids
}

export async function fetchVerseText(params: FetchVerseParams): Promise<string> {
  const config = useRuntimeConfig()
  const apiKey = config.bibleBrainApiKey

  if (!apiKey) {
    throw new Error('BIBLE_BRAIN_API_KEY is not configured')
  }

  const { bibleId, bookId, chapter, verseStart, verseEnd } = params

  // Resolve the bible abbreviation to text fileset IDs
  const filesetIds = await resolveTextFilesetIds(bibleId, apiKey)

  // Try each fileset until one returns data (handles split OT/NT bibles)
  for (const filesetId of filesetIds) {
    const url = new URL(`https://4.dbt.io/api/bibles/filesets/${filesetId}/${bookId}/${chapter}`)
    url.searchParams.set('key', apiKey)
    url.searchParams.set('v', '4')
    if (verseStart !== undefined) {
      url.searchParams.set('verse_start', String(verseStart))
      url.searchParams.set('verse_end', String(verseEnd ?? verseStart))
    }

    const response = await fetch(url.toString())

    if (!response.ok) continue

    const data: BibleBrainVerseResponse = await response.json()

    if (data.data && data.data.length > 0) {
      return data.data.map(v => v.verse_text).join(' ').trim()
    }
  }

  throw new Error('No verse data returned from Bible Brain')
}
