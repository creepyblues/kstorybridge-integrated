import UniversalHeader from '../components/UniversalHeader';
import { Card, CardContent } from '@kstorybridge/ui';
import { ExternalLink } from 'lucide-react';
import Footer from '../components/Footer';
import { TypewriterText } from '../components/TypewriterText';
import { useTranslation } from 'react-i18next';

const AboutPage = () => {
  const { t } = useTranslation('about');

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <UniversalHeader />
      
      <main className="flex-1">
        {/* Hero Section with Typewriter Effect */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <div className="mb-12">
                <TypewriterText
                  storageKey="about-hero-played"
                  lines={[
                    {
                      text: t('hero.title'),
                      className: 'text-5xl lg:text-6xl font-bold text-midnight-ink',
                    },
                    {
                      text: t('hero.subtitle'),
                      className: 'text-xl lg:text-2xl text-midnight-ink-600 block mt-6',
                      delay: 400,
                    },
                  ]}
                  cursorClassName="text-hanok-teal"
                />
              </div>
            </div>
          </div>
        </section>

        {/* What is KStoryBridge Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-porcelain-blue-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-midnight-ink mb-12 lg:mb-16">
                {t('whatIs.title')}
              </h2>

              <div className="space-y-6 lg:space-y-8 text-midnight-ink-600">
                <p className="text-lg lg:text-xl leading-relaxed">
                  {t('whatIs.intro')}
                </p>

                <p className="text-base lg:text-lg leading-relaxed">
                  {t('whatIs.ecosystem')}
                </p>

                <p className="text-base lg:text-lg leading-relaxed">
                  {t('whatIs.aiPowered')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white to-porcelain-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-midnight-ink mb-12 lg:mb-16">
                {t('team.title')}
              </h2>

              <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                {/* Kevin Nicklaus */}
                <Card className="border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow duration-300 bg-white">
                  <CardContent className="p-6 lg:p-8">
                    <div className="text-center mb-6">
                      <h3 className="text-xl lg:text-2xl font-bold text-midnight-ink mb-4">{t('team.members.kevin.name')}</h3>

                      <a
                        href="https://www.linkedin.com/in/kevin-nicklaus/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-hanok-teal hover:text-hanok-teal-600 transition-colors font-medium text-sm lg:text-base"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {t('team.members.kevin.linkedinLabel')}
                      </a>
                    </div>
                    <div className="text-left text-midnight-ink-600">
                      <p className="leading-relaxed text-sm lg:text-base">
                        {t('team.members.kevin.bio')}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Sungho Lee */}
                <Card className="border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow duration-300 bg-white">
                  <CardContent className="p-6 lg:p-8">
                    <div className="text-center mb-6">
                      <h3 className="text-xl lg:text-2xl font-bold text-midnight-ink mb-4">{t('team.members.sungho.name')}</h3>

                      <a
                        href="https://www.linkedin.com/in/sungholee/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-hanok-teal hover:text-hanok-teal-600 transition-colors font-medium text-sm lg:text-base"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {t('team.members.sungho.linkedinLabel')}
                      </a>
                    </div>
                    <div className="text-left text-midnight-ink-600">
                      <p className="leading-relaxed text-sm lg:text-base">
                        {t('team.members.sungho.bio')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="py-12 sm:py-16 lg:py-20 bg-porcelain-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center bg-gradient-to-br from-hanok-teal/10 to-porcelain-blue-600/10 rounded-3xl p-8 sm:p-12 max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-midnight-ink mb-6 lg:mb-8">
                {t('mission.title')}
              </h2>
              <p className="text-lg lg:text-xl text-midnight-ink-600 leading-relaxed">
                {t('mission.statement')}
              </p>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default AboutPage;