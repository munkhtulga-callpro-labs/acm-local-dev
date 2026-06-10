import crypto from 'crypto'

const algorithm = 'aes-256-gcm'

// Ensure encryption key is properly formatted (32 bytes for AES-256)
function getEncryptionKey(): Buffer {
  const keyString = process.env.ENCRYPTION_KEY

  if (!keyString) {
    console.warn('ENCRYPTION_KEY environment variable not set. Using random key (not suitable for production!)')
    return crypto.randomBytes(32)
  }

  // If key is hex-encoded, convert it
  if (keyString.length === 64 && /^[0-9a-fA-F]+$/.test(keyString)) {
    return Buffer.from(keyString, 'hex')
  }

  // If key is a string, hash it to get exactly 32 bytes
  return crypto.createHash('sha256').update(keyString).digest()
}

const key = getEncryptionKey()

export function encrypt(text: string): string {
  // Generate a random initialization vector
  const iv = crypto.randomBytes(16)

  // Create cipher with proper IV
  const cipher = crypto.createCipheriv(algorithm, key, iv)

  // Encrypt the text
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  // Get the authentication tag for GCM mode
  const authTag = cipher.getAuthTag()

  // Return IV:authTag:encrypted format
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

export function decrypt(encryptedText: string): string {
  // Split the encrypted text into its components
  const parts = encryptedText.split(':')

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format')
  }

  const [ivHex, authTagHex, encrypted] = parts

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  // Create decipher with proper IV
  const decipher = crypto.createDecipheriv(algorithm, key, iv)

  // Set the authentication tag for GCM mode
  decipher.setAuthTag(authTag)

  // Decrypt the text
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
