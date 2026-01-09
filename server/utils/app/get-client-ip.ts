import { H3Event, getHeader } from 'h3'

export function getClientIp(event: H3Event): string {
  // Cloudflare provides the real client IP
  const cfIp = getHeader(event, 'cf-connecting-ip')
  if (cfIp) return cfIp

  // Fallback to X-Forwarded-For
  const xForwardedFor = getHeader(event, 'x-forwarded-for')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }

  return 'unknown'
}
