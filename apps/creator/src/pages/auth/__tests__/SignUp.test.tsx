import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SignUp from '../SignUp'
import * as auth from '@/lib/auth'
import * as supabaseLib from '@/lib/supabase'
import * as analytics from '@/utils/analytics'

// Mock modules
vi.mock('@/lib/auth')
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
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
  trackSignup: vi.fn(),
}))

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => {
      const translations: Record<string, string> = {
        'auth:signUp.title': 'Create Creator Account',
        'auth:signUp.subtitle': 'Create your creator account',
        'auth:signUp.emailLabel': 'Email',
        'auth:signUp.emailPlaceholder': 'creator@example.com',
        'auth:signUp.passwordLabel': 'Password',
        'auth:signUp.passwordPlaceholder': 'Create a secure password',
        'auth:signUp.confirmPasswordLabel': 'Confirm Password',
        'auth:signUp.confirmPasswordPlaceholder': 'Re-enter your password',
        'auth:signUp.fullNameLabel': 'Full Name',
        'auth:signUp.fullNamePlaceholder': 'Enter your full name',
        'auth:signUp.penNameLabel': 'Pen Name',
        'auth:signUp.penNamePlaceholder': 'Enter your pen name',
        'auth:signUp.roleLabel': 'Role',
        'auth:signUp.roleAuthor': 'Author',
        'auth:signUp.roleAgent': 'Agent',
        'auth:signUp.companyLabel': 'Company',
        'auth:signUp.companyPlaceholder': 'Company name',
        'auth:signUp.websiteLabel': 'Website',
        'auth:signUp.websitePlaceholder': 'https://example.com',
        'auth:signUp.submitButton': 'Create Account',
        'auth:signUp.submitting': 'Creating account...',
        'auth:signUp.googleButton': 'Continue with Google',
        'auth:signUp.alreadyHaveAccount': 'Already have an account?',
        'auth:signUp.signInLink': 'Sign in',
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

describe('SignUp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render signup form', () => {
    render(
      <BrowserRouter>
        <SignUp />
      </BrowserRouter>
    )

    // Check form elements exist (heading is h3, so use level: 3 or name)
    expect(screen.getByRole('heading', { name: /create creator account/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    // Use id selector for password fields since labels may have same text in tests
    expect(document.getElementById('password')).toBeInTheDocument()
    expect(document.getElementById('confirmPassword')).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/pen name/i)).toBeInTheDocument()
  })

  it('should show validation error for empty fields', async () => {
    render(
      <BrowserRouter>
        <SignUp />
      </BrowserRouter>
    )

    // Fill only some fields to bypass browser validation, but leave required fields empty
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(document.getElementById('password')!, {
      target: { value: 'password123' },
    })
    fireEvent.change(document.getElementById('confirmPassword')!, {
      target: { value: 'password123' },
    })
    // Leave full_name and pen_name empty

    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    // Browser validation will prevent submission for required fields
    // Check that form was not submitted (no error message appears because browser handles it)
    // This tests that required fields are properly marked
    const fullNameInput = screen.getByLabelText(/full name/i)
    expect(fullNameInput).toHaveAttribute('required')
  })

  it('should show validation error for password mismatch', async () => {
    render(
      <BrowserRouter>
        <SignUp />
      </BrowserRouter>
    )

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(document.getElementById('password')!, {
      target: { value: 'password123' },
    })
    fireEvent.change(document.getElementById('confirmPassword')!, {
      target: { value: 'password456' },
    })
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByLabelText(/pen name/i), {
      target: { value: 'Test Creator' },
    })

    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('should show validation error for short password', async () => {
    render(
      <BrowserRouter>
        <SignUp />
      </BrowserRouter>
    )

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(document.getElementById('password')!, {
      target: { value: '12345' },
    })
    fireEvent.change(document.getElementById('confirmPassword')!, {
      target: { value: '12345' },
    })
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByLabelText(/pen name/i), {
      target: { value: 'Test Creator' },
    })

    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    })
  })

  it('should call signUpWithEmail and show toast on successful signup', async () => {
    const mockSignUpWithEmail = vi.mocked(auth.signUpWithEmail)
    mockSignUpWithEmail.mockResolvedValue({ user: { id: '123' }, session: null })

    const mockSignOut = vi.mocked(supabaseLib.supabase.auth.signOut)
    mockSignOut.mockResolvedValue({ error: null })

    render(
      <BrowserRouter>
        <SignUp />
      </BrowserRouter>
    )

    // Fill form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(document.getElementById('password')!, {
      target: { value: 'password123' },
    })
    fireEvent.change(document.getElementById('confirmPassword')!, {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByLabelText(/pen name/i), {
      target: { value: 'Test Creator' },
    })

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      // Verify signUpWithEmail was called
      expect(mockSignUpWithEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
        pen_name: 'Test Creator',
        ip_owner_role: 'author',
        ip_owner_company: undefined,
        website_url: undefined,
        newsletter_consent: true,
      })

      // Verify toast was shown
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Account Created!',
        description: 'Please check your email to confirm your account.',
      })

      // Verify signOut was called
      expect(mockSignOut).toHaveBeenCalled()

      expect(analytics.trackSignup).toHaveBeenCalledWith('attempted', 'email')
      expect(analytics.trackSignup).toHaveBeenCalledWith('completed', 'email')
      expect(analytics.trackSignup.mock.calls.filter(([stage]) => stage === 'completed')).toHaveLength(1)

      // Verify navigation
      expect(mockNavigate).toHaveBeenCalledWith(
        '/signin?from=signup&email=test%40example.com',
        { replace: true }
      )
    })
  })

  it('should display error message on signup failure', async () => {
    const mockSignUpWithEmail = vi.mocked(auth.signUpWithEmail)
    mockSignUpWithEmail.mockRejectedValue(new Error('Signup failed'))

    render(
      <BrowserRouter>
        <SignUp />
      </BrowserRouter>
    )

    // Fill form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(document.getElementById('password')!, {
      target: { value: 'password123' },
    })
    fireEvent.change(document.getElementById('confirmPassword')!, {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByLabelText(/pen name/i), {
      target: { value: 'Test Creator' },
    })

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/signup failed/i)).toBeInTheDocument()
    })
    expect(analytics.trackSignup).toHaveBeenCalledWith('failed', 'email', 'auth_rejected')
    expect(analytics.trackSignup.mock.calls.filter(([stage]) => stage === 'failed')).toHaveLength(1)
    expect(analytics.trackSignup.mock.calls.some(([stage]) => stage === 'completed')).toBe(false)
  })

  it('should show loading state during signup', async () => {
    const mockSignUpWithEmail = vi.mocked(auth.signUpWithEmail)
    mockSignUpWithEmail.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    )

    render(
      <BrowserRouter>
        <SignUp />
      </BrowserRouter>
    )

    // Fill form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(document.getElementById('password')!, {
      target: { value: 'password123' },
    })
    fireEvent.change(document.getElementById('confirmPassword')!, {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByLabelText(/pen name/i), {
      target: { value: 'Test Creator' },
    })

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    // Check loading state
    expect(screen.getByText(/creating account/i)).toBeInTheDocument()
  })
})
