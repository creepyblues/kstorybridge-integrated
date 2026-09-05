import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import SignIn from '../SignIn'
import * as auth from '@/lib/auth'
import * as supabaseLib from '@/lib/supabase'
import * as analytics from '@/utils/analytics'
import { notifyCreatorSignin } from '@/utils/slack'
import { SESSION_EXPIRED_REASON_KEY } from '@/lib/sessionInactivity'

// Mock modules
vi.mock('@/lib/auth')
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      resend: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
    toasts: [],
    dismiss: vi.fn(),
  }),
}))

// Mock analytics
vi.mock('@/utils/analytics', () => ({
  trackSignin: vi.fn(),
  trackSignup: vi.fn(),
}))

vi.mock('@/utils/slack', () => ({
  notifyCreatorSignin: vi.fn().mockResolvedValue(undefined),
}))

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => {
      const translations: Record<string, string> = {
        'auth:signIn.title': 'Sign In',
        'auth:signIn.subtitle': 'Welcome back!',
        'auth:signIn.emailLabel': 'Email',
        'auth:signIn.emailPlaceholder': 'creator@example.com',
        'auth:signIn.passwordLabel': 'Password',
        'auth:signIn.passwordPlaceholder': 'Enter your password',
        'auth:signIn.submitButton': 'Sign In',
        'auth:signIn.submitting': 'Signing in...',
        'auth:signIn.googleButton': 'Continue with Google',
        'auth:signIn.noAccount': "Don't have an account?",
        'auth:signIn.signUpLink': 'Sign up',
        'auth:messages.sessionExpired': 'Your session has expired. Please sign in again.',
        'auth:oauth.redirect': 'Redirecting...',
      }
      return translations[key] || defaultValue || key
    },
    i18n: {
      changeLanguage: vi.fn(),
    },
  }),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('SignIn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    vi.mocked(auth.lookupCreatorProfile).mockResolvedValue('exists')
    vi.mocked(auth.createCreatorProfileFromPending).mockResolvedValue({ status: 'no_data' })
    vi.mocked(supabaseLib.supabase.auth.signOut).mockResolvedValue({ error: null } as never)
  })

  it('shows and consumes the one-time inactivity expiry message', () => {
    sessionStorage.setItem(SESSION_EXPIRED_REASON_KEY, 'inactivity')

    render(
      <MemoryRouter>
        <SignIn />
      </MemoryRouter>
    )

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Your session has expired. Please sign in again.',
      description: 'Your session has expired. Please sign in again.',
      duration: 5000,
    })
    expect(sessionStorage.getItem(SESSION_EXPIRED_REASON_KEY)).toBeNull()
  })

  it('should render signin form', () => {
    render(
      <BrowserRouter>
        <SignIn />
      </BrowserRouter>
    )

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('should show validation error for empty fields', async () => {
    render(
      <BrowserRouter>
        <SignIn />
      </BrowserRouter>
    )

    const submitButton = screen.getByRole('button', { name: /^sign in$/i })
    fireEvent.submit(submitButton.closest('form')!)

    await waitFor(() => {
      expect(screen.getByText(/please enter both email and password/i)).toBeInTheDocument()
    })
  })

  it('should call signInWithEmail on form submit', async () => {
    const mockSignInWithEmail = vi.mocked(auth.signInWithEmail)
    mockSignInWithEmail.mockResolvedValue()

    render(
      <BrowserRouter>
        <SignIn />
      </BrowserRouter>
    )

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })

    const submitButton = screen.getByRole('button', { name: /^sign in$/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSignInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockNavigate).toHaveBeenCalledWith('/home')
      expect(analytics.trackSignin).toHaveBeenCalledWith('attempted', 'email')
      expect(analytics.trackSignin).toHaveBeenCalledWith('completed', 'email')
      expect(analytics.trackSignin.mock.calls.filter(([stage]) => stage === 'completed')).toHaveLength(1)
      expect(notifyCreatorSignin).toHaveBeenCalledOnce()
      expect(notifyCreatorSignin).toHaveBeenCalledWith({
        email: 'test@example.com',
        authType: 'email',
      })
    })
  })

  it('onboards an authenticated user with no creator profile instead of rejecting them', async () => {
    vi.mocked(auth.signInWithEmail).mockResolvedValue()
    vi.mocked(auth.lookupCreatorProfile).mockResolvedValue('missing')

    render(
      <BrowserRouter>
        <SignIn />
      </BrowserRouter>
    )

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'buyer-only@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))

    // A buyer-only (or Google-first) account signing in here gets creator onboarding,
    // stays signed in, and is never told the account "doesn't exist".
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/auth/complete-profile'))
    expect(mockNavigate).not.toHaveBeenCalledWith('/signup')
    expect(supabaseLib.supabase.auth.signOut).not.toHaveBeenCalled()
    expect(analytics.trackSignup).toHaveBeenCalledWith('attempted', 'email')
    expect(analytics.trackSignin.mock.calls.some(([stage]) => stage === 'completed')).toBe(false)
    expect(analytics.trackSignin.mock.calls.some(([stage]) => stage === 'failed')).toBe(false)
    expect(notifyCreatorSignin).not.toHaveBeenCalled()
  })

  it('fails closed when creator profile verification errors after authentication', async () => {
    vi.mocked(auth.signInWithEmail).mockResolvedValue()
    vi.mocked(auth.lookupCreatorProfile).mockResolvedValue('error')

    render(
      <BrowserRouter>
        <SignIn />
      </BrowserRouter>
    )

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'creator@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(supabaseLib.supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
    })
    expect(analytics.trackSignin).toHaveBeenCalledWith('failed', 'email', 'profile_lookup_failed')
    expect(mockNavigate).not.toHaveBeenCalledWith('/home')
    // 'error' must never be treated as 'missing'
    expect(mockNavigate).not.toHaveBeenCalledWith('/auth/complete-profile')
    expect(notifyCreatorSignin).not.toHaveBeenCalled()
  })

  it('should show email verification alert when coming from signup', () => {
    render(
      <MemoryRouter initialEntries={['/signin?from=signup&email=test@example.com']}>
        <SignIn />
      </MemoryRouter>
    )

    expect(screen.getByText(/verify your email/i)).toBeInTheDocument()
    expect(screen.getByText(/we've sent a verification link to test@example.com/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument()
  })

  it('should pre-fill email from URL parameter', () => {
    render(
      <MemoryRouter initialEntries={['/signin?from=signup&email=test@example.com']}>
        <SignIn />
      </MemoryRouter>
    )

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
    expect(emailInput.value).toBe('test@example.com')
  })

  it('should show email verification alert on "Email not confirmed" error', async () => {
    const mockSignInWithEmail = vi.mocked(auth.signInWithEmail)
    mockSignInWithEmail.mockRejectedValue(new Error('Email not confirmed'))

    render(
      <BrowserRouter>
        <SignIn />
      </BrowserRouter>
    )

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'unverified@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })

    const submitButton = screen.getByRole('button', { name: /^sign in$/i })
    fireEvent.click(submitButton)

    await waitFor(
      () => {
        // Error message in red box
        expect(screen.getByText(/please verify your email address before signing in/i)).toBeInTheDocument()
        // Alert box title
        expect(screen.getByRole('heading', { name: /verify your email/i })).toBeInTheDocument()
        // Resend button
        expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
    expect(analytics.trackSignin).toHaveBeenCalledWith('failed', 'email', 'email_not_confirmed')
    expect(analytics.trackSignin.mock.calls.filter(([stage]) => stage === 'failed')).toHaveLength(1)
    expect(analytics.trackSignin.mock.calls.some(([stage]) => stage === 'completed')).toBe(false)
  })

  it('should handle resend verification email success', async () => {
    const mockResend = vi.mocked(supabaseLib.supabase.auth.resend)
    mockResend.mockResolvedValue({ data: {}, error: null })

    render(
      <MemoryRouter initialEntries={['/signin?from=signup&email=test@example.com']}>
        <SignIn />
      </MemoryRouter>
    )

    const resendButton = screen.getByRole('button', { name: /resend verification email/i })
    fireEvent.click(resendButton)

    await waitFor(() => {
      expect(mockResend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'test@example.com',
      })

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Verification email sent',
        description: 'Please check your email for the verification link.',
        duration: 5000,
      })
    })
  })

  it('should handle resend verification email failure', async () => {
    const mockResend = vi.mocked(supabaseLib.supabase.auth.resend)
    mockResend.mockResolvedValue({
      data: {},
      error: { message: 'Rate limit exceeded' } as any,
    })

    render(
      <MemoryRouter initialEntries={['/signin?from=signup&email=test@example.com']}>
        <SignIn />
      </MemoryRouter>
    )

    const resendButton = screen.getByRole('button', { name: /resend verification email/i })
    fireEvent.click(resendButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Resend failed',
        description: 'Rate limit exceeded',
        variant: 'destructive',
      })
    })
  })

  it('should show loading state during resend', async () => {
    const mockResend = vi.mocked(supabaseLib.supabase.auth.resend)
    mockResend.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: {}, error: null }), 1000))
    )

    render(
      <MemoryRouter initialEntries={['/signin?from=signup&email=test@example.com']}>
        <SignIn />
      </MemoryRouter>
    )

    const resendButton = screen.getByRole('button', { name: /resend verification email/i })
    fireEvent.click(resendButton)

    expect(screen.getByText(/sending\.\.\./i)).toBeInTheDocument()
  })

  it('should dismiss email verification alert', async () => {
    render(
      <MemoryRouter initialEntries={['/signin?from=signup&email=test@example.com']}>
        <SignIn />
      </MemoryRouter>
    )

    expect(screen.getByText(/verify your email/i)).toBeInTheDocument()

    const dismissButton = screen.getByRole('button', { name: /dismiss/i })
    fireEvent.click(dismissButton)

    await waitFor(() => {
      expect(screen.queryByText(/verify your email/i)).not.toBeInTheDocument()
    })
  })

  it('should show generic error for non-email-verification errors', async () => {
    const mockSignInWithEmail = vi.mocked(auth.signInWithEmail)
    mockSignInWithEmail.mockRejectedValue(new Error('Invalid password'))

    render(
      <BrowserRouter>
        <SignIn />
      </BrowserRouter>
    )

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    })

    const submitButton = screen.getByRole('button', { name: /^sign in$/i })
    fireEvent.click(submitButton)

    await waitFor(
      () => {
        // Component shows generic "Invalid email or password" for security (don't leak if email exists)
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
    expect(analytics.trackSignin).toHaveBeenCalledWith('failed', 'email', 'auth_rejected')
    expect(analytics.trackSignin.mock.calls.filter(([stage]) => stage === 'failed')).toHaveLength(1)
    expect(analytics.trackSignin.mock.calls.some(([stage]) => stage === 'completed')).toBe(false)
  })

  it('should show loading state during signin', async () => {
    const mockSignInWithEmail = vi.mocked(auth.signInWithEmail)
    mockSignInWithEmail.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    )

    render(
      <BrowserRouter>
        <SignIn />
      </BrowserRouter>
    )

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })

    const submitButton = screen.getByRole('button', { name: /^sign in$/i })
    fireEvent.click(submitButton)

    expect(screen.getByText(/signing in\.\.\./i)).toBeInTheDocument()
  })

  it('should not show alert when not from signup', () => {
    render(
      <BrowserRouter>
        <SignIn />
      </BrowserRouter>
    )

    expect(screen.queryByText(/verify your email/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /resend verification email/i })).not.toBeInTheDocument()
  })
})
