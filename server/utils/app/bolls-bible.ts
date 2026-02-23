/**
 * Bolls.life Bible API client
 * Fetches verse text from the Bolls.life API (no API key required).
 *
 * The `bibleId` stored in language config is a Bolls translation code (e.g., "NKJV", "RV1960").
 *
 * Some translations use different chapter/verse numbering than English (NKJV).
 * The remapping logic below adjusts references before querying the API.
 */

interface FetchVerseParams {
  bibleId: string
  bookId: string
  chapter: number
  verseStart?: number
  verseEnd?: number
}

interface BollsVerse {
  pk: number
  verse: number
  text: string
}

/**
 * USFM book code → Bolls.life book number (standard Protestant canon, 1-66)
 */
export const USFM_TO_BOOK_NUMBER: Record<string, number> = {
  GEN: 1, EXO: 2, LEV: 3, NUM: 4, DEU: 5,
  JOS: 6, JDG: 7, RUT: 8, '1SA': 9, '2SA': 10,
  '1KI': 11, '2KI': 12, '1CH': 13, '2CH': 14, EZR: 15,
  NEH: 16, EST: 17, JOB: 18, PSA: 19, PRO: 20,
  ECC: 21, SNG: 22, ISA: 23, JER: 24, LAM: 25,
  EZK: 26, DAN: 27, HOS: 28, JOL: 29, AMO: 30,
  OBA: 31, JON: 32, MIC: 33, NAM: 34, HAB: 35,
  ZEP: 36, HAG: 37, ZEC: 38, MAL: 39,
  MAT: 40, MRK: 41, LUK: 42, JHN: 43, ACT: 44,
  ROM: 45, '1CO': 46, '2CO': 47, GAL: 48, EPH: 49,
  PHP: 50, COL: 51, '1TH': 52, '2TH': 53, '1TI': 54,
  '2TI': 55, TIT: 56, PHM: 57, HEB: 58, JAS: 59,
  '1PE': 60, '2PE': 61, '1JN': 62, '2JN': 63, '3JN': 64,
  JUD: 65, REV: 66,
}

// ---------------------------------------------------------------------------
// Reference remapping for translations with different numbering
// ---------------------------------------------------------------------------

interface ChapterRemap {
  book: string
  fromChapter: number
  fromVerseStart?: number // If set, only applies when verse >= this
  toChapter: number
  verseOffset: number     // Added to verse numbers
}

interface TranslationMapping {
  psalmChapterOffset?: { fromChapter: number; toChapter: number; offset: number }
  psalmVerseOffset?: boolean // Auto-detect verse offset for superscription counting
  remaps?: ChapterRemap[]
}

const TRANSLATION_MAPPINGS: Record<string, TranslationMapping> = {
  SYNOD: {
    // Psalms 10-146: English psalm N = SYNOD psalm N-1
    psalmChapterOffset: { fromChapter: 10, toChapter: 146, offset: -1 },
    psalmVerseOffset: true,
    remaps: [
      // English Romans 16:25-27 → SYNOD Romans 14:24-26
      { book: 'ROM', fromChapter: 16, fromVerseStart: 25, toChapter: 14, verseOffset: -1 },
    ]
  },
  BDS: {
    psalmVerseOffset: true,
    remaps: [
      // English Joel 2:28-32 → BDS Joel 3:1-5
      { book: 'JOL', fromChapter: 2, fromVerseStart: 28, toChapter: 3, verseOffset: -27 },
      // English Joel 3:* → BDS Joel 4:*
      { book: 'JOL', fromChapter: 3, toChapter: 4, verseOffset: 0 },
      // English Malachi 4:* → BDS Malachi 3:(verse+18)
      { book: 'MAL', fromChapter: 4, toChapter: 3, verseOffset: 18 },
    ]
  },
  S00: {
    psalmVerseOffset: true,
    remaps: [
      { book: 'JOL', fromChapter: 2, fromVerseStart: 28, toChapter: 3, verseOffset: -27 },
      { book: 'JOL', fromChapter: 3, toChapter: 4, verseOffset: 0 },
      { book: 'MAL', fromChapter: 4, toChapter: 3, verseOffset: 18 },
    ]
  }
}

interface RemappedRef {
  chapter: number
  verseStart?: number
  verseEnd?: number
  needsPsalmVerseOffset: boolean
}

function remapReference(
  bibleId: string,
  bookId: string,
  chapter: number,
  verseStart?: number,
  verseEnd?: number
): RemappedRef {
  const mapping = TRANSLATION_MAPPINGS[bibleId]
  if (!mapping) {
    return { chapter, verseStart, verseEnd, needsPsalmVerseOffset: false }
  }

  let ch = chapter
  let vs = verseStart
  let ve = verseEnd

  // Psalm chapter offset (SYNOD: LXX numbering)
  if (mapping.psalmChapterOffset && bookId === 'PSA') {
    const { fromChapter, toChapter, offset } = mapping.psalmChapterOffset
    if (ch >= fromChapter && ch <= toChapter) {
      ch = ch + offset
      console.log(`[Bolls remap] ${bibleId} Psalm ${chapter} → Psalm ${ch}`)
    }
  }

  // Specific chapter/verse remaps
  if (mapping.remaps) {
    for (const remap of mapping.remaps) {
      if (remap.book !== bookId || remap.fromChapter !== chapter) continue

      // If remap has fromVerseStart, only apply if our verse range starts at or after it
      if (remap.fromVerseStart !== undefined) {
        if (vs === undefined || vs < remap.fromVerseStart) continue
      }

      const oldCh = ch
      ch = remap.toChapter
      if (vs !== undefined) vs = vs + remap.verseOffset
      if (ve !== undefined) ve = ve + remap.verseOffset
      console.log(`[Bolls remap] ${bibleId} ${bookId} ${oldCh}:${verseStart}-${verseEnd} → ${ch}:${vs}-${ve}`)
      break
    }
  }

  const needsPsalmVerseOffset = !!(mapping.psalmVerseOffset && bookId === 'PSA')
  return { chapter: ch, verseStart: vs, verseEnd: ve, needsPsalmVerseOffset }
}

// ---------------------------------------------------------------------------
// Core API client
// ---------------------------------------------------------------------------

function cleanVerseText(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/\s*\[\d+\]/g, '').replace(/[\u24B6-\u24E9\u2460-\u2473]/g, '')
}

export function isBollsBibleConfigured(bibleId: string | undefined): boolean {
  return !!bibleId
}

// Throttle: max ~240 requests/minute to stay under Bolls rate limit (256/min)
let lastBollsCall = 0
const BOLLS_MIN_INTERVAL = 250

async function throttle() {
  const now = Date.now()
  const elapsed = now - lastBollsCall
  if (elapsed < BOLLS_MIN_INTERVAL) {
    await new Promise(r => setTimeout(r, BOLLS_MIN_INTERVAL - elapsed))
  }
  lastBollsCall = Date.now()
}

// Cache full chapters to avoid re-fetching the same chapter for different verse ranges
const chapterCache = new Map<string, BollsVerse[]>()

async function fetchChapter(bibleId: string, bookNumber: number, chapter: number): Promise<BollsVerse[]> {
  const cacheKey = `${bibleId}/${bookNumber}/${chapter}`
  const cached = chapterCache.get(cacheKey)
  if (cached) {
    console.log(`[Bolls] Cache hit: ${cacheKey}`)
    return cached
  }

  await throttle()

  const url = `https://bolls.life/get-text/${bibleId}/${bookNumber}/${chapter}/`
  console.log(`[Bolls] Fetching: ${url}`)
  const response = await fetch(url)

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[Bolls] API error ${response.status}: ${errorText}`)
    throw new Error(`Bolls Bible API error: ${response.status} - ${errorText}`)
  }

  const verses: BollsVerse[] = await response.json()
  console.log(`[Bolls] Got ${verses.length} verses for ${cacheKey}`)
  chapterCache.set(cacheKey, verses)
  return verses
}

export async function fetchVerseText(params: FetchVerseParams): Promise<string> {
  const { bibleId, bookId, chapter, verseStart, verseEnd } = params

  const bookNumber = USFM_TO_BOOK_NUMBER[bookId]
  if (!bookNumber) {
    throw new Error(`Unknown USFM book code: "${bookId}"`)
  }

  // Remap chapter/verse numbers for translations with different numbering
  const remapped = remapReference(bibleId, bookId, chapter, verseStart, verseEnd)

  const verses = await fetchChapter(bibleId, bookNumber, remapped.chapter)

  let vs = remapped.verseStart
  let ve = remapped.verseEnd

  // Auto-detect psalm verse offset by comparing with NKJV
  if (remapped.needsPsalmVerseOffset && vs !== undefined) {
    const nkjvVerses = await fetchChapter('NKJV', bookNumber, chapter)
    const nkjvMax = Math.max(...nkjvVerses.map(v => v.verse))
    const targetMax = Math.max(...verses.map(v => v.verse))
    const offset = targetMax - nkjvMax

    if (offset > 0) {
      console.log(`[Bolls remap] Psalm verse offset: +${offset} (NKJV max=${nkjvMax}, ${bibleId} max=${targetMax})`)
      vs = vs + offset
      if (ve !== undefined) ve = ve + offset
    }
  }

  // Filter by verse range if specified
  let filtered = verses
  if (vs !== undefined) {
    const end = ve ?? vs
    filtered = verses.filter(v => v.verse >= vs! && v.verse <= end)
  }

  if (filtered.length === 0) {
    throw new Error('No verse data returned from Bolls Bible')
  }

  return filtered.map(v => cleanVerseText(v.text)).join(' ').trim()
}
