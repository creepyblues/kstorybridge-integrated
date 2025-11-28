/**
 * Unit Tests: GenerationStats Component
 * Tests statistics calculation and display
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GenerationStats } from '../GenerationStats';
import type { MarketingAsset } from '@/types/asset-generation';

const createMockAsset = (overrides: Partial<MarketingAsset> = {}): MarketingAsset => ({
  id: 'asset-1',
  title_id: 'title-1',
  title_name: 'Test Title',
  asset_category: 'social_media',
  asset_type: 'instagram_story',
  asset_format: '1080x1920',
  description: 'Test asset',
  prompt_template: 'Test prompt',
  prompt_used: null,
  image_url: null,
  video_url: null,
  generation_api: 'dall-e-3',
  generation_model: 'dall-e-3',
  generation_cost: 0,
  generation_attempts: 0,
  error_message: null,
  status: 'pending',
  approved: false,
  approved_by_email: null,
  approved_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe('GenerationStats', () => {
  it('should display total asset count', () => {
    const assets = [
      createMockAsset({ id: 'asset-1' }),
      createMockAsset({ id: 'asset-2' }),
      createMockAsset({ id: 'asset-3' }),
    ];

    render(<GenerationStats assets={assets} />);

    expect(screen.getByText('Total Assets')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should calculate status counts correctly', () => {
    const assets = [
      createMockAsset({ id: 'asset-1', status: 'pending' }),
      createMockAsset({ id: 'asset-2', status: 'pending' }),
      createMockAsset({ id: 'asset-3', status: 'generating' }),
      createMockAsset({ id: 'asset-4', status: 'completed' }),
      createMockAsset({ id: 'asset-5', status: 'completed' }),
      createMockAsset({ id: 'asset-6', status: 'completed' }),
      createMockAsset({ id: 'asset-7', status: 'failed' }),
    ];

    render(<GenerationStats assets={assets} />);

    expect(screen.getByText('Total Assets')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    expect(screen.getByText('Generating')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('should calculate total cost from completed assets only', () => {
    const assets = [
      createMockAsset({ status: 'completed', generation_cost: 0.04 }),
      createMockAsset({ status: 'completed', generation_cost: 0.08 }),
      createMockAsset({ status: 'pending', generation_cost: 0 }),
      createMockAsset({ status: 'failed', generation_cost: 0 }),
    ];

    render(<GenerationStats assets={assets} />);

    expect(screen.getByText('Total Cost')).toBeInTheDocument();
    expect(screen.getByText('$0.12')).toBeInTheDocument();
  });

  it('should estimate remaining cost for pending assets', () => {
    const assets = [
      createMockAsset({ status: 'pending' }),
      createMockAsset({ status: 'pending' }),
      createMockAsset({ status: 'pending' }),
      createMockAsset({ status: 'completed', generation_cost: 0.04 }),
    ];

    render(<GenerationStats assets={assets} />);

    // 3 pending × $0.08 = $0.24
    expect(screen.getByText('Estimated Remaining: $0.24')).toBeInTheDocument();
  });

  it('should calculate projected total cost', () => {
    const assets = [
      createMockAsset({ status: 'completed', generation_cost: 0.04 }),
      createMockAsset({ status: 'completed', generation_cost: 0.08 }),
      createMockAsset({ status: 'pending' }), // Estimated $0.08
      createMockAsset({ status: 'pending' }), // Estimated $0.08
    ];

    render(<GenerationStats assets={assets} />);

    // Spent: $0.12, Remaining: $0.16, Total: $0.28
    expect(screen.getByText('Spent: $0.12')).toBeInTheDocument();
    expect(screen.getByText('Estimated Remaining: $0.16')).toBeInTheDocument();
    expect(screen.getByText('Total Projected: $0.28')).toBeInTheDocument();
  });

  it('should display progress bar with correct percentage', () => {
    const assets = [
      createMockAsset({ status: 'completed' }),
      createMockAsset({ status: 'completed' }),
      createMockAsset({ status: 'pending' }),
      createMockAsset({ status: 'pending' }),
    ];

    render(<GenerationStats assets={assets} />);

    // 2 completed out of 4 total = 50%
    expect(screen.getByText('2 / 4 completed')).toBeInTheDocument();
    expect(screen.getByText('(50%)')).toBeInTheDocument();
  });

  it('should handle empty assets array', () => {
    render(<GenerationStats assets={[]} />);

    expect(screen.getByText('Total Assets')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should show cost breakdown when costs exist', () => {
    const assets = [
      createMockAsset({ status: 'completed', generation_cost: 0.04 }),
    ];

    render(<GenerationStats assets={assets} />);

    expect(screen.getByText('Cost Breakdown')).toBeInTheDocument();
  });

  it('should not show cost breakdown when no costs', () => {
    const assets = [
      createMockAsset({ status: 'pending' }),
    ];

    const { container } = render(<GenerationStats assets={assets} />);

    expect(container.textContent).not.toContain('Cost Breakdown');
  });

  it('should animate generating indicator', () => {
    const assets = [
      createMockAsset({ status: 'generating' }),
    ];

    const { container } = render(<GenerationStats assets={assets} />);

    const generatingIcon = container.querySelector('.animate-spin');
    expect(generatingIcon).toBeInTheDocument();
  });

  it('should display zero cost as $0.00', () => {
    const assets = [
      createMockAsset({ status: 'pending' }),
    ];

    render(<GenerationStats assets={assets} />);

    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  it('should handle decimal costs correctly', () => {
    const assets = [
      createMockAsset({ status: 'completed', generation_cost: 0.041 }),
      createMockAsset({ status: 'completed', generation_cost: 0.079 }),
    ];

    render(<GenerationStats assets={assets} />);

    // 0.041 + 0.079 = 0.12
    expect(screen.getByText('$0.12')).toBeInTheDocument();
  });

  it('should show average cost per asset in note', () => {
    const assets = [
      createMockAsset({ status: 'pending' }),
      createMockAsset({ status: 'pending' }),
    ];

    render(<GenerationStats assets={assets} />);

    // Shows estimation note
    expect(screen.getByText(/× ~\$0.08 avg/)).toBeInTheDocument();
  });
});
