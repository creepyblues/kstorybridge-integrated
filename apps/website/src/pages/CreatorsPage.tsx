import { useState } from 'react';
import { Link } from 'react-router-dom';
import UniversalHeader from '../components/UniversalHeader';
import { Button } from '@kstorybridge/ui';
import { Card, CardContent } from '../components/ui/card';
import Footer from '../components/Footer';
import CreatorComingSoonDialog from '../components/CreatorComingSoonDialog';
import {
  Globe,
  Shield,
  Users,
  MessageSquare,
  FileCheck,
  Handshake,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Star,
  Target
} from 'lucide-react';

const CreatorsPage = () => {
  const [showComingSoon, setShowComingSoon] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      {/* Navigation */}
      <UniversalHeader />

      <main className="flex-1">

        {/* ========================================
            SECTION 1: HERO - ASPIRATIONAL MESSAGING
            ======================================== */}
        <section className="relative py-12 sm:py-16 lg:py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              {/* Aspirational headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 sm:mb-8 text-midnight-ink leading-tight">
                Your Story Deserves the <span className="text-sunrise-coral">Global Stage</span>
              </h1>

              {/* Hollywood access hook */}
              <p className="text-lg sm:text-xl lg:text-2xl text-midnight-ink-600 mb-4 leading-relaxed max-w-3xl mx-auto">
                Pitch directly to Hollywood IP scouts, writers, and producers
              </p>

              <p className="text-base sm:text-lg text-midnight-ink-600 mb-8 sm:mb-12 leading-relaxed max-w-3xl mx-auto">
                From Korea to Hollywood. We open the doors. You keep creative control.
              </p>

              {/* Primary CTA */}
              <Button
                id="creators-hero-join-btn"
                size="lg"
                className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => setShowComingSoon(true)}
              >
                Join the Platform
              </Button>

              <p className="mt-4 text-sm text-midnight-ink-400">
                Free to join • No exclusivity required
              </p>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 2: ACCESS SHOWCASE (NEW)
            Priority #1 - 30% page focus
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Globe className="h-10 w-10 text-sunrise-coral" />
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink">
                  Stop Being Invisible to Hollywood
                </h2>
              </div>
              <p className="text-lg sm:text-xl text-midnight-ink-600 leading-relaxed max-w-3xl mx-auto">
                Direct access to the buyers who greenlight global hits
              </p>
            </div>

            {/* Studio Logo Grid */}
            <div className="mb-12">
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

                        // Try different extensions in order: .png -> .jpg -> .svg -> .webp
                        if (currentSrc.endsWith('.png')) {
                          target.src = currentSrc.replace('.png', '.jpg');
                        } else if (currentSrc.endsWith('.jpg')) {
                          target.src = currentSrc.replace('.jpg', '.svg');
                        } else if (currentSrc.endsWith('.svg')) {
                          target.src = currentSrc.replace('.svg', '.webp');
                        } else {
                          // All extensions failed, show text fallback
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
                  <div className="text-2xl sm:text-3xl font-bold text-sunrise-coral mb-1">50+</div>
                  <p className="text-midnight-ink-600 text-center text-xs leading-tight">Hollywood studios and global streamers</p>
                </div>
              </div>
            </div>

            {/* 3 Feature Cards */}
            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-sunrise-coral/10 rounded-lg flex items-center justify-center">
                      <Target className="h-6 w-6 text-sunrise-coral" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-midnight-ink mb-2">
                        Direct to Decision-Makers
                      </h3>
                      <p className="text-midnight-ink-600">
                        Your work reaches executives who actually greenlight projects
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-sunrise-coral/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-sunrise-coral" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-midnight-ink mb-2">
                        Active Buyers Searching Now
                      </h3>
                      <p className="text-midnight-ink-600">
                        Hollywood buyers log in daily searching for their next Korean hit
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-sunrise-coral/10 rounded-lg flex items-center justify-center">
                      <Shield className="h-6 w-6 text-sunrise-coral" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-midnight-ink mb-2">
                        No Gatekeepers
                      </h3>
                      <p className="text-midnight-ink-600">
                        You pitch directly. They respond directly. No one filters your voice.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-12">
              <Button
                size="lg"
                className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-8 py-4 text-base rounded-full font-medium transition-all duration-300"
                onClick={() => setShowComingSoon(true)}
              >
                See Who's Waiting
              </Button>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 3: THREE GUARANTEES GRID
            3 Core Pillars
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-porcelain-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink mb-6">
                Everything You Need to Succeed Globally
              </h2>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Pillar 1: ACCESS */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-sunrise-coral/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Globe className="h-8 w-8 text-sunrise-coral" />
                  </div>
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-sunrise-coral/10 text-sunrise-coral text-xs font-semibold rounded-full">
                      50+ STUDIOS
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-midnight-ink mb-4">
                    Hollywood Connections
                  </h3>
                  <p className="text-midnight-ink-600 leading-relaxed">
                    Pitch to Netflix, Disney, Sony Pictures, and 50+ major platforms
                  </p>
                </CardContent>
              </Card>

              {/* Pillar 2: EXPERT */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-hanok-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Users className="h-8 w-8 text-hanok-teal" />
                  </div>
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-hanok-teal/10 text-hanok-teal text-xs font-semibold rounded-full">
                      20+ YEARS EXPERIENCE
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-midnight-ink mb-4">
                    Hollywood Veterans Develop Your Pitch
                  </h3>
                  <p className="text-midnight-ink-600 leading-relaxed">
                    Professional pitch decks developed by Hollywood showrunners
                  </p>
                </CardContent>
              </Card>

              {/* Pillar 3: EASY DEAL */}
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-porcelain-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Shield className="h-8 w-8 text-porcelain-blue-600" />
                  </div>
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-porcelain-blue-600/10 text-porcelain-blue-600 text-xs font-semibold rounded-full">
                      YOUR TERMS
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-midnight-ink mb-4">
                    Expert Deal Support
                  </h3>
                  <p className="text-midnight-ink-600 leading-relaxed">
                    Fair deals, legal protection, negotiation support every step
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 4: EXPERT DEEP DIVE (NEW)
            Priority #2 - 30% page focus
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Star className="h-10 w-10 text-hanok-teal" />
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink">
                  Your Korean Story, Packaged for Hollywood Minds
                </h2>
              </div>
              <p className="text-lg sm:text-xl text-midnight-ink-600 leading-relaxed max-w-3xl mx-auto">
                Professional pitch development by Hollywood veterans
              </p>
            </div>

            {/* Challenge intro */}
            <div className="max-w-4xl mx-auto mb-12">
              <Card
                className="shadow-none rounded-2xl"
                style={{
                  background: 'linear-gradient(to bottom right, rgba(76, 156, 155, 0.05), rgba(195, 227, 226, 1))',
                  borderColor: 'rgba(76, 156, 155, 0.2)',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              >
                <CardContent className="p-6 sm:p-8">
                  <p className="text-lg text-midnight-ink-600 leading-relaxed text-center">
                    <span className="font-semibold text-midnight-ink">Korean storytelling has unique strengths. Hollywood has specific expectations.</span><br />We bridge the gap so your vision shines through.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 3 Process Cards */}
            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-hanok-teal/10 rounded-lg flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-hanok-teal" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-midnight-ink mb-2">
                        Cultural Translation
                      </h3>
                      <p className="text-midnight-ink-600">
                        We translate not just language, but cultural context, storytelling conventions, and market positioning
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-hanok-teal/10 rounded-lg flex items-center justify-center">
                      <FileCheck className="h-6 w-6 text-hanok-teal" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-midnight-ink mb-2">
                        Professional Pitch Decks
                      </h3>
                      <p className="text-midnight-ink-600">
                        Hollywood-standard pitch materials: loglines, comp titles, character breakdowns, adaptation roadmap
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-hanok-teal/10 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-hanok-teal" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-midnight-ink mb-2">
                        Veteran Guidance
                      </h3>
                      <p className="text-midnight-ink-600">
                        Direct support from Hollywood producer with 20+ years of development experience
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-12">
              <Button
                size="lg"
                className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-8 py-4 text-base rounded-full font-medium transition-all duration-300"
                onClick={() => setShowComingSoon(true)}
              >
                Get Your Pitch Developed
              </Button>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 5: BEFORE/AFTER COMPARISON
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-porcelain-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink mb-6">
                Why Creators Choose KStoryBridge
              </h2>
              <p className="text-lg sm:text-xl text-midnight-ink-600 leading-relaxed max-w-3xl mx-auto">
                The traditional route vs. the KStoryBridge path
              </p>
            </div>

            {/* Before/After Comparison */}
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Traditional Route */}
              <Card className="bg-red-50 border-red-200 shadow-none rounded-2xl">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-red-800 mb-4">❌ Traditional Route</h3>
                  <ul className="space-y-3 text-sm text-red-900">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>Send emails to generic studio addresses → No response</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>Pitch in English without cultural context → Misunderstood</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>DIY contracts and negotiation → Exploited or overwhelmed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>Weeks of research to find the right contact → Still invisible</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* KStoryBridge Process */}
              <Card className="bg-green-50 border-green-200 shadow-none rounded-2xl">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-green-800 mb-4">✅ KStoryBridge</h3>
                  <ul className="space-y-3 text-sm text-green-900">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Direct access to 50+ verified Hollywood buyers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Professional pitch developed by Hollywood veterans</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Legal protection and deal negotiation support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Buyers come to you, see your work on day 1</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Keep creative control, fair commission structure</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 6: THREE STEPS
            Simplified journey
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink mb-6">
                Your Journey from Korea to Hollywood
              </h2>
              <p className="text-lg sm:text-xl text-midnight-ink-600 leading-relaxed max-w-3xl mx-auto">
                Three simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Step 1: Join & Showcase */}
              <div className="text-center">
                <div className="w-16 h-16 bg-hanok-teal text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg">
                  01
                </div>
                <h3 className="text-xl font-bold text-midnight-ink mb-4">Join & Showcase</h3>
                <p className="text-midnight-ink-600 leading-relaxed mb-3">
                  Create your profile, upload your webtoon/novel, tell us your vision
                </p>
                <p className="text-sm text-hanok-teal font-semibold">
                  5-minute setup
                </p>
              </div>

              {/* Step 2: Get Hollywood-Ready */}
              <div className="text-center">
                <div className="w-16 h-16 bg-hanok-teal text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg">
                  02
                </div>
                <h3 className="text-xl font-bold text-midnight-ink mb-4">Get Hollywood-Ready</h3>
                <p className="text-midnight-ink-600 leading-relaxed mb-3">
                  Our team develops your professional pitch deck with Hollywood veteran guidance
                </p>
                <p className="text-sm text-hanok-teal font-semibold">
                  1-2 weeks turnaround
                </p>
              </div>

              {/* Step 3: Connect & Close */}
              <div className="text-center">
                <div className="w-16 h-16 bg-porcelain-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg">
                  03
                </div>
                <h3 className="text-xl font-bold text-midnight-ink mb-4">Connect & Close</h3>
                <p className="text-midnight-ink-600 leading-relaxed mb-3">
                  Hollywood buyers see your pitch, reach out directly, and we support you through deal closure
                </p>
                <p className="text-sm text-porcelain-blue-600 font-semibold">
                  We're with you every step
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button
                size="lg"
                className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => setShowComingSoon(true)}
              >
                Get Started
              </Button>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 7: FINAL CTA
            Signup + Newsletter
            ======================================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-porcelain-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Final CTA */}
            <div className="text-center bg-gradient-to-br from-sunrise-coral/10 to-hanok-teal/10 rounded-3xl p-8 sm:p-12 max-w-4xl mx-auto mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink mb-4">
                Your Story Is Ready. Hollywood Is Waiting.
              </h2>
              <p className="text-lg text-midnight-ink-600 mb-8 max-w-2xl mx-auto">
                Join the platform connecting Korean creators with global studios
              </p>

              <Button
                size="lg"
                className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 mb-6"
                onClick={() => setShowComingSoon(true)}
              >
                Create Your Profile
              </Button>

              {/* Trust signals */}
              <div className="flex flex-wrap justify-center gap-4 text-sm text-midnight-ink-600 mb-4">
                <span>✓ Free to join</span>
                <span>✓ No exclusivity required</span>
                <span>✓ Keep creative control</span>
              </div>

              <p className="text-xs text-midnight-ink-400">
                Free platform • No upfront fees • Commission only on successful deals • Keep IP rights
              </p>
            </div>

          </div>
        </section>

      </main>

      <Footer />

      <CreatorComingSoonDialog
        open={showComingSoon}
        onOpenChange={setShowComingSoon}
      />
    </div>
  );
};

export default CreatorsPage;
