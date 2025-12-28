// Utility functions for encoding/decoding
export function encodeBase64(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str).toString('base64')
  }
  return btoa(str)
}

export function decodeBase64(str: string): string {
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(str, 'base64').toString('utf-8')
    }
    return atob(str)
  } catch (error) {
    console.error('Base64 decode error:', error)
    throw new Error('Invalid base64 string')
  }
}

export function getNodeEnv(): string {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV || 'development'
  }
  return 'development'
}

