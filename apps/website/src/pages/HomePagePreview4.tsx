import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import UniversalHeader from '../components/UniversalHeader';
import { Button } from '@kstorybridge/ui';
import { Card, CardContent } from '../components/ui/card';
import Footer from '../components/Footer';
import {
  Sparkles,
  ShieldCheck,
  Network
} from 'lucide-react';

/**
 * HOMEPAGE PREVIEW 4 - "BRIDGE-FIRST" DESIGN
 *
 * Visual Concept: Lead with connection/partnership value proposition
 * Focus: KStoryBridge connects creators + buyers to create bigger value
 * Appeal: Both audiences equally, emphasize relationship and expertise
 *
 * Created: 2025-11-17
 */

const HomePagePreview4 = () => {
  const { t } = useTranslation('homePreview4');

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

      {/* Preview Banner */}
      <div className="bg-yellow-50 border-b-2 border-yellow-400 py-3 px-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-yellow-900">⚠️ PREVIEW MODE</span>
            <span className="text-sm text-yellow-800">
              This is a preview of the new "Bridge-First" homepage design
            </span>
          </div>
          <a
            href="/"
            className="text-sm text-yellow-900 hover:text-yellow-700 font-semibold underline"
          >
            View Production →
          </a>
        </div>
      </div>

      {/* Navigation */}
      <UniversalHeader />

      <main className="flex-1">

        {/* ========================================
            SECTION 1: HERO - THE BRIDGE MESSAGE
            Connection & partnership value proposition
            ======================================== */}
        <section className="py-16 sm:py-20 lg:py-28 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-midnight-ink mb-6 leading-tight">
                {t('hero.title')}
              </h1>

              {/* Subheadline */}
              <p className="text-xl sm:text-2xl text-midnight-ink-600 mb-10 leading-relaxed">
                {t('hero.subtitle')}
              </p>

              {/* Dual CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-8 py-6 text-lg rounded-full"
                  onClick={() => window.location.href = '/creators'}
                >
                  {t('hero.ctaCreator')}
                </Button>
                <Button
                  className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-8 py-6 text-lg rounded-full"
                  onClick={() => window.location.href = '/buyers'}
                >
                  {t('hero.ctaBuyer')}
                </Button>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 2: THREE CORE VALUES
            Intelligent Discovery, Trusted Connection, Transmedia Expertise
            ======================================== */}
        <section className="py-16 sm:py-20 lg:py-24 bg-white border-y border-gray-200">
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
              <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
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
              <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
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
              <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
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
            SECTION 3: NEWSLETTER
            ======================================== */}
        <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
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

export default HomePagePreview4;
