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
  Search,
  Handshake,
  ArrowRight,
  CheckCircle2,
  Globe,
  TrendingUp,
  FileCheck,
  Shield
} from 'lucide-react';

/**
 * HOMEPAGE PREVIEW 3 - "THE JOURNEY" DESIGN
 *
 * Visual Concept: Illustrated pathway showing creator-to-Hollywood journey
 * Appeal: Visual storytelling, easy to understand flow
 *
 * Created: 2025-10-14
 */

const HomePagePreview3 = () => {
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
            <span className="text-yellow-800 font-semibold">PREVIEW MODE - Option 3: "The Journey"</span>
            <span className="text-xs text-yellow-600">Visual storytelling with pathway design</span>
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
            SECTION 1: HERO WITH VISUAL PATHWAY
            Illustrated diagram concept
            ======================================== */}
        <section className="relative py-12 sm:py-16 lg:py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Headline */}
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 text-midnight-ink leading-tight">
                The Shortest Path from Korea to Hollywood
              </h1>
              <p className="text-lg sm:text-xl text-midnight-ink-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                AI-powered platform • 50+ studios • Verified rights
              </p>
            </div>

            {/* Visual Pathway Diagram */}
            <div className="bg-gradient-to-br from-sunrise-coral/5 via-white to-hanok-teal/5 rounded-3xl p-8 sm:p-12 mb-12 border border-gray-200">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-5xl mx-auto">

                {/* Start: Creator */}
                <div className="flex-1 text-center">
                  <div className="w-24 h-24 bg-sunrise-coral rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Globe className="h-12 w-12 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-midnight-ink">Korean Creator</p>
                </div>

                <ArrowRight className="hidden md:block h-8 w-8 text-gray-400 flex-shrink-0" />

                {/* Step 1: Upload */}
                <div className="flex-1 text-center">
                  <div className="w-20 h-20 bg-porcelain-blue-600/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-10 w-10 text-porcelain-blue-600" />
                  </div>
                  <p className="text-xs text-midnight-ink-600">Upload</p>
                </div>

                <ArrowRight className="hidden md:block h-8 w-8 text-gray-400 flex-shrink-0" />

                {/* Step 2: AI Match */}
                <div className="flex-1 text-center">
                  <div className="w-20 h-20 bg-hanok-teal/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Bot className="h-10 w-10 text-hanok-teal" />
                  </div>
                  <p className="text-xs text-midnight-ink-600">AI Matching</p>
                </div>

                <ArrowRight className="hidden md:block h-8 w-8 text-gray-400 flex-shrink-0" />

                {/* Step 3: Verified Rights */}
                <div className="flex-1 text-center">
                  <div className="w-20 h-20 bg-sunrise-coral/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-10 w-10 text-sunrise-coral" />
                  </div>
                  <p className="text-xs text-midnight-ink-600">Rights Check</p>
                </div>

                <ArrowRight className="hidden md:block h-8 w-8 text-gray-400 flex-shrink-0" />

                {/* Step 4: Discovery */}
                <div className="flex-1 text-center">
                  <div className="w-20 h-20 bg-porcelain-blue-600/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Search className="h-10 w-10 text-porcelain-blue-600" />
                  </div>
                  <p className="text-xs text-midnight-ink-600">Buyer Finds</p>
                </div>

                <ArrowRight className="hidden md:block h-8 w-8 text-gray-400 flex-shrink-0" />

                {/* End: Hollywood */}
                <div className="flex-1 text-center">
                  <div className="w-24 h-24 bg-hanok-teal rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Handshake className="h-12 w-12 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-midnight-ink">Hollywood Deal</p>
                </div>

              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <p className="text-midnight-ink-600 mb-6">See how it works below ↓</p>
            </div>

          </div>
        </section>

        {/* ========================================
            SECTION 2: THE JOURNEY
            4-step detailed flow
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink mb-4">
                The Journey
              </h2>
              <p className="text-lg text-midnight-ink-600 max-w-2xl mx-auto">
                Four simple steps from Korean content to Hollywood screens
              </p>
            </div>

            <div className="space-y-12 max-w-5xl mx-auto">

              {/* Step 1: Creator Uploads */}
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="order-2 md:order-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-sunrise-coral text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-lg">
                      01
                    </div>
                    <h3 className="text-2xl font-bold text-midnight-ink">Creator Uploads</h3>
                  </div>
                  <p className="text-midnight-ink-600 leading-relaxed mb-4">
                    Korean creators showcase their webtoons, web novels, and stories on our platform. We help develop Hollywood-ready pitch materials with professional support.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-sunrise-coral mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">Professional pitch deck development</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-sunrise-coral mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">Rights documentation verified</span>
                    </li>
                  </ul>
                </div>
                <div className="order-1 md:order-2">
                  <div className="bg-gradient-to-br from-sunrise-coral/10 to-sunrise-coral/5 rounded-2xl p-12 flex items-center justify-center">
                    <Upload className="h-32 w-32 text-sunrise-coral" />
                  </div>
                </div>
              </div>

              {/* Step 2: AI Analyzes */}
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="bg-gradient-to-br from-hanok-teal/10 to-hanok-teal/5 rounded-2xl p-12 flex items-center justify-center">
                  <Bot className="h-32 w-32 text-hanok-teal" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-hanok-teal text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-lg">
                      02
                    </div>
                    <h3 className="text-2xl font-bold text-midnight-ink">AI Analyzes</h3>
                  </div>
                  <p className="text-midnight-ink-600 leading-relaxed mb-4">
                    Jinu AI understands story craft, character arcs, and market fit. It analyzes each title's adaptation potential and matches them with buyer preferences.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-hanok-teal mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">Narrative structure analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-hanok-teal mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">Market positioning intelligence</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Step 3: Buyer Discovers */}
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="order-2 md:order-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-porcelain-blue-600 text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-lg">
                      03
                    </div>
                    <h3 className="text-2xl font-bold text-midnight-ink">Buyer Discovers</h3>
                  </div>
                  <p className="text-midnight-ink-600 leading-relaxed mb-4">
                    Hollywood studios use AI-powered search to find their next hit. They get instant access to verified rights information and comprehensive pitch materials.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-porcelain-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">10x faster than traditional sourcing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-porcelain-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">Complete pitch decks included</span>
                    </li>
                  </ul>
                </div>
                <div className="order-1 md:order-2">
                  <div className="bg-gradient-to-br from-porcelain-blue-600/10 to-porcelain-blue-600/5 rounded-2xl p-12 flex items-center justify-center">
                    <Search className="h-32 w-32 text-porcelain-blue-600" />
                  </div>
                </div>
              </div>

              {/* Step 4: Deal Closes */}
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl p-12 flex items-center justify-center">
                  <Handshake className="h-32 w-32 text-green-600" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-600 text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-lg">
                      04
                    </div>
                    <h3 className="text-2xl font-bold text-midnight-ink">Deal Closes</h3>
                  </div>
                  <p className="text-midnight-ink-600 leading-relaxed mb-4">
                    Direct connection between creator and buyer with expert support. Our Hollywood veterans guide cultural bridging, contract negotiation, and deal closure.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">Legal protection and fair terms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">Expert mediation support</span>
                    </li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 3: STUDIO SHOWCASE
            Logo grid with trust headline
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-porcelain-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink mb-4">
                50+ Studios Trust KStoryBridge
              </h2>
              <p className="text-lg text-midnight-ink-600">
                Hollywood's biggest names are actively searching for Korean content
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
                <p className="text-midnight-ink-600 text-center text-xs leading-tight">and growing</p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 4: DUAL CTA CARDS
            Large cards for each audience
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">

              {/* For Creators Card */}
              <Card className="bg-gradient-to-br from-sunrise-coral/10 to-sunrise-coral/5 border-sunrise-coral/20 shadow-lg rounded-2xl overflow-hidden">
                <CardContent className="p-10">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-sunrise-coral/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Globe className="h-10 w-10 text-sunrise-coral" />
                    </div>
                    <h3 className="text-2xl font-bold text-midnight-ink mb-3">
                      For Creators
                    </h3>
                    <p className="text-midnight-ink-600 leading-relaxed">
                      Your story deserves the global stage. Pitch directly to Hollywood with expert support.
                    </p>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-sunrise-coral flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">Direct access to 50+ studios</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-sunrise-coral flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">Professional pitch development</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-sunrise-coral flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">Keep creative control</span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-sunrise-coral hover:bg-sunrise-coral-600 text-white rounded-full py-6 text-lg"
                    onClick={() => window.location.href = '/creators'}
                  >
                    Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>

              {/* For Buyers Card */}
              <Card className="bg-gradient-to-br from-hanok-teal/10 to-hanok-teal/5 border-hanok-teal/20 shadow-lg rounded-2xl overflow-hidden">
                <CardContent className="p-10">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-hanok-teal/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-10 w-10 text-hanok-teal" />
                    </div>
                    <h3 className="text-2xl font-bold text-midnight-ink mb-3">
                      For Buyers
                    </h3>
                    <p className="text-midnight-ink-600 leading-relaxed">
                      Find your next Korean hit with AI-powered discovery and verified rights.
                    </p>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-hanok-teal flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">AI finds matches in seconds</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-hanok-teal flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">100% verified rights chain</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-hanok-teal flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">10x faster sourcing</span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-hanok-teal hover:bg-hanok-teal-600 text-white rounded-full py-6 text-lg"
                    onClick={() => window.location.href = '/buyers'}
                  >
                    Start Discovering <ArrowRight className="ml-2 h-5 w-5" />
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
                Explore verified Korean content ready for Hollywood adaptation
              </p>
            </div>

            <FeaturedTitlesCarousel />
          </div>
        </section>

        {/* ========================================
            SECTION 6: NEWSLETTER
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
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

export default HomePagePreview3;
