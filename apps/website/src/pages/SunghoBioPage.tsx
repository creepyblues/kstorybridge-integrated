import { Linkedin, ExternalLink } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import UniversalHeader from '../components/UniversalHeader';
import Footer from '../components/Footer';

const SunghoBioPage = () => {
  const { t } = useTranslation('team');

  const strongOnly = {
    strong: <strong className="text-midnight-ink" />,
  };
  const emphOnly = {
    emph: <em className="not-italic font-semibold text-midnight-ink" />,
  };

  const mailtoHref = `mailto:partners@kstorybridge.com?subject=${encodeURIComponent(
    t('sungho.cta.mailtoSubject')
  )}`;

  return (
    <div className="min-h-screen bg-white">
      <UniversalHeader />

      <main>
        {/* Section 1: Hero */}
        <section className="relative min-h-[88vh] flex items-center bg-gradient-to-b from-porcelain-blue-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 lg:py-24">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              {/* Copy column */}
              <div className="lg:col-span-7 order-2 lg:order-1">
                <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-hanok-teal mb-6">
                  {t('sungho.hero.eyebrow')}
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-midnight-ink leading-[1.15] mb-8">
                  {t('sungho.hero.headlineLine1')}
                  <br />
                  {t('sungho.hero.headlineLine2')}
                </h1>
                <p className="text-lg lg:text-xl text-midnight-ink-700 leading-relaxed mb-10 max-w-2xl">
                  {t('sungho.hero.sub')}
                </p>
                <div className="space-y-1 text-sm lg:text-base">
                  <p className="font-semibold text-midnight-ink text-lg">
                    {t('sungho.hero.name')}
                  </p>
                  <p className="text-midnight-ink-700">{t('sungho.hero.role')}</p>
                </div>
              </div>

              {/* Portrait column */}
              <div className="lg:col-span-5 order-1 lg:order-2">
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-midnight-ink-100 to-porcelain-blue-200 shadow-2xl">
                  <img
                    src="/team/profile_sungho.jpeg"
                    alt={t('sungho.hero.portraitAlt')}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight-ink/30 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Lead paragraph */}
        <section className="py-16 lg:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-lg lg:text-xl text-midnight-ink leading-relaxed">
              {t('sungho.lead.p1')}
            </p>
            <p className="text-lg lg:text-xl text-midnight-ink leading-relaxed mt-6">
              <Trans i18nKey="sungho.lead.p2" ns="team" components={strongOnly} />
            </p>
          </div>
        </section>

        {/* Section 3: KSB Role / 연결 */}
        <section className="py-20 lg:py-28 bg-gradient-to-b from-white to-porcelain-blue-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-hanok-teal mb-4">
              {t('sungho.role.eyebrow')}
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-midnight-ink leading-[1.2] mb-12">
              {t('sungho.role.headlineLine1')}
              <br />
              {t('sungho.role.headlineLine2')}
            </h2>

            <p className="text-base lg:text-lg text-midnight-ink-700 leading-relaxed mb-8">
              {t('sungho.role.intro')}
            </p>

            <p className="text-base lg:text-lg text-midnight-ink-700 leading-relaxed mb-10">
              {t('sungho.role.threeSeats')}
            </p>

            <div className="space-y-8">
              {(['hollywood', 'kevin', 'business'] as const).map((key) => (
                <div key={key} className="border-l-2 border-hanok-teal pl-6">
                  <h3 className="text-lg lg:text-xl font-semibold text-midnight-ink mb-2 leading-snug">
                    {t(`sungho.role.items.${key}.title`)}
                  </h3>
                  <p className="text-base lg:text-lg text-midnight-ink-700 leading-relaxed">
                    {t(`sungho.role.items.${key}.description`)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 space-y-2 text-base lg:text-lg text-midnight-ink-700 leading-relaxed">
              <p>
                <Trans i18nKey="sungho.role.closingLine1" ns="team" components={emphOnly} />
              </p>
              <p>
                <Trans i18nKey="sungho.role.closingLine2" ns="team" components={emphOnly} />
              </p>
              <p>{t('sungho.role.closingLine3')}</p>
            </div>
          </div>
        </section>

        {/* Section 4: Closing */}
        <section className="py-24 lg:py-36">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-2xl sm:text-3xl lg:text-4xl text-midnight-ink leading-[1.4] font-medium">
              {t('sungho.closing.line1')}
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl text-hanok-teal leading-[1.4] font-medium mt-6">
              {t('sungho.closing.line2')}
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl text-midnight-ink leading-[1.4] font-medium mt-6">
              {t('sungho.closing.line3')}
            </p>

            <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
              <a
                href="https://www.linkedin.com/in/sungholee/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-midnight-ink-600 hover:text-hanok-teal transition-colors"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </a>
              <a
                href="/team/kevin"
                className="inline-flex items-center gap-2 text-midnight-ink-600 hover:text-hanok-teal transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {t('sungho.closing.kevinLink')}
              </a>
            </div>
          </div>
        </section>

        {/* Section 5: Final CTA */}
        <section className="py-20 lg:py-28 bg-midnight-ink text-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.25] mb-8">
              {t('sungho.cta.headlineLine1')}
              <br />
              {t('sungho.cta.headlineLine2')}
            </h2>
            <p className="text-lg lg:text-xl text-white/70 leading-relaxed mb-12">
              {t('sungho.cta.body')}
            </p>
            <a
              href={mailtoHref}
              className="inline-flex items-center gap-3 bg-white text-midnight-ink hover:bg-porcelain-blue-50 transition-colors px-8 py-4 rounded-full font-semibold text-base lg:text-lg"
            >
              {t('sungho.cta.button')}
            </a>
            <p className="mt-6 text-sm text-white/60">partners@kstorybridge.com</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SunghoBioPage;
