import { useTranslation } from 'react-i18next';
import UniversalHeader from '../components/UniversalHeader';
import { Button } from '@kstorybridge/ui';
import { Card, CardContent } from '../components/ui/card';
import Footer from '../components/Footer';
import { TypewriterText } from '../components/TypewriterText';
import { getCreatorUrl } from '../config/urls';
import {
  Globe,
  Shield,
  Users,
  MessageSquare,
  FileCheck,
  AlertCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const CreatorsPage = () => {
  const { t } = useTranslation('creators');

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      {/* Navigation */}
      <UniversalHeader />

      <main className="flex-1">

        {/* ========================================
            SECTION 1: HERO - ASPIRATIONAL MESSAGING
            ======================================== */}
        <section className="relative py-12 sm:py-16 lg:py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              {/* Hero with Typewriter Effect */}
              <div className="mb-8 sm:mb-12">
                <TypewriterText
                  storageKey="creators-hero-played"
                  lines={[
                    {
                      text: t('hero.title'),
                      className: 'text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-midnight-ink leading-tight',
                    },
                    {
                      text: t('hero.titleHighlight'),
                      className: 'text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-sunrise-coral leading-tight',
                      delay: 0,
                    },
                    {
                      text: t('hero.subtitle'),
                      className: 'text-lg sm:text-xl lg:text-2xl text-midnight-ink-600 leading-relaxed max-w-3xl mx-auto block mt-6 sm:mt-8',
                      delay: 400,
                    },
                  ]}
                  cursorClassName="text-sunrise-coral"
                />
              </div>

              {/* Primary CTA */}
              <Button
                id="creators-hero-join-btn"
                size="lg"
                className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => window.location.href = `${getCreatorUrl()}/signup`}
              >
                {t('hero.cta')}
              </Button>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 2: ACCESS SHOWCASE (NEW)
            Priority #1 - 30% page focus
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-porcelain-blue-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink">
                {t('access.title')}
              </h2>
            </div>

            {/* Studio Logo Grid */}
            <div className="mb-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 max-w-5xl mx-auto">
                {[
                  { name: 'Netflix', logo: 'logo_netflix' },
                  { name: 'Disney', logo: 'logo_disney_studios' },
                  { name: 'Sony Pictures', logo: 'logo_sony_pictures' },
                  { name: 'Crunchyroll', logo: 'logo_crunchyroll' },
                  { name: 'Amazon Studios', logo: 'logo_amazon_studios' },
                  { name: 'Warner Bros', logo: 'logo_warner_bros' },
                  { name: 'Paramount+', logo: 'logo_paramount' }
                ].map((studio) => (
                  <div
                    key={studio.name}
                    className="bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-md transition-shadow p-6 flex items-center justify-center"
                  >
                    <img
                      src={`https://dlrnrgcoguxlkkcitlpd.supabase.co/storage/v1/object/public/images/${studio.logo}.png`}
                      alt={studio.name}
                      className="w-full h-auto object-contain max-h-16"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const currentSrc = target.src;

                        // Try different extensions in order: .png -> .jpg -> .svg -> .webp
                        if (currentSrc.endsWith('.png')) {
                          target.src = currentSrc.replace('.png', '.jpg');
                        } else if (currentSrc.endsWith('.jpg')) {
                          target.src = currentSrc.replace('.jpg', '.svg');
                        } else if (currentSrc.endsWith('.svg')) {
                          target.src = currentSrc.replace('.svg', '.webp');
                        } else {
                          // All extensions failed, show text fallback
                          target.style.display = 'none';
                          const fallback = document.createElement('div');
                          fallback.className = 'text-lg font-bold text-midnight-ink';
                          fallback.textContent = studio.name;
                          target.parentElement?.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                ))}

                {/* 50+ Studios Stat Card */}
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-md transition-shadow p-6 flex flex-col items-center justify-center">
                  <div className="text-2xl sm:text-3xl font-bold text-sunrise-coral mb-1">{t('access.studios.stat')}</div>
                  <p className="text-midnight-ink-600 text-center text-xs leading-tight">{t('access.studios.statLabel')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 3: THREE GUARANTEES GRID
            3 Core Pillars
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white to-porcelain-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink mb-6">
                {t('guarantees.title')}
              </h2>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Pillar 1: ACCESS */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-sunrise-coral/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Globe className="h-8 w-8 text-sunrise-coral" />
                  </div>
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-sunrise-coral/10 text-sunrise-coral text-xs font-semibold rounded-full">
                      {t('guarantees.access.badge')}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-midnight-ink mb-4">
                    {t('guarantees.access.title')}
                  </h3>
                  <p className="text-midnight-ink-600 leading-relaxed">
                    {t('guarantees.access.description')}
                  </p>
                </CardContent>
              </Card>

              {/* Pillar 2: EXPERT */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-hanok-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Users className="h-8 w-8 text-hanok-teal" />
                  </div>
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-hanok-teal/10 text-hanok-teal text-xs font-semibold rounded-full">
                      {t('guarantees.expert.badge')}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-midnight-ink mb-4">
                    {t('guarantees.expert.title')}
                  </h3>
                  <p className="text-midnight-ink-600 leading-relaxed">
                    {t('guarantees.expert.description')}
                  </p>
                </CardContent>
              </Card>

              {/* Pillar 3: EASY DEAL */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-porcelain-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Shield className="h-8 w-8 text-porcelain-blue-600" />
                  </div>
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-porcelain-blue-600/10 text-porcelain-blue-600 text-xs font-semibold rounded-full">
                      {t('guarantees.deal.badge')}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-midnight-ink mb-4">
                    {t('guarantees.deal.title')}
                  </h3>
                  <p className="text-midnight-ink-600 leading-relaxed">
                    {t('guarantees.deal.description')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 4: EXPERT DEEP DIVE (NEW)
            Priority #2 - 30% page focus
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-porcelain-blue-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink mb-6">
                {t('expertDeepDive.title')}
              </h2>
              <p className="text-lg sm:text-xl text-midnight-ink-600 leading-relaxed max-w-3xl mx-auto">
                {t('expertDeepDive.subtitle')}
              </p>
            </div>

            {/* Challenge intro */}
            <div className="max-w-4xl mx-auto mb-12">
              <Card
                className="shadow-none rounded-2xl"
                style={{
                  background: 'linear-gradient(to bottom right, rgba(76, 156, 155, 0.05), rgba(195, 227, 226, 1))',
                  borderColor: 'rgba(76, 156, 155, 0.2)',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              >
                <CardContent className="p-6 sm:p-8">
                  <p className="text-lg text-midnight-ink-600 leading-relaxed text-center">
                    <span className="font-semibold text-midnight-ink">{t('expertDeepDive.challenge.bold')}</span><br />{t('expertDeepDive.challenge.description')}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 3 Process Cards */}
            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-hanok-teal/10 rounded-lg flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-hanok-teal" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-midnight-ink mb-2">
                        {t('expertDeepDive.process.cultural.title')}
                      </h3>
                      <p className="text-midnight-ink-600">
                        {t('expertDeepDive.process.cultural.description')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-hanok-teal/10 rounded-lg flex items-center justify-center">
                      <FileCheck className="h-6 w-6 text-hanok-teal" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-midnight-ink mb-2">
                        {t('expertDeepDive.process.pitch.title')}
                      </h3>
                      <p className="text-midnight-ink-600">
                        {t('expertDeepDive.process.pitch.description')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-hanok-teal/10 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-hanok-teal" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-midnight-ink mb-2">
                        {t('expertDeepDive.process.veteran.title')}
                      </h3>
                      <p className="text-midnight-ink-600">
                        {t('expertDeepDive.process.veteran.description')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 5: WHY CREATORS CHOOSE KSTORYBRIDGE
            Three elegant cards with icons
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white to-porcelain-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink mb-6">
                {t('comparison.title')}
              </h2>
              <p className="text-lg sm:text-xl text-midnight-ink-600 leading-relaxed max-w-3xl mx-auto">
                {t('comparison.subtitle')}
              </p>
            </div>

            {/* Three Elegant Cards */}
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
              {/* Card 1: The Problem */}
              <Card className="bg-sunrise-coral-50 border-sunrise-coral-100 shadow-none hover:shadow-md transition-shadow rounded-2xl">
                <CardContent className="p-6 sm:p-8">
                  {/* Circular Icon */}
                  <div className="w-16 h-16 bg-sunrise-coral/10 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="h-8 w-8 text-sunrise-coral" />
                  </div>

                  {/* Heading */}
                  <h3 className="text-xl font-bold text-midnight-ink mb-3">
                    {t('comparison.problem.title')}
                  </h3>

                  {/* Description */}
                  <p className="text-midnight-ink-600 leading-relaxed">
                    {t('comparison.problem.description')}
                  </p>
                </CardContent>
              </Card>

              {/* Card 2: The Bridge */}
              <Card className="bg-white border-gray-200 shadow-none hover:shadow-md transition-shadow rounded-2xl">
                <CardContent className="p-6 sm:p-8">
                  {/* Circular Icon */}
                  <div className="w-16 h-16 bg-hanok-teal/10 rounded-full flex items-center justify-center mb-6">
                    <ArrowRight className="h-8 w-8 text-hanok-teal" />
                  </div>

                  {/* Heading */}
                  <h3 className="text-xl font-bold text-midnight-ink mb-3">
                    {t('comparison.bridge.title')}
                  </h3>

                  {/* Description */}
                  <p className="text-midnight-ink-600 leading-relaxed">
                    {t('comparison.bridge.description')}
                  </p>
                </CardContent>
              </Card>

              {/* Card 3: The Success */}
              <Card className="bg-porcelain-blue-50 border-porcelain-blue-200 shadow-none hover:shadow-md transition-shadow rounded-2xl">
                <CardContent className="p-6 sm:p-8">
                  {/* Circular Icon */}
                  <div className="w-16 h-16 bg-hanok-teal/10 rounded-full flex items-center justify-center mb-6">
                    <Sparkles className="h-8 w-8 text-hanok-teal" />
                  </div>

                  {/* Heading */}
                  <h3 className="text-xl font-bold text-midnight-ink mb-3">
                    {t('comparison.success.title')}
                  </h3>

                  {/* Description */}
                  <p className="text-midnight-ink-600 leading-relaxed">
                    {t('comparison.success.description')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 7: FINAL CTA
            Signup + Newsletter
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-porcelain-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Final CTA */}
            <div className="text-center bg-gradient-to-br from-sunrise-coral/10 to-hanok-teal/10 rounded-3xl p-8 sm:p-12 max-w-4xl mx-auto mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink mb-4">
                {t('finalCta.title')}
              </h2>
              <p className="text-lg text-midnight-ink-600 mb-8 max-w-2xl mx-auto">
                {t('finalCta.subtitle')}
              </p>

              <Button
                size="lg"
                className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => window.location.href = `${getCreatorUrl()}/signup`}
              >
                {t('finalCta.cta')}
              </Button>
            </div>

          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default CreatorsPage;
