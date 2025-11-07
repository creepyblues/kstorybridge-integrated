/**
 * Unit Tests: TitleSelector Component
 * Tests title dropdown with pitch data filtering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { TitleSelector } from '../TitleSelector';
import * as useAssetGeneration from '@/hooks/useAssetGeneration';
import type { TitleWithPitch } from '@/types/asset-generation';

// Mock hooks
vi.mock('@/hooks/useAssetGeneration');

const mockTitles: TitleWithPitch[] = [
  {
    title_id: 'title-1',
    title_name_en: 'True Beauty',
    title_name_kr: '여신강림',
    views: 5000000,
    pitch: 'https://example.com/pitch1.pdf',
  },
  {
    title_id: 'title-2',
    title_name_en: 'Solo Leveling',
    title_name_kr: '나 혼자만 레벨업',
    views: 10000000,
    pitch: 'https://example.com/pitch2.pdf',
  },
  {
    title_id: 'title-3',
    title_name_en: null,
    title_name_kr: '한국어 제목만',
    views: 1000000,
    pitch: 'https://example.com/pitch3.pdf',
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('TitleSelector', () => {
  const mockOnSelectTitle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    vi.mocked(useAssetGeneration.useTitlesWithPitch).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(
      <TitleSelector selectedTitleId={null} onSelectTitle={mockOnSelectTitle} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Loading titles...')).toBeInTheDocument();
  });

  it('should render error state', () => {
    const mockError = new Error('Failed to load titles');

    vi.mocked(useAssetGeneration.useTitlesWithPitch).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
    } as any);

    render(
      <TitleSelector selectedTitleId={null} onSelectTitle={mockOnSelectTitle} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/Error loading titles/)).toBeInTheDocument();
    expect(screen.getByText(/Failed to load titles/)).toBeInTheDocument();
  });

  it('should render titles dropdown', () => {
    vi.mocked(useAssetGeneration.useTitlesWithPitch).mockReturnValue({
      data: mockTitles,
      isLoading: false,
      error: null,
    } as any);

    render(
      <TitleSelector selectedTitleId={null} onSelectTitle={mockOnSelectTitle} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Select a title...')).toBeInTheDocument();
  });

  it('should display selected title', () => {
    vi.mocked(useAssetGeneration.useTitlesWithPitch).mockReturnValue({
      data: mockTitles,
      isLoading: false,
      error: null,
    } as any);

    render(
      <TitleSelector selectedTitleId="title-1" onSelectTitle={mockOnSelectTitle} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('True Beauty')).toBeInTheDocument();
  });

  it('should call onSelectTitle when title is selected', async () => {
    const user = userEvent.setup();

    vi.mocked(useAssetGeneration.useTitlesWithPitch).mockReturnValue({
      data: mockTitles,
      isLoading: false,
      error: null,
    } as any);

    render(
      <TitleSelector selectedTitleId={null} onSelectTitle={mockOnSelectTitle} />,
      { wrapper: createWrapper() }
    );

    // Open dropdown
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    // Select title
    await waitFor(() => {
      expect(screen.getByText('True Beauty')).toBeInTheDocument();
    });

    const option = screen.getByText('True Beauty');
    await user.click(option);

    expect(mockOnSelectTitle).toHaveBeenCalledWith(mockTitles[0]);
  });

  it('should display Korean name as fallback', () => {
    vi.mocked(useAssetGeneration.useTitlesWithPitch).mockReturnValue({
      data: mockTitles,
      isLoading: false,
      error: null,
    } as any);

    render(
      <TitleSelector selectedTitleId="title-3" onSelectTitle={mockOnSelectTitle} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('한국어 제목만')).toBeInTheDocument();
  });

  it('should format view counts', async () => {
    const user = userEvent.setup();

    vi.mocked(useAssetGeneration.useTitlesWithPitch).mockReturnValue({
      data: mockTitles,
      isLoading: false,
      error: null,
    } as any);

    render(
      <TitleSelector selectedTitleId={null} onSelectTitle={mockOnSelectTitle} />,
      { wrapper: createWrapper() }
    );

    // Open dropdown
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('5,000,000 views')).toBeInTheDocument();
      expect(screen.getByText('10,000,000 views')).toBeInTheDocument();
    });
  });

  it('should handle empty titles array', () => {
    vi.mocked(useAssetGeneration.useTitlesWithPitch).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    render(
      <TitleSelector selectedTitleId={null} onSelectTitle={mockOnSelectTitle} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Select a title...')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    vi.mocked(useAssetGeneration.useTitlesWithPitch).mockReturnValue({
      data: mockTitles,
      isLoading: false,
      error: null,
    } as any);

    const { container } = render(
      <TitleSelector
        selectedTitleId={null}
        onSelectTitle={mockOnSelectTitle}
        className="custom-class"
      />,
      { wrapper: createWrapper() }
    );

    const trigger = container.querySelector('.custom-class');
    expect(trigger).toBeInTheDocument();
  });
});
