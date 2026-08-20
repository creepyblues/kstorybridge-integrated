import { act, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionInactivityMonitor } from './SessionInactivityMonitor'
import {
  AUTH_INACTIVITY_TIMEOUT_MS,
  LAST_ACTIVITY_KEY,
  SESSION_EXPIRED_REASON_KEY,
} from '@/lib/sessionInactivity'
import { supabase } from '@/lib/supabase'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ session: { access_token: 'token' } }),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { signOut: vi.fn().mockResolvedValue({ error: null }) } },
}))

describe('creator SessionInactivityMonitor', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('locally signs out at one hour and preserves the protected route', async () => {
    render(
      <MemoryRouter initialEntries={['/titles/title-1/edit?step=3']}>
        <SessionInactivityMonitor />
      </MemoryRouter>
    )

    await act(async () => {
      vi.advanceTimersByTime(AUTH_INACTIVITY_TIMEOUT_MS)
      await Promise.resolve()
    })

    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
    expect(sessionStorage.getItem('redirect_after_login')).toBe('/titles/title-1/edit?step=3')
    expect(sessionStorage.getItem(SESSION_EXPIRED_REASON_KEY)).toBe('inactivity')
  })

  it('re-checks cross-tab activity before an old timer expires the session', async () => {
    render(
      <MemoryRouter initialEntries={['/home']}>
        <SessionInactivityMonitor />
      </MemoryRouter>
    )

    act(() => {
      vi.advanceTimersByTime(AUTH_INACTIVITY_TIMEOUT_MS - 1)
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))
      vi.advanceTimersByTime(1)
    })
    expect(supabase.auth.signOut).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(AUTH_INACTIVITY_TIMEOUT_MS)
      await Promise.resolve()
    })
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
  })
})
