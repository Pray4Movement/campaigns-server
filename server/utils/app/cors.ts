import { type H3Event, setResponseHeader } from 'h3'

/**
 * Set CORS headers for public API endpoints
 * Allows cross-origin requests from WordPress themes and other clients
 */
export function setCorsHeaders(event: H3Event) {
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*')
  setResponseHeader(event, 'Access-Control-Allow-Methods', 'GET, OPTIONS')
  setResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type')
}

/**
 * Set cache headers for public API endpoints
 * Default: 5 minutes for both browser and CDN
 */
export function setCacheHeaders(event: H3Event, options?: {
  maxAge?: number
  sMaxAge?: number
}) {
  const maxAge = options?.maxAge ?? 300
  const sMaxAge = options?.sMaxAge ?? 300
  setResponseHeader(event, 'Cache-Control', `public, max-age=${maxAge}, s-maxage=${sMaxAge}`)
}
