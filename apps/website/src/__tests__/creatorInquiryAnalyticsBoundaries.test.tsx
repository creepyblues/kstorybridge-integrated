import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const analytics = vi.hoisted(() => ({
  trackCreatorInquiryFailed: vi.fn(),
  trackCreatorInquirySubmitted: vi.fn(),
}));
const invoke = vi.hoisted(() => vi.fn());
const sendSlackNotification = vi.hoisted(() => vi.fn());
const toast = vi.hoisted(() => vi.fn());

vi.mock('../utils/analytics', () => analytics);
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke } },
}));
vi.mock('../utils/slack', () => ({ sendSlackNotification }));
vi.mock('react-i18next', () => ({
  useTranslation: (namespace = 'creators') => ({
    t: (key: string) => `${namespace}.${key}`,
  }),
}));
vi.mock('@kstorybridge/ui', async importOriginal => {
  const actual = await importOriginal<typeof import('@kstorybridge/ui')>();
  return { ...actual, useToast: () => ({ toast }) };
});

import CreatorInquiryDialog from '../components/CreatorInquiryDialog';

const fillRequiredFields = async () => {
  fireEvent.change(screen.getByLabelText('creators.inquiry.fields.name.label'), {
    target: { value: 'Test Creator' },
  });
  fireEvent.change(screen.getByLabelText('creators.inquiry.fields.email.label'), {
    target: { value: 'creator@example.com' },
  });
  fireEvent.change(screen.getByLabelText('creators.inquiry.fields.titleName.label'), {
    target: { value: 'Test Title' },
  });
  fireEvent.change(screen.getByLabelText('creators.inquiry.fields.titleUrl.label'), {
    target: { value: 'https://example.com/title' },
  });

  fireEvent.click(screen.getByRole('combobox'));
  fireEvent.click(await screen.findByRole('option', {
    name: 'creators.inquiry.fields.role.author',
  }));
};

beforeEach(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
  invoke.mockResolvedValue({ error: null });
  sendSlackNotification.mockResolvedValue(undefined);
});

describe('creator inquiry analytics outcome boundaries', () => {
  it('emits one submitted outcome only after email and Slack succeed', async () => {
    const onOpenChange = vi.fn();
    render(<CreatorInquiryDialog open onOpenChange={onOpenChange} />);
    await fillRequiredFields();

    fireEvent.click(screen.getByRole('button', { name: 'creators.inquiry.submit' }));

    await waitFor(() => expect(analytics.trackCreatorInquirySubmitted).toHaveBeenCalledOnce());
    expect(invoke).toHaveBeenCalledOnce();
    expect(sendSlackNotification).toHaveBeenCalledOnce();
    expect(analytics.trackCreatorInquiryFailed).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('emits one failed outcome and no submitted outcome when delivery rejects', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    invoke.mockResolvedValue({ error: new Error('delivery rejected') });
    render(<CreatorInquiryDialog open onOpenChange={vi.fn()} />);
    await fillRequiredFields();

    fireEvent.click(screen.getByRole('button', { name: 'creators.inquiry.submit' }));

    await waitFor(() => expect(analytics.trackCreatorInquiryFailed).toHaveBeenCalledOnce());
    expect(invoke).toHaveBeenCalledOnce();
    expect(sendSlackNotification).not.toHaveBeenCalled();
    expect(analytics.trackCreatorInquirySubmitted).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it('does not claim submission when the team notification rejects', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    sendSlackNotification.mockRejectedValue(new Error('notification rejected'));
    render(<CreatorInquiryDialog open onOpenChange={vi.fn()} />);
    await fillRequiredFields();

    fireEvent.click(screen.getByRole('button', { name: 'creators.inquiry.submit' }));

    await waitFor(() => expect(analytics.trackCreatorInquiryFailed).toHaveBeenCalledOnce());
    expect(invoke).toHaveBeenCalledOnce();
    expect(sendSlackNotification).toHaveBeenCalledOnce();
    expect(analytics.trackCreatorInquirySubmitted).not.toHaveBeenCalled();
  });

  it('emits no delivery outcome when client validation blocks submission', async () => {
    render(<CreatorInquiryDialog open onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'creators.inquiry.submit' }));

    await waitFor(() => {
      expect(screen.getByText('creators.inquiry.validation.name')).toBeInTheDocument();
    });
    expect(invoke).not.toHaveBeenCalled();
    expect(sendSlackNotification).not.toHaveBeenCalled();
    expect(analytics.trackCreatorInquirySubmitted).not.toHaveBeenCalled();
    expect(analytics.trackCreatorInquiryFailed).not.toHaveBeenCalled();
  });
});
