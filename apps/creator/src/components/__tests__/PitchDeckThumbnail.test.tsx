import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PitchDeckThumbnail from '../PitchDeckThumbnail';

// Mock react-pdf
vi.mock('@/lib/pdfConfig', () => ({
  Document: ({ children, onLoadSuccess, onLoadError, file }: any) => {
    // Simulate successful PDF load
    if (file && !file.includes('invalid')) {
      setTimeout(() => onLoadSuccess?.({ numPages: 1 }), 100);
    } else {
      setTimeout(() => onLoadError?.(new Error('Failed to load PDF')), 100);
    }
    return <div data-testid="pdf-document">{children}</div>;
  },
  Page: ({ pageNumber }: any) => (
    <div data-testid="pdf-page">Page {pageNumber}</div>
  ),
  pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: '/pdf.worker.min.js',
    },
  },
}));

// Mock IntersectionObserver globally
let globalCallback: any = null;
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const mockUnobserve = vi.fn();

class MockIntersectionObserver {
  constructor(callback: any) {
    globalCallback = callback;
    // Immediately trigger visibility for most tests
    setTimeout(() => {
      if (globalCallback) {
        globalCallback([{ isIntersecting: true }]);
      }
    }, 0);
  }

  observe = mockObserve;
  disconnect = mockDisconnect;
  unobserve = mockUnobserve;
}

window.IntersectionObserver = MockIntersectionObserver as any;

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock fetch
global.fetch = vi.fn();

describe('PitchDeckThumbnail', () => {
  const mockOnClick = vi.fn();
  const mockPdfUrl = 'https://example.com/pitch.pdf';

  beforeEach(() => {
    vi.clearAllMocks();
    mockObserve.mockClear();
    mockDisconnect.mockClear();
    mockUnobserve.mockClear();
    globalCallback = null;

    (global.fetch as any).mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['mock pdf data'], { type: 'application/pdf' }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render placeholder before lazy loading', () => {
    // Create a custom observer that doesn't trigger
    class NoTriggerObserver {
      constructor(callback: any) {
        // Don't call callback
      }
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    }

    window.IntersectionObserver = NoTriggerObserver as any;

    render(
      <PitchDeckThumbnail pdfUrl={mockPdfUrl} onClick={mockOnClick} />
    );

    expect(screen.getByText('Pitch Deck Preview')).toBeInTheDocument();

    // Restore
    window.IntersectionObserver = MockIntersectionObserver as any;
  });

  it('should fetch PDF when component becomes visible', async () => {
    render(
      <PitchDeckThumbnail pdfUrl={mockPdfUrl} onClick={mockOnClick} />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(mockPdfUrl);
    });
  });

  it('should display loading state while PDF loads', async () => {
    // Delay fetch to ensure we can see loading state
    (global.fetch as any).mockImplementation(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({
          ok: true,
          blob: async () => new Blob(['mock pdf data'], { type: 'application/pdf' }),
        }), 500)
      )
    );

    render(
      <PitchDeckThumbnail pdfUrl={mockPdfUrl} onClick={mockOnClick} />
    );

    // Loading state should appear shortly after component becomes visible
    await waitFor(() => {
      expect(screen.getByText('Loading preview...')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('should render PDF document on successful load', async () => {
    render(
      <PitchDeckThumbnail pdfUrl={mockPdfUrl} onClick={mockOnClick} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
      expect(screen.getByTestId('pdf-page')).toBeInTheDocument();
    });
  });

  it('should display error state on PDF load failure', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Failed to load PDF'));

    render(
      <PitchDeckThumbnail pdfUrl={mockPdfUrl} onClick={mockOnClick} />
    );

    await waitFor(() => {
      expect(screen.getByText('Preview unavailable')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getAllByText('Click to view full deck').length).toBeGreaterThan(0);
  });

  it('should call onClick handler when thumbnail is clicked', async () => {
    render(
      <PitchDeckThumbnail pdfUrl={mockPdfUrl} onClick={mockOnClick} />
    );

    const thumbnail = screen.getByRole('button');
    fireEvent.click(thumbnail);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should handle keyboard Enter key press', async () => {
    render(
      <PitchDeckThumbnail pdfUrl={mockPdfUrl} onClick={mockOnClick} />
    );

    const thumbnail = screen.getByRole('button');
    fireEvent.keyDown(thumbnail, { key: 'Enter', code: 'Enter' });

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should handle keyboard Space key press', async () => {
    render(
      <PitchDeckThumbnail pdfUrl={mockPdfUrl} onClick={mockOnClick} />
    );

    const thumbnail = screen.getByRole('button');
    fireEvent.keyDown(thumbnail, { key: ' ', code: 'Space' });

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should cleanup blob URLs on unmount', async () => {
    const { unmount } = render(
      <PitchDeckThumbnail pdfUrl={mockPdfUrl} onClick={mockOnClick} />
    );

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    unmount();

    await waitFor(() => {
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  it('should render with custom className', () => {
    render(
      <PitchDeckThumbnail
        pdfUrl={mockPdfUrl}
        onClick={mockOnClick}
        className="custom-class"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should render with custom alt text', () => {
    const customAlt = 'Custom pitch deck preview';
    render(
      <PitchDeckThumbnail
        pdfUrl={mockPdfUrl}
        onClick={mockOnClick}
        alt={customAlt}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', customAlt);
  });

  it('should handle network fetch errors', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    render(
      <PitchDeckThumbnail pdfUrl={mockPdfUrl} onClick={mockOnClick} />
    );

    await waitFor(() => {
      expect(screen.getByText('Preview unavailable')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should not fetch PDF if not visible', async () => {
    // Create a custom observer that doesn't trigger
    class NoTriggerObserver {
      constructor(callback: any) {
        // Don't call callback
      }
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    }

    window.IntersectionObserver = NoTriggerObserver as any;

    render(
      <PitchDeckThumbnail pdfUrl={mockPdfUrl} onClick={mockOnClick} />
    );

    // Wait a bit to ensure fetch doesn't happen
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(global.fetch).not.toHaveBeenCalled();

    // Restore
    window.IntersectionObserver = MockIntersectionObserver as any;
  });

  it('should disconnect IntersectionObserver after becoming visible', async () => {
    render(
      <PitchDeckThumbnail pdfUrl={mockPdfUrl} onClick={mockOnClick} />
    );

    await waitFor(() => {
      expect(mockDisconnect).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('should be accessible with proper ARIA attributes', () => {
    render(
      <PitchDeckThumbnail pdfUrl={mockPdfUrl} onClick={mockOnClick} />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('tabIndex', '0');
  });
});
