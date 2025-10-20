import { useEffect } from 'react';
import UniversalHeader from '../components/UniversalHeader';
import { Button } from '@kstorybridge/ui';
import { Card, CardContent } from '../components/ui/card';
import FeaturedTitlesCarousel from '../components/FeaturedTitlesCarousel';
import Footer from '../components/Footer';
import {
  Bot,
  Shield,
  Users,
  MessageSquare,
  FileCheck,
  Handshake,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

/**
 * BUYERS PAGE
 *
 * Main landing page for Hollywood buyers and media scouts.
 *
 * Design Strategy: AI-first messaging with clear rights chain and expert support
 * Documentation: /apps/dashboard/public/docs/BUYERS_PAGE_OVERHAUL.md
 *
 * Sections:
 * 1. Hero (AI-first messaging)
 * 2. AI Assistant Showcase (Priority #1)
 * 3. Value Props Grid (3 pillars)
 * 4. Rights Deep Dive (Priority #2)
 * 5. Streamlined Process (3 steps)
 * 6. Catalog Preview
 * 7. Final CTA (simplified)
 *
 * Updated: 2025-10-14
 */

const BuyersPage = () => {
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
            SECTION 1: HERO - REVISED MESSAGING
            ======================================== */}
        <section className="relative py-12 sm:py-16 lg:py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              {/* NEW: AI-first headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 sm:mb-8 text-midnight-ink leading-tight">
                Find Your Next Hit with <span className="text-hanok-teal">AI Assistant</span>
              </h1>

              {/* NEW: 3-pillar subheadline */}
              <p className="text-lg sm:text-xl lg:text-2xl text-midnight-ink-600 mb-8 sm:mb-12 leading-relaxed max-w-3xl mx-auto">
                AI assistant + verified rights chain + expert deal support = Korean hits discovered faster
              </p>

              {/* NEW: Primary CTA emphasis on AI */}
              <Button
                id="buyers-hero-try-ai-btn"
                size="lg"
                className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => window.location.href = `${import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:8081'}/signup/buyer`}
              >
                Try AI Assistant →
              </Button>

              <p className="mt-4 text-sm text-midnight-ink-400">
                No credit card required • Free to start
              </p>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 2: AI ASSISTANT SHOWCASE (NEW)
            Priority #1 - 30% page focus
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Bot className="h-10 w-10 text-hanok-teal" />
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink">
                  Meet Jinu: Your AI Story Expert
                </h2>
              </div>
              <p className="text-lg sm:text-xl text-midnight-ink-600 leading-relaxed max-w-3xl mx-auto">
                Your collaborative AI Assistant who specializes in Korean storytelling with Hollywood showrunner's mind
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

              {/* Left: Features */}
              <div className="space-y-6">
                <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-hanok-teal/10 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-hanok-teal" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-midnight-ink mb-2">
                          Recommend titles that cleared rights
                        </h3>
                        <p className="text-midnight-ink-600">
                          AI recommendations focus on titles with verified rights documentation, reducing legal risks.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-hanok-teal/10 rounded-lg flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-hanok-teal" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-midnight-ink mb-2">
                          Story Craft + Market Fit Intelligence
                        </h3>
                        <p className="text-midnight-ink-600">
                          Discusses character arcs, narrative structure, and platform fit based on your goals.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-hanok-teal/10 rounded-lg flex items-center justify-center">
                        <ExternalLink className="h-6 w-6 text-hanok-teal" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-midnight-ink mb-2">
                          Deep details including pitch deck
                        </h3>
                        <p className="text-midnight-ink-600">
                          Access comprehensive pitch decks with story analysis, market positioning, and adaptation potential.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Visual Demo Placeholder */}
              <div className="bg-gradient-to-br from-hanok-teal/10 to-porcelain-blue-100 rounded-2xl p-8 lg:p-12">
                <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-700">
                        "Show me romantic comedy webtoons with strong female leads"
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-hanok-teal rounded-full flex-shrink-0 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-hanok-teal/10 rounded-lg p-3 text-sm text-midnight-ink">
                        <p className="font-semibold mb-2">Great choice! Let me tell you why these stories work...</p>
                        <p className="text-xs text-midnight-ink-600">
                          I found some delightful titles that really blend those elements well! "You Get Me Going" is a standout choice! It features Youngwon, whose overbearing nature leads to humorous clashes with Hyunwoo, who is his polar opposite. Their relationship takes an unexpected turn during a business trip, where the playful banter not only drives the comedy but also deepens their character arcs. What I love here is how the humor is rooted in their evolving dynamics, making it a fun and engaging read.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center pt-4">
                    <Button
                      size="sm"
                      className="bg-hanok-teal hover:bg-hanok-teal-600 text-white"
                      onClick={() => window.location.href = `${import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:8081'}/signup/buyer`}
                    >
                      Chat with Jinu
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 3: VALUE PROPS GRID (NEW)
            3 Core Pillars
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-porcelain-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink mb-6">
                Three Pillars. Three Problems Solved.
              </h2>
              <p className="text-lg sm:text-xl text-midnight-ink-600 leading-relaxed max-w-3xl mx-auto">
                Everything you need to discover, verify, and acquire Korean content
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Pillar 1: AI Discovery */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-hanok-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Bot className="h-8 w-8 text-hanok-teal" />
                  </div>
                  <h3 className="text-xl font-bold text-midnight-ink mb-4">
                    AI-Powered Discovery
                  </h3>
                  <p className="text-midnight-ink-600 leading-relaxed mb-4">
                    Stop endless browsing. Jinu finds what you need in seconds with intelligent recommendations and story expertise.
                  </p>
                  <p className="text-sm text-hanok-teal font-semibold">
                    10x faster discovery
                  </p>
                </CardContent>
              </Card>

              {/* Pillar 2: Rights Chain */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-[#4C9C9B]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Shield className="h-8 w-8 text-[#4C9C9B]" />
                  </div>
                  <h3 className="text-xl font-bold text-midnight-ink mb-4">
                    Verified Rights Chain
                  </h3>
                  <p className="text-midnight-ink-600 leading-relaxed mb-4">
                    No more surprises. Every title has clear ownership documentation and direct access to rights holders.
                  </p>
                  <p className="text-sm text-[#4C9C9B] font-semibold">
                    Zero ownership surprises
                  </p>
                </CardContent>
              </Card>

              {/* Pillar 3: Expert Support */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-porcelain-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Users className="h-8 w-8 text-porcelain-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-midnight-ink mb-4">
                    Expert Deal Support
                  </h3>
                  <p className="text-midnight-ink-600 leading-relaxed mb-4">
                    Navigate complex Korean deals with confidence. Cultural bridging, pitch decks, and negotiation expertise.
                  </p>
                  <p className="text-sm text-porcelain-blue-600 font-semibold">
                    Close deals faster
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 4: RIGHTS DEEP DIVE (NEW)
            Priority #2 - 25% page focus
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Shield className="h-10 w-10 text-sunrise-coral" />
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink">
                  Verified Rights. Zero Surprises.
                </h2>
              </div>
              <p className="text-lg sm:text-xl text-midnight-ink-600 leading-relaxed max-w-3xl mx-auto">
                Clear ownership chain from creator to you
              </p>
            </div>

            {/* Visual Rights Chain Diagram */}
            <div className="max-w-5xl mx-auto mb-12">
              <div className="flex flex-col md:flex-row items-center justify-evenly gap-6">
                {/* Step 1 */}
                <div className="flex-1 text-center max-w-[200px] w-full">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mx-auto mb-4">
                    <FileCheck className="h-10 w-10 text-green-600 flex-shrink-0" />
                  </div>
                  <h4 className="font-semibold text-midnight-ink mb-2 min-h-[3rem] flex items-center justify-center">1. Creator Profile</h4>
                  <p className="text-sm text-midnight-ink-600 min-h-[2.5rem]">Verified identity & work history</p>
                </div>

                <ArrowRight className="hidden md:block h-6 w-6 text-gray-400 flex-shrink-0 self-start mt-8" />

                {/* Step 2 */}
                <div className="flex-1 text-center max-w-[200px] w-full">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mx-auto mb-4">
                    <Shield className="h-10 w-10 text-green-600 flex-shrink-0" />
                  </div>
                  <h4 className="font-semibold text-midnight-ink mb-2 min-h-[3rem] flex items-center justify-center">2. Rights Documentation</h4>
                  <p className="text-sm text-midnight-ink-600 min-h-[2.5rem]">Clear ownership records</p>
                </div>

                <ArrowRight className="hidden md:block h-6 w-6 text-gray-400 flex-shrink-0 self-start mt-8" />

                {/* Step 3 */}
                <div className="flex-1 text-center max-w-[200px] w-full">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mx-auto mb-4">
                    <Handshake className="h-10 w-10 text-green-600 flex-shrink-0" />
                  </div>
                  <h4 className="font-semibold text-midnight-ink mb-2 min-h-[3rem] flex items-center justify-center">3. Direct Connection</h4>
                  <p className="text-sm text-midnight-ink-600 min-h-[2.5rem]">No intermediaries</p>
                </div>

                <ArrowRight className="hidden md:block h-6 w-6 text-gray-400 flex-shrink-0 self-start mt-8" />

                {/* Step 4 */}
                <div className="flex-1 text-center max-w-[200px] w-full">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mx-auto mb-4">
                    <CheckCircle2 className="h-10 w-10 text-green-600 flex-shrink-0" />
                  </div>
                  <h4 className="font-semibold text-midnight-ink mb-2 min-h-[3rem] flex items-center justify-center">4. Deal Closed</h4>
                  <p className="text-sm text-midnight-ink-600 min-h-[2.5rem]">Clean chain of title</p>
                </div>
              </div>
            </div>

            {/* Before/After Comparison */}
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Traditional Process */}
              <Card className="bg-red-50 border-red-200 shadow-none rounded-2xl">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-red-800 mb-4">❌ Traditional Process</h3>
                  <ul className="space-y-3 text-sm text-red-900">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>Unclear rights ownership</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>Multiple intermediaries delay deals</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>Surprise ownership disputes mid-deal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>No authority to make decisions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>Deals fall apart after months of work</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* KStoryBridge Process */}
              <Card className="bg-green-50 border-green-200 shadow-none rounded-2xl">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-green-800 mb-4">✅ KStoryBridge Process</h3>
                  <ul className="space-y-3 text-sm text-green-900">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Verified rights documentation upfront</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Direct access to rights holders</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Clear chain of title documented</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Deal authority confirmed before discussions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Deals close in weeks, not months</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

          </div>
        </section>

        {/* ========================================
            SECTION 5: STREAMLINED PROCESS
            Simplified to 3 steps
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink mb-6">
                Three Simple Steps
              </h2>
              <p className="text-lg sm:text-xl text-midnight-ink-600 leading-relaxed max-w-3xl mx-auto">
                From discovery to closed deal
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Step 1: Discover */}
              <div className="text-center">
                <div className="w-16 h-16 bg-hanok-teal text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg">
                  01
                </div>
                <h3 className="text-xl font-bold text-midnight-ink mb-4">Discover with AI</h3>
                <p className="text-midnight-ink-600 leading-relaxed">
                  Chat with Jinu to find titles that match your audience and vision. Get 10 smart recommendations instantly.
                </p>
              </div>

              {/* Step 2: Verify */}
              <div className="text-center">
                <div className="w-16 h-16 bg-[#4C9C9B] text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg">
                  02
                </div>
                <h3 className="text-xl font-bold text-midnight-ink mb-4">Verify Rights</h3>
                <p className="text-midnight-ink-600 leading-relaxed">
                  Review verified ownership chain and connect directly with rights holders who have deal authority.
                </p>
              </div>

              {/* Step 3: Close */}
              <div className="text-center">
                <div className="w-16 h-16 bg-porcelain-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg">
                  03
                </div>
                <h3 className="text-xl font-bold text-midnight-ink mb-4">Close with Support</h3>
                <p className="text-midnight-ink-600 leading-relaxed">
                  Navigate cultural and legal complexities with expert guidance. Get pitch decks, contract review, and mediation.
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button
                size="lg"
                className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-12 py-6 text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => window.location.href = `${import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:8081'}/signup/buyer`}
              >
                Get Started
              </Button>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 6: CATALOG PREVIEW
            Keep existing with minor updates
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-porcelain-blue-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink mb-6">
                The Biggest IP Catalog
              </h2>
              <p className="text-xl text-midnight-ink-600 leading-relaxed max-w-2xl mx-auto">
                Get access to verified Korean content with proven market performance
              </p>
            </div>

            <div className="mb-16">
              <FeaturedTitlesCarousel />
            </div>

            <div className="text-center">
              <Button
                id="buyers-catalog-join-btn"
                size="lg"
                className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-12 py-6 text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => window.location.href = `${import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:8081'}/signup/buyer`}
              >
                Join to View Full Catalog
              </Button>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 7: PRICING + FINAL CTA
            Combined and simplified
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Final CTA Section */}
            <div className="text-center bg-gradient-to-br from-hanok-teal/10 to-porcelain-blue-100 rounded-3xl p-8 sm:p-12 max-w-4xl mx-auto">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink mb-4">
                Start Discovering Today
              </h2>
              <p className="text-lg text-midnight-ink-600 mb-8 max-w-2xl mx-auto">
                Join hundreds of buyers discovering Korean hits with AI-powered search, verified rights, and expert support
              </p>

              <Button
                size="lg"
                className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-8 py-6 text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => window.location.href = `${import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:8081'}/signup/buyer`}
              >
                Try Free
              </Button>

              <p className="mt-6 text-sm text-midnight-ink-400">
                No credit card required • Upgrade anytime • Cancel anytime
              </p>
            </div>

          </div>
        </section>

        {/* ========================================
            SECTION 8: NEWSLETTER
            KStoryBridge Newsletter signup
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

export default BuyersPage;
