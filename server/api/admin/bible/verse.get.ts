import { parseReference } from '../../../../config/bible-books'
import { fetchVerseText, isBibleBrainConfigured } from '#server/utils/app/bible-brain'
import { getBibleId } from '~/utils/languages'

/**
 * Fetch verse text from Bible Brain
 *
 * GET /api/admin/bible/verse?reference=John+3:16&language=en
 */
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'content.create')

  if (!isBibleBrainConfigured()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Bible Brain API is not configured. Please add BIBLE_BRAIN_API_KEY to environment.'
    })
  }

  const query = getQuery(event)
  const reference = String(query.reference || '').trim()
  const language = String(query.language || 'en').trim()

  if (!reference) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Reference query parameter is required (e.g., ?reference=John+3:16)'
    })
  }

  const parsed = parseReference(reference)
  if (!parsed) {
    throw createError({
      statusCode: 400,
      statusMessage: `Could not parse reference: "${reference}". Use format like "John 3:16" or "1 Corinthians 13:4-7".`
    })
  }

  const bibleId = getBibleId(language)
  if (!bibleId) {
    throw createError({
      statusCode: 400,
      statusMessage: `No Bible configured for language: ${language}`
    })
  }

  const text = await fetchVerseText({
    bibleId,
    bookId: parsed.bookId,
    chapter: parsed.chapter,
    verseStart: parsed.verseStart,
    verseEnd: parsed.verseEnd
  })

  return {
    reference,
    text,
    language
  }
})
