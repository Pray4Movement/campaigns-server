import type { H3Event } from 'h3'
import { createError, H3Error, getRouterParam } from 'h3'

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
  if (!process.env.VITEST) {
    console.error(`${defaultMessage}:`, error)
  }
  throw createError({
    statusCode,
    statusMessage: getErrorMessage(error) || defaultMessage
  })
}

/**
 * Get and validate an integer route parameter.
 * Throws 400 error if parameter is missing, not a number, or <= 0.
 */
export function getIntParam(event: H3Event, paramName: string): number {
  const raw = getRouterParam(event, paramName)
  const value = Number(raw)

  if (!raw || isNaN(value) || value <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid ${paramName}`
    })
  }

  return value
}

/**
 * Get and validate a UUID route parameter.
 * Throws 400 error if parameter is missing or not a valid UUID format.
 */
export function getUuidParam(event: H3Event, paramName: string): string {
  const raw = getRouterParam(event, paramName)

  if (!raw) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid ${paramName}`
    })
  }

  // UUID regex pattern (accepts any valid UUID format)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (!uuidRegex.test(raw)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid ${paramName}`
    })
  }

  return raw
}
