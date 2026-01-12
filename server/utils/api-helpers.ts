import { createError, H3Error } from 'h3'

/**
 * Type guard to check if error is already a Nitro/H3 HTTP error
 */
export function isNitroError(error: unknown): error is H3Error {
  return error instanceof H3Error || (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof (error as Record<string, unknown>).statusCode === 'number'
  )
}

/**
 * Safely extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Unknown error'
}

/**
 * Handle API errors with consistent pattern
 * - Re-throws existing Nitro errors (preserves status codes)
 * - Wraps unknown errors with specified status code (default 500)
 * - Logs error to console
 *
 * @param statusCode - HTTP status code for unknown errors (default 500)
 *   Use 400 for endpoints where errors are likely client-caused (validation, duplicates)
 *   Use 500 for endpoints where errors are likely server-caused (database failures)
 */
export function handleApiError(error: unknown, defaultMessage: string, statusCode: number = 500): never {
  // Re-throw existing HTTP errors (e.g., from requireAuth, createError)
  if (isNitroError(error)) {
    throw error
  }

  // Log and wrap unknown errors
  console.error(`${defaultMessage}:`, error)
  throw createError({
    statusCode,
    statusMessage: getErrorMessage(error) || defaultMessage
  })
}
