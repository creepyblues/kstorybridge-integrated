import { Linkedin, ExternalLink } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import UniversalHeader from '../components/UniversalHeader';
import Footer from '../components/Footer';

const TeamPage = () => {
  const { t } = useTranslation('team');

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
    t('together.cta.mailtoSubject')
  )}`;

  return (
    <div className="min-h-screen bg-white">
      <UniversalHeader />

      <main>
        {/* Section 1: Hero — both portraits side-by-side */}
        <section className="relative min-h-[88vh] flex items-center bg-gradient-to-b from-porcelain-blue-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 lg:py-24">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              {/* Copy column */}
              <div className="lg:col-span-7 order-2 lg:order-1">
                <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-hanok-teal mb-6">
                  {t('together.hero.eyebrow')}
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-midnight-ink leading-[1.15] mb-8">
                  {t('together.hero.headlineLine1')}
                  <br />
                  {t('together.hero.headlineLine2')}
                </h1>
                <p className="text-lg lg:text-xl text-midnight-ink-700 leading-relaxed mb-10 max-w-2xl">
                  {t('together.hero.sub')}
                </p>
                <div className="space-y-1 text-sm lg:text-base">
                  <p className="font-semibold text-midnight-ink text-lg">
                    {t('together.hero.namesLine')}
                  </p>
                  <p className="text-midnight-ink-700">{t('together.hero.role')}</p>
                </div>
              </div>

              {/* Two-portrait column */}
              <div className="lg:col-span-5 order-1 lg:order-2">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-midnight-ink-100 to-porcelain-blue-200 shadow-2xl">
                    <img
                      src="/team/profile_kevin.jpeg"
                      alt={t('together.hero.kevinPortraitAlt')}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight-ink/30 via-transparent to-transparent pointer-events-none" />
                  </div>
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-midnight-ink-100 to-porcelain-blue-200 shadow-2xl">
                    <img
                      src="/team/profile_sungho.jpeg"
                      alt={t('together.hero.sunghoPortraitAlt')}
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
          </div>
        </section>

        {/* Section 2: Lead paragraph */}
        <section className="py-16 lg:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-lg lg:text-xl text-midnight-ink leading-relaxed">
              <Trans i18nKey="together.lead.p1" ns="team" components={strongOnly} />
            </p>
          </div>
        </section>

        {/* Section 3: The pairing — two cards side-by-side */}
        <section className="py-20 lg:py-28 bg-gradient-to-b from-white to-porcelain-blue-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-hanok-teal mb-4">
              {t('together.pairing.sectionEyebrow')}
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-midnight-ink leading-[1.2] mb-14">
              {t('together.pairing.sectionHeadline')}
            </h2>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">
              {/* Kevin card */}
              <article className="bg-transparent border border-gray-300 rounded-2xl p-8 lg:p-10 flex flex-col">
                <div className="flex items-center gap-5 mb-8">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-midnight-ink-100 to-porcelain-blue-200 shrink-0">
                    <img
                      src="/team/profile_kevin.jpeg"
                      alt={t('together.pairing.kevin.name')}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-hanok-teal mb-1">
                      {t('together.pairing.kevin.eyebrow')}
                    </p>
                    <p className="font-semibold text-midnight-ink text-lg leading-tight">
                      {t('together.pairing.kevin.name')}
                    </p>
                    <p className="text-sm text-midnight-ink-700">
                      {t('together.pairing.kevin.role')}
                    </p>
                  </div>
                </div>

                <h3 className="text-2xl lg:text-3xl font-bold text-midnight-ink leading-snug mb-6">
                  {t('together.pairing.kevin.headline')}
                </h3>

                <ul className="space-y-4 text-base lg:text-lg text-midnight-ink-700 leading-relaxed mb-8 flex-grow">
                  <li className="border-l-2 border-hanok-teal pl-5 py-1">
                    {t('together.pairing.kevin.bullet1')}
                  </li>
                  <li className="border-l-2 border-hanok-teal pl-5 py-1">
                    {t('together.pairing.kevin.bullet2')}
                  </li>
                  <li className="border-l-2 border-hanok-teal pl-5 py-1">
                    <Trans
                      i18nKey="together.pairing.kevin.bullet3"
                      ns="team"
                      components={titleOnly}
                    />
                  </li>
                </ul>

                <a
                  href="https://www.linkedin.com/in/kevin-nicklaus/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-midnight-ink hover:text-hanok-teal transition-colors font-medium text-sm lg:text-base self-start"
                >
                  <Linkedin className="w-4 h-4" />
                  {t('together.pairing.kevin.ctaLink')}
                </a>
              </article>

              {/* Sungho card */}
              <article className="bg-transparent border border-gray-300 rounded-2xl p-8 lg:p-10 flex flex-col">
                <div className="flex items-center gap-5 mb-8">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-midnight-ink-100 to-porcelain-blue-200 shrink-0">
                    <img
                      src="/team/profile_sungho.jpeg"
                      alt={t('together.pairing.sungho.name')}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-hanok-teal mb-1">
                      {t('together.pairing.sungho.eyebrow')}
                    </p>
                    <p className="font-semibold text-midnight-ink text-lg leading-tight">
                      {t('together.pairing.sungho.name')}
                    </p>
                    <p className="text-sm text-midnight-ink-700">
                      {t('together.pairing.sungho.role')}
                    </p>
                  </div>
                </div>

                <h3 className="text-2xl lg:text-3xl font-bold text-midnight-ink leading-snug mb-6">
                  {t('together.pairing.sungho.headline')}
                </h3>

                <ul className="space-y-4 text-base lg:text-lg text-midnight-ink-700 leading-relaxed mb-8 flex-grow">
                  <li className="border-l-2 border-hanok-teal pl-5 py-1">
                    {t('together.pairing.sungho.bullet1')}
                  </li>
                  <li className="border-l-2 border-hanok-teal pl-5 py-1">
                    {t('together.pairing.sungho.bullet2')}
                  </li>
                  <li className="border-l-2 border-hanok-teal pl-5 py-1">
                    {t('together.pairing.sungho.bullet3')}
                  </li>
                </ul>

                <a
                  href="https://www.linkedin.com/in/sungholee/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-midnight-ink hover:text-hanok-teal transition-colors font-medium text-sm lg:text-base self-start"
                >
                  <Linkedin className="w-4 h-4" />
                  {t('together.pairing.sungho.ctaLink')}
                </a>
              </article>
            </div>
          </div>
        </section>

        {/* Section 4: Why this pair — three pillars */}
        <section className="py-20 lg:py-28">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-hanok-teal mb-4">
              {t('together.pillars.sectionEyebrow')}
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-midnight-ink leading-[1.2] mb-12">
              {t('together.pillars.sectionHeadline')}
            </h2>

            <div className="space-y-10">
              {(['rights', 'path', 'focus'] as const).map((key) => (
                <div key={key} className="border-l-2 border-hanok-teal pl-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-hanok-teal mb-2">
                    {t(`together.pillars.${key}.eyebrow`)}
                  </p>
                  <h3 className="text-xl lg:text-2xl font-semibold text-midnight-ink mb-3 leading-snug">
                    {t(`together.pillars.${key}.headline`)}
                  </h3>
                  <p className="text-base lg:text-lg text-midnight-ink-700 leading-relaxed">
                    <Trans
                      i18nKey={`together.pillars.${key}.body`}
                      ns="team"
                      components={emphOnly}
                    />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5: Closing pair quote */}
        <section className="py-24 lg:py-36 bg-gradient-to-b from-porcelain-blue-50 to-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-2xl sm:text-3xl lg:text-4xl text-midnight-ink leading-[1.4] font-medium">
              {t('together.closing.line1')}
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl text-midnight-ink leading-[1.4] font-medium mt-6">
              {t('together.closing.line2')}
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl text-hanok-teal leading-[1.4] font-medium mt-6">
              {t('together.closing.line3')}
            </p>

            <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
              <Link
                to="/team/kevin"
                className="inline-flex items-center gap-2 text-midnight-ink-600 hover:text-hanok-teal transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {t('together.closing.kevinLink')}
              </Link>
              <Link
                to="/team/sungho"
                className="inline-flex items-center gap-2 text-midnight-ink-600 hover:text-hanok-teal transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {t('together.closing.sunghoLink')}
              </Link>
              <a
                href="https://www.linkedin.com/in/kevin-nicklaus/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-midnight-ink-600 hover:text-hanok-teal transition-colors"
              >
                <Linkedin className="w-4 h-4" />
                Kevin
              </a>
              <a
                href="https://www.linkedin.com/in/sungholee/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-midnight-ink-600 hover:text-hanok-teal transition-colors"
              >
                <Linkedin className="w-4 h-4" />
                Sungho
              </a>
            </div>
          </div>
        </section>

        {/* Section 6: Final CTA */}
        <section className="py-20 lg:py-28 bg-midnight-ink text-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.25] mb-8">
              {t('together.cta.headlineLine1')}
              <br />
              {t('together.cta.headlineLine2')}
            </h2>
            <p className="text-lg lg:text-xl text-white/70 leading-relaxed mb-12">
              {t('together.cta.body')}
            </p>
            <a
              href={mailtoHref}
              className="inline-flex items-center gap-3 bg-white text-midnight-ink hover:bg-porcelain-blue-50 transition-colors px-8 py-4 rounded-full font-semibold text-base lg:text-lg"
            >
              {t('together.cta.button')}
            </a>
            <p className="mt-6 text-sm text-white/60">partners@kstorybridge.com</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TeamPage;
