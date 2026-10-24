import assert from 'node:assert/strict'
import test from 'node:test'

import {
  authorizationHeader,
  clearPlatformSession,
  createPlatformSession,
  isSessionExpired,
  readPlatformSession,
  savePlatformSession,
  sessionRemainingSeconds,
  type StorageLike,
} from '../src/platformSession.ts'

function memoryStorage(): StorageLike {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

const user = {
  id: '46d493f0-40c7-4f92-b13c-330dde429779',
  email: 'aluno@example.com',
  display_name: 'Aluno',
  is_active: true,
  created_at: '2026-10-22T12:00:00Z',
}

test('session uses expires_in and can be restored only before expiration', () => {
  const storage = memoryStorage()
  const session = createPlatformSession('signed-token', 1800, user, 1_000)
  savePlatformSession(session, storage)

  assert.equal(session.expiresAt, 1_801_000)
  assert.equal(readPlatformSession(storage, 60_000)?.accessToken, 'signed-token')
  assert.equal(sessionRemainingSeconds(session, 1_000), 1800)
  assert.equal(isSessionExpired(session, 1_796_001), true)
  assert.equal(readPlatformSession(storage, 1_801_000), null)
})

test('authorization is omitted for missing or expired sessions', () => {
  const session = createPlatformSession('signed-token', 1800, user, 1_000)
  assert.deepEqual(authorizationHeader(session), {})

  const currentSession = createPlatformSession('signed-token', 1800, user)
  assert.deepEqual(authorizationHeader(currentSession), { Authorization: 'Bearer signed-token' })
})

test('invalid persisted content is discarded and logout clears storage', () => {
  const storage = memoryStorage()
  storage.setItem('github-sync.platform-session.v1', '{invalid')
  assert.equal(readPlatformSession(storage), null)

  const session = createPlatformSession('signed-token', 1800, user)
  savePlatformSession(session, storage)
  clearPlatformSession(storage)
  assert.equal(readPlatformSession(storage), null)
})
