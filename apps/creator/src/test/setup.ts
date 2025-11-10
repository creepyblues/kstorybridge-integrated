import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Initialize i18n for tests
i18n
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common', 'auth', 'titles', 'survey'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        common: {},
        auth: {
          signIn: {
            title: 'Sign In to Creator Dashboard',
            subtitle: 'Enter your credentials to access your account',
            emailLabel: 'Email',
            passwordLabel: 'Password',
            submitButton: 'Sign In',
            googleButton: 'Continue with Google',
          },
          signUp: {
            title: 'Create Creator Account',
            subtitle: 'Join our community of content creators',
            emailLabel: 'Email',
            passwordLabel: 'Password',
            fullNameLabel: 'Full Name',
            penNameLabel: 'Pen Name',
            roleLabel: 'I am an',
            submitButton: 'Create Account',
            googleButton: 'Continue with Google',
          },
        },
        titles: {},
        survey: {},
      },
    },
  })

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock environment variables
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}))
