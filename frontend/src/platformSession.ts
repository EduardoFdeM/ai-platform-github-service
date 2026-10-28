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

export interface PlatformSessionStores {
  tab: StorageLike | null
  device: StorageLike | null
}

function browserSessionStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function browserLocalStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function browserSessionStores(): PlatformSessionStores {
  return { tab: browserSessionStorage(), device: browserLocalStorage() }
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

export function savePlatformSession(
  session: PlatformSession,
  rememberOnDevice = false,
  stores = browserSessionStores(),
): void {
  const serialized = JSON.stringify(session)
  if (rememberOnDevice) {
    stores.device?.setItem(SESSION_KEY, serialized)
    stores.tab?.removeItem(SESSION_KEY)
  } else {
    stores.tab?.setItem(SESSION_KEY, serialized)
    stores.device?.removeItem(SESSION_KEY)
  }
}

export function clearPlatformSession(stores = browserSessionStores()): void {
  stores.tab?.removeItem(SESSION_KEY)
  stores.device?.removeItem(SESSION_KEY)
}

export function readPlatformSession(
  stores = browserSessionStores(),
  now = Date.now(),
): PlatformSession | null {
  for (const storage of [stores.tab, stores.device]) {
    const serialized = storage?.getItem(SESSION_KEY)
    if (!serialized) continue

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
        continue
      }
      return session as PlatformSession
    } catch {
      storage?.removeItem(SESSION_KEY)
    }
  }
  return null
}

export function sessionRemainingSeconds(session: PlatformSession, now = Date.now()): number {
  return Math.max(0, Math.ceil((session.expiresAt - now) / 1000))
}

export function authorizationHeader(session: PlatformSession | null): Record<string, string> {
  if (!session || isSessionExpired(session)) return {}
  return { Authorization: `Bearer ${session.accessToken}` }
}
