import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, X, Sparkles, TrendingUp, Rocket } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { PricingCard } from '@/components/PricingCard'
import { CheckoutModal } from '@/components/CheckoutModal'

export default function Plan() {
  const navigate = useNavigate()
  const [checkoutModal, setCheckoutModal] = useState<{
    isOpen: boolean
    planType: 'packaging' | 'premium'
    billingPeriod: 'monthly' | 'yearly'
  }>({
    isOpen: false,
    planType: 'packaging',
    billingPeriod: 'monthly',
  })

  const handleStartFree = () => {
    navigate('/titles/add-title')
  }

  const handleUpgrade = (planType: 'packaging' | 'premium') => {
    setCheckoutModal({
      isOpen: true,
      planType,
      billingPeriod: 'monthly', // Default to monthly, user can upgrade after seeing options
    })
  }

  const closeCheckoutModal = () => {
    setCheckoutModal((prev) => ({ ...prev, isOpen: false }))
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-4 sm:mb-6">
              Three Clear Paths to Global Success
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto">
              From free listing to active representation—choose what fits your goals
            </p>
          </div>
        </section>

        {/* Pricing Cards Section */}
        <section className="py-8 sm:py-12 lg:py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
            {/* Free Listing Plan */}
            <PricingCard
              title="Free 'Listing' Plan"
              price="$0"
              description="Perfect for early-stage creators curious about Western interest"
              features={[
                'List one title for free in our curated Korean IP marketplace',
                'Your work becomes searchable by verified Netflix, Amazon, and Disney buyers',
                'Receive direct buyer inquiries',
                'Basic messaging and notification tools'
              ]}
              buttonText="Start Free"
              onButtonClick={handleStartFree}
              className="bg-transparent shadow-none rounded-2xl"
            />

            {/* Packaging Plan */}
            <PricingCard
              title="'Packaging' Plan"
              price="$100"
              originalPrice="$200"
              period="/month"
              description="Perfect for serious creators ready to compete professionally"
              features={[
                'Professional Adaptation Pitch Deck (normally costs $500-$2,000)',
                'Deep Analytics Dashboard: readership trends, genre benchmarks',
                "'Verified Creator' Badge: instant credibility with buyers",
                "Buyer Insights: track who's viewing your title, which regions show interest",
                'Adaptation Strategy Consultation: 60-minute session',
                'Regular: $200/month or $2,000/year per title',
                <span className="text-sunrise-coral-600">🎉 Launch Promo: $100/month or $1,000/year (50% off first year)</span>
              ]}
              buttonText="Go Packaging"
              onButtonClick={() => handleUpgrade('packaging')}
              popular={true}
              className="bg-transparent shadow-none rounded-2xl"
            />

            {/* Premium Plan */}
            <PricingCard
              title="'Premium' Plan"
              price="$200"
              originalPrice="$400"
              period="/month"
              description="Perfect for creators who want dedicated representation without agency fees"
              features={[
                'Everything in Packaging, PLUS:',
                'We personally pitch your IP to 20+ carefully selected buyers per year',
                'Monthly Intelligence Reports with actual buyer feedback',
                'Featured in our industry newsletter reaching 1,000+ Western buyers',
                'Homepage spotlight positioning',
                '3 customized pitch versions (film, series, game)',
                'Producer coaching on how to present in meetings',
                'Regular: $400/month or $4,000/year per title',
                <span className="text-sunrise-coral-600">🎉 Launch Promo: $200/month or $2,000/year (50% off first year)</span>
              ]}
              buttonText="Go Premium"
              onButtonClick={() => handleUpgrade('premium')}
              className="bg-transparent shadow-none rounded-2xl"
            />
          </div>

          {/* Commitment Notice */}
          <div className="text-center">
            <p className="text-gray-600 text-xs sm:text-sm">
              * Paid plans require 1 year commitment (because building momentum takes time)
            </p>
          </div>
        </section>

        {/* What Makes This Different Section */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-6 sm:mb-8 text-center">
              What Makes KStoryBridge Different?
            </h2>

            <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6 sm:mb-8">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-sunrise-coral-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-sunrise-coral-500" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-black mb-2">Curated Marketplace</h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Unlike dumping your script on a generic platform where it gets lost among thousands,
                      your IP enters a curated Korean adaptation marketplace. Buyers come here specifically
                      seeking Korean stories—your work is already positioned as valuable cultural content,
                      not just another PDF in the pile.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6 sm:mb-8">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-sunrise-coral-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-sunrise-coral-500" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-black mb-2">Professional Packaging</h3>
                    <p className="text-gray-600 text-sm sm:text-base">
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
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-sunrise-coral-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Rocket className="w-6 h-6 text-sunrise-coral-500" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-black mb-2">Active Representation</h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Traditional agents charge 20-40% forever and might never pitch your project. We charge
                      a flat fee and guarantee 20+ targeted pitches annually. You know exactly what you're
                      paying for and what you're getting.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Commission Section */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-3 sm:mb-4">
                The Fairest Commission in the Industry
              </h2>
              <p className="text-lg sm:text-xl text-sunrise-coral-600 font-semibold">
                Just 10% When You Succeed
              </p>
            </div>

            <Card className="bg-white border-gray-300 shadow-none rounded-2xl mb-8 sm:mb-12">
              <CardContent className="p-6 sm:p-8 lg:p-12">
                <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-6">
                      Our 10% Commission Covers:
                    </h3>
                    <ul className="space-y-2 sm:space-y-3">
                      {[
                        'Option payments',
                        'Purchase prices',
                        'Production bonuses',
                        'License fees'
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-sunrise-coral-500 flex-shrink-0" />
                          <span className="text-gray-600 text-sm sm:text-base">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-6">
                      Compare This To:
                    </h3>
                    <ul className="space-y-2 sm:space-y-3">
                      {[
                        { label: 'Traditional agents', value: '20-40% commission' },
                        { label: 'Other platforms', value: '15-20% commission' },
                        { label: 'Film market + consultant', value: 'Often $10,000+ with zero guarantee' }
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                          <div className="text-sm sm:text-base">
                            <span className="text-black font-semibold">{item.label}:</span>
                            <span className="text-gray-600 ml-2">{item.value}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bundle Pricing */}
            <Card className="bg-transparent border-sunrise-coral-500 shadow-none rounded-2xl">
              <CardContent className="p-6 sm:p-8 lg:p-12">
                <div className="text-center mb-6 sm:mb-8">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-black mb-2">
                    Special Bundle Pricing
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    For Publishers and Studios with Multiple Titles
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto mb-6 sm:mb-8">
                  <Card className="bg-white border-gray-300 shadow-none rounded-xl">
                    <CardContent className="p-4 sm:p-6 text-center">
                      <div className="text-3xl sm:text-4xl font-bold text-sunrise-coral-500 mb-2">25% OFF</div>
                      <div className="text-base sm:text-lg font-semibold text-black mb-2">5+ Titles</div>
                      <p className="text-gray-600 text-xs sm:text-sm">Additional discount on all plans</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-gray-300 shadow-none rounded-xl">
                    <CardContent className="p-4 sm:p-6 text-center">
                      <div className="text-3xl sm:text-4xl font-bold text-sunrise-coral-500 mb-2">40% OFF</div>
                      <div className="text-base sm:text-lg font-semibold text-black mb-2">10+ Titles</div>
                      <p className="text-gray-600 text-xs sm:text-sm">Maximum savings for publishers</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-center">
                  <Button
                    onClick={() => window.location.href = 'mailto:sales@kstorybridge.com'}
                    className="bg-sunrise-coral-500 hover:bg-sunrise-coral-600 text-white px-6 sm:px-8 py-3 text-sm sm:text-base font-medium"
                  >
                    Contact Us
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-8 sm:mb-12 text-center">
              Why Creators Choose KStoryBridge
            </h2>

            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              {/* vs Going It Alone */}
              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl hover:border-gray-400 transition-colors">
                <CardContent className="p-6 sm:p-8">
                  <h3 className="text-lg sm:text-xl font-bold text-black mb-4">vs. Going It Alone</h3>
                  <div className="space-y-2 sm:space-y-3 mb-6">
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm">No industry connections, language barriers</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm">Don't know market rates or best practices</span>
                    </div>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm font-medium">Direct access to verified buyers</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm font-medium">Bilingual support, market intelligence</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* vs Traditional Agents */}
              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl hover:border-gray-400 transition-colors">
                <CardContent className="p-6 sm:p-8">
                  <h3 className="text-lg sm:text-xl font-bold text-black mb-4">vs. Traditional Agents</h3>
                  <div className="space-y-2 sm:space-y-3 mb-6">
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm">20-40% commission forever</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm">Might never pitch your project, no transparency</span>
                    </div>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm font-medium">10% only on success, guaranteed pitches</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm font-medium">Full reporting, complete transparency</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* vs Major Platforms */}
              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl hover:border-gray-400 transition-colors">
                <CardContent className="p-6 sm:p-8">
                  <h3 className="text-lg sm:text-xl font-bold text-black mb-4">vs. Major Platforms (Naver/Kakao)</h3>
                  <div className="space-y-2 sm:space-y-3 mb-6">
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm">Lost in the crowd with millions of titles</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm">Minimal revenue share, no direct buyer relationships</span>
                    </div>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm font-medium">Curated marketplace, keep 90% of your deal</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm font-medium">Build your own buyer network</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* vs Film Markets */}
              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl hover:border-gray-400 transition-colors">
                <CardContent className="p-6 sm:p-8">
                  <h3 className="text-lg sm:text-xl font-bold text-black mb-4">vs. Film Markets</h3>
                  <div className="space-y-2 sm:space-y-3 mb-6">
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm">$5,000-20,000 per event, exhausting</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm">No follow-up system, connections fade quickly</span>
                    </div>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm font-medium">Year-round representation for less than one badge</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm font-medium">Continuous follow-up and relationship building</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutModal.isOpen}
        onClose={closeCheckoutModal}
        planType={checkoutModal.planType}
        billingPeriod={checkoutModal.billingPeriod}
      />
    </MainLayout>
  )
}
