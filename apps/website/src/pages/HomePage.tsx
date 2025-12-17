import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import UniversalHeader from '../components/UniversalHeader';
import { Button } from '@kstorybridge/ui';
import { Card, CardContent } from '../components/ui/card';
import Footer from '../components/Footer';
import { TypewriterText } from '../components/TypewriterText';
import {
  Sparkles,
  ShieldCheck,
  Network,
  Compass,
  Stars,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

/**
 * HOMEPAGE - "BRIDGE-FIRST" DESIGN
 *
 * Visual Concept: Lead with connection/partnership value proposition
 * Focus: KStoryBridge connects creators + producers to create bigger value
 * Appeal: Both audiences equally, emphasize relationship and expertise
 *
 * Updated: 2025-11-18
 */

const HomePage = () => {
  const { t } = useTranslation('home');

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
    <div className="min-h-screen bg-white">

      {/* Navigation */}
      <UniversalHeader />

      <main className="flex-1">

        {/* ========================================
            SECTION 1: HERO - THE BRIDGE MESSAGE
            Connection & partnership value proposition
            ======================================== */}
        <section className="py-16 sm:py-20 lg:py-28 bg-gradient-to-b from-white to-porcelain-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

              {/* Left: Text Content */}
              <div className="text-center lg:text-left">
                {/* Main Headline with Typewriter Effect */}
                <div className="mb-6">
                  <TypewriterText
                    storageKey="home-hero-played"
                    lines={[
                      {
                        text: t('hero.title'),
                        className: 'text-4xl sm:text-5xl lg:text-6xl font-bold text-midnight-ink leading-tight',
                      },
                      {
                        text: t('hero.subtitle'),
                        className: 'text-xl sm:text-2xl text-midnight-ink-600 leading-relaxed block mt-6',
                        delay: 400,
                      },
                    ]}
                    cursorClassName="text-hanok-teal"
                  />
                </div>

                {/* Dual CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-8 py-6 text-lg rounded-full"
                    onClick={() => window.location.href = '/creators'}
                  >
                    {t('hero.ctaCreator')}
                  </Button>
                  <Button
                    className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-8 py-6 text-lg rounded-full"
                    onClick={() => window.location.href = '/producers'}
                  >
                    {t('hero.ctaBuyer')}
                  </Button>
                </div>
              </div>

              {/* Right: Bridge Image */}
              <div className="flex items-center justify-center">
                <img
                  src="https://dlrnrgcoguxlkkcitlpd.supabase.co/storage/v1/object/public/images/main.png"
                  alt="KStoryBridge connecting Korean stories to global audiences"
                  className="w-full h-auto max-w-lg rounded-2xl shadow-lg"
                />
              </div>

            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 2: TRIAL PROMO
            Drive users to try core features
            Floating glassmorphism card design
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-porcelain-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Floating Glassmorphism Card */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl p-8 sm:p-12 max-w-4xl mx-auto text-center">

              {/* Headline */}
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink mb-3">
                {t('trialPromo.title')}
              </h2>

              {/* Subhead */}
              <p className="text-lg text-midnight-ink-600 mb-8 sm:mb-10">
                {t('trialPromo.subtitle')}
              </p>

              {/* Feature Cards (3-col grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">

                {/* Card 1: Comps Navigator - Rotate animation */}
                <div className="group p-5 rounded-2xl hover:bg-white/50 transition-colors cursor-pointer">
                  <div className="w-14 h-14 bg-hanok-teal/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Compass className="h-7 w-7 text-hanok-teal group-hover:animate-[slow-spin_3s_linear_infinite]" />
                  </div>
                  <h3 className="font-semibold text-midnight-ink mb-1">{t('trialPromo.comps.title')}</h3>
                  <p className="text-sm text-midnight-ink-600">{t('trialPromo.comps.description')}</p>
                </div>

                {/* Card 2: Mandate Matcher - Pulse animation */}
                <div className="group p-5 rounded-2xl hover:bg-white/50 transition-colors cursor-pointer">
                  <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Stars className="h-7 w-7 text-purple-500 group-hover:animate-[pulse-subtle_1.5s_ease-in-out_infinite]" />
                  </div>
                  <h3 className="font-semibold text-midnight-ink mb-1">{t('trialPromo.mandates.title')}</h3>
                  <p className="text-sm text-midnight-ink-600">{t('trialPromo.mandates.description')}</p>
                </div>

                {/* Card 3: Trending Titles - Bounce animation */}
                <div className="group p-5 rounded-2xl hover:bg-white/50 transition-colors cursor-pointer">
                  <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-7 w-7 text-orange-500 group-hover:animate-[bounce-subtle_1s_ease-in-out_infinite]" />
                  </div>
                  <h3 className="font-semibold text-midnight-ink mb-1">{t('trialPromo.trending.title')}</h3>
                  <p className="text-sm text-midnight-ink-600">{t('trialPromo.trending.description')}</p>
                </div>

              </div>

              {/* CTA Button */}
              <Button
                className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => window.location.href = 'https://dashboard.kstorybridge.com/trial'}
              >
                {t('trialPromo.cta')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 3: THREE CORE VALUES
            Intelligent Discovery, Trusted Connection, Transmedia Expertise
            ======================================== */}
        <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-porcelain-blue-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Section Title */}
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-midnight-ink mb-4">
                {t('coreValues.sectionTitle')}
              </h2>
              <p className="text-lg text-midnight-ink-600 max-w-2xl mx-auto">
                {t('coreValues.subtitle')}
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

              {/* Value 1: Intelligent Discovery */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-hanok-teal/10 rounded-lg flex items-center justify-center mb-6">
                    <Sparkles className="h-6 w-6 text-hanok-teal" />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-midnight-ink mb-4">
                    {t('coreValues.discovery.title')}
                  </h3>

                  <p className="text-midnight-ink-600 leading-relaxed">
                    {t('coreValues.discovery.description')}
                  </p>
                </CardContent>
              </Card>

              {/* Value 2: Trusted Connection */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-hanok-teal/10 rounded-lg flex items-center justify-center mb-6">
                    <ShieldCheck className="h-6 w-6 text-hanok-teal" />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-midnight-ink mb-4">
                    {t('coreValues.trusted.title')}
                  </h3>

                  <p className="text-midnight-ink-600 leading-relaxed">
                    {t('coreValues.trusted.description')}
                  </p>
                </CardContent>
              </Card>

              {/* Value 3: Transmedia Expertise */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-hanok-teal/10 rounded-lg flex items-center justify-center mb-6">
                    <Network className="h-6 w-6 text-hanok-teal" />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-midnight-ink mb-4">
                    {t('coreValues.expertise.title')}
                  </h3>

                  <p className="text-midnight-ink-600 leading-relaxed">
                    {t('coreValues.expertise.description')}
                  </p>
                </CardContent>
              </Card>

            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 4: NEWSLETTER
            ======================================== */}
        <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white to-porcelain-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <iframe
                src="https://subscribe-forms.beehiiv.com/44fe1ec1-b67e-4431-9ed2-84a8bb05dbbc"
                className="beehiiv-embed"
                data-test-id="beehiiv-embed"
                frameBorder="0"
                scrolling="no"
                style={{
                  width: '1014px',
                  height: '288px',
                  margin: '0 auto',
                  borderRadius: '0px',
                  backgroundColor: 'transparent',
                  boxShadow: '0 0 #0000',
                  maxWidth: '100%',
                  display: 'block'
                }}
              />
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
