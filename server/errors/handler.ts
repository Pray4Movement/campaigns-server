import type { H3Error, H3Event } from 'h3'

export default defineEventHandler((event) => {
  const error = event.context.error as H3Error | Error

  // Get status code from error or default to 500
  const statusCode = 'statusCode' in error ? error.statusCode : 500
  const statusMessage = 'statusMessage' in error ? error.statusMessage : 'Internal Server Error'

  // Log the full error to server console for debugging
  console.error(`[${statusCode}] ${statusMessage}:`, error.message)
  if ('stack' in error && error.stack) {
    console.error(error.stack)
  }

  // Set response status
  setResponseStatus(event, statusCode, statusMessage)

  // Return sanitized error response (never include stack trace)
  return {
    error: true,
    statusCode,
    statusMessage,
    message: error.message || statusMessage
  }
})
