import { useEffect } from 'react';
import UniversalHeader from '../components/UniversalHeader';
import { Button } from '@kstorybridge/ui';
import { Card, CardContent } from '../components/ui/card';
import FeaturedTitlesCarousel from '../components/FeaturedTitlesCarousel';
import Footer from '../components/Footer';
import { TypewriterText } from '../components/TypewriterText';
import { useTranslation } from 'react-i18next';
import { getDashboardUrl } from '../config/urls';
import {
  Bot,
  Shield,
  Users,
  MessageSquare,
  FileCheck,
  Handshake,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Clock,
  Target,
  FileText,
  AlertCircle
} from 'lucide-react';

/**
 * PRODUCERS PAGE
 *
 * Main landing page for Hollywood producers and media scouts.
 *
 * Design Strategy: AI-first messaging with clear rights chain and expert support
 * Documentation: /apps/dashboard/public/docs/BUYERS_PAGE_OVERHAUL.md
 *
 * Sections:
 * 1. Hero (AI-first messaging)
 * 2. Video Showcase
 * 3. AI Assistant Showcase (Priority #1)
 * 4. Value Props Grid (3 pillars)
 * 5. Rights Deep Dive (Priority #2)
 * 6. Streamlined Process (3 steps)
 * 7. Catalog Preview
 * 8. Final CTA (simplified)
 * 9. Newsletter
 *
 * Updated: 2025-10-20
 */

const ProducersPage = () => {
  const { t } = useTranslation('producers');

  // Load Beehiiv script for newsletter
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://subscribe-forms.beehiiv.com/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">

      {/* Navigation */}
      <UniversalHeader />

      <main className="flex-1">

        {/* ========================================
            SECTION 1: HERO - REVISED MESSAGING
            ======================================== */}
        <section className="relative py-12 sm:py-16 lg:py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              {/* Hero with Typewriter Effect */}
              <div className="mb-8 sm:mb-12">
                <TypewriterText
                  storageKey="producers-hero-played"
                  lines={[
                    {
                      text: t('hero.title'),
                      className: 'text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-midnight-ink leading-tight',
                    },
                    {
                      text: t('hero.titleHighlight'),
                      className: 'text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-hanok-teal leading-tight',
                      delay: 0,
                    },
                    {
                      text: t('hero.subtitle'),
                      className: 'text-lg sm:text-xl lg:text-2xl text-midnight-ink-600 leading-relaxed max-w-3xl mx-auto block mt-6 sm:mt-8',
                      delay: 400,
                    },
                  ]}
                  cursorClassName="text-hanok-teal"
                />
              </div>

              {/* Primary CTA emphasis on AI */}
              <Button
                id="buyers-hero-try-ai-btn"
                size="lg"
                className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => window.location.href = `${getDashboardUrl()}/trial`}
              >
                {t('hero.cta')}
              </Button>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 2: VIDEO SHOWCASE
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white to-porcelain-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-2xl shadow-lg"
                  src="https://www.youtube.com/embed/BJS2m-MfOFg"
                  title="KStoryBridge Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 3: VALUE PROPS GRID (NEW)
            3 Core Pillars
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-porcelain-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink mb-6">
                {t('pillars.title')}
              </h2>
              <p className="text-lg sm:text-xl text-midnight-ink-600 leading-relaxed max-w-3xl mx-auto">
                {t('pillars.subtitle')}
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Pillar 1: AI Discovery */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-hanok-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Bot className="h-8 w-8 text-hanok-teal" />
                  </div>
                  <h3 className="text-xl font-bold text-midnight-ink mb-4">
                    {t('pillars.aiDiscovery.title')}
                  </h3>
                  <p className="text-midnight-ink-600 leading-relaxed">
                    {t('pillars.aiDiscovery.description')}
                  </p>
                </CardContent>
              </Card>

              {/* Pillar 2: Rights Chain */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-[#4C9C9B]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Shield className="h-8 w-8 text-[#4C9C9B]" />
                  </div>
                  <h3 className="text-xl font-bold text-midnight-ink mb-4">
                    {t('pillars.rightsChain.title')}
                  </h3>
                  <p className="text-midnight-ink-600 leading-relaxed">
                    {t('pillars.rightsChain.description')}
                  </p>
                </CardContent>
              </Card>

              {/* Pillar 3: Expert Support */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-porcelain-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Users className="h-8 w-8 text-porcelain-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-midnight-ink mb-4">
                    {t('pillars.expertSupport.title')}
                  </h3>
                  <p className="text-midnight-ink-600 leading-relaxed">
                    {t('pillars.expertSupport.description')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 4: AI ASSISTANT SHOWCASE (NEW)
            Priority #1 - 30% page focus
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-porcelain-blue-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Bot className="h-10 w-10 text-hanok-teal" />
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink">
                  {t('aiAssistant.title')}
                </h2>
              </div>
              <p className="text-lg sm:text-xl text-midnight-ink-600 leading-relaxed max-w-3xl mx-auto">
                {t('aiAssistant.subtitle')}
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

              {/* Left: Features */}
              <div className="space-y-6">
                <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-hanok-teal/10 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-hanok-teal" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-midnight-ink mb-2">
                          {t('aiAssistant.features.recommend.title')}
                        </h3>
                        <p className="text-midnight-ink-600">
                          {t('aiAssistant.features.recommend.description')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-hanok-teal/10 rounded-lg flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-hanok-teal" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-midnight-ink mb-2">
                          {t('aiAssistant.features.intelligence.title')}
                        </h3>
                        <p className="text-midnight-ink-600">
                          {t('aiAssistant.features.intelligence.description')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-hanok-teal/10 rounded-lg flex items-center justify-center">
                        <ExternalLink className="h-6 w-6 text-hanok-teal" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-midnight-ink mb-2">
                          {t('aiAssistant.features.details.title')}
                        </h3>
                        <p className="text-midnight-ink-600">
                          {t('aiAssistant.features.details.description')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Visual Demo Placeholder */}
              <div className="bg-gradient-to-br from-hanok-teal/10 to-porcelain-blue-100 rounded-2xl p-8 lg:p-12">
                <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-700">
                        "{t('aiAssistant.demo.userQuery')}"
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-hanok-teal rounded-full flex-shrink-0 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-hanok-teal/10 rounded-lg p-3 text-sm text-midnight-ink">
                        <p className="font-semibold mb-2">{t('aiAssistant.demo.aiResponseTitle')}</p>
                        <p className="text-xs text-midnight-ink-600">
                          {t('aiAssistant.demo.aiResponseBody')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center pt-4">
                    <Button
                      size="sm"
                      className="bg-hanok-teal hover:bg-hanok-teal-600 text-white"
                      onClick={() => window.location.href = `${getDashboardUrl()}/trial`}
                    >
                      {t('aiAssistant.demo.cta')}
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 5: EXPERT CURATION
            3-column grid layout
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-porcelain-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink mb-6">
                {t('expertCuration.headline')}
              </h2>
              <p className="text-lg sm:text-xl text-midnight-ink-600 leading-relaxed max-w-3xl mx-auto">
                {t('expertCuration.subtitle')}
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Benefit 1: Save Research Time */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-porcelain-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Clock className="h-8 w-8 text-porcelain-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-midnight-ink mb-4">
                    {t('expertCuration.benefits.research.title')}
                  </h3>
                  <p className="text-midnight-ink-600 leading-relaxed">
                    {t('expertCuration.benefits.research.description')}
                  </p>
                </CardContent>
              </Card>

              {/* Benefit 2: Make Decisions Faster */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-porcelain-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-8 w-8 text-porcelain-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-midnight-ink mb-4">
                    {t('expertCuration.benefits.decisions.title')}
                  </h3>
                  <p className="text-midnight-ink-600 leading-relaxed">
                    {t('expertCuration.benefits.decisions.description')}
                  </p>
                </CardContent>
              </Card>

              {/* Benefit 3: Ready to Pitch */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-porcelain-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <FileText className="h-8 w-8 text-porcelain-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-midnight-ink mb-4">
                    {t('expertCuration.benefits.ready.title')}
                  </h3>
                  <p className="text-midnight-ink-600 leading-relaxed">
                    {t('expertCuration.benefits.ready.description')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 7: CATALOG PREVIEW
            Updated background gradient
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-porcelain-blue-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink mb-6">
                {t('catalog.title')}
              </h2>
              <p className="text-xl text-midnight-ink-600 leading-relaxed max-w-2xl mx-auto">
                {t('catalog.subtitle')}
              </p>
            </div>

            <div>
              <FeaturedTitlesCarousel />
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 8: FINAL CTA
            Signup + Newsletter
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-porcelain-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Final CTA */}
            <div className="text-center bg-gradient-to-br from-hanok-teal/10 to-porcelain-blue-600/10 rounded-3xl p-8 sm:p-12 max-w-4xl mx-auto">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink mb-4">
                {t('finalCta.title')}
              </h2>
              <p className="text-lg text-midnight-ink-600 mb-8 max-w-2xl mx-auto">
                {t('finalCta.subtitle')}
              </p>

              <Button
                size="lg"
                className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => window.location.href = `${getDashboardUrl()}/trial`}
              >
                Get Started Today
              </Button>
            </div>

          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default ProducersPage;
