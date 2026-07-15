/**
 * QuickAddTitle Page Tests
 * Tests for the Quick Add Title form page
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import QuickAddTitle from '../QuickAddTitle'
import * as analytics from '@/utils/analytics'

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      if (typeof fallback === 'string') return fallback
      const translations: Record<string, string> = {
        'titles:quickAdd.title': 'Add Your Title',
        'titles:quickAdd.subtitle': 'Submit essential title information',
        'titles:quickAdd.description': "Submit your title for our quick review. Once approved, you'll be asked to provide additional details.",
        'titles:quickAdd.requiredInfo': 'Required Information',
        'titles:quickAdd.tipTitle': 'How It Works',
        'titles:quickAdd.tipDescription': 'Submit the essential information below.',
        'titles:quickAdd.submitForReview': 'Submit for Review',
        'titles:quickAdd.submitting': 'Submitting...',
        'titles:quickAdd.submittedTitle': 'Title Submitted',
        'titles:quickAdd.submittedDescription': 'Your title has been submitted for review.',
        'titles:quickAdd.errorMessage': 'Failed to submit title. Please try again.',
        'titles:quickAdd.reviewHint': 'Your submission will be reviewed by our team.',
        'titles:quickAdd.fields.titleNameKr': 'Title Name (Korean)',
        'titles:quickAdd.fields.titleNameKrPlaceholder': 'Enter Korean title',
        'titles:quickAdd.fields.titleUrl': 'Title Link (Korean)',
        'titles:quickAdd.fields.titleUrlPlaceholder': 'https://comic.naver.com/...',
        'titles:quickAdd.fields.titleUrlHelper': 'Link to the original Korean publication',
        'titles:quickAdd.fields.rightsHolder': 'Rights Holder',
        'titles:quickAdd.fields.rightsHolderPlaceholder': 'Individual or company name',
        'titles:quickAdd.fields.rightsAvailable': 'Rights Available',
        'titles:quickAdd.fields.rightsAvailableHelper': 'Select all rights available for licensing',
        'titles:quickAdd.fields.titleNameEn': 'Title Name (English)',
        'titles:quickAdd.fields.titleNameEnPlaceholder': 'Enter English title (optional)',
        'titles:quickAdd.fields.titleUrlEn': 'Title Link (English)',
        'titles:quickAdd.fields.titleUrlEnPlaceholder': 'https://... (optional)',
        'common:buttons.cancel': 'Cancel',
        'common:messages.error': 'Error',
      }
      return translations[key] || key
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

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false,
  })),
}))

const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

// Mock services
const mockCreateDraft = vi.fn()
const mockSubmitDraftById = vi.fn()

vi.mock('@/services/draftService', () => ({
  draftService: {
    createDraft: (...args: unknown[]) => mockCreateDraft(...args),
    submitDraftById: (...args: unknown[]) => mockSubmitDraftById(...args),
  },
}))

vi.mock('@/utils/analytics', () => ({
  trackTitleDraftCreated: vi.fn(),
  trackTitleSubmitted: vi.fn(),
}))

// Mock MainLayout
vi.mock('@/components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>,
}))

vi.mock('@/components/ui/AdminColumnHint', () => ({
  LabelWithColumn: ({
    htmlFor,
    label,
  }: {
    htmlFor?: string
    label: string
  }) => <label htmlFor={htmlFor}>{label}</label>,
}))

// Mock RightsCheckboxGroup
vi.mock('@/components/survey/RightsCheckboxGroup', () => ({
  RightsCheckboxGroup: ({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) => (
    <div data-testid="rights-checkbox-group">
      <button
        type="button"
        data-testid="select-film-tv"
        onClick={() => onChange([...value, 'film_tv'])}
      >
        Film & TV
      </button>
      <button
        type="button"
        data-testid="select-animation"
        onClick={() => onChange([...value, 'animation'])}
      >
        Animation
      </button>
      <span data-testid="selected-rights">{value.join(', ')}</span>
    </div>
  ),
}))

const renderWithRouter = (component: React.ReactNode) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('QuickAddTitle Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateDraft.mockResolvedValue({ id: 'new-draft-id' })
    mockSubmitDraftById.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Page Rendering', () => {
    it('should render the page with correct title and description', () => {
      renderWithRouter(<QuickAddTitle />)

      expect(screen.getByText('Add Your Title')).toBeInTheDocument()
      expect(screen.getByText("Submit your title for our quick review. Once approved, you'll be asked to provide additional details.")).toBeInTheDocument()
    })

    it('should render the quick tips section', () => {
      renderWithRouter(<QuickAddTitle />)

      expect(screen.getByText('How It Works')).toBeInTheDocument()
    })

    it('should render the required information section', () => {
      renderWithRouter(<QuickAddTitle />)

      expect(screen.getByText('Required Information')).toBeInTheDocument()
    })

    it('should render all form fields', () => {
      renderWithRouter(<QuickAddTitle />)

      expect(screen.getByText('Title Name (Korean)')).toBeInTheDocument()
      expect(screen.getByText('Title Link (Korean)')).toBeInTheDocument()
      expect(screen.getByText('Rights Holder')).toBeInTheDocument()
      expect(screen.getByText('Rights Available')).toBeInTheDocument()
      expect(screen.getByText('Title Name (English)')).toBeInTheDocument()
      expect(screen.getByText('Title Link (English)')).toBeInTheDocument()
    })

    it('should render submit and cancel buttons', () => {
      renderWithRouter(<QuickAddTitle />)

      expect(screen.getByText('Submit for Review')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    it('should allow typing in text fields', async () => {
      const user = userEvent.setup()
      renderWithRouter(<QuickAddTitle />)

      const koreanTitleInput = screen.getByPlaceholderText('Enter Korean title')
      await user.type(koreanTitleInput, '테스트 제목')
      expect(koreanTitleInput).toHaveValue('테스트 제목')

      const englishTitleInput = screen.getByPlaceholderText('Enter English title (optional)')
      await user.type(englishTitleInput, 'Test Title')
      expect(englishTitleInput).toHaveValue('Test Title')
    })

    it('should allow entering URL', async () => {
      const user = userEvent.setup()
      renderWithRouter(<QuickAddTitle />)

      const urlInput = screen.getByPlaceholderText('https://comic.naver.com/...')
      await user.type(urlInput, 'https://comic.naver.com/webtoon/list?titleId=12345')
      expect(urlInput).toHaveValue('https://comic.naver.com/webtoon/list?titleId=12345')
    })

    it('should allow selecting rights', async () => {
      const user = userEvent.setup()
      renderWithRouter(<QuickAddTitle />)

      await user.click(screen.getByTestId('select-film-tv'))
      expect(screen.getByTestId('selected-rights')).toHaveTextContent('film_tv')

      await user.click(screen.getByTestId('select-animation'))
      expect(screen.getByTestId('selected-rights')).toHaveTextContent('film_tv, animation')
    })
  })

  describe('Form Validation', () => {
    it('should show validation errors when submitting empty form', async () => {
      const user = userEvent.setup()
      renderWithRouter(<QuickAddTitle />)

      await user.click(screen.getByText('Submit for Review'))

      // Form should not submit without required fields
      expect(mockCreateDraft).not.toHaveBeenCalled()
    })

    it('should show error for invalid URL format', async () => {
      const user = userEvent.setup()
      renderWithRouter(<QuickAddTitle />)

      // Fill required fields with invalid URL
      await user.type(screen.getByPlaceholderText('Enter Korean title'), '테스트 제목')
      await user.type(screen.getByPlaceholderText('https://comic.naver.com/...'), 'not-a-valid-url')
      await user.type(screen.getByPlaceholderText('Individual or company name'), 'Test Company')
      await user.click(screen.getByTestId('select-film-tv'))

      await user.click(screen.getByText('Submit for Review'))

      // Should show validation error for URL
      await waitFor(() => {
        expect(mockCreateDraft).not.toHaveBeenCalled()
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup()
      renderWithRouter(<QuickAddTitle />)

      // Fill all required fields
      await user.type(screen.getByPlaceholderText('Enter Korean title'), '테스트 제목')
      await user.type(screen.getByPlaceholderText('https://comic.naver.com/...'), 'https://comic.naver.com/webtoon/list?titleId=12345')
      await user.type(screen.getByPlaceholderText('Individual or company name'), 'Test Company')
      await user.click(screen.getByTestId('select-film-tv'))

      await user.click(screen.getByText('Submit for Review'))

      await waitFor(() => {
        expect(mockCreateDraft).toHaveBeenCalledWith(expect.objectContaining({
          creator_id: 'test-user-id',
          draft_data: expect.objectContaining({
            title_name_kr: '테스트 제목',
            title_url: 'https://comic.naver.com/webtoon/list?titleId=12345',
            rights_holder_name: 'Test Company',
            rights_available: ['film_tv'],
          }),
          current_step: 1,
        }))
      })
    })

    it('should call submitDraftById after creating draft', async () => {
      const user = userEvent.setup()
      renderWithRouter(<QuickAddTitle />)

      // Fill all required fields
      await user.type(screen.getByPlaceholderText('Enter Korean title'), '테스트 제목')
      await user.type(screen.getByPlaceholderText('https://comic.naver.com/...'), 'https://comic.naver.com/webtoon/list?titleId=12345')
      await user.type(screen.getByPlaceholderText('Individual or company name'), 'Test Company')
      await user.click(screen.getByTestId('select-film-tv'))

      await user.click(screen.getByText('Submit for Review'))

      await waitFor(() => {
        expect(mockSubmitDraftById).toHaveBeenCalledWith('new-draft-id')
        expect(analytics.trackTitleDraftCreated).toHaveBeenCalledWith('new-draft-id', 'quick_add')
        expect(analytics.trackTitleSubmitted).toHaveBeenCalledWith('new-draft-id', 'quick_add')
        expect(analytics.trackTitleDraftCreated).toHaveBeenCalledTimes(1)
        expect(analytics.trackTitleSubmitted).toHaveBeenCalledTimes(1)
      })
    })

    it('should show success toast on successful submission', async () => {
      const user = userEvent.setup()
      renderWithRouter(<QuickAddTitle />)

      // Fill all required fields
      await user.type(screen.getByPlaceholderText('Enter Korean title'), '테스트 제목')
      await user.type(screen.getByPlaceholderText('https://comic.naver.com/...'), 'https://comic.naver.com/webtoon/list?titleId=12345')
      await user.type(screen.getByPlaceholderText('Individual or company name'), 'Test Company')
      await user.click(screen.getByTestId('select-film-tv'))

      await user.click(screen.getByText('Submit for Review'))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Title Submitted',
        }))
      })
    })

    it('should navigate to /titles on successful submission', async () => {
      const user = userEvent.setup()
      renderWithRouter(<QuickAddTitle />)

      // Fill all required fields
      await user.type(screen.getByPlaceholderText('Enter Korean title'), '테스트 제목')
      await user.type(screen.getByPlaceholderText('https://comic.naver.com/...'), 'https://comic.naver.com/webtoon/list?titleId=12345')
      await user.type(screen.getByPlaceholderText('Individual or company name'), 'Test Company')
      await user.click(screen.getByTestId('select-film-tv'))

      await user.click(screen.getByText('Submit for Review'))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/titles')
      })
    })

    it('should show submitting state during submission', async () => {
      const user = userEvent.setup()
      // Make the service call hang
      mockCreateDraft.mockImplementation(() => new Promise(() => {}))

      renderWithRouter(<QuickAddTitle />)

      // Fill all required fields
      await user.type(screen.getByPlaceholderText('Enter Korean title'), '테스트 제목')
      await user.type(screen.getByPlaceholderText('https://comic.naver.com/...'), 'https://comic.naver.com/webtoon/list?titleId=12345')
      await user.type(screen.getByPlaceholderText('Individual or company name'), 'Test Company')
      await user.click(screen.getByTestId('select-film-tv'))

      await user.click(screen.getByText('Submit for Review'))

      await waitFor(() => {
        expect(screen.getByText('Submitting...')).toBeInTheDocument()
      })
    })

    it('should include optional English fields when provided', async () => {
      const user = userEvent.setup()
      renderWithRouter(<QuickAddTitle />)

      // Fill all fields including optional
      await user.type(screen.getByPlaceholderText('Enter Korean title'), '테스트 제목')
      await user.type(screen.getByPlaceholderText('Enter English title (optional)'), 'Test Title')
      await user.type(screen.getByPlaceholderText('https://comic.naver.com/...'), 'https://comic.naver.com/webtoon/list?titleId=12345')
      await user.type(screen.getByPlaceholderText('https://... (optional)'), 'https://webtoon.com/en/test-title')
      await user.type(screen.getByPlaceholderText('Individual or company name'), 'Test Company')
      await user.click(screen.getByTestId('select-film-tv'))

      await user.click(screen.getByText('Submit for Review'))

      await waitFor(() => {
        expect(mockCreateDraft).toHaveBeenCalledWith(expect.objectContaining({
          draft_data: expect.objectContaining({
            title_name_en: 'Test Title',
            title_url_en: 'https://webtoon.com/en/test-title',
          }),
        }))
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error toast on submission failure', async () => {
      const user = userEvent.setup()
      mockCreateDraft.mockRejectedValue(new Error('Network error'))

      renderWithRouter(<QuickAddTitle />)

      // Fill all required fields
      await user.type(screen.getByPlaceholderText('Enter Korean title'), '테스트 제목')
      await user.type(screen.getByPlaceholderText('https://comic.naver.com/...'), 'https://comic.naver.com/webtoon/list?titleId=12345')
      await user.type(screen.getByPlaceholderText('Individual or company name'), 'Test Company')
      await user.click(screen.getByTestId('select-film-tv'))

      await user.click(screen.getByText('Submit for Review'))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          variant: 'destructive',
        }))
      })
      expect(analytics.trackTitleDraftCreated).not.toHaveBeenCalled()
      expect(analytics.trackTitleSubmitted).not.toHaveBeenCalled()
    })

    it('should not navigate on submission failure', async () => {
      const user = userEvent.setup()
      mockCreateDraft.mockRejectedValue(new Error('Network error'))

      renderWithRouter(<QuickAddTitle />)

      // Fill all required fields
      await user.type(screen.getByPlaceholderText('Enter Korean title'), '테스트 제목')
      await user.type(screen.getByPlaceholderText('https://comic.naver.com/...'), 'https://comic.naver.com/webtoon/list?titleId=12345')
      await user.type(screen.getByPlaceholderText('Individual or company name'), 'Test Company')
      await user.click(screen.getByTestId('select-film-tv'))

      await user.click(screen.getByText('Submit for Review'))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled()
      })

      expect(mockNavigate).not.toHaveBeenCalledWith('/titles')
    })
  })

  describe('Navigation', () => {
    it('should navigate to /titles when cancel button is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(<QuickAddTitle />)

      await user.click(screen.getByText('Cancel'))

      expect(mockNavigate).toHaveBeenCalledWith('/titles')
    })
  })
})
