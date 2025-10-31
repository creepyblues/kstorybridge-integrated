import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SignUp from '../SignUp'
import * as auth from '@/lib/auth'
import * as supabaseLib from '@/lib/supabase'

// Mock modules
vi.mock('@/lib/auth')
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
    },
  },
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
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

    expect(screen.getByRole('heading', { name: /create creator account/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/pen name/i)).toBeInTheDocument()
  })

  it('should show validation error for empty fields', async () => {
    render(
      <BrowserRouter>
        <SignUp />
      </BrowserRouter>
    )

    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please fill in all required fields/i)).toBeInTheDocument()
    })
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
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
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
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: '12345' },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
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

    const mockToast = vi.fn()
    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
      toasts: [],
      dismiss: vi.fn(),
    })

    render(
      <BrowserRouter>
        <SignUp />
      </BrowserRouter>
    )

    // Fill form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
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
      })

      // Verify toast was shown
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Account Created!',
        description: 'Please check your email to confirm your account.',
      })

      // Verify signOut was called
      expect(mockSignOut).toHaveBeenCalled()

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
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
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
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
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
