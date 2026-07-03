import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'

beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'test-encryption-key-for-vitest-only'
})

const getModule = () => import('@/lib/encryption')

describe('encrypt / decrypt', () => {
  it('round-trips a plain string', async () => {
    const { encrypt, decrypt } = await getModule()
    const plaintext = 'hello world'
    expect(decrypt(encrypt(plaintext))).toBe(plaintext)
  })

  it('round-trips an empty string', async () => {
    const { encrypt, decrypt } = await getModule()
    expect(decrypt(encrypt(''))).toBe('')
  })

  it('round-trips a string with special characters', async () => {
    const { encrypt, decrypt } = await getModule()
    const text = 'p@$$w0rd! <>&"'
    expect(decrypt(encrypt(text))).toBe(text)
  })

  it('produces different ciphertexts for the same input (random IV)', async () => {
    const { encrypt } = await getModule()
    const a = encrypt('same input')
    const b = encrypt('same input')
    expect(a).not.toBe(b)
  })

  it('ciphertext has the expected IV:authTag:data format', async () => {
    const { encrypt } = await getModule()
    const parts = encrypt('test').split(':')
    expect(parts).toHaveLength(3)
    // IV = 16 bytes hex = 32 chars
    expect(parts[0]).toHaveLength(32)
    // authTag = 16 bytes hex = 32 chars
    expect(parts[1]).toHaveLength(32)
  })

  it('throws on tampered ciphertext', async () => {
    const { encrypt, decrypt } = await getModule()
    const tampered = encrypt('secret').slice(0, -4) + '0000'
    expect(() => decrypt(tampered)).toThrow()
  })

  it('throws when format is wrong (not three colon-delimited parts)', async () => {
    const { decrypt } = await getModule()
    expect(() => decrypt('notvalid')).toThrow('Invalid encrypted text format')
  })
})

describe('getEncryptionKey branches', () => {
  const originalKey = process.env.ENCRYPTION_KEY

  afterEach(() => {
    process.env.ENCRYPTION_KEY = originalKey
    vi.resetModules()
  })

  it('falls back to a random key and warns when ENCRYPTION_KEY is unset', async () => {
    delete process.env.ENCRYPTION_KEY
    vi.resetModules()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { encrypt, decrypt } = await getModule()
    const plaintext = 'no key configured'
    expect(decrypt(encrypt(plaintext))).toBe(plaintext)
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('ENCRYPTION_KEY environment variable not set')
    )

    warnSpy.mockRestore()
  })

  it('uses a 64-char hex string directly as the key', async () => {
    process.env.ENCRYPTION_KEY = 'a'.repeat(64)
    vi.resetModules()

    const { encrypt, decrypt } = await getModule()
    const plaintext = 'hex encoded key'
    expect(decrypt(encrypt(plaintext))).toBe(plaintext)
  })

  it('hashes a non-hex key string down to 32 bytes', async () => {
    process.env.ENCRYPTION_KEY = 'a-plain-passphrase-not-hex'
    vi.resetModules()

    const { encrypt, decrypt } = await getModule()
    const plaintext = 'hashed key'
    expect(decrypt(encrypt(plaintext))).toBe(plaintext)
  })
})
