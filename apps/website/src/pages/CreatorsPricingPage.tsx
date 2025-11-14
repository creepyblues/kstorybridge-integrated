import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from "@kstorybridge/ui";
import { Check, X, Sparkles, TrendingUp, Rocket, Users, DollarSign, Award } from 'lucide-react';
import UniversalHeader from '../components/UniversalHeader';
import Footer from '../components/Footer';
import PricingCard from '../components/PricingCard';

const CreatorsPricingPage = () => {
  const navigate = useNavigate();

  const handleStartFree = () => {
    window.location.href = `${import.meta.env.VITE_DASHBOARD_URL}/signin`;
  };

  const handleUpgrade = (plan: string) => {
    // TODO: Integrate with Stripe PaymentButton
    console.log(`Upgrading to ${plan}`);
    window.location.href = `${import.meta.env.VITE_DASHBOARD_URL}/signin`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <UniversalHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-midnight-ink mb-6">
              Three Clear Paths to Global Success
            </h1>
            <p className="text-xl sm:text-2xl text-midnight-ink-600 max-w-3xl mx-auto">
              From free listing to active representation—choose what fits your goals
            </p>
          </div>
        </section>

        {/* Pricing Cards Section */}
        <section className="py-12 lg:py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Free Listing Plan */}
              <PricingCard
                title="Free 'Listing' Plan"
                price="$0"
                period="forever for 2 titles"
                description="Perfect for early-stage creators curious about Western interest"
                features={[
                  "List up to 2 titles in our curated Korean IP marketplace",
                  "Your work becomes searchable by verified Netflix, Amazon, and Disney buyers",
                  "Receive direct buyer inquiries (no middlemen)",
                  "Basic messaging and notification tools"
                ]}
                buttonText="Start Free"
                onButtonClick={handleStartFree}
                className="bg-transparent border-gray-300 shadow-none rounded-2xl"
              />

              {/* Packaging Plan */}
              <PricingCard
                title="'Packaging' Plan"
                price="$100"
                period="/month"
                description="Perfect for serious creators ready to compete professionally"
                features={[
                  "Professional Adaptation Pitch Deck (normally costs $3,000-5,000)",
                  "Deep Analytics Dashboard: readership trends, genre benchmarks",
                  "'Verified Creator' Badge: instant credibility with buyers",
                  "Buyer Insights: track who's viewing your title, which regions show interest",
                  "Adaptation Strategy Consultation: 60-minute session",
                  "Regular: $200/month or $2,000/year per title",
                  "🎉 Launch Promo: $100/month or $1,000/year (50% off first year)"
                ]}
                buttonText="Go Pro"
                onButtonClick={() => handleUpgrade('packaging')}
                popular={true}
                className="bg-transparent border-sunrise-coral shadow-none rounded-2xl"
              />

              {/* Premium Plan */}
              <PricingCard
                title="'Premium' Plan"
                price="$200"
                period="/month"
                description="Perfect for creators who want dedicated representation without agency fees"
                features={[
                  "Everything in Packaging, PLUS:",
                  "We personally pitch your IP to 20+ carefully selected buyers per year",
                  "Monthly Intelligence Reports with actual buyer feedback",
                  "Featured in our industry newsletter reaching 1,000+ Western buyers",
                  "Homepage spotlight positioning",
                  "3 customized pitch versions (film, series, game)",
                  "Producer coaching on how to present in meetings",
                  "Regular: $400/month or $4,000/year per title",
                  "🎉 Launch Promo: $200/month or $2,000/year (50% off first year)"
                ]}
                buttonText="Go Premium"
                onButtonClick={() => handleUpgrade('premium')}
                className="bg-transparent border-gray-300 shadow-none rounded-2xl"
              />
            </div>

            {/* Commitment Notice */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 text-sm">
                * Paid plans require 1 year commitment (because building momentum takes time)
              </p>
            </div>
          </div>
        </section>

        {/* What Makes This Different Section */}
        <section className="py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl lg:text-4xl font-bold text-midnight-ink mb-8 text-center">
                What Makes This Different?
              </h2>

              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-sunrise-coral/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-sunrise-coral" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-midnight-ink mb-2">Curated Marketplace</h3>
                      <p className="text-midnight-ink-600">
                        Unlike dumping your script on a generic platform where it gets lost among thousands,
                        your IP enters a curated Korean adaptation marketplace. Buyers come here specifically
                        seeking Korean stories—your work is already positioned as valuable cultural content,
                        not just another PDF in the pile.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-sunrise-coral/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-sunrise-coral" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-midnight-ink mb-2">Professional Packaging</h3>
                      <p className="text-midnight-ink-600">
                        For the price of a single film market badge, you get an entire year of professional
                        packaging, analytics, and marketplace presence. Your raw Korean story becomes a
                        data-backed, professionally presented adaptation opportunity that speaks the language
                        Hollywood understands.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-sunrise-coral/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Rocket className="w-6 h-6 text-sunrise-coral" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-midnight-ink mb-2">Active Representation</h3>
                      <p className="text-midnight-ink-600">
                        Traditional agents charge 20-40% forever and might never pitch your project. We charge
                        a flat fee and guarantee 20+ targeted pitches annually. You know exactly what you're
                        paying for and what you're getting.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Commission Section */}
        <section className="py-16 lg:py-20 bg-gradient-to-b from-porcelain-blue-50 to-white">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-midnight-ink mb-4">
                The Fairest Commission in the Industry
              </h2>
              <p className="text-xl text-sunrise-coral font-semibold">
                Just 10% When You Succeed
              </p>
            </div>

            <Card className="bg-white border-gray-300 shadow-none rounded-2xl mb-12">
              <CardContent className="p-8 lg:p-12">
                <div className="grid md:grid-cols-2 gap-12">
                  <div>
                    <h3 className="text-2xl font-bold text-midnight-ink mb-6">
                      Our 10% Commission Covers:
                    </h3>
                    <ul className="space-y-3">
                      {[
                        'Option payments',
                        'Purchase prices',
                        'Production bonuses',
                        'License fees'
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-sunrise-coral flex-shrink-0" />
                          <span className="text-midnight-ink-600">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-midnight-ink mb-6">
                      Compare This To:
                    </h3>
                    <ul className="space-y-3">
                      {[
                        { label: 'Traditional agents', value: '20-40% commission' },
                        { label: 'Other platforms', value: '15-20% commission' },
                        { label: 'Film market + consultant', value: 'Often $10,000+ with zero guarantee' }
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                          <div>
                            <span className="text-midnight-ink font-semibold">{item.label}:</span>
                            <span className="text-midnight-ink-600 ml-2">{item.value}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bundle Pricing */}
            <Card className="bg-transparent border-sunrise-coral shadow-none rounded-2xl">
              <CardContent className="p-8 lg:p-12">
                <div className="text-center mb-8">
                  <h3 className="text-2xl lg:text-3xl font-bold text-midnight-ink mb-2">
                    Special Bundle Pricing
                  </h3>
                  <p className="text-midnight-ink-600">
                    For Publishers and Studios with Multiple Titles
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                  <Card className="bg-white border-gray-300 shadow-none rounded-xl">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl font-bold text-sunrise-coral mb-2">25% OFF</div>
                      <div className="text-lg font-semibold text-midnight-ink mb-2">5+ Titles</div>
                      <p className="text-gray-600 text-sm">Additional discount on all plans</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-gray-300 shadow-none rounded-xl">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl font-bold text-sunrise-coral mb-2">40% OFF</div>
                      <div className="text-lg font-semibold text-midnight-ink mb-2">10+ Titles</div>
                      <p className="text-gray-600 text-sm">Maximum savings for publishers</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl lg:text-4xl font-bold text-midnight-ink mb-12 text-center">
              Why Creators Choose KStoryBridge
            </h2>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* vs Going It Alone */}
              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-midnight-ink mb-4">vs. Going It Alone</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">No industry connections, language barriers</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">Don't know market rates or best practices</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm font-medium">Direct access to verified buyers</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm font-medium">Bilingual support, market intelligence</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* vs Traditional Agents */}
              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-midnight-ink mb-4">vs. Traditional Agents</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">20-40% commission forever</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">Might never pitch your project, no transparency</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm font-medium">10% only on success, guaranteed pitches</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm font-medium">Full reporting, complete transparency</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* vs Major Platforms */}
              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-midnight-ink mb-4">vs. Major Platforms (Naver/Kakao)</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">Lost in the crowd with millions of titles</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">Minimal revenue share, no direct buyer relationships</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm font-medium">Curated marketplace, keep 90% of your deal</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm font-medium">Build your own buyer network</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* vs Film Markets */}
              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-midnight-ink mb-4">vs. Film Markets</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">$5,000-20,000 per event, exhausting</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">No follow-up system, connections fade quickly</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm font-medium">Year-round representation for less than one badge</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm font-medium">Continuous follow-up and relationship building</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 lg:py-32 bg-gradient-to-b from-porcelain-blue-50 to-sunrise-coral/10">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-midnight-ink mb-6">
              Your Story Starts Here
            </h2>
            <p className="text-xl sm:text-2xl text-midnight-ink-600 mb-8 max-w-3xl mx-auto">
              Every Korean creator whose story became a global hit started with a single decision:
              to stop waiting for permission and start taking action.
            </p>
            <p className="text-lg text-midnight-ink-600 mb-12 max-w-2xl mx-auto">
              For less than your monthly phone bill, you can have your IP professionally packaged,
              actively pitched, and strategically positioned for Western adaptation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button
                onClick={handleStartFree}
                className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-8 py-6 text-lg rounded-full font-medium shadow-lg"
              >
                🎯 Start Free: List 2 titles at no cost
              </Button>
              <Button
                onClick={() => handleUpgrade('packaging')}
                className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-8 py-6 text-lg rounded-full font-medium shadow-lg"
              >
                📈 Go Pro: Just $100/month (launch price)
              </Button>
              <Button
                onClick={() => handleUpgrade('premium')}
                className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-8 py-6 text-lg rounded-full font-medium shadow-lg"
              >
                🚀 Go Premium: Just $200/month (launch price)
              </Button>
            </div>

            <p className="text-gray-600 text-sm">
              No credit card required for free plan
            </p>

            <div className="mt-16 p-8 bg-white rounded-2xl border border-gray-300 max-w-3xl mx-auto">
              <p className="text-xl font-semibold text-midnight-ink mb-2">
                The Korean Wave isn't slowing down.
              </p>
              <p className="text-lg text-midnight-ink-600">
                Western buyers are hungry for authentic Korean stories.<br />
                The only question is: <span className="font-semibold text-sunrise-coral">Will your story be the next one they discover?</span>
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CreatorsPricingPage;
