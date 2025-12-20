/**
 * Titles Page Tests
 * Tests for the My Titles list page
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import Titles from '../Titles'

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) => {
      if (typeof fallback === 'string') return fallback
      // Return simple translations for testing
      const translations: Record<string, string> = {
        'titles:list.title': 'My Titles',
        'titles:list.subtitle': 'Manage and track your IP submissions',
        'titles:list.addNewButton': 'Add New Title',
        'titles:list.loadingMessage': 'Loading titles...',
        'titles:list.loadingError': 'Failed to load titles. Please try again.',
        'titles:list.retryButton': 'Retry',
        'titles:list.deleteConfirmation': 'Are you sure you want to delete this draft?',
        'titles:list.deleteFailed': 'Failed to delete draft. Please try again.',
        'titles:list.pendingReviewMessage': 'This submission is awaiting admin approval.',
        'titles:list.rejectionMessage': 'Rejection reason: {{reason}}',
        'titles:empty.title': 'Start Your Journey',
        'titles:empty.description': 'Add your first title to begin showcasing your creative work to media buyers worldwide.',
        'titles:empty.addButton': 'Add Your First Title',
        'titles:sections.inProgress': 'In Progress',
        'titles:sections.needsAttention': 'Needs Attention',
        'titles:sections.published': 'Published Titles',
        'titles:sections.noDrafts': 'No drafts in progress',
        'titles:sections.noPublished': 'No published titles yet',
        'titles:sections.completeSubmission': 'Complete a title submission to see it here',
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

const mockUseAuth = vi.fn()
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock services
const mockGetTitlesByCreator = vi.fn()
const mockGetAllDrafts = vi.fn()
const mockDeleteDraftById = vi.fn()

vi.mock('@/services/titlesService', () => ({
  titlesService: {
    getTitlesByCreator: (...args: unknown[]) => mockGetTitlesByCreator(...args),
  },
}))

vi.mock('@/services/draftService', () => ({
  draftService: {
    getAllDrafts: (...args: unknown[]) => mockGetAllDrafts(...args),
    deleteDraftById: (...args: unknown[]) => mockDeleteDraftById(...args),
  },
}))

// Mock MainLayout
vi.mock('@/components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>,
}))

// Mock title components
vi.mock('@/components/titles', () => ({
  TitlesSectionCard: ({ children, title, count }: { children: React.ReactNode; title: string; count: number }) => (
    <div data-testid="section-card">
      <div data-testid="section-title">{title} ({count})</div>
      {children}
    </div>
  ),
  TitlesStatsBar: ({ draftsCount, pendingCount, rejectedCount, publishedCount }: Record<string, number>) => (
    <div data-testid="stats-bar">
      Drafts: {draftsCount}, Pending: {pendingCount}, Rejected: {rejectedCount}, Published: {publishedCount}
    </div>
  ),
  TitlesDraftCard: ({ draft, onClick, onDelete }: { draft: { id: string }; onClick: () => void; onDelete: (e: React.MouseEvent) => void }) => (
    <div data-testid={`draft-card-${draft.id}`} onClick={onClick}>
      <button data-testid={`delete-draft-${draft.id}`} onClick={onDelete}>Delete</button>
    </div>
  ),
  TitlesAttentionItem: ({ item, status, onClick }: { item: { id: string }; status: string; onClick: () => void }) => (
    <div data-testid={`attention-item-${item.id}`} data-status={status} onClick={onClick}>
      {status} item
    </div>
  ),
  TitlesPublishedCard: ({ title, onClick }: { title: { title_id: string }; onClick: () => void }) => (
    <div data-testid={`published-card-${title.title_id}`} onClick={onClick}>
      Published Title
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

describe('Titles Page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Set up default mock returns
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      loading: false,
    })
    mockGetTitlesByCreator.mockResolvedValue([])
    mockGetAllDrafts.mockImplementation(() => Promise.resolve([]))
  })

  describe('Loading State', () => {
    it('should display loading state initially', async () => {
      // Make the service call hang
      mockGetTitlesByCreator.mockImplementation(() => new Promise(() => {}))
      mockGetAllDrafts.mockImplementation(() => new Promise(() => {}))

      renderWithRouter(<Titles />)

      expect(screen.getByText('Loading titles...')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should display error state when loading fails', async () => {
      mockGetTitlesByCreator.mockRejectedValue(new Error('Network error'))
      mockGetAllDrafts.mockRejectedValue(new Error('Network error'))

      renderWithRouter(<Titles />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load titles. Please try again.')).toBeInTheDocument()
      })
    })

    it('should have a retry button in error state', async () => {
      mockGetTitlesByCreator.mockRejectedValue(new Error('Network error'))
      mockGetAllDrafts.mockRejectedValue(new Error('Network error'))

      renderWithRouter(<Titles />)

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
    })

    it('should retry loading when retry button is clicked', async () => {
      const user = userEvent.setup()
      mockGetTitlesByCreator.mockRejectedValueOnce(new Error('Network error'))
      mockGetAllDrafts.mockRejectedValueOnce(new Error('Network error'))

      renderWithRouter(<Titles />)

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })

      // Set up successful response for retry
      mockGetTitlesByCreator.mockResolvedValue([])
      mockGetAllDrafts.mockResolvedValue([])

      await user.click(screen.getByText('Retry'))

      await waitFor(() => {
        expect(mockGetTitlesByCreator).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Empty State', () => {
    it('should display empty state when no titles exist', async () => {
      mockGetTitlesByCreator.mockResolvedValue([])
      mockGetAllDrafts.mockResolvedValue([])

      renderWithRouter(<Titles />)

      await waitFor(() => {
        expect(screen.getByText('Start Your Journey')).toBeInTheDocument()
        expect(screen.getByText('Add your first title to begin showcasing your creative work to media buyers worldwide.')).toBeInTheDocument()
      })
    })

    it('should have Add First Title button in empty state', async () => {
      mockGetTitlesByCreator.mockResolvedValue([])
      mockGetAllDrafts.mockResolvedValue([])

      renderWithRouter(<Titles />)

      await waitFor(() => {
        expect(screen.getByText('Add Your First Title')).toBeInTheDocument()
      })
    })

    it('should navigate to quick-add when Add First Title button is clicked', async () => {
      const user = userEvent.setup()
      mockGetTitlesByCreator.mockResolvedValue([])
      mockGetAllDrafts.mockResolvedValue([])

      renderWithRouter(<Titles />)

      await waitFor(() => {
        expect(screen.getByText('Add Your First Title')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Add Your First Title'))

      expect(mockNavigate).toHaveBeenCalledWith('/titles/quick-add')
    })
  })

  describe('Content Display', () => {
    const mockTitles = [
      { title_id: 'title-1', title_name_kr: 'Test Title 1' },
      { title_id: 'title-2', title_name_kr: 'Test Title 2' },
    ]

    const mockDrafts = [
      { id: 'draft-1', draft_data: { title_name_kr: 'Draft Title 1' }, current_step: 2 },
    ]

    const mockPendingDrafts = [
      { id: 'pending-1', draft_data: { title_name_kr: 'Pending Title 1' }, status: 'submitted' },
    ]

    const mockRejectedDrafts = [
      { id: 'rejected-1', draft_data: { title_name_kr: 'Rejected Title 1' }, status: 'rejected', rejection_reason: 'Missing info' },
    ]

    it('should display page header with title and add button', async () => {
      mockGetTitlesByCreator.mockResolvedValue(mockTitles)
      mockGetAllDrafts.mockImplementation((_userId: string, status: string) => {
        if (status === 'draft') return Promise.resolve(mockDrafts)
        return Promise.resolve([])
      })

      renderWithRouter(<Titles />)

      await waitFor(() => {
        expect(screen.getByText('My Titles')).toBeInTheDocument()
      })
      expect(screen.getByText('Add New Title')).toBeInTheDocument()
    })

    it('should display stats bar with correct counts', async () => {
      mockGetTitlesByCreator.mockResolvedValue(mockTitles)
      mockGetAllDrafts.mockImplementation((_userId: string, status: string) => {
        if (status === 'draft') return Promise.resolve(mockDrafts)
        if (status === 'submitted') return Promise.resolve(mockPendingDrafts)
        if (status === 'rejected') return Promise.resolve(mockRejectedDrafts)
        return Promise.resolve([])
      })

      renderWithRouter(<Titles />)

      await waitFor(() => {
        expect(screen.getByTestId('stats-bar')).toHaveTextContent('Drafts: 1, Pending: 1, Rejected: 1, Published: 2')
      })
    })

    it('should display drafts in the In Progress section', async () => {
      mockGetTitlesByCreator.mockResolvedValue([])
      mockGetAllDrafts.mockImplementation((_userId: string, status: string) => {
        if (status === 'draft') return Promise.resolve(mockDrafts)
        return Promise.resolve([])
      })

      renderWithRouter(<Titles />)

      await waitFor(() => {
        expect(screen.getByTestId('draft-card-draft-1')).toBeInTheDocument()
      })
    })

    it('should display published titles', async () => {
      mockGetTitlesByCreator.mockResolvedValue(mockTitles)
      mockGetAllDrafts.mockResolvedValue([])

      renderWithRouter(<Titles />)

      await waitFor(() => {
        expect(screen.getByTestId('published-card-title-1')).toBeInTheDocument()
        expect(screen.getByTestId('published-card-title-2')).toBeInTheDocument()
      })
    })

    it('should display needs attention section for pending/rejected items', async () => {
      mockGetTitlesByCreator.mockResolvedValue([])
      mockGetAllDrafts.mockImplementation((_userId: string, status: string) => {
        if (status === 'submitted') return Promise.resolve(mockPendingDrafts)
        if (status === 'rejected') return Promise.resolve(mockRejectedDrafts)
        return Promise.resolve([])
      })

      renderWithRouter(<Titles />)

      await waitFor(() => {
        expect(screen.getByTestId('attention-item-pending-1')).toBeInTheDocument()
        expect(screen.getByTestId('attention-item-rejected-1')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should navigate to quick-add when Add New Title button is clicked', async () => {
      const user = userEvent.setup()
      mockGetTitlesByCreator.mockResolvedValue([{ title_id: 'title-1' }])
      mockGetAllDrafts.mockImplementation(() => Promise.resolve([]))

      renderWithRouter(<Titles />)

      await waitFor(() => {
        expect(screen.getByText('Add New Title')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Add New Title'))

      expect(mockNavigate).toHaveBeenCalledWith('/titles/quick-add')
    })

    it('should navigate to add-title with draftId when draft card is clicked', async () => {
      const user = userEvent.setup()
      const mockDrafts = [{ id: 'draft-1', draft_data: {} }]
      mockGetTitlesByCreator.mockResolvedValue([])
      mockGetAllDrafts.mockImplementation((_userId: string, status: string) => {
        if (status === 'draft') return Promise.resolve(mockDrafts)
        return Promise.resolve([])
      })

      renderWithRouter(<Titles />)

      await waitFor(() => {
        expect(screen.getByTestId('draft-card-draft-1')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('draft-card-draft-1'))

      expect(mockNavigate).toHaveBeenCalledWith('/titles/add-title?draftId=draft-1')
    })

    it('should navigate to title detail when published card is clicked', async () => {
      const user = userEvent.setup()
      mockGetTitlesByCreator.mockResolvedValue([{ title_id: 'title-1' }])
      mockGetAllDrafts.mockImplementation(() => Promise.resolve([]))

      renderWithRouter(<Titles />)

      await waitFor(() => {
        expect(screen.getByTestId('published-card-title-1')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('published-card-title-1'))

      expect(mockNavigate).toHaveBeenCalledWith('/titles/title-1')
    })
  })

  describe('Delete Draft', () => {
    it('should show confirmation dialog when deleting draft', async () => {
      const user = userEvent.setup()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

      const mockDrafts = [{ id: 'draft-1', draft_data: {} }]
      mockGetTitlesByCreator.mockResolvedValue([])
      mockGetAllDrafts.mockImplementation((_userId: string, status: string) => {
        if (status === 'draft') return Promise.resolve(mockDrafts)
        return Promise.resolve([])
      })

      renderWithRouter(<Titles />)

      await waitFor(() => {
        expect(screen.getByTestId('delete-draft-draft-1')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('delete-draft-draft-1'))

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this draft?')
      confirmSpy.mockRestore()
    })

    it('should delete draft when confirmed', async () => {
      const user = userEvent.setup()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      mockDeleteDraftById.mockResolvedValue(undefined)

      const mockDrafts = [{ id: 'draft-1', draft_data: {} }]
      mockGetTitlesByCreator.mockResolvedValue([])
      mockGetAllDrafts.mockImplementation((_userId: string, status: string) => {
        if (status === 'draft') return Promise.resolve(mockDrafts)
        return Promise.resolve([])
      })

      renderWithRouter(<Titles />)

      await waitFor(() => {
        expect(screen.getByTestId('delete-draft-draft-1')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('delete-draft-draft-1'))

      await waitFor(() => {
        expect(mockDeleteDraftById).toHaveBeenCalledWith('draft-1')
      })

      confirmSpy.mockRestore()
    })

    it('should not delete draft when cancelled', async () => {
      const user = userEvent.setup()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

      const mockDrafts = [{ id: 'draft-1', draft_data: {} }]
      mockGetTitlesByCreator.mockResolvedValue([])
      mockGetAllDrafts.mockImplementation((_userId: string, status: string) => {
        if (status === 'draft') return Promise.resolve(mockDrafts)
        return Promise.resolve([])
      })

      renderWithRouter(<Titles />)

      await waitFor(() => {
        expect(screen.getByTestId('delete-draft-draft-1')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('delete-draft-draft-1'))

      expect(mockDeleteDraftById).not.toHaveBeenCalled()
      confirmSpy.mockRestore()
    })
  })
})
