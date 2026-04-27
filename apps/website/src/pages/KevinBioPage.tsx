import { Linkedin, ExternalLink } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import UniversalHeader from '../components/UniversalHeader';
import Footer from '../components/Footer';

const KevinBioPage = () => {
  const { t } = useTranslation('team');

  // Reusable Trans component prop maps
  const strongOnly = {
    strong: <strong className="text-midnight-ink" />,
  };
  const emphOnly = {
    emph: <em className="not-italic font-semibold text-midnight-ink" />,
  };
  const titleOnly = {
    title: <em className="italic" />,
  };

  const mailtoHref = `mailto:partners@kstorybridge.com?subject=${encodeURIComponent(
    t('kevin.cta.mailtoSubject')
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
                  {t('kevin.hero.eyebrow')}
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-midnight-ink leading-[1.15] mb-8">
                  {t('kevin.hero.headlineLine1')}
                  <br />
                  {t('kevin.hero.headlineLine2')}
                </h1>
                <p className="text-lg lg:text-xl text-midnight-ink-700 leading-relaxed mb-10 max-w-2xl">
                  {t('kevin.hero.sub')}
                </p>
                <div className="space-y-1 text-sm lg:text-base">
                  <p className="font-semibold text-midnight-ink text-lg">
                    {t('kevin.hero.name')}
                  </p>
                  <p className="text-midnight-ink-700">{t('kevin.hero.role')}</p>
                </div>
              </div>

              {/* Portrait column */}
              <div className="lg:col-span-5 order-1 lg:order-2">
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-midnight-ink-100 to-porcelain-blue-200 shadow-2xl">
                  <img
                    src="/team/profile_kevin.jpeg"
                    alt={t('kevin.hero.portraitAlt')}
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
              <Trans i18nKey="kevin.lead" ns="team" components={titleOnly} />
            </p>
          </div>
        </section>

        {/* Section 3: 신뢰 / Trust */}
        <section className="py-20 lg:py-28 bg-gradient-to-b from-white to-porcelain-blue-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-hanok-teal mb-4">
              {t('kevin.trust.eyebrow')}
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-midnight-ink leading-[1.2] mb-12">
              {t('kevin.trust.headlineLine1')}
              <br />
              {t('kevin.trust.headlineLine2')}
            </h2>

            <div className="space-y-6 text-base lg:text-lg text-midnight-ink-700 leading-relaxed">
              <p>{t('kevin.trust.intro')}</p>

              <ul className="space-y-4 list-none pl-0 my-2">
                <li className="border-l-2 border-hanok-teal pl-5 py-1">
                  <Trans i18nKey="kevin.trust.tapasBullet" ns="team" components={strongOnly} />
                </li>
                <li className="border-l-2 border-hanok-teal pl-5 py-1">
                  <Trans i18nKey="kevin.trust.ridiBullet" ns="team" components={strongOnly} />
                </li>
              </ul>

              <p>{t('kevin.trust.rare')}</p>
              <p>
                <Trans i18nKey="kevin.trust.rights" ns="team" components={emphOnly} />
              </p>
            </div>

            {/* Logo strip */}
            <div className="mt-14 pt-8 border-t border-midnight-ink-200 text-xs sm:text-sm uppercase tracking-[0.15em] text-midnight-ink-500">
              {t('kevin.trust.logos')}
            </div>
          </div>
        </section>

        {/* Section 4: 전문성 / Expertise */}
        <section className="py-20 lg:py-28">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-hanok-teal mb-4">
              {t('kevin.expertise.eyebrow')}
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-midnight-ink leading-[1.2] mb-12">
              {t('kevin.expertise.headlineLine1')}
              <br />
              {t('kevin.expertise.headlineLine2')}
            </h2>

            <div className="space-y-6 text-base lg:text-lg text-midnight-ink-700 leading-relaxed">
              <p>
                <Trans i18nKey="kevin.expertise.p1" ns="team" components={strongOnly} />
              </p>
              <p>
                <Trans i18nKey="kevin.expertise.p2" ns="team" components={strongOnly} />
              </p>
              <p>{t('kevin.expertise.p3')}</p>
            </div>

            <div className="mt-14 pt-8 border-t border-midnight-ink-200 text-xs sm:text-sm uppercase tracking-[0.15em] text-midnight-ink-500">
              {t('kevin.expertise.logos')}
            </div>
          </div>
        </section>

        {/* Section 5: 실행력 / Execution */}
        <section className="py-20 lg:py-28 bg-gradient-to-b from-porcelain-blue-50 to-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-hanok-teal mb-4">
              {t('kevin.execution.eyebrow')}
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-midnight-ink leading-[1.2] mb-12">
              {t('kevin.execution.headlineLine1')}
              <br />
              {t('kevin.execution.headlineLine2')}
            </h2>

            <p className="text-base lg:text-lg text-midnight-ink-700 leading-relaxed mb-10">
              {t('kevin.execution.intro')}
            </p>

            <div className="space-y-8">
              {(['tbate', 'junjiIto', 'sandstone', 'microdrama'] as const).map((key) => (
                <div key={key} className="border-l-2 border-hanok-teal pl-6">
                  <h3 className="text-lg lg:text-xl font-semibold text-midnight-ink mb-2 leading-snug">
                    <Trans
                      i18nKey={`kevin.execution.items.${key}.title`}
                      ns="team"
                      components={titleOnly}
                    />
                  </h3>
                  <p className="text-base lg:text-lg text-midnight-ink-700 leading-relaxed">
                    {t(`kevin.execution.items.${key}.description`)}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-base lg:text-lg text-midnight-ink-700 leading-relaxed mt-12">
              <Trans i18nKey="kevin.execution.outro" ns="team" components={strongOnly} />
            </p>
          </div>
        </section>

        {/* Section 6: Closing */}
        <section className="py-24 lg:py-36">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-2xl sm:text-3xl lg:text-4xl text-midnight-ink leading-[1.4] font-medium">
              {t('kevin.closing.line1Part1')}
              <br />
              {t('kevin.closing.line1Part2')}
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl text-hanok-teal leading-[1.4] font-medium mt-6">
              {t('kevin.closing.line2Part1')}
              <br />
              {t('kevin.closing.line2Part2')}
            </p>

            <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
              <a
                href="https://www.linkedin.com/in/kevin-nicklaus/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-midnight-ink-600 hover:text-hanok-teal transition-colors"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </a>
              <a
                href="https://www.imdb.com/name/nm2102454/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-midnight-ink-600 hover:text-hanok-teal transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                IMDb
              </a>
              <a
                href="https://sandstoneartists.com/team/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-midnight-ink-600 hover:text-hanok-teal transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Sandstone Artists
              </a>
            </div>
          </div>
        </section>

        {/* Section 7: Final CTA */}
        <section className="py-20 lg:py-28 bg-midnight-ink text-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.25] mb-8">
              {t('kevin.cta.headlineLine1')}
              <br />
              {t('kevin.cta.headlineLine2')}
            </h2>
            <p className="text-lg lg:text-xl text-white/70 leading-relaxed mb-12">
              {t('kevin.cta.body')}
            </p>
            <a
              href={mailtoHref}
              className="inline-flex items-center gap-3 bg-white text-midnight-ink hover:bg-porcelain-blue-50 transition-colors px-8 py-4 rounded-full font-semibold text-base lg:text-lg"
            >
              {t('kevin.cta.button')}
            </a>
            <p className="mt-6 text-sm text-white/60">partners@kstorybridge.com</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default KevinBioPage;
