import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User } from '@prisma/client'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}))

vi.mock('bcryptjs', () => {
  const compare = vi.fn()
  return { compare, default: { compare } }
})

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'

// next-auth's CredentialsProvider() factory returns a stub `authorize: () => null`
// and stashes the real config (including the authorize we defined) under `.options`;
// the stub only gets replaced by `.options.authorize` inside NextAuth's internal
// request handling (core/lib/providers.js), so tests must reach into `.options`.
const credentialsProviderConfig = authOptions.providers.find(
  (p) => p.id === 'credentials'
) as unknown as {
  options: {
    authorize: (
      credentials: { email: string; password: string } | undefined
    ) => Promise<unknown>
  }
}
const credentialsProvider = credentialsProviderConfig.options

const mockUser = {
  id: 'user-1',
  email: 'jane@example.com',
  name: 'Jane Doe',
  password: 'hashed-password',
  role: 'ADMIN',
  company: 'CallPro',
}

describe('auth authorize', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when email or password is missing', async () => {
    expect(await credentialsProvider.authorize(undefined)).toBeNull()
    expect(await credentialsProvider.authorize({ email: '', password: 'x' })).toBeNull()
    expect(await credentialsProvider.authorize({ email: 'a@b.com', password: '' })).toBeNull()
  })

  it('returns null when no user is found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const result = await credentialsProvider.authorize({
      email: 'jane@example.com',
      password: 'secret',
    })

    expect(result).toBeNull()
  })

  it('returns null when user has no password set', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...mockUser, password: null } as unknown as User)

    const result = await credentialsProvider.authorize({
      email: 'jane@example.com',
      password: 'secret',
    })

    expect(result).toBeNull()
  })

  it('returns null when password is invalid', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as unknown as User)
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

    const result = await credentialsProvider.authorize({
      email: 'jane@example.com',
      password: 'wrong-password',
    })

    expect(result).toBeNull()
  })

  it('returns the user when credentials are valid', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as unknown as User)
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

    const result = await credentialsProvider.authorize({
      email: 'jane@example.com',
      password: 'secret',
    })

    expect(result).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      role: mockUser.role,
      company: mockUser.company,
    })
  })
})

describe('auth callbacks', () => {
  it('jwt copies role, company, and id from user onto the token', async () => {
    const token = { sub: 'user-1' }
    const user = { role: 'HR_MANAGER', company: 'CallPro', id: 'user-1' }

    // @ts-expect-error partial callback args are sufficient for this test
    const result = await authOptions.callbacks!.jwt!({ token, user })

    expect(result).toMatchObject({
      role: 'HR_MANAGER',
      company: 'CallPro',
      id: 'user-1',
    })
  })

  it('jwt leaves the token untouched when no user is present', async () => {
    const token = { sub: 'user-1', role: 'ADMIN' }

    // @ts-expect-error partial callback args are sufficient for this test
    const result = await authOptions.callbacks!.jwt!({ token })

    expect(result).toEqual(token)
  })

  it('session copies id, role, and company from token onto session.user', async () => {
    const session = { user: {}, expires: '2099-01-01' }
    const token = { role: 'IT_STAFF', company: 'CallPro', id: 'user-1' }

    // @ts-expect-error partial callback args are sufficient for this test
    const result = await authOptions.callbacks!.session!({ session, token })

    expect(result.user).toMatchObject({
      id: 'user-1',
      role: 'IT_STAFF',
      company: 'CallPro',
    })
  })
})
