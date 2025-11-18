import UniversalHeader from '../components/UniversalHeader';
import { Card, CardContent } from '@kstorybridge/ui';
import { ExternalLink } from 'lucide-react';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';

const AboutPage = () => {
  const { t } = useTranslation('about');

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <UniversalHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl lg:text-6xl font-bold text-midnight-ink mb-6">
                {t('hero.title')}
              </h1>
              <p className="text-xl lg:text-2xl text-midnight-ink-600 mb-12">
                {t('hero.subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* What is KStoryBridge Section */}
        <section className="py-20 bg-porcelain-blue-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-bold text-center text-midnight-ink mb-16">
                {t('whatIs.title')}
              </h2>

              <div className="space-y-8 text-midnight-ink-600">
                <p className="text-xl leading-relaxed">
                  {t('whatIs.intro')}
                </p>

                <p className="text-lg leading-relaxed">
                  {t('whatIs.ecosystem')}
                </p>

                <p className="text-lg leading-relaxed">
                  {t('whatIs.aiPowered')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-bold text-center text-midnight-ink mb-16">
                {t('team.title')}
              </h2>

              <div className="grid md:grid-cols-2 gap-12">
                {/* Kevin Nicklaus */}
                <Card className="text-center border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300 bg-white">
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-midnight-ink mb-4">{t('team.members.kevin.name')}</h3>

                      <a
                        href="https://www.linkedin.com/in/kevin-nicklaus/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-hanok-teal hover:text-hanok-teal-600 transition-colors font-medium"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {t('team.members.kevin.linkedinLabel')}
                      </a>
                    </div>
                    <div className="text-left space-y-4 text-midnight-ink-600">
                      <p className="leading-relaxed">
                        {t('team.members.kevin.bio')}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Sungho Lee */}
                <Card className="text-center border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300 bg-white">
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-midnight-ink mb-4">{t('team.members.sungho.name')}</h3>

                      <a
                        href="https://www.linkedin.com/in/sungholee/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-hanok-teal hover:text-hanok-teal-600 transition-colors font-medium"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {t('team.members.sungho.linkedinLabel')}
                      </a>
                    </div>
                    <div className="text-left space-y-4 text-midnight-ink-600">
                      <p className="leading-relaxed">
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
        <section className="py-20 bg-gradient-to-r from-hanok-teal to-porcelain-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl lg:text-5xl font-bold mb-8">
                {t('mission.title')}
              </h2>
              <p className="text-xl leading-relaxed">
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