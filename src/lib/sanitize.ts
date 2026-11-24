/**
 * Security helper to sanitize and escape user-provided strings against XSS injection
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    return ''
  }

  return input
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

export function cleanText(input: unknown, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return ''
  }

  // Strip null bytes and control chars except newlines and tabs
  const stripped = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  return stripped.trim().slice(0, maxLength)
}
