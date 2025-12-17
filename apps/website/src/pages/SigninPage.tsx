import { useTranslation } from 'react-i18next';
import UniversalHeader from '../components/UniversalHeader';
import { Button } from '@kstorybridge/ui';
import { Card, CardContent } from '../components/ui/card';
import Footer from '../components/Footer';
import { ArrowRight, Pencil, Film } from 'lucide-react';
import { getDashboardUrl, getCreatorUrl } from '../config/urls';

/**
 * SIGNIN PAGE - Authentication Entry Point
 *
 * Directs users to appropriate app based on account type:
 * - Creators → creator.kstorybridge.com
 * - Buyers → dashboard.kstorybridge.com
 *
 * Created: 2025-10-29
 */

const SigninPage = () => {
  const { t } = useTranslation('auth');

  // Get environment-aware URLs
  const dashboardUrl = getDashboardUrl();
  const creatorUrl = getCreatorUrl();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-porcelain-blue-50">
      {/* Navigation */}
      <UniversalHeader />

      <main className="flex-1 flex items-center justify-center">
        {/* Hero Section */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Title */}
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-4xl lg:text-5xl font-bold text-midnight-ink mb-4">
                {t('signinPage.title')}
              </h1>
              <p className="text-lg text-midnight-ink-600 max-w-2xl mx-auto">
                {t('signinPage.subtitle')}
              </p>
            </div>

            {/* Two-Column Layout - Side by side on all screens */}
            <div className="grid grid-cols-2 gap-3 sm:gap-8 lg:gap-12 max-w-5xl mx-auto">

              {/* Creator Section */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow duration-300 h-full">
                <CardContent className="p-4 sm:p-8 text-center sm:text-left h-full flex flex-col">
                  {/* Icon */}
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-sunrise-coral/10 rounded-2xl flex items-center justify-center mb-3 sm:mb-6 mx-auto sm:mx-0">
                    <Pencil className="w-6 h-6 sm:w-8 sm:h-8 text-sunrise-coral" />
                  </div>

                  {/* Title */}
                  <h2 className="text-sm sm:text-2xl font-bold text-midnight-ink mb-3 sm:mb-3">
                    {t('signinPage.creator.title')}
                  </h2>

                  {/* Description - Hidden on mobile */}
                  <p className="hidden sm:block text-midnight-ink-600 flex-grow">
                    {t('signinPage.creator.description')}
                  </p>

                  {/* Button area - always at bottom */}
                  <div className="mt-auto pt-4 sm:pt-8">
                    {/* Sign Up Button (Primary) */}
                    <a href={`${creatorUrl}/signup`} className="block mb-2 sm:mb-4">
                      <Button
                        size="lg"
                        className="w-full bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-3 sm:px-8 py-2 sm:py-6 text-xs sm:text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {t('signinPage.creator.signupButton')}
                      </Button>
                    </a>

                    {/* Sign In Link - Hidden on mobile */}
                    <a
                      href={`${creatorUrl}/signin`}
                      className="hidden sm:flex items-center justify-center text-black hover:text-gray-700 transition-colors text-sm"
                    >
                      {t('signinPage.creator.signinLink')}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Producer Section */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow duration-300 h-full">
                <CardContent className="p-4 sm:p-8 text-center sm:text-left h-full flex flex-col">
                  {/* Icon */}
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-hanok-teal/10 rounded-2xl flex items-center justify-center mb-3 sm:mb-6 mx-auto sm:mx-0">
                    <Film className="w-6 h-6 sm:w-8 sm:h-8 text-hanok-teal" />
                  </div>

                  {/* Title */}
                  <h2 className="text-sm sm:text-2xl font-bold text-midnight-ink mb-3 sm:mb-3">
                    {t('signinPage.buyer.title')}
                  </h2>

                  {/* Description - Hidden on mobile */}
                  <p className="hidden sm:block text-midnight-ink-600 flex-grow">
                    {t('signinPage.buyer.description')}
                  </p>

                  {/* Button area - always at bottom */}
                  <div className="mt-auto pt-4 sm:pt-8">
                    {/* Sign Up Button (Primary) */}
                    <a href={`${dashboardUrl}/signup`} className="block mb-2 sm:mb-4">
                      <Button
                        size="lg"
                        className="w-full bg-hanok-teal hover:bg-hanok-teal-600 text-white px-3 sm:px-8 py-2 sm:py-6 text-xs sm:text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {t('signinPage.buyer.signupButton')}
                      </Button>
                    </a>

                    {/* Sign In Link - Hidden on mobile */}
                    <a
                      href={`${dashboardUrl}/signin/buyer`}
                      className="hidden sm:flex items-center justify-center text-black hover:text-gray-700 transition-colors text-sm"
                    >
                      {t('signinPage.buyer.signinLink')}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </a>
                  </div>
                </CardContent>
              </Card>

            </div>

          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default SigninPage;
