import { useEffect } from 'react';
import UniversalHeader from '../components/UniversalHeader';
import { Button } from '@kstorybridge/ui';
import { Card, CardContent } from '../components/ui/card';
import Footer from '../components/Footer';
import {
  Bot,
  Shield,
  Users,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Globe
} from 'lucide-react';

/**
 * HOMEPAGE - "AI-FIRST" DESIGN
 *
 * Visual Concept: Lead with Jinu AI Assistant as the hero
 * Appeal: Technology differentiator, modern and innovative
 *
 * Updated: 2025-10-14
 */

const HomePage = () => {
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

      {/* Navigation */}
      <UniversalHeader />

      <main className="flex-1">

        {/* ========================================
            SECTION 1: AI HERO
            Jinu AI Assistant front and center
            ======================================== */}
        <section className="relative py-12 sm:py-16 lg:py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

              {/* Left: Headline & CTAs */}
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                  <Bot className="h-12 w-12 text-hanok-teal" />
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-midnight-ink">
                    Meet Jinu
                  </h1>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink mb-6 leading-tight">
                  The AI Assistant That Connects Korean Stories with Hollywood
                </h2>

                <p className="text-lg text-midnight-ink-600 mb-8 leading-relaxed">
                  AI discovery • Verified rights • Expert support
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-8 py-6 text-lg rounded-full"
                    onClick={() => window.location.href = '/buyers'}
                  >
                    I'm a Buyer
                  </Button>
                  <Button
                    className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-8 py-6 text-lg rounded-full"
                    onClick={() => window.location.href = '/creators'}
                  >
                    I'm a Creator
                  </Button>
                </div>
              </div>

              {/* Right: AI Chat Demo Mockup */}
              <div className="bg-gradient-to-br from-hanok-teal/10 to-porcelain-blue-100 rounded-2xl p-8 lg:p-12">
                <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-700">
                        "I'm looking for Korean romantic comedies with strong female leads similar to Crash Landing on You"
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-hanok-teal rounded-full flex-shrink-0 flex items-center justify-center">
                      <Bot className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-hanok-teal/10 rounded-lg p-4 text-sm text-midnight-ink">
                        <p className="font-semibold mb-2">Perfect! I found 10 titles that match your criteria...</p>
                        <p className="text-xs text-midnight-ink-600 mb-3">
                          I've found some delightful recommendations that capture that playful spirit! "You Get Me Going" is a fantastic choice! It features Youngwon, who is quite the character with his overbearing nature leading to amusing clashes with his work counterpart, Hyunwoo. Their dynamic kicks off with a business trip that turns into a romantic adventure, laced with humor and unexpected moments of connection. What hooked me is how the story balances playful banter with deeper emotional undertones, making it a great fit for fans of light-hearted comedy!
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-green-700 font-semibold">Rights Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center pt-4">
                    <Button
                      size="sm"
                      className="bg-hanok-teal hover:bg-hanok-teal-600 text-white"
                      onClick={() => window.location.href = `${import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:8081'}/signup/buyer`}
                    >
                      Try Jinu Now
                    </Button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ========================================
            SECTION 2: STATS BAR
            Horizontal stats strip
            ======================================== */}
        <section className="py-8 sm:py-12 bg-white border-y border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 text-center">

              <div>
                <div className="text-3xl sm:text-4xl font-bold text-hanok-teal mb-2">50+</div>
                <p className="text-sm text-midnight-ink-600">Hollywood Studios</p>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-bold text-hanok-teal mb-2">200+</div>
                <p className="text-sm text-midnight-ink-600">Korean Titles</p>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-bold text-hanok-teal mb-2">10x</div>
                <p className="text-sm text-midnight-ink-600">Faster Discovery</p>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-bold text-hanok-teal mb-2">100%</div>
                <p className="text-sm text-midnight-ink-600">Rights Verified</p>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 3: PLATFORM OVERVIEW
            3 Core Pillars with large icons
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-porcelain-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink mb-4">
                Three Pillars. One Platform.
              </h2>
              <p className="text-lg text-midnight-ink-600 max-w-2xl mx-auto">
                Everything you need to discover, verify, and acquire Korean content
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

              {/* Pillar 1: AI Discovery */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="p-10 text-center">
                  <div className="w-20 h-20 bg-hanok-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Bot className="h-10 w-10 text-hanok-teal" />
                  </div>
                  <h3 className="text-2xl font-bold text-midnight-ink mb-4">
                    AI Discovery
                  </h3>
                  <p className="text-midnight-ink-600 leading-relaxed mb-4">
                    Jinu finds perfect matches in seconds with intelligent recommendations based on story craft, character arcs, and market fit.
                  </p>
                  <p className="text-sm text-hanok-teal font-semibold">
                    10x faster than traditional sourcing
                  </p>
                </CardContent>
              </Card>

              {/* Pillar 2: Rights Verified */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="p-10 text-center">
                  <div className="w-20 h-20 bg-hanok-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Shield className="h-10 w-10 text-hanok-teal" />
                  </div>
                  <h3 className="text-2xl font-bold text-midnight-ink mb-4">
                    Rights Verified
                  </h3>
                  <p className="text-midnight-ink-600 leading-relaxed mb-4">
                    Clean chain of title with verified ownership documentation. Direct access to rights holders with deal authority.
                  </p>
                  <p className="text-sm text-hanok-teal font-semibold">
                    Zero ownership surprises
                  </p>
                </CardContent>
              </Card>

              {/* Pillar 3: Expert Support */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="p-10 text-center">
                  <div className="w-20 h-20 bg-hanok-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Users className="h-10 w-10 text-hanok-teal" />
                  </div>
                  <h3 className="text-2xl font-bold text-midnight-ink mb-4">
                    Expert Support
                  </h3>
                  <p className="text-midnight-ink-600 leading-relaxed mb-4">
                    Hollywood veterans guide every deal with cultural bridging, pitch development, and negotiation expertise.
                  </p>
                  <p className="text-sm text-hanok-teal font-semibold">
                    Close deals faster
                  </p>
                </CardContent>
              </Card>

            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 4: AUDIENCE PATHS
            Side-by-side cards for creators/buyers
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink mb-4">
                Choose Your Path
              </h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">

              {/* Are You a Creator? */}
              <Card
                className="shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-shadow"
                style={{
                  background: 'linear-gradient(to bottom right, rgba(255, 107, 107, 0.1), rgba(255, 107, 107, 0.05))',
                  borderColor: 'rgba(255, 107, 107, 0.2)',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              >
                <CardContent className="p-10">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-sunrise-coral/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Globe className="h-8 w-8 text-sunrise-coral" />
                    </div>
                    <h3 className="text-2xl font-bold text-midnight-ink mb-4">
                      Are You a Creator?
                    </h3>
                    <p className="text-midnight-ink-600 leading-relaxed mb-6">
                      Get your Korean story in front of 50+ Hollywood studios with professional pitch development and expert deal support.
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8 text-left">
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
                      <span className="text-sm text-midnight-ink-600">Keep creative control and IP rights</span>
                    </li>
                  </ul>

                  <Button
                    className="w-full bg-sunrise-coral hover:bg-sunrise-coral-600 text-white rounded-full text-lg py-6"
                    onClick={() => window.location.href = '/creators'}
                  >
                    Learn More <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>

              {/* Are You a Buyer? */}
              <Card
                className="shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-shadow"
                style={{
                  background: 'linear-gradient(to bottom right, rgba(76, 156, 155, 0.1), rgba(76, 156, 155, 0.05))',
                  borderColor: 'rgba(76, 156, 155, 0.2)',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              >
                <CardContent className="p-10">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-hanok-teal/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-8 w-8 text-hanok-teal" />
                    </div>
                    <h3 className="text-2xl font-bold text-midnight-ink mb-4">
                      Are You an IP Scout or Producer?
                    </h3>
                    <p className="text-midnight-ink-600 leading-relaxed mb-6">
                      Find your next Korean hit with AI-powered discovery, verified rights chain, and comprehensive pitch materials.
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8 text-left">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-hanok-teal mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">AI finds perfect matches in seconds</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-hanok-teal mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">Verified rights, zero ownership surprises</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-hanok-teal mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-midnight-ink-600">Expert support for every deal</span>
                    </li>
                  </ul>

                  <Button
                    className="w-full bg-hanok-teal hover:bg-hanok-teal-600 text-white rounded-full text-lg py-6"
                    onClick={() => window.location.href = '/buyers'}
                  >
                    Learn More <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>

            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 5: NEWSLETTER
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

export default HomePage;
