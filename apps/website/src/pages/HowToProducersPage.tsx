import { Button } from '@kstorybridge/ui';
import { Card, CardContent } from '../components/ui/card';
import { FeaturePageLayout } from '../components/features/shared/FeaturePageLayout';
import { ScrollReveal } from '../components/features/shared/ScrollReveal';
import { TypewriterText } from '../components/TypewriterText';
import { trackButtonClick } from '../utils/analytics';

const signupUrl = () => '/signup';

const threeWaysCards = [
  {
    image: '/images/how-to/comps-navigator.png',
    tag: 'Comps Navigator',
    title: '"I have a show I like."',
    description:
      'Type the titles that are working. KStoryBridge finds Korean IP with matching DNA: same emotional tone, similar structure, comparable audience.',
    example: 'Try: "Twilight + Bridgerton" → instant Korean IP shortlist',
  },
  {
    image: '/images/how-to/mandate-matcher.png',
    tag: 'Mandate Matcher',
    title: '"I have a brief."',
    description:
      'Paste your acquisition mandate, the actual language your team uses. The AI reads it semantically and ranks the entire Korean catalog against it.',
    example: 'Try: "K-pop romance. Youth-targeted streaming." → ranked results',
  },
  {
    image: '/images/how-to/jinu-chat.png',
    tag: 'Ask Jinu',
    title: '"Ask AI anything."',
    description:
      'Meet Jinu, your AI Korean IP expert. Conversational, specific, available 24/7. Ask about genres, trends, comparable titles, or adaptation angles.',
    example:
      'Try: "What Korean thrillers would work for Netflix right now?"',
  },
];

const beyondFeatures = [
  {
    title: 'Rights Verified',
    description:
      'Adaptation rights status, available formats (Film/TV, Animation, Microdrama, Audio), and direct licensing contact on every page.',
  },
  {
    title: 'Format Fit Analysis',
    description:
      "AI-scored across 5 formats with dimension breakdowns. Know if it's an 83% TV Series or 76% Microdrama, and exactly why, before you make a call.",
  },
  {
    title: 'AI Comparable Analysis',
    description:
      "Matched to titles you already know, with percentage scores and notes on what the match is. Not guesswork. Evidence you can bring to a meeting.",
  },
  {
    title: 'Pitch Decks',
    description:
      '23-page adaptation briefs with loglines, characters, themes, and audience profiles. First 5 pages free. Full deck with Pro.',
  },
];

const HowToProducersPage = () => {
  return (
    <FeaturePageLayout>
      {/* Section 1: Hero */}
      <section
        className="relative py-24 sm:py-32 lg:py-40 overflow-hidden"
        style={{
          backgroundImage: 'url(/images/how-to/hero-producer.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm sm:text-base uppercase tracking-widest text-white/80 mb-6">
              Dashboard for Producers
            </p>

            <div className="mb-8">
              <TypewriterText
                storageKey="how-to-producers-hero-v2"
                lines={[
                  {
                    text: 'Find Korean IP that fits your next show',
                    className:
                      'text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight',
                  },
                  {
                    text: ' in under 60 seconds.',
                    className:
                      'text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-hanok-teal leading-tight italic',
                    delay: 0,
                  },
                ]}
                cursorClassName="text-hanok-teal"
              />
            </div>

            <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto mb-10 leading-relaxed">
              Tell us one show or brief. We'll pull matching Korean IP with
              rights, format analysis, and adaptation notes, ready to walk into
              any room.
            </p>

            <div className="mt-10 flex flex-col items-center gap-2 text-white/60">
              <p className="text-sm tracking-wide">Scroll to explore</p>
              <span className="text-xl animate-bounce">↓</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Problem */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink mb-6 leading-tight">
                Korean content isn't a trend.{' '}
                <br className="hidden sm:block" />
                Your discovery process still is.
              </h2>
              <p className="text-lg sm:text-xl text-midnight-ink-600 leading-relaxed max-w-3xl mx-auto">
                Word of mouth. Market trips. Cold emails. Rights that turn out
                to be tied up.{' '}
                <strong className="text-midnight-ink">
                  The Korean IP catalog is massive
                </strong>{' '}
                : tens of thousands of webtoons, web novels, and drama originals
                with proven global audiences. Finding the right one for your
                next project shouldn't take months of guesswork.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Section 3: Three Ways In */}
      <section className="py-16 sm:py-20 lg:py-24 bg-porcelain-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink mb-4">
                Start with how you already think.
              </h2>
              <p className="text-lg text-midnight-ink-600 max-w-2xl mx-auto">
                Three discovery modes built for how development executives
                actually work.
              </p>
            </div>
          </ScrollReveal>

          {/* Dashboard overview screenshot */}
          <ScrollReveal>
            <div className="mb-12 sm:mb-16 max-w-4xl mx-auto">
              <img
                src="/images/how-to/dashboard-home.png"
                alt="KStoryBridge Dashboard overview"
                className="w-full rounded-2xl shadow-lg border border-gray-200"
                loading="lazy"
              />
            </div>
          </ScrollReveal>

          {/* 3 feature cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {threeWaysCards.map((card, index) => (
              <ScrollReveal key={card.title} delay={index * 150}>
                <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow h-full overflow-hidden">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full aspect-[16/10] object-cover"
                    loading="lazy"
                  />
                  <CardContent className="p-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-hanok-teal mb-2 block">
                      {card.tag}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-midnight-ink mb-3">
                      {card.title}
                    </h3>
                    <p className="text-sm sm:text-base text-midnight-ink-600 leading-relaxed mb-4">
                      {card.description}
                    </p>
                    <p className="text-sm text-hanok-teal italic">
                      {card.example}
                    </p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Beyond Discovery */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink mb-4">
                Beyond Discovery
              </h2>
              <p className="text-lg text-midnight-ink-600 max-w-2xl mx-auto mb-2">
                Every title comes with a development brief built in.
              </p>
              <p className="text-base text-midnight-ink-600/80 max-w-2xl mx-auto">
                Click any result and get everything you need to evaluate,
                present, and move fast.
              </p>
            </div>
          </ScrollReveal>

          {/* Title detail screenshot */}
          <ScrollReveal>
            <div className="mb-12 sm:mb-16 max-w-4xl mx-auto">
              <img
                src="/images/how-to/title-detail.jpg"
                alt="Title detail page with development brief"
                className="w-full rounded-2xl shadow-lg border border-gray-200"
                loading="lazy"
              />
            </div>
          </ScrollReveal>

          {/* 4 feature tiles - 2x2 grid */}
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
            {beyondFeatures.map((feature, index) => (
              <ScrollReveal key={feature.title} delay={index * 100}>
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-midnight-ink mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-midnight-ink-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Pull quote */}
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center mb-12">
              <blockquote className="text-lg sm:text-xl italic text-midnight-ink-600 border-l-4 border-hanok-teal pl-6 text-left mb-3">
                "12.3 million readers. Rights verified. Microdrama: 80%
                Excellent Fit. Cliffhanger score: 85%."
              </blockquote>
              <p className="text-sm text-hanok-teal font-medium text-left pl-6">
                This is what you see before you make your first call.
              </p>
            </div>
          </ScrollReveal>

          {/* Film reels decorative image */}
          <ScrollReveal>
            <div className="max-w-md mx-auto">
              <img
                src="/images/how-to/film-reels.jpg"
                alt="Film reels"
                className="w-full rounded-xl opacity-80"
                loading="lazy"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Section 5: Final CTA */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-hanok-teal/10 to-porcelain-blue-600/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink mb-6">
                Stop searching. Start scouting.
              </h2>
              <p className="text-lg text-midnight-ink-600 mb-10 leading-relaxed">
                The next global hit is already written. It's Korean, it has
                millions of readers, and it's waiting for the right producer.
              </p>
              <Button
                size="lg"
                className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-10 sm:px-14 py-5 sm:py-6 text-base sm:text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => {
                  trackButtonClick('how-to-final-cta', 'final_cta_section');
                  window.location.href = signupUrl();
                }}
              >
                Request Access &rarr;
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </FeaturePageLayout>
  );
};

export default HowToProducersPage;
