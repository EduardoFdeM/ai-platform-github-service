export interface PlatformUser {
  id: string
  email: string
  display_name: string
  is_active: boolean
  created_at: string
}

export interface PlatformSession {
  accessToken: string
  tokenType: 'bearer'
  expiresAt: number
  user: PlatformUser
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const SESSION_KEY = 'github-sync.platform-session.v1'

function browserSessionStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function createPlatformSession(
  accessToken: string,
  expiresInSeconds: number,
  user: PlatformUser,
  now = Date.now(),
): PlatformSession {
  return {
    accessToken,
    tokenType: 'bearer',
    expiresAt: now + Math.max(0, expiresInSeconds) * 1000,
    user,
  }
}

export function isSessionExpired(session: PlatformSession, now = Date.now()): boolean {
  // A pequena margem evita iniciar uma requisição com um token prestes a vencer.
  return session.expiresAt <= now + 5_000
}

export function savePlatformSession(session: PlatformSession, storage = browserSessionStorage()): void {
  storage?.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearPlatformSession(storage = browserSessionStorage()): void {
  storage?.removeItem(SESSION_KEY)
}

export function readPlatformSession(
  storage = browserSessionStorage(),
  now = Date.now(),
): PlatformSession | null {
  const serialized = storage?.getItem(SESSION_KEY)
  if (!serialized) return null

  try {
    const session = JSON.parse(serialized) as Partial<PlatformSession>
    const valid =
      typeof session.accessToken === 'string' &&
      session.accessToken.length > 0 &&
      session.tokenType === 'bearer' &&
      typeof session.expiresAt === 'number' &&
      typeof session.user?.id === 'string' &&
      typeof session.user?.email === 'string'

    if (!valid || isSessionExpired(session as PlatformSession, now)) {
      storage?.removeItem(SESSION_KEY)
      return null
    }
    return session as PlatformSession
  } catch {
    storage?.removeItem(SESSION_KEY)
    return null
  }
}

export function sessionRemainingSeconds(session: PlatformSession, now = Date.now()): number {
  return Math.max(0, Math.ceil((session.expiresAt - now) / 1000))
}

export function authorizationHeader(session: PlatformSession | null): Record<string, string> {
  if (!session || isSessionExpired(session)) return {}
  return { Authorization: `Bearer ${session.accessToken}` }
}
