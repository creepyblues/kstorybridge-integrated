/**
 * AddTitle Survey Page Tests
 * Tests for the 5-step Add Title survey form
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import AddTitleSurvey from '../AddTitle'
import * as analytics from '@/utils/analytics'

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) => {
      if (typeof fallback === 'string') return fallback
      const translations: Record<string, string> = {
        'survey:page.pageTitle': 'Add New Title',
        'survey:page.pageSubtitle': 'Submit your content for review',
        'survey:page.saveDraftNow': 'Save Draft Now',
        'survey:navigation.previous': 'Previous',
        'survey:navigation.next': 'Next',
        'survey:navigation.submit': 'Submit Title',
        'survey:navigation.stepProgress': 'Step {{current}} of {{total}}',
        'survey:messages.loading': 'Loading survey form...',
        'survey:messages.loginRequired': 'Please sign in to continue',
        'survey:messages.completeRequired': 'Please complete all required fields',
        'survey:messages.submitting': 'Submitting...',
        'survey:messages.submitFailed': 'Failed to submit. Please try again.',
        'survey:messages.submitReviewMessage': 'Your title has been submitted for review.',
        'survey:steps.step1.title': 'Basic Info',
        'survey:steps.step1.description': 'Enter the basic information about your title',
        'survey:steps.step2.title': 'Story Details',
        'survey:steps.step2.description': 'Describe your story world and characters',
        'survey:steps.step3.title': 'Narrative',
        'survey:steps.step3.description': 'Share your narrative structure and themes',
        'survey:steps.step4.title': 'Materials',
        'survey:steps.step4.description': 'Upload supporting materials and documents',
        'survey:steps.step5.title': 'Profile',
        'survey:steps.step5.description': 'Complete your creator profile information',
        'survey:tips.title': 'Pro Tip',
        'survey:tips.step1': 'Make sure to include a compelling Korean title.',
        'survey:tips.step2': 'Rich character descriptions make your title stand out.',
        'survey:tips.step3': 'A clear story structure helps buyers understand your content.',
        'survey:tips.step4': 'High-quality materials increase buyer engagement.',
        'survey:tips.step5': 'A complete profile builds credibility.',
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

// Mock Supabase
const mockGetUser = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
  },
}))

// Mock services
const mockGetDraftById = vi.fn()
const mockCreateDraft = vi.fn()
const mockUpdateDraftById = vi.fn()
const mockSubmitDraftById = vi.fn()

vi.mock('@/services/draftService', () => ({
  draftService: {
    getDraftById: (...args: unknown[]) => mockGetDraftById(...args),
    createDraft: (...args: unknown[]) => mockCreateDraft(...args),
    updateDraftById: (...args: unknown[]) => mockUpdateDraftById(...args),
    submitDraftById: (...args: unknown[]) => mockSubmitDraftById(...args),
  },
}))

// Mock analytics
vi.mock('@/utils/analytics', () => ({
  trackSurveyStepComplete: vi.fn(),
  trackTitleDraftCreated: vi.fn(),
  trackTitleSaveDraft: vi.fn(),
  trackTitleSubmitted: vi.fn(),
}))

// Mock MainLayout
vi.mock('@/components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>,
}))

// Mock survey components
vi.mock('@/components/survey/MultiStepProgressBar', () => ({
  MultiStepProgressBar: ({ currentStep, steps, onStepClick }: { currentStep: number; steps: { title: string }[]; onStepClick: (step: number) => void }) => (
    <div data-testid="progress-bar">
      {steps.map((step, index) => (
        <button
          key={index}
          data-testid={`step-${index + 1}`}
          onClick={() => onStepClick(index + 1)}
          data-current={currentStep === index + 1}
        >
          {step.title}
        </button>
      ))}
    </div>
  ),
  getDefaultSteps: () => [
    { title: 'Basic Info' },
    { title: 'Story Details' },
    { title: 'Narrative' },
    { title: 'Materials' },
    { title: 'Profile' },
  ],
}))

vi.mock('@/components/survey/AutoSaveIndicator', () => ({
  AutoSaveIndicator: ({ status }: { status: string }) => (
    <div data-testid="auto-save-indicator">{status}</div>
  ),
  useAutoSave: ({ onSave, enabled }: { onSave: (data: unknown) => Promise<void>; enabled: boolean }) => ({
    saveStatus: 'idle',
    lastSavedAt: null,
    triggerSave: (data: unknown, immediate?: boolean) => {
      if (enabled && immediate) onSave(data)
    },
  }),
}))

// Mock step components
vi.mock('@/components/survey/Step1BasicInfo', () => ({
  Step1BasicInfo: () => <div data-testid="step-1-content">Step 1 Content</div>,
}))

vi.mock('@/components/survey/Step2StoryDetails', () => ({
  Step2StoryDetails: () => <div data-testid="step-2-content">Step 2 Content</div>,
}))

vi.mock('@/components/survey/Step3Narrative', () => ({
  Step3Narrative: () => <div data-testid="step-3-content">Step 3 Content</div>,
}))

vi.mock('@/components/survey/Step4Materials', () => ({
  Step4Materials: () => <div data-testid="step-4-content">Step 4 Content</div>,
}))

vi.mock('@/components/survey/Step5Profile', () => ({
  Step5Profile: () => <div data-testid="step-5-content">Step 5 Content</div>,
}))

// Mock validation functions with a permissive Zod schema
vi.mock('@/lib/surveySchema', async () => {
  const z = await import('zod')
  return {
    surveyFormSchema: z.z.object({}).passthrough(),
    validateStep1: () => ({}),
    validateStep2: () => ({}),
    validateStep3: () => ({}),
  }
})

const renderWithRouter = (component: React.ReactNode) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('AddTitle Survey Page', () => {
  const alertSpy = vi.fn()
  const scrollToSpy = vi.fn()
  const replaceStateSpy = vi.fn()

  beforeEach(() => {
    vi.resetAllMocks()

    // Set up default mock returns
    mockGetUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } } })
    mockGetDraftById.mockResolvedValue(null)
    mockCreateDraft.mockResolvedValue({ id: 'new-draft-id' })
    mockUpdateDraftById.mockResolvedValue({ id: 'existing-draft-id' })
    mockSubmitDraftById.mockResolvedValue(undefined)

    // Clear URL params
    Object.defineProperty(window, 'location', {
      value: { search: '', origin: 'http://localhost:8083' },
      writable: true,
    })

    // Mock window methods
    window.history.replaceState = replaceStateSpy
    window.alert = alertSpy
    window.scrollTo = scrollToSpy
  })

  describe('Loading State', () => {
    it('should show loading state initially', async () => {
      // Delay the user response
      mockGetUser.mockImplementation(() => new Promise(() => {}))

      renderWithRouter(<AddTitleSurvey />)

      expect(screen.getByText('Loading survey form...')).toBeInTheDocument()
    })

    it('should redirect to signin if not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      renderWithRouter(<AddTitleSurvey />)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/signin')
      })
    })
  })

  describe('Page Rendering', () => {
    it('should render page title and subtitle', async () => {
      renderWithRouter(<AddTitleSurvey />)

      await waitFor(() => {
        expect(screen.getByText('Add New Title')).toBeInTheDocument()
      })
      expect(screen.getByText('Submit your content for review')).toBeInTheDocument()
    })

    it('should render progress bar', async () => {
      renderWithRouter(<AddTitleSurvey />)

      await waitFor(() => {
        expect(screen.getByTestId('progress-bar')).toBeInTheDocument()
      })
    })

    it('should render step 1 content by default', async () => {
      renderWithRouter(<AddTitleSurvey />)

      await waitFor(() => {
        expect(screen.getByTestId('step-1-content')).toBeInTheDocument()
      })
    })

    it('should render navigation buttons', async () => {
      renderWithRouter(<AddTitleSurvey />)

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument()
        expect(screen.getByText('Next')).toBeInTheDocument()
      })
    })

    it('should render save draft button', async () => {
      renderWithRouter(<AddTitleSurvey />)

      await waitFor(() => {
        expect(screen.getByText('Save Draft Now')).toBeInTheDocument()
      })
    })

    it('should render tips section', async () => {
      renderWithRouter(<AddTitleSurvey />)

      await waitFor(() => {
        expect(screen.getByText('Pro Tip')).toBeInTheDocument()
      })
    })
  })

  describe('Step Navigation', () => {
    it('should disable Previous button on step 1', async () => {
      renderWithRouter(<AddTitleSurvey />)

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeDisabled()
      })
    })

    it('should navigate to next step when Next is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(<AddTitleSurvey />)

      await waitFor(() => {
        expect(screen.getByTestId('step-1-content')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Next'))

      await waitFor(() => {
        expect(screen.getByTestId('step-2-content')).toBeInTheDocument()
      })
    })

    it('should navigate to previous step when Previous is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(<AddTitleSurvey />)

      await waitFor(() => {
        expect(screen.getByTestId('step-1-content')).toBeInTheDocument()
      })

      // Go to step 2
      await user.click(screen.getByText('Next'))
      await waitFor(() => {
        expect(screen.getByTestId('step-2-content')).toBeInTheDocument()
      })

      // Go back to step 1
      await user.click(screen.getByText('Previous'))
      await waitFor(() => {
        expect(screen.getByTestId('step-1-content')).toBeInTheDocument()
      })
    })

    it('should show Submit button on step 5', async () => {
      const user = userEvent.setup()
      renderWithRouter(<AddTitleSurvey />)

      await waitFor(() => {
        expect(screen.getByTestId('step-1-content')).toBeInTheDocument()
      })

      // Navigate to step 5
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByText('Next'))
      }

      await waitFor(() => {
        expect(screen.getByText('Submit Title')).toBeInTheDocument()
      })
    })

    it('should allow clicking on progress bar steps', async () => {
      const user = userEvent.setup()
      renderWithRouter(<AddTitleSurvey />)

      await waitFor(() => {
        expect(screen.getByTestId('step-1-content')).toBeInTheDocument()
      })

      // Go forward first (can't skip ahead)
      await user.click(screen.getByText('Next'))
      await waitFor(() => {
        expect(screen.getByTestId('step-2-content')).toBeInTheDocument()
      })

      // Click on step 1 in progress bar to go back
      await user.click(screen.getByTestId('step-1'))
      await waitFor(() => {
        expect(screen.getByTestId('step-1-content')).toBeInTheDocument()
      })
    })

    it('should scroll to top when navigating steps', async () => {
      const user = userEvent.setup()
      renderWithRouter(<AddTitleSurvey />)

      await waitFor(() => {
        expect(screen.getByTestId('step-1-content')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Next'))

      await waitFor(() => {
        expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
      })
    })
  })

  describe('Draft Loading', () => {
    it('should load draft when draftId is in URL', async () => {
      Object.defineProperty(window, 'location', {
        value: { search: '?draftId=test-draft-id', origin: 'http://localhost:8083' },
        writable: true,
      })

      const mockDraft = {
        id: 'test-draft-id',
        draft_data: { title_name_kr: 'Loaded Title' },
        current_step: 3,
      }
      mockGetDraftById.mockResolvedValue(mockDraft)

      renderWithRouter(<AddTitleSurvey />)

      await waitFor(() => {
        expect(mockGetDraftById).toHaveBeenCalledWith('test-draft-id')
      })
    })

    it('should not load any draft when no draftId in URL', async () => {
      Object.defineProperty(window, 'location', {
        value: { search: '', origin: 'http://localhost:8083' },
        writable: true,
      })

      renderWithRouter(<AddTitleSurvey />)

      await waitFor(() => {
        expect(screen.getByTestId('step-1-content')).toBeInTheDocument()
      })

      expect(mockGetDraftById).not.toHaveBeenCalled()
    })
  })

  describe('Form Submission', () => {
    it('should create draft and submit on step 5', async () => {
      const user = userEvent.setup()
      renderWithRouter(<AddTitleSurvey />)

      await waitFor(() => {
        expect(screen.getByTestId('step-1-content')).toBeInTheDocument()
      })

      // Navigate to step 5
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByText('Next'))
      }

      await waitFor(() => {
        expect(screen.getByText('Submit Title')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Submit Title'))

      await waitFor(() => {
        expect(mockCreateDraft).toHaveBeenCalled()
        expect(mockSubmitDraftById).toHaveBeenCalledWith('new-draft-id')
        expect(analytics.trackTitleDraftCreated).toHaveBeenCalledWith('new-draft-id', 'full')
        expect(analytics.trackTitleSubmitted).toHaveBeenCalledWith('new-draft-id', 'full')
      })
    })

    it('should show success alert and navigate on successful submission', async () => {
      const user = userEvent.setup()
      renderWithRouter(<AddTitleSurvey />)

      await waitFor(() => {
        expect(screen.getByTestId('step-1-content')).toBeInTheDocument()
      })

      // Navigate to step 5
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByText('Next'))
      }

      await user.click(screen.getByText('Submit Title'))

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Your title has been submitted for review.')
        expect(mockNavigate).toHaveBeenCalledWith('/titles')
      })
    })

    it('should emit no outcome events on submission failure', async () => {
      const user = userEvent.setup()
      mockCreateDraft.mockRejectedValue(new Error('Network error'))

      renderWithRouter(<AddTitleSurvey />)

      await waitFor(() => {
        expect(screen.getByTestId('step-1-content')).toBeInTheDocument()
      })

      // Navigate to step 5
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByText('Next'))
      }

      await user.click(screen.getByText('Submit Title'))

      await waitFor(() => expect(mockCreateDraft).toHaveBeenCalled())
      expect(analytics.trackTitleDraftCreated).not.toHaveBeenCalled()
      expect(analytics.trackTitleSubmitted).not.toHaveBeenCalled()
    })

    it('should update existing draft before submitting if draftId exists', async () => {
      Object.defineProperty(window, 'location', {
        value: { search: '?draftId=existing-draft-id', origin: 'http://localhost:8083' },
        writable: true,
      })

      const mockDraft = {
        id: 'existing-draft-id',
        draft_data: { title_name_kr: 'Existing Title' },
        current_step: 1,
      }
      mockGetDraftById.mockResolvedValue(mockDraft)

      const user = userEvent.setup()
      renderWithRouter(<AddTitleSurvey />)

      await waitFor(() => {
        expect(mockGetDraftById).toHaveBeenCalledWith('existing-draft-id')
      })

      // Navigate to step 5
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByText('Next'))
      }

      await waitFor(() => {
        expect(screen.getByText('Submit Title')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Submit Title'))

      await waitFor(() => {
        expect(mockUpdateDraftById).toHaveBeenCalledWith('existing-draft-id', expect.any(Object))
        expect(mockSubmitDraftById).toHaveBeenCalledWith('existing-draft-id')
      })
    })
  })

  describe('Auto-Save Indicator', () => {
    it('should render auto-save indicator', async () => {
      renderWithRouter(<AddTitleSurvey />)

      await waitFor(() => {
        expect(screen.getByTestId('auto-save-indicator')).toBeInTheDocument()
      })
    })
  })

  describe('Save Draft Button', () => {
    it('should render save draft button', async () => {
      renderWithRouter(<AddTitleSurvey />)

      await waitFor(() => {
        expect(screen.getByText('Save Draft Now')).toBeInTheDocument()
      })
    })
  })

  describe('Step Content Rendering', () => {
    it('should render correct step content for each step', async () => {
      const user = userEvent.setup()
      renderWithRouter(<AddTitleSurvey />)

      // Step 1
      await waitFor(() => {
        expect(screen.getByTestId('step-1-content')).toBeInTheDocument()
      })

      // Step 2
      await user.click(screen.getByText('Next'))
      await waitFor(() => {
        expect(screen.getByTestId('step-2-content')).toBeInTheDocument()
      })

      // Step 3
      await user.click(screen.getByText('Next'))
      await waitFor(() => {
        expect(screen.getByTestId('step-3-content')).toBeInTheDocument()
      })

      // Step 4
      await user.click(screen.getByText('Next'))
      await waitFor(() => {
        expect(screen.getByTestId('step-4-content')).toBeInTheDocument()
      })

      // Step 5
      await user.click(screen.getByText('Next'))
      await waitFor(() => {
        expect(screen.getByTestId('step-5-content')).toBeInTheDocument()
      })
    })
  })

  describe('Step Indicators', () => {
    it('should render step indicator dots', async () => {
      renderWithRouter(<AddTitleSurvey />)

      await waitFor(() => {
        // 5 step indicator dots should be rendered
        const form = screen.getByTestId('main-layout')
        expect(form.querySelectorAll('.rounded-full').length).toBeGreaterThan(0)
      })
    })
  })
})
