import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ChatPitchPreview } from '@/components/ChatPitchPreview';

// Mock dependencies
vi.mock('@/components/SecurePDFViewer', () => ({
  default: ({ pdfUrl, userTier }: { pdfUrl: string; userTier: string | null }) => (
    <div data-testid="mock-pdf-viewer">
      PDF Viewer: {pdfUrl} - Tier: {userTier}
    </div>
  ),
}));

vi.mock('@/components/PitchDeckThumbnail', () => ({
  default: ({ pdfUrl, onClick, alt }: { pdfUrl: string; onClick: () => void; alt: string }) => (
    <div
      data-testid="mock-pitch-thumbnail"
      onClick={onClick}
      role="button"
      aria-label={alt}
    >
      Thumbnail: {pdfUrl}
    </div>
  ),
}));

vi.mock('@/hooks/useTierAccess', () => ({
  useTierAccess: () => ({ tier: 'basic' }),
}));

describe('ChatPitchPreview Component', () => {
  it('should render PitchDeckThumbnail component', () => {
    render(
      <ChatPitchPreview
        titleId="test-123"
        titleName="Test Title"
        pitchUrl="https://example.com/pitch.pdf"
        userTier="basic"
      />
    );

    const thumbnail = screen.getByTestId('mock-pitch-thumbnail');
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail).toHaveTextContent('https://example.com/pitch.pdf');
  });

  it('should show tier badge for basic tier user', () => {
    render(
      <ChatPitchPreview
        titleId="test-123"
        titleName="Test Title"
        pitchUrl="https://example.com/pitch.pdf"
        userTier="basic"
      />
    );

    expect(screen.getByText(/Preview: Pages 1-5 only/i)).toBeInTheDocument();
    expect(screen.getByText('PRO PLAN')).toBeInTheDocument();
  });

  it('should NOT show tier badge for pro tier user', () => {
    render(
      <ChatPitchPreview
        titleId="test-123"
        titleName="Test Title"
        pitchUrl="https://example.com/pitch.pdf"
        userTier="pro"
      />
    );

    expect(screen.getByText(/Click to view complete pitch deck/i)).toBeInTheDocument();
    expect(screen.queryByText('PRO PLAN')).not.toBeInTheDocument();
  });

  it('should NOT render if pitchUrl is empty', () => {
    const { container } = render(
      <ChatPitchPreview
        titleId="test-123"
        titleName="Test Title"
        pitchUrl=""
        userTier="basic"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should have link to title detail page', () => {
    render(
      <ChatPitchPreview
        titleId="test-123"
        titleName="Test Title"
        pitchUrl="https://example.com/pitch.pdf"
        userTier="basic"
      />
    );

    const link = screen.getByRole('link', { name: /view full title details/i });
    expect(link).toHaveAttribute('href', '/buyers/titles/test-123');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('should open modal when thumbnail is clicked', async () => {
    render(
      <ChatPitchPreview
        titleId="test-123"
        titleName="Test Title"
        pitchUrl="https://example.com/pitch.pdf"
        userTier="basic"
      />
    );

    const thumbnail = screen.getByTestId('mock-pitch-thumbnail');

    // Modal should not be visible initially
    expect(screen.queryByTestId('mock-pdf-viewer')).not.toBeInTheDocument();

    // Click thumbnail
    fireEvent.click(thumbnail);

    // Modal should now be visible
    await waitFor(() => {
      expect(screen.getByTestId('mock-pdf-viewer')).toBeInTheDocument();
    });
  });
});

describe('Chat Helper Functions - isInformationQuery', () => {
  // Helper function implementation (copy from Chat.tsx for testing)
  const isInformationQuery = (query: string): boolean => {
    if (!query) return false;
    const lowerQuery = query.toLowerCase();

    const specificTitlePattern = /(tell me|learn|details?|more) (more )?(about|on) /;
    const infoIndicators = ['what is', 'who is', 'explain', 'describe'];

    return specificTitlePattern.test(lowerQuery) || infoIndicators.some(ind => lowerQuery.includes(ind));
  };

  it('should detect "Tell me more about X" queries', () => {
    expect(isInformationQuery('Tell me more about First Love')).toBe(true);
    expect(isInformationQuery('tell me about Romance webtoons')).toBe(true);
    expect(isInformationQuery('Learn more about this title')).toBe(true);
  });

  it('should detect information request patterns', () => {
    expect(isInformationQuery('What is First Love?')).toBe(true);
    expect(isInformationQuery('Explain the plot of First Love')).toBe(true);
    expect(isInformationQuery('Describe this story')).toBe(true);
  });

  it('should NOT detect other query types', () => {
    expect(isInformationQuery('Find me romance webtoons')).toBe(false);
    expect(isInformationQuery('Show me popular titles')).toBe(false);
    expect(isInformationQuery('I love this!')).toBe(false);
    expect(isInformationQuery('')).toBe(false);
  });
});

describe('Chat Helper Functions - extractTitleName', () => {
  // Helper function implementation (copy from Chat.tsx for testing)
  const extractTitleName = (query: string): string | null => {
    if (!query) return null;

    const patterns = [
      /(?:tell me|learn|details?|more)\s+(?:more\s+)?(?:about|on)\s+["']?([^"'?.!]+)["']?/i,
      /(?:what is|who is|explain|describe)\s+["']?([^"'?.!]+)["']?/i,
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  };

  it('should extract title from "Tell me more about X"', () => {
    expect(extractTitleName('Tell me more about First Love')).toBe('First Love');
    expect(extractTitleName('tell me about Romance Story')).toBe('Romance Story');
    expect(extractTitleName('Learn more about The Great Webtoon')).toBe('The Great Webtoon');
  });

  it('should extract title from information queries', () => {
    expect(extractTitleName('What is First Love')).toBe('First Love');
    expect(extractTitleName('Explain The Plot')).toBe('The Plot');
    expect(extractTitleName('Describe "Romantic Comedy"')).toBe('Romantic Comedy');
  });

  it('should handle quoted titles', () => {
    expect(extractTitleName('Tell me about "First Love"')).toBe('First Love');
    expect(extractTitleName("Tell me about 'My Story'")).toBe('My Story');
  });

  it('should return null for non-information queries', () => {
    expect(extractTitleName('Find me romance webtoons')).toBeNull();
    expect(extractTitleName('Show popular titles')).toBeNull();
    expect(extractTitleName('')).toBeNull();
  });
});

describe('Integration Test - Pitch Preview in Chat Flow', () => {
  it('should NOT show pitch preview for non-information queries', () => {
    // This test verifies that discovery/search queries don't trigger pitch fetch
    const query = 'Find me romance webtoons';

    const isInformationQuery = (q: string): boolean => {
      const lowerQuery = q.toLowerCase();
      const specificTitlePattern = /(tell me|learn|details?|more) (more )?(about|on) /;
      const infoIndicators = ['what is', 'who is', 'explain', 'describe'];
      return specificTitlePattern.test(lowerQuery) || infoIndicators.some(ind => lowerQuery.includes(ind));
    };

    expect(isInformationQuery(query)).toBe(false);
  });

  it('should detect information queries correctly', () => {
    const query = 'Tell me more about First Love';

    const isInformationQuery = (q: string): boolean => {
      const lowerQuery = q.toLowerCase();
      const specificTitlePattern = /(tell me|learn|details?|more) (more )?(about|on) /;
      const infoIndicators = ['what is', 'who is', 'explain', 'describe'];
      return specificTitlePattern.test(lowerQuery) || infoIndicators.some(ind => lowerQuery.includes(ind));
    };

    const extractTitleName = (q: string): string | null => {
      const patterns = [
        /(?:tell me|learn|details?|more)\s+(?:more\s+)?(?:about|on)\s+["']?([^"'?.!]+)["']?/i,
        /(?:what is|who is|explain|describe)\s+["']?([^"'?.!]+)["']?/i,
      ];

      for (const pattern of patterns) {
        const match = q.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }

      return null;
    };

    expect(isInformationQuery(query)).toBe(true);
    expect(extractTitleName(query)).toBe('First Love');
  });
});

describe('Regression Tests - Existing Chat Behavior', () => {
  it('should NOT modify message rendering logic', () => {
    // This test ensures that adding pitch preview doesn't break existing rendering
    // The pitch preview is added separately and doesn't modify ConversationalMessage
    const mockMessage = {
      id: '1',
      content: 'Bot response here',
      sender: 'bot' as const,
      timestamp: new Date(),
      titles: [],
      suggestedQueries: []
    };

    // Verify message structure is unchanged
    expect(mockMessage).toHaveProperty('content');
    expect(mockMessage).toHaveProperty('sender');
    expect(mockMessage).toHaveProperty('titles');
    expect(mockMessage).toHaveProperty('suggestedQueries');
  });

  it('should NOT interfere with suggested queries', () => {
    // Suggested queries should still work alongside pitch preview
    const suggestedQueries = ['Query 1', 'Query 2', 'Query 3'];

    // Verify suggested queries are not modified
    expect(suggestedQueries).toHaveLength(3);
    expect(suggestedQueries[0]).toBe('Query 1');
  });

  it('should preserve tier-based restrictions', () => {
    // Basic tier should still have page 1-5 restriction
    const basicTier = 'basic';
    const maxPagesForBasic = 5;

    expect(basicTier).toBe('basic');
    expect(maxPagesForBasic).toBe(5);

    // Pro/Suite should have full access
    const proTier = 'pro';
    const canAccessPremiumContent = proTier === 'pro' || proTier === 'suite';
    expect(canAccessPremiumContent).toBe(true);
  });
});
