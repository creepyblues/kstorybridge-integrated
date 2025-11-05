import { useState } from 'react';
import UniversalHeader from '../components/UniversalHeader';
import { Button } from '@kstorybridge/ui';
import { Card, CardContent } from '../components/ui/card';
import Footer from '../components/Footer';
import { ArrowRight, Palette, ShoppingCart } from 'lucide-react';
import { getDashboardUrl, getCreatorUrl } from '../config/urls';
import CreatorComingSoonDialog from '../components/CreatorComingSoonDialog';

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
  // State for "Coming Soon" dialog
  const [showComingSoon, setShowComingSoon] = useState(false);

  // Get environment-aware URLs
  const dashboardUrl = getDashboardUrl();
  const creatorUrl = getCreatorUrl();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      {/* Navigation */}
      <UniversalHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-6">
            {/* Page Title */}
            <div className="text-center mb-12">
              <h1 className="text-4xl lg:text-5xl font-bold text-midnight-ink mb-4">
                Welcome to K Story Bridge
              </h1>
              <p className="text-lg text-midnight-ink-600 max-w-2xl mx-auto">
                Choose your account type to continue
              </p>
            </div>

            {/* Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">

              {/* Creator Section */}
              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                <CardContent className="p-8">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-sunrise-coral/10 rounded-2xl flex items-center justify-center mb-6">
                    <Palette className="w-8 h-8 text-sunrise-coral" />
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-midnight-ink mb-3">
                    I'm a Creator
                  </h2>

                  {/* Description */}
                  <p className="text-midnight-ink-600 mb-8">
                    Webtoon artists, web novel authors, and content creators looking to bring their stories to global audiences.
                  </p>

                  {/* Sign Up Button (Primary) */}
                  <div className="block mb-4">
                    <Button
                      onClick={() => setShowComingSoon(true)}
                      size="lg"
                      className="w-full bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-8 py-4 sm:py-6 text-base sm:text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Sign Up as Creator
                    </Button>
                  </div>

                  {/* Sign In Link */}
                  <button
                    onClick={() => setShowComingSoon(true)}
                    className="w-full flex items-center justify-center text-black hover:text-gray-700 transition-colors text-sm"
                  >
                    Already have an account? Sign In
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </CardContent>
              </Card>

              {/* Buyer Section */}
              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                <CardContent className="p-8">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-hanok-teal/10 rounded-2xl flex items-center justify-center mb-6">
                    <ShoppingCart className="w-8 h-8 text-hanok-teal" />
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-midnight-ink mb-3">
                    I'm a Buyer
                  </h2>

                  {/* Description */}
                  <p className="text-midnight-ink-600 mb-8">
                    Hollywood studios, streaming platforms, and media buyers seeking premium Korean content with verified rights.
                  </p>

                  {/* Sign Up Button (Primary) */}
                  <a href={`${dashboardUrl}/signup/buyer`} className="block mb-4">
                    <Button
                      size="lg"
                      className="w-full bg-hanok-teal hover:bg-hanok-teal-600 text-white px-8 py-4 sm:py-6 text-base sm:text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Sign Up as Buyer
                    </Button>
                  </a>

                  {/* Sign In Link */}
                  <a
                    href={`${dashboardUrl}/signin/buyer`}
                    className="flex items-center justify-center text-black hover:text-gray-700 transition-colors text-sm"
                  >
                    Already have an account? Sign In
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </a>
                </CardContent>
              </Card>

            </div>

            {/* Help Text */}
            <div className="text-center mt-12">
              <p className="text-midnight-ink-600 text-sm">
                Not sure which account type you need?{' '}
                <a href="/about" className="text-black hover:text-gray-700 underline">
                  Learn more about K Story Bridge
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Creator Coming Soon Dialog */}
      <CreatorComingSoonDialog
        open={showComingSoon}
        onOpenChange={setShowComingSoon}
      />
    </div>
  );
};

export default SigninPage;
