import { describe, it, expect, beforeEach } from 'vitest'
import { consumePostAuthRedirect, isSafeRedirectPath, resolvePostAuthRedirect, REDIRECT_KEY } from './postAuthRedirect'

describe('creator postAuthRedirect', () => {
  beforeEach(() => sessionStorage.clear())

  it('accepts internal app paths and rejects auth pages / external URLs', () => {
    expect(isSafeRedirectPath('/titles/abc')).toBe(true)
    expect(isSafeRedirectPath('/home')).toBe(true)
    expect(isSafeRedirectPath('/signin')).toBe(false)
    expect(isSafeRedirectPath('/auth/callback')).toBe(false)
    expect(isSafeRedirectPath('https://evil.example/home')).toBe(false)
    expect(isSafeRedirectPath('//evil.example')).toBe(false)
    expect(isSafeRedirectPath(null)).toBe(false)
  })

  it('prefers the session stash, then metadata, then /home', () => {
    expect(resolvePostAuthRedirect('/titles/a', '/titles/b')).toBe('/titles/a')
    expect(resolvePostAuthRedirect(null, '/titles/b')).toBe('/titles/b')
    expect(resolvePostAuthRedirect(null, undefined)).toBe('/home')
    expect(resolvePostAuthRedirect('/signin', undefined)).toBe('/home')
  })

  it('consumes (reads then clears) the session stash', () => {
    sessionStorage.setItem(REDIRECT_KEY, '/titles/x')
    expect(consumePostAuthRedirect()).toBe('/titles/x')
    expect(sessionStorage.getItem(REDIRECT_KEY)).toBeNull()
    expect(consumePostAuthRedirect()).toBe('/home')
  })
})
