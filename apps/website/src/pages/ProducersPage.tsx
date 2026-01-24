import { useEffect } from 'react';
import UniversalHeader from '../components/UniversalHeader';
import { Button } from '@kstorybridge/ui';
import { Card, CardContent } from '../components/ui/card';
import RandomFeaturedGrid from '../components/RandomFeaturedGrid';
import Footer from '../components/Footer';
import { TypewriterText } from '../components/TypewriterText';
import { DiscoveryToolsSection } from '../components/producers/DiscoveryToolsSection';
import { useTranslation } from 'react-i18next';
import { getDashboardUrl } from '../config/urls';
import { trackButtonClick } from '../utils/analytics';
import {
  Bot,
  Shield,
  Users
} from 'lucide-react';

/**
 * PRODUCERS PAGE (Redesigned)
 *
 * Main landing page for Hollywood producers and media scouts.
 *
 * Design Strategy: Feature-centric with 3 discovery tool cards
 * Updated: 2026-01-23
 *
 * Sections:
 * 1. Hero (Streamlined - "Discover Korean Content 3 Ways")
 * 2. Discovery Tools (3 feature cards linking to promo pages)
 * 3. Value Props Grid (3 pillars: AI, Rights, Expert)
 * 4. Catalog Preview (RandomFeaturedGrid)
 * 5. Final CTA
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
            SECTION 1: HERO - STREAMLINED
            ======================================== */}
        <section className="relative py-12 sm:py-16 lg:py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              {/* Hero with Typewriter Effect */}
              <div className="mb-8 sm:mb-12">
                <TypewriterText
                  storageKey="producers-hero-played-v2"
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

              {/* Primary CTA */}
              <Button
                id="buyers-hero-try-ai-btn"
                size="lg"
                className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => {
                  trackButtonClick('try-ai-trial', 'hero_section');
                  window.location.href = `${getDashboardUrl()}/trial`;
                }}
              >
                {t('hero.cta')}
              </Button>

              {/* Trust signal */}
              <p className="mt-4 text-sm text-midnight-ink-600">
                {t('hero.trust')}
              </p>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 2: DISCOVERY TOOLS (NEW)
            3 Feature Cards
            ======================================== */}
        <DiscoveryToolsSection />

        {/* ========================================
            SECTION 3: VALUE PROPS GRID
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
            SECTION 4: CATALOG PREVIEW
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
              <RandomFeaturedGrid />
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 5: FINAL CTA
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
                onClick={() => {
                  trackButtonClick('get-started-signup', 'final_cta_section');
                  window.location.href = `${getDashboardUrl()}/signup`;
                }}
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
