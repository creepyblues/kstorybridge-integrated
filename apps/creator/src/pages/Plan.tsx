import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, X, Sparkles, TrendingUp, Rocket } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { PricingCard } from '@/components/PricingCard'
import { CheckoutModal } from '@/components/CheckoutModal'

export default function Plan() {
  const navigate = useNavigate()
  const { t } = useTranslation(['pricing', 'common'])
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
              {t('pricing:hero.title')}
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto">
              {t('pricing:hero.subtitle')}
            </p>
          </div>
        </section>

        {/* Pricing Cards Section */}
        <section className="py-8 sm:py-12 lg:py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
            {/* Free Listing Plan */}
            <PricingCard
              title={t('pricing:plans.free.title')}
              price={t('pricing:plans.free.price')}
              description={t('pricing:plans.free.description')}
              features={[
                t('pricing:plans.free.features.feature1'),
                t('pricing:plans.free.features.feature2'),
                t('pricing:plans.free.features.feature3'),
                t('pricing:plans.free.features.feature4')
              ]}
              buttonText={t('pricing:plans.free.buttonText')}
              onButtonClick={handleStartFree}
              className="bg-transparent shadow-none rounded-2xl"
            />

            {/* Packaging Plan */}
            <PricingCard
              title={t('pricing:plans.packaging.title')}
              price={t('pricing:plans.packaging.price')}
              originalPrice={t('pricing:plans.packaging.originalPrice')}
              period={t('pricing:plans.packaging.period')}
              description={t('pricing:plans.packaging.description')}
              features={[
                t('pricing:plans.packaging.features.feature1'),
                t('pricing:plans.packaging.features.feature2'),
                t('pricing:plans.packaging.features.feature3'),
                t('pricing:plans.packaging.features.feature4'),
                t('pricing:plans.packaging.features.feature5'),
                t('pricing:plans.packaging.features.feature6'),
                <span className="text-sunrise-coral-600">{t('pricing:plans.packaging.features.feature7')}</span>
              ]}
              buttonText={t('pricing:plans.packaging.buttonText')}
              onButtonClick={() => handleUpgrade('packaging')}
              popular={true}
              className="bg-transparent shadow-none rounded-2xl"
            />

            {/* Premium Plan */}
            <PricingCard
              title={t('pricing:plans.premium.title')}
              price={t('pricing:plans.premium.price')}
              originalPrice={t('pricing:plans.premium.originalPrice')}
              period={t('pricing:plans.premium.period')}
              description={t('pricing:plans.premium.description')}
              features={[
                t('pricing:plans.premium.features.feature1'),
                t('pricing:plans.premium.features.feature2'),
                t('pricing:plans.premium.features.feature3'),
                t('pricing:plans.premium.features.feature4'),
                t('pricing:plans.premium.features.feature5'),
                t('pricing:plans.premium.features.feature6'),
                t('pricing:plans.premium.features.feature7'),
                t('pricing:plans.premium.features.feature8'),
                <span className="text-sunrise-coral-600">{t('pricing:plans.premium.features.feature9')}</span>
              ]}
              buttonText={t('pricing:plans.premium.buttonText')}
              onButtonClick={() => handleUpgrade('premium')}
              className="bg-transparent shadow-none rounded-2xl"
            />
          </div>

          {/* Commitment Notice */}
          <div className="text-center">
            <p className="text-gray-600 text-xs sm:text-sm">
              {t('pricing:plans.commitmentNotice')}
            </p>
          </div>
        </section>

        {/* What Makes This Different Section */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-6 sm:mb-8 text-center">
              {t('pricing:differentiators.title')}
            </h2>

            <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6 sm:mb-8">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-sunrise-coral-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-sunrise-coral-500" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-black mb-2">{t('pricing:differentiators.curatedMarketplace.title')}</h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {t('pricing:differentiators.curatedMarketplace.description')}
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
                    <h3 className="text-lg sm:text-xl font-bold text-black mb-2">{t('pricing:differentiators.professionalPackaging.title')}</h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {t('pricing:differentiators.professionalPackaging.description')}
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
                    <h3 className="text-lg sm:text-xl font-bold text-black mb-2">{t('pricing:differentiators.activeRepresentation.title')}</h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {t('pricing:differentiators.activeRepresentation.description')}
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
                {t('pricing:commission.title')}
              </h2>
              <p className="text-lg sm:text-xl text-sunrise-coral-600 font-semibold">
                {t('pricing:commission.subtitle')}
              </p>
            </div>

            <Card className="bg-white border-gray-300 shadow-none rounded-2xl mb-8 sm:mb-12">
              <CardContent className="p-6 sm:p-8 lg:p-12">
                <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-6">
                      {t('pricing:commission.ourCommission.title')}
                    </h3>
                    <ul className="space-y-2 sm:space-y-3">
                      {[
                        t('pricing:commission.ourCommission.item1'),
                        t('pricing:commission.ourCommission.item2'),
                        t('pricing:commission.ourCommission.item3'),
                        t('pricing:commission.ourCommission.item4')
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
                      {t('pricing:commission.comparison.title')}
                    </h3>
                    <ul className="space-y-2 sm:space-y-3">
                      {[
                        { label: t('pricing:commission.comparison.traditionalAgents.label'), value: t('pricing:commission.comparison.traditionalAgents.value') },
                        { label: t('pricing:commission.comparison.otherPlatforms.label'), value: t('pricing:commission.comparison.otherPlatforms.value') },
                        { label: t('pricing:commission.comparison.filmMarket.label'), value: t('pricing:commission.comparison.filmMarket.value') }
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
                    {t('pricing:commission.bundle.title')}
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {t('pricing:commission.bundle.subtitle')}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto mb-6 sm:mb-8">
                  <Card className="bg-white border-gray-300 shadow-none rounded-xl">
                    <CardContent className="p-4 sm:p-6 text-center">
                      <div className="text-3xl sm:text-4xl font-bold text-sunrise-coral-500 mb-2">{t('pricing:commission.bundle.tier1.discount')}</div>
                      <div className="text-base sm:text-lg font-semibold text-black mb-2">{t('pricing:commission.bundle.tier1.requirement')}</div>
                      <p className="text-gray-600 text-xs sm:text-sm">{t('pricing:commission.bundle.tier1.description')}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-gray-300 shadow-none rounded-xl">
                    <CardContent className="p-4 sm:p-6 text-center">
                      <div className="text-3xl sm:text-4xl font-bold text-sunrise-coral-500 mb-2">{t('pricing:commission.bundle.tier2.discount')}</div>
                      <div className="text-base sm:text-lg font-semibold text-black mb-2">{t('pricing:commission.bundle.tier2.requirement')}</div>
                      <p className="text-gray-600 text-xs sm:text-sm">{t('pricing:commission.bundle.tier2.description')}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-center">
                  <Button
                    onClick={() => window.location.href = 'mailto:sales@kstorybridge.com'}
                    className="bg-sunrise-coral-500 hover:bg-sunrise-coral-600 text-white px-6 sm:px-8 py-3 text-sm sm:text-base font-medium"
                  >
                    {t('pricing:commission.bundle.contactButton')}
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
              {t('pricing:comparisons.title')}
            </h2>

            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              {/* vs Going It Alone */}
              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl hover:border-gray-400 transition-colors">
                <CardContent className="p-6 sm:p-8">
                  <h3 className="text-lg sm:text-xl font-bold text-black mb-4">{t('pricing:comparisons.goingAlone.title')}</h3>
                  <div className="space-y-2 sm:space-y-3 mb-6">
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm">{t('pricing:comparisons.goingAlone.cons.con1')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm">{t('pricing:comparisons.goingAlone.cons.con2')}</span>
                    </div>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm font-medium">{t('pricing:comparisons.goingAlone.pros.pro1')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm font-medium">{t('pricing:comparisons.goingAlone.pros.pro2')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* vs Traditional Agents */}
              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl hover:border-gray-400 transition-colors">
                <CardContent className="p-6 sm:p-8">
                  <h3 className="text-lg sm:text-xl font-bold text-black mb-4">{t('pricing:comparisons.traditionalAgents.title')}</h3>
                  <div className="space-y-2 sm:space-y-3 mb-6">
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm">{t('pricing:comparisons.traditionalAgents.cons.con1')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm">{t('pricing:comparisons.traditionalAgents.cons.con2')}</span>
                    </div>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm font-medium">{t('pricing:comparisons.traditionalAgents.pros.pro1')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm font-medium">{t('pricing:comparisons.traditionalAgents.pros.pro2')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* vs Major Platforms */}
              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl hover:border-gray-400 transition-colors">
                <CardContent className="p-6 sm:p-8">
                  <h3 className="text-lg sm:text-xl font-bold text-black mb-4">{t('pricing:comparisons.majorPlatforms.title')}</h3>
                  <div className="space-y-2 sm:space-y-3 mb-6">
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm">{t('pricing:comparisons.majorPlatforms.cons.con1')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm">{t('pricing:comparisons.majorPlatforms.cons.con2')}</span>
                    </div>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm font-medium">{t('pricing:comparisons.majorPlatforms.pros.pro1')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm font-medium">{t('pricing:comparisons.majorPlatforms.pros.pro2')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* vs Film Markets */}
              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl hover:border-gray-400 transition-colors">
                <CardContent className="p-6 sm:p-8">
                  <h3 className="text-lg sm:text-xl font-bold text-black mb-4">{t('pricing:comparisons.filmMarkets.title')}</h3>
                  <div className="space-y-2 sm:space-y-3 mb-6">
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm">{t('pricing:comparisons.filmMarkets.cons.con1')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm">{t('pricing:comparisons.filmMarkets.cons.con2')}</span>
                    </div>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm font-medium">{t('pricing:comparisons.filmMarkets.pros.pro1')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-sunrise-coral-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-xs sm:text-sm font-medium">{t('pricing:comparisons.filmMarkets.pros.pro2')}</span>
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
