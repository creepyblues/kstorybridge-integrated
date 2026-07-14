import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const analytics = vi.hoisted(() => ({
  trackAudiencePathSelected: vi.fn(),
  trackCreatorInquiryStarted: vi.fn(),
  trackFeaturePromoSelected: vi.fn(),
  trackSigninCtaClicked: vi.fn(),
  trackSignupCtaClicked: vi.fn(),
  trackTrialCtaClicked: vi.fn(),
}));

vi.mock('../utils/analytics', () => analytics);
vi.mock('../config/urls', () => ({
  getDashboardUrl: () => '#dashboard',
  getCreatorUrl: () => '#creator',
}));
vi.mock('react-i18next', () => ({
  useTranslation: (namespace = 'common') => ({
    t: (key: string) => `${namespace}.${key}`,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));
vi.mock('../components/Footer', () => ({ default: () => null }));
vi.mock('../components/header/LanguageSelector', () => ({ default: () => null }));
vi.mock('../components/TypewriterText', () => ({
  TypewriterText: ({ lines }: { lines: Array<{ text: string }> }) => (
    <>{lines.map(line => <span key={line.text}>{line.text}</span>)}</>
  ),
}));
vi.mock('../components/RandomFeaturedGrid', () => ({ default: () => null }));
vi.mock('../components/CreatorInquiryDialog', () => ({ default: () => null }));

import UniversalHeader from '../components/UniversalHeader';
import { FeatureHero } from '../components/features/shared/FeatureHero';
import { FinalCTASection } from '../components/features/shared/FinalCTASection';
import SignInDropdown from '../components/header/SignInDropdown';
import { DiscoveryToolsSection } from '../components/producers/DiscoveryToolsSection';
import CreatorsPage from '../pages/CreatorsPage';
import HomePage from '../pages/HomePage';
import ProducersPage from '../pages/ProducersPage';

const renderWithRouter = (node: React.ReactNode, path = '/') =>
  render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      {node}
    </MemoryRouter>
  );

const mediaQueryResult = (matches: boolean): MediaQueryList => ({
  matches,
  media: '(min-width: 768px)',
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

beforeEach(() => {
  window.history.replaceState({}, '', '/');
});

describe('website acquisition CTA component boundaries', () => {
  it('records each homepage audience choice once before its handoff', () => {
    renderWithRouter(<HomePage />);

    fireEvent.click(screen.getByRole('button', { name: 'home.hero.ctaCreator' }));
    fireEvent.click(screen.getByRole('button', { name: 'home.hero.ctaBuyer' }));

    expect(analytics.trackAudiencePathSelected).toHaveBeenNthCalledWith(1, 'creator', 'hero');
    expect(analytics.trackAudiencePathSelected).toHaveBeenNthCalledWith(2, 'buyer', 'hero');
    expect(analytics.trackAudiencePathSelected).toHaveBeenCalledTimes(2);
  });

  it('distinguishes desktop and mobile audience navigation', () => {
    renderWithRouter(<UniversalHeader />, '/about');

    fireEvent.click(screen.getByRole('button', { name: 'COMMON.NAV.CREATORS' }));
    fireEvent.click(screen.getByRole('button', { name: 'Toggle menu' }));
    const creatorButtons = screen.getAllByRole('button', { name: 'COMMON.NAV.CREATORS' });
    fireEvent.click(creatorButtons[creatorButtons.length - 1]);

    expect(analytics.trackAudiencePathSelected).toHaveBeenNthCalledWith(
      1,
      'creator',
      'header_desktop'
    );
    expect(analytics.trackAudiencePathSelected).toHaveBeenNthCalledWith(
      2,
      'creator',
      'header_mobile'
    );
    expect(analytics.trackAudiencePathSelected).toHaveBeenCalledTimes(2);
  });

  it('distinguishes desktop and mobile buyer navigation', () => {
    renderWithRouter(<UniversalHeader />, '/about');

    fireEvent.click(screen.getByRole('button', { name: 'COMMON.NAV.PRODUCERS' }));
    fireEvent.click(screen.getByRole('button', { name: 'Toggle menu' }));
    const producerButtons = screen.getAllByRole('button', { name: 'COMMON.NAV.PRODUCERS' });
    fireEvent.click(producerButtons[producerButtons.length - 1]);

    expect(analytics.trackAudiencePathSelected).toHaveBeenNthCalledWith(
      1,
      'buyer',
      'header_desktop'
    );
    expect(analytics.trackAudiencePathSelected).toHaveBeenNthCalledWith(
      2,
      'buyer',
      'header_mobile'
    );
    expect(analytics.trackAudiencePathSelected).toHaveBeenCalledTimes(2);
  });

  it('records route-aware creator sign-in with the rendered viewport position', () => {
    renderWithRouter(<SignInDropdown />, '/creators');
    const link = screen.getByRole('link', { name: 'COMMON.NAV.SIGNIN' });
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    click.preventDefault();

    link.dispatchEvent(click);

    expect(analytics.trackSigninCtaClicked).toHaveBeenCalledOnce();
    expect(analytics.trackSigninCtaClicked).toHaveBeenCalledWith('creator', 'header_mobile');
  });

  it('records route-aware buyer sign-in with the desktop position', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue(mediaQueryResult(true));
    renderWithRouter(<SignInDropdown />, '/producers');
    const link = screen.getByRole('link', { name: 'COMMON.NAV.SIGNIN' });
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    click.preventDefault();

    link.dispatchEvent(click);

    expect(analytics.trackSigninCtaClicked).toHaveBeenCalledOnce();
    expect(analytics.trackSigninCtaClicked).toHaveBeenCalledWith('buyer', 'header_desktop');
  });

  it('records each producer trial and signup handoff once', () => {
    renderWithRouter(<ProducersPage />, '/producers');

    fireEvent.click(screen.getByRole('button', { name: 'producers.hero.cta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Get Started Today' }));

    expect(analytics.trackTrialCtaClicked).toHaveBeenCalledOnce();
    expect(analytics.trackTrialCtaClicked).toHaveBeenCalledWith('hero', 'producers_page');
    expect(analytics.trackSignupCtaClicked).toHaveBeenCalledOnce();
    expect(analytics.trackSignupCtaClicked).toHaveBeenCalledWith(
      'final_cta',
      'producers_page'
    );
  });

  it('records the exact feature selected from the discovery cards', () => {
    renderWithRouter(<DiscoveryToolsSection />, '/producers');

    fireEvent.click(screen.getByRole('link', { name: /producers\.discoveryTools\.chatbot\.title/ }));

    expect(analytics.trackFeaturePromoSelected).toHaveBeenCalledOnce();
    expect(analytics.trackFeaturePromoSelected).toHaveBeenCalledWith('chatbot');
  });

  it('preserves feature and position on hero trial/signup handoffs', () => {
    renderWithRouter(
      <FeatureHero
        headline="Headline"
        subhead="Subhead"
        primaryCtaText="Try"
        secondaryCtaText="Sign up"
        storageKey="test"
        featureName="comps_navigator"
      >
        <div>Demo</div>
      </FeatureHero>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Try' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(analytics.trackTrialCtaClicked).toHaveBeenCalledWith('hero', 'comps_navigator');
    expect(analytics.trackSignupCtaClicked).toHaveBeenCalledWith('hero', 'comps_navigator');
    expect(analytics.trackTrialCtaClicked).toHaveBeenCalledTimes(1);
    expect(analytics.trackSignupCtaClicked).toHaveBeenCalledTimes(1);
  });

  it('preserves feature and position on final trial/signup handoffs', () => {
    renderWithRouter(<FinalCTASection featureName="mandate_matcher" />);
    const buttons = screen.getAllByRole('button');

    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);

    expect(analytics.trackTrialCtaClicked).toHaveBeenCalledWith(
      'final_cta',
      'mandate_matcher'
    );
    expect(analytics.trackSignupCtaClicked).toHaveBeenCalledWith(
      'final_cta',
      'mandate_matcher'
    );
    expect(analytics.trackTrialCtaClicked).toHaveBeenCalledTimes(1);
    expect(analytics.trackSignupCtaClicked).toHaveBeenCalledTimes(1);
  });

  it('distinguishes hero and final creator inquiry starts', () => {
    renderWithRouter(<CreatorsPage />, '/creators');
    const inquiryButtons = screen.getAllByRole('button').filter(button =>
      button.textContent?.includes('creators.')
    );

    fireEvent.click(inquiryButtons[0]);
    fireEvent.click(inquiryButtons[inquiryButtons.length - 1]);

    expect(analytics.trackCreatorInquiryStarted).toHaveBeenNthCalledWith(1, 'hero');
    expect(analytics.trackCreatorInquiryStarted).toHaveBeenNthCalledWith(2, 'final_cta');
    expect(analytics.trackCreatorInquiryStarted).toHaveBeenCalledTimes(2);
  });
});
