import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

function getEncryptionKey(): Buffer {
  const hex = process.env.DISPLAY_PASSWORD_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('DISPLAY_PASSWORD_KEY must be a 64-char hex string (32 bytes)')
  }
  return Buffer.from(hex, 'hex')
}

/** Encrypt plaintext → `iv:ciphertext:tag` (all hex). */
export function encryptDisplayPassword(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`
}

/** Decrypt `iv:ciphertext:tag` → plaintext. Returns null on failure. */
export function decryptDisplayPassword(stored: string): string | null {
  try {
    const parts = stored.split(':')
    if (parts.length !== 3) return null
    const [ivHex, encHex, tagHex] = parts as [string, string, string]
    const key = getEncryptionKey()
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()])
    return decrypted.toString('utf8')
  } catch {
    return null
  }
}
