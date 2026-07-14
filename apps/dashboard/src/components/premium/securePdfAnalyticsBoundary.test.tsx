import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SecurePDFViewer from './SecurePDFViewer';

const mocks = vi.hoisted(() => ({
  user: { id: 'buyer-1' },
  getSession: vi.fn(),
  createSignedUrl: vi.fn(),
  trackPitchDeckOpened: vi.fn(),
  trackPitchDeckPageViewed: vi.fn(),
  trackPitchDeckPageLimitHit: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: mocks.getSession },
    storage: { from: () => ({ createSignedUrl: mocks.createSignedUrl }) },
  },
}));
vi.mock('@/lib/pdfConfig', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    Document: ({ onLoadSuccess, children }: { onLoadSuccess: (value: { numPages: number }) => void; children: React.ReactNode }) => {
      const hasLoaded = React.useRef(false);
      React.useEffect(() => {
        if (hasLoaded.current) return;
        hasLoaded.current = true;
        onLoadSuccess({ numPages: 3 });
      }, [onLoadSuccess]);
      return <>{children}</>;
    },
    Page: () => <div>PDF page</div>,
  };
});
vi.mock('@/utils/analytics', () => ({
  trackUpgradeButtonClick: vi.fn(),
  trackPitchDeckOpened: mocks.trackPitchDeckOpened,
  trackPitchDeckPageViewed: mocks.trackPitchDeckPageViewed,
  trackPitchDeckPageLimitHit: mocks.trackPitchDeckPageLimitHit,
  trackPitchDeckUpgradePromptShown: vi.fn(),
  trackPitchDeckClosed: vi.fn(),
  trackPitchDeckError: vi.fn(),
  trackPitchDeckZoom: vi.fn(),
  trackPitchDeckFullscreen: vi.fn(),
}));

const pdfUrl = 'https://project.supabase.co/storage/v1/object/public/pitches/Sample.pdf';

describe('pitch-deck analytics boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      data: { session: { user: { id: 'buyer-1' }, access_token: 'token', expires_at: 9999999999 } },
      error: null,
    });
    mocks.createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed.example/Sample.pdf?token=signed' },
      error: null,
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/pdf', 'content-length': '3' }),
      body: {
        getReader: () => {
          let read = false;
          return {
            read: vi.fn().mockImplementation(async () => {
              if (read) return { done: true, value: undefined };
              read = true;
              return { done: false, value: new Uint8Array([1, 2, 3]) };
            }),
          };
        },
      },
    }));
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:pdf'), configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
  });

  it('emits open and first-page outcomes once after the document loads', async () => {
    render(<SecurePDFViewer pdfUrl={pdfUrl} titleId="title-1" userTier="pro" />);

    await waitFor(() => expect(mocks.trackPitchDeckOpened).toHaveBeenCalledTimes(1));
    expect(mocks.trackPitchDeckOpened).toHaveBeenCalledWith('title-1', 'full');
    expect(mocks.trackPitchDeckPageViewed).toHaveBeenCalledTimes(1);
    expect(mocks.trackPitchDeckPageViewed).toHaveBeenCalledWith('title-1', 1, 'full');
  });

  it('records the destination page only after it becomes visible', async () => {
    render(<SecurePDFViewer pdfUrl={pdfUrl} titleId="title-1" userTier="pro" />);
    await waitFor(() => expect(mocks.trackPitchDeckOpened).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByLabelText('Next page'));

    expect(mocks.trackPitchDeckPageViewed).toHaveBeenNthCalledWith(2, 'title-1', 2, 'full');
    expect(mocks.trackPitchDeckPageViewed).toHaveBeenCalledTimes(2);
  });

  it('does not count a page blocked by the preview limit', async () => {
    render(
      <SecurePDFViewer
        pdfUrl={pdfUrl}
        titleId="title-1"
        userTier="basic"
        maxPagesForBasic={1}
      />
    );
    await waitFor(() => expect(mocks.trackPitchDeckOpened).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByLabelText('Next page'));

    expect(mocks.trackPitchDeckPageLimitHit).toHaveBeenCalledTimes(1);
    expect(mocks.trackPitchDeckPageViewed).toHaveBeenCalledTimes(1);
    expect(mocks.trackPitchDeckPageViewed).toHaveBeenCalledWith('title-1', 1, 'preview');
  });

  it('emits no open/page outcome when authentication fails', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: new Error('expired') });
    render(<SecurePDFViewer pdfUrl={pdfUrl} titleId="title-1" userTier="pro" />);

    await screen.findByText(/session expired/i);
    expect(mocks.trackPitchDeckOpened).not.toHaveBeenCalled();
    expect(mocks.trackPitchDeckPageViewed).not.toHaveBeenCalled();
  });
});
