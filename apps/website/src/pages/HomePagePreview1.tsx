import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import UniversalHeader from '../components/UniversalHeader';
import { Button } from '@kstorybridge/ui';
import { Card, CardContent } from '../components/ui/card';
import FeaturedTitlesCarousel from '../components/FeaturedTitlesCarousel';
import Footer from '../components/Footer';
import {
  Upload,
  Bot,
  Handshake,
  Globe,
  Shield,
  Users,
  Target,
  TrendingUp,
  Zap,
  CheckCircle2
} from 'lucide-react';

/**
 * HOMEPAGE PREVIEW 1 - "THE BRIDGE" DESIGN
 *
 * Visual Concept: Split-screen design with connecting bridge element
 * Appeal: Both creators (coral) and buyers (teal) equally
 *
 * Created: 2025-10-14
 */

const HomePagePreview1 = () => {
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
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">

      {/* Preview Banner */}
      <div className="bg-yellow-50 border-b-2 border-yellow-400 py-3 px-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-yellow-800 font-semibold">PREVIEW MODE - Option 1: "The Bridge"</span>
            <span className="text-xs text-yellow-600">Split-screen dual-audience design</span>
          </div>
          <Link
            to="/"
            className="text-sm text-yellow-700 hover:text-yellow-900 underline"
          >
            Compare with production homepage →
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <UniversalHeader />

      <main className="flex-1">

        {/* ========================================
            SECTION 1: SPLIT HERO - "THE BRIDGE"
            ======================================== */}
        <section className="relative py-12 sm:py-16 lg:py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Main Headline */}
            <div className="text-center mb-12 sm:mb-16">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 text-midnight-ink leading-tight">
                Where Korean Stories Meet Hollywood
              </h1>
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-base sm:text-lg text-midnight-ink-600">Powered by AI</span>
                <span className="text-midnight-ink-400">•</span>
                <span className="text-base sm:text-lg text-midnight-ink-600">Verified Rights</span>
                <span className="text-midnight-ink-400">•</span>
                <span className="text-base sm:text-lg text-midnight-ink-600">Expert Support</span>
              </div>
            </div>

            {/* Split Design */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto mb-12">

              {/* LEFT: Creators Side (Coral) */}
              <Card className="bg-gradient-to-br from-sunrise-coral/10 to-sunrise-coral/5 border-sunrise-coral/20 shadow-none rounded-2xl overflow-hidden">
                <CardContent className="p-8 sm:p-10">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-sunrise-coral/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Globe className="h-8 w-8 text-sunrise-coral" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-midnight-ink mb-3">
                      Your Story → Hollywood
                    </h2>
                    <p className="text-midnight-ink-600 leading-relaxed">
                      Pitch directly to 50+ Hollywood studios. Keep creative control. Capture more upside.
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-sunrise-coral mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">Direct access to Netflix, Disney, Sony Pictures</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-sunrise-coral mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">Hollywood veterans develop your pitch</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-sunrise-coral mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">Fair deals, legal protection, no exclusivity</span>
                    </li>
                  </ul>

                  <Button
                    className="w-full bg-sunrise-coral hover:bg-sunrise-coral-600 text-white rounded-full"
                    onClick={() => window.location.href = '/creators'}
                  >
                    I'm a Creator
                  </Button>
                </CardContent>
              </Card>

              {/* RIGHT: Buyers Side (Teal) */}
              <Card className="bg-gradient-to-br from-hanok-teal/10 to-hanok-teal/5 border-hanok-teal/20 shadow-none rounded-2xl overflow-hidden">
                <CardContent className="p-8 sm:p-10">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-hanok-teal/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bot className="h-8 w-8 text-hanok-teal" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-midnight-ink mb-3">
                      Korean Hits → Discovered
                    </h2>
                    <p className="text-midnight-ink-600 leading-relaxed">
                      Find your next adaptation with AI-powered search and verified rights.
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-hanok-teal mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">AI assistant finds perfect matches in seconds</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-hanok-teal mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">Verified rights chain, zero ownership surprises</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-hanok-teal mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">10x faster sourcing than traditional methods</span>
                    </li>
                  </ul>

                  <Button
                    className="w-full bg-hanok-teal hover:bg-hanok-teal-600 text-white rounded-full"
                    onClick={() => window.location.href = '/buyers'}
                  >
                    I'm a Buyer
                  </Button>
                </CardContent>
              </Card>

            </div>

            {/* Central Bridge Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-sunrise-coral to-hanok-teal rounded-full flex items-center justify-center shadow-lg">
                <Bot className="h-10 w-10 text-white" />
              </div>
            </div>

          </div>
        </section>

        {/* ========================================
            SECTION 2: HOW IT WORKS
            3-column visual flow
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink mb-4">
                How It Works
              </h2>
              <p className="text-lg text-midnight-ink-600 max-w-2xl mx-auto">
                The fastest path from Korean content to Hollywood screens
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">

              {/* Step 1: Upload */}
              <div className="text-center">
                <div className="w-20 h-20 bg-sunrise-coral/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Upload className="h-10 w-10 text-sunrise-coral" />
                </div>
                <h3 className="text-xl font-bold text-midnight-ink mb-3">Creators Showcase</h3>
                <p className="text-midnight-ink-600 leading-relaxed">
                  Korean creators upload verified content with professional pitch materials
                </p>
              </div>

              {/* Step 2: AI Match */}
              <div className="text-center">
                <div className="w-20 h-20 bg-hanok-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Bot className="h-10 w-10 text-hanok-teal" />
                </div>
                <h3 className="text-xl font-bold text-midnight-ink mb-3">AI Matches</h3>
                <p className="text-midnight-ink-600 leading-relaxed">
                  Jinu AI connects stories with buyers based on narrative fit and market needs
                </p>
              </div>

              {/* Step 3: Discover */}
              <div className="text-center">
                <div className="w-20 h-20 bg-porcelain-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Handshake className="h-10 w-10 text-porcelain-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-midnight-ink mb-3">Hollywood Discovers</h3>
                <p className="text-midnight-ink-600 leading-relaxed">
                  Studios find their next hit with verified rights and expert deal support
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 3: TRUST - STUDIO LOGOS
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-porcelain-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink mb-4">
                Trusted by Hollywood's Biggest Studios
              </h2>
              <p className="text-lg text-midnight-ink-600">
                50+ verified buyers actively searching for Korean content
              </p>
            </div>

            {/* Studio Logo Grid */}
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

                      if (currentSrc.endsWith('.png')) {
                        target.src = currentSrc.replace('.png', '.jpg');
                      } else if (currentSrc.endsWith('.jpg')) {
                        target.src = currentSrc.replace('.jpg', '.svg');
                      } else if (currentSrc.endsWith('.svg')) {
                        target.src = currentSrc.replace('.svg', '.webp');
                      } else {
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
                <div className="text-2xl sm:text-3xl font-bold text-hanok-teal mb-1">50+</div>
                <p className="text-midnight-ink-600 text-center text-xs leading-tight">Hollywood studios and global streamers</p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 4: DUAL VALUE PROPS
            Side-by-side benefit cards
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">

              {/* For Creators */}
              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-sunrise-coral/10 rounded-lg flex items-center justify-center">
                      <Target className="h-6 w-6 text-sunrise-coral" />
                    </div>
                    <h3 className="text-2xl font-bold text-midnight-ink">For Creators</h3>
                  </div>

                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-sunrise-coral mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-midnight-ink">Direct Access to 50+ Hollywood Buyers</p>
                        <p className="text-sm text-midnight-ink-600">Netflix, Disney, Sony Pictures actively searching</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-sunrise-coral mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-midnight-ink">Professional Pitch Development</p>
                        <p className="text-sm text-midnight-ink-600">Hollywood veterans create your pitch deck</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-sunrise-coral mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-midnight-ink">Keep Creative Control</p>
                        <p className="text-sm text-midnight-ink-600">Fair deals, legal protection, no exclusivity required</p>
                      </div>
                    </li>
                  </ul>

                  <Button
                    className="w-full mt-8 bg-sunrise-coral hover:bg-sunrise-coral-600 text-white rounded-full"
                    onClick={() => window.location.href = '/creators'}
                  >
                    Learn More for Creators →
                  </Button>
                </CardContent>
              </Card>

              {/* For Buyers */}
              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-hanok-teal/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-hanok-teal" />
                    </div>
                    <h3 className="text-2xl font-bold text-midnight-ink">For Buyers</h3>
                  </div>

                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-hanok-teal mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-midnight-ink">AI-Powered Discovery</p>
                        <p className="text-sm text-midnight-ink-600">Jinu finds perfect matches in seconds, not weeks</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-hanok-teal mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-midnight-ink">Verified Rights Chain</p>
                        <p className="text-sm text-midnight-ink-600">Clean chain of title, zero ownership surprises</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-hanok-teal mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-midnight-ink">10x Faster Sourcing</p>
                        <p className="text-sm text-midnight-ink-600">AI recommendations + expert deal support</p>
                      </div>
                    </li>
                  </ul>

                  <Button
                    className="w-full mt-8 bg-hanok-teal hover:bg-hanok-teal-600 text-white rounded-full"
                    onClick={() => window.location.href = '/buyers'}
                  >
                    Learn More for Buyers →
                  </Button>
                </CardContent>
              </Card>

            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 5: FEATURED TITLES
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-porcelain-blue-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink mb-4">
                Featured Titles
              </h2>
              <p className="text-lg text-midnight-ink-600">
                Discover verified Korean content with proven market performance
              </p>
            </div>

            <FeaturedTitlesCarousel />
          </div>
        </section>

        {/* ========================================
            SECTION 6: FINAL CTA
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center bg-gradient-to-br from-hanok-teal/10 via-porcelain-blue-50 to-sunrise-coral/10 rounded-3xl p-8 sm:p-12 max-w-4xl mx-auto">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink mb-4">
                Join the Platform
              </h2>
              <p className="text-lg text-midnight-ink-600 mb-8 max-w-2xl mx-auto">
                Whether you're a creator or buyer, start discovering Korean hits today
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <Button
                  className="flex-1 bg-sunrise-coral hover:bg-sunrise-coral-600 text-white rounded-full py-6 text-lg"
                  onClick={() => window.location.href = `${import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:8081'}/signup/creator`}
                >
                  I'm a Creator
                </Button>
                <Button
                  className="flex-1 bg-hanok-teal hover:bg-hanok-teal-600 text-white rounded-full py-6 text-lg"
                  onClick={() => window.location.href = `${import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:8081'}/signup/buyer`}
                >
                  I'm a Buyer
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 7: NEWSLETTER
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-porcelain-blue-50">
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

export default HomePagePreview1;
