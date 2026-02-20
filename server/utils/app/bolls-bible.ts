/**
 * Bolls.life Bible API client
 * Fetches verse text from the Bolls.life API (no API key required).
 *
 * The `bibleId` stored in language config is a Bolls translation code (e.g., "NKJV", "RV1960").
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

function cleanVerseText(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/\s*\[\d+\]/g, '').replace(/[\u24B6-\u24E9\u2460-\u2473]/g, '')
}

export function isBollsBibleConfigured(bibleId: string | undefined): boolean {
  return !!bibleId
}

export async function fetchVerseText(params: FetchVerseParams): Promise<string> {
  const { bibleId, bookId, chapter, verseStart, verseEnd } = params

  const bookNumber = USFM_TO_BOOK_NUMBER[bookId]
  if (!bookNumber) {
    throw new Error(`Unknown USFM book code: "${bookId}"`)
  }

  const url = `https://bolls.life/get-text/${bibleId}/${bookNumber}/${chapter}/`
  const response = await fetch(url)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Bolls Bible API error: ${response.status} - ${errorText}`)
  }

  const verses: BollsVerse[] = await response.json()

  // Filter by verse range if specified
  let filtered = verses
  if (verseStart !== undefined) {
    const end = verseEnd ?? verseStart
    filtered = verses.filter(v => v.verse >= verseStart && v.verse <= end)
  }

  if (filtered.length === 0) {
    throw new Error('No verse data returned from Bolls Bible')
  }

  return filtered.map(v => cleanVerseText(v.text)).join(' ').trim()
}
