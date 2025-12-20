/**
 * Plan Page
 * Pricing plans and subscription options
 * Redesigned with sunrise-coral accents and modern layout
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react'
import { MainLayout } from '@/components/layout/MainLayout'
import { PricingCard } from '@/components/PricingCard'
import { CheckoutModal } from '@/components/CheckoutModal'
import { trackPlanView } from '@/utils/analytics'

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

  // Track plan page view
  useEffect(() => {
    trackPlanView()
  }, [])

  const handleStartFree = () => {
    navigate('/titles/add-title')
  }

  const handleUpgrade = (planType: 'packaging' | 'premium') => {
    setCheckoutModal({
      isOpen: true,
      planType,
      billingPeriod: 'monthly',
    })
  }

  const closeCheckoutModal = () => {
    setCheckoutModal((prev) => ({ ...prev, isOpen: false }))
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sunrise-coral/10 text-sunrise-coral text-sm font-medium mb-6">
            <Icon icon="solar:tag-price-bold" className="h-4 w-4" />
            {t('pricing:hero.badge', 'Launch Special')}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-4 tracking-tight">
            {t('pricing:hero.title')}
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto">
            {t('pricing:hero.subtitle')}
          </p>
        </section>

        {/* Pricing Cards Section */}
        <section className="mb-16 sm:mb-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
            {/* Free Listing Plan */}
            <PricingCard
              title={t('pricing:plans.free.title')}
              price={t('pricing:plans.free.price')}
              description={t('pricing:plans.free.description')}
              icon="solar:documents-bold-duotone"
              features={[
                t('pricing:plans.free.features.feature1'),
                t('pricing:plans.free.features.feature2'),
                t('pricing:plans.free.features.feature3'),
                t('pricing:plans.free.features.feature4'),
              ]}
              buttonText={t('pricing:plans.free.buttonText')}
              onButtonClick={handleStartFree}
              className="rounded-2xl"
            />

            {/* Packaging Plan */}
            <PricingCard
              title={t('pricing:plans.packaging.title')}
              price={t('pricing:plans.packaging.price')}
              originalPrice={t('pricing:plans.packaging.originalPrice')}
              period={t('pricing:plans.packaging.period')}
              description={t('pricing:plans.packaging.description')}
              icon="solar:box-bold-duotone"
              features={[
                t('pricing:plans.packaging.features.feature1'),
                t('pricing:plans.packaging.features.feature2'),
                t('pricing:plans.packaging.features.feature3'),
                t('pricing:plans.packaging.features.feature4'),
                t('pricing:plans.packaging.features.feature5'),
                t('pricing:plans.packaging.features.feature6'),
                <span key="f7" className="text-sunrise-coral font-medium">
                  {t('pricing:plans.packaging.features.feature7')}
                </span>,
              ]}
              buttonText={t('pricing:plans.packaging.buttonText')}
              onButtonClick={() => handleUpgrade('packaging')}
              popular={true}
              className="rounded-2xl"
            />

            {/* Premium Plan */}
            <PricingCard
              title={t('pricing:plans.premium.title')}
              price={t('pricing:plans.premium.price')}
              originalPrice={t('pricing:plans.premium.originalPrice')}
              period={t('pricing:plans.premium.period')}
              description={t('pricing:plans.premium.description')}
              icon="solar:crown-bold-duotone"
              features={[
                t('pricing:plans.premium.features.feature1'),
                t('pricing:plans.premium.features.feature2'),
                t('pricing:plans.premium.features.feature3'),
                t('pricing:plans.premium.features.feature4'),
                t('pricing:plans.premium.features.feature5'),
                t('pricing:plans.premium.features.feature6'),
                t('pricing:plans.premium.features.feature7'),
                t('pricing:plans.premium.features.feature8'),
                <span key="f9" className="text-sunrise-coral font-medium">
                  {t('pricing:plans.premium.features.feature9')}
                </span>,
              ]}
              buttonText={t('pricing:plans.premium.buttonText')}
              onButtonClick={() => handleUpgrade('premium')}
              className="rounded-2xl"
            />
          </div>

          {/* Commitment Notice */}
          <p className="text-center text-gray-500 text-sm">
            {t('pricing:plans.commitmentNotice')}
          </p>
        </section>

        {/* What Makes This Different Section */}
        <section className="mb-16 sm:mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-black mb-3">
              {t('pricing:differentiators.title')}
            </h2>
            <p className="text-gray-500">
              Why creators choose KStoryBridge over traditional methods
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Curated Marketplace */}
            <Card className="group bg-white border-gray-200 shadow-none rounded-2xl hover:border-sunrise-coral/30 transition-all">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-sunrise-coral/10 flex items-center justify-center mb-4 group-hover:bg-sunrise-coral transition-colors">
                  <Icon
                    icon="solar:star-shine-bold-duotone"
                    className="h-6 w-6 text-sunrise-coral group-hover:text-white transition-colors"
                  />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">
                  {t('pricing:differentiators.curatedMarketplace.title')}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {t('pricing:differentiators.curatedMarketplace.description')}
                </p>
              </CardContent>
            </Card>

            {/* Professional Packaging */}
            <Card className="group bg-white border-gray-200 shadow-none rounded-2xl hover:border-sunrise-coral/30 transition-all">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-sunrise-coral/10 flex items-center justify-center mb-4 group-hover:bg-sunrise-coral transition-colors">
                  <Icon
                    icon="solar:graph-up-bold-duotone"
                    className="h-6 w-6 text-sunrise-coral group-hover:text-white transition-colors"
                  />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">
                  {t('pricing:differentiators.professionalPackaging.title')}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {t('pricing:differentiators.professionalPackaging.description')}
                </p>
              </CardContent>
            </Card>

            {/* Active Representation */}
            <Card className="group bg-white border-gray-200 shadow-none rounded-2xl hover:border-sunrise-coral/30 transition-all">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-sunrise-coral/10 flex items-center justify-center mb-4 group-hover:bg-sunrise-coral transition-colors">
                  <Icon
                    icon="solar:rocket-bold-duotone"
                    className="h-6 w-6 text-sunrise-coral group-hover:text-white transition-colors"
                  />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">
                  {t('pricing:differentiators.activeRepresentation.title')}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {t('pricing:differentiators.activeRepresentation.description')}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Commission Section */}
        <section className="mb-16 sm:mb-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-4">
              <Icon icon="solar:hand-money-bold" className="h-4 w-4" />
              Fair Commission Structure
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-black mb-2">
              {t('pricing:commission.title')}
            </h2>
            <p className="text-lg text-sunrise-coral font-semibold">
              {t('pricing:commission.subtitle')}
            </p>
          </div>

          {/* Commission Comparison */}
          <Card className="bg-white border-gray-200 shadow-none rounded-2xl mb-8 overflow-hidden">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                {/* Our Commission */}
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-sunrise-coral/10 flex items-center justify-center">
                      <Icon
                        icon="solar:verified-check-bold"
                        className="h-5 w-5 text-sunrise-coral"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-black">
                      {t('pricing:commission.ourCommission.title')}
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {[
                      t('pricing:commission.ourCommission.item1'),
                      t('pricing:commission.ourCommission.item2'),
                      t('pricing:commission.ourCommission.item3'),
                      t('pricing:commission.ourCommission.item4'),
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Icon
                          icon="solar:check-circle-bold"
                          className="h-5 w-5 text-sunrise-coral flex-shrink-0 mt-0.5"
                        />
                        <span className="text-gray-600 text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Comparison */}
                <div className="p-6 sm:p-8 bg-gray-50/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center">
                      <Icon
                        icon="solar:chart-bold"
                        className="h-5 w-5 text-gray-500"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-black">
                      {t('pricing:commission.comparison.title')}
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {[
                      {
                        label: t(
                          'pricing:commission.comparison.traditionalAgents.label'
                        ),
                        value: t(
                          'pricing:commission.comparison.traditionalAgents.value'
                        ),
                      },
                      {
                        label: t(
                          'pricing:commission.comparison.otherPlatforms.label'
                        ),
                        value: t(
                          'pricing:commission.comparison.otherPlatforms.value'
                        ),
                      },
                      {
                        label: t('pricing:commission.comparison.filmMarket.label'),
                        value: t('pricing:commission.comparison.filmMarket.value'),
                      },
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Icon
                          icon="solar:close-circle-bold"
                          className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5"
                        />
                        <div className="text-sm">
                          <span className="text-black font-medium">
                            {item.label}:
                          </span>
                          <span className="text-gray-500 ml-1">{item.value}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bundle Pricing */}
          <Card className="bg-gradient-to-br from-sunrise-coral/5 to-orange-50 border-sunrise-coral/20 shadow-none rounded-2xl overflow-hidden">
            <CardContent className="p-6 sm:p-8 lg:p-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sunrise-coral text-white text-sm font-medium mb-4">
                  <Icon icon="solar:gift-bold" className="h-4 w-4" />
                  Bundle Discount
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-black mb-2">
                  {t('pricing:commission.bundle.title')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('pricing:commission.bundle.subtitle')}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
                <Card className="bg-white border-gray-200 shadow-none rounded-xl">
                  <CardContent className="p-5 text-center">
                    <div className="text-3xl font-bold text-sunrise-coral mb-1">
                      {t('pricing:commission.bundle.tier1.discount')}
                    </div>
                    <div className="font-semibold text-black mb-1">
                      {t('pricing:commission.bundle.tier1.requirement')}
                    </div>
                    <p className="text-gray-500 text-xs">
                      {t('pricing:commission.bundle.tier1.description')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-gray-200 shadow-none rounded-xl">
                  <CardContent className="p-5 text-center">
                    <div className="text-3xl font-bold text-sunrise-coral mb-1">
                      {t('pricing:commission.bundle.tier2.discount')}
                    </div>
                    <div className="font-semibold text-black mb-1">
                      {t('pricing:commission.bundle.tier2.requirement')}
                    </div>
                    <p className="text-gray-500 text-xs">
                      {t('pricing:commission.bundle.tier2.description')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <Button
                  onClick={() =>
                    (window.location.href = 'mailto:sales@kstorybridge.com')
                  }
                  className="bg-sunrise-coral hover:bg-sunrise-coral/90 text-white px-8 py-3 h-auto text-sm font-medium shadow-lg shadow-sunrise-coral/25"
                >
                  <Icon icon="solar:letter-bold" className="h-4 w-4 mr-2" />
                  {t('pricing:commission.bundle.contactButton')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Comparison Section */}
        <section className="mb-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-black mb-3">
              {t('pricing:comparisons.title')}
            </h2>
            <p className="text-gray-500">
              See how KStoryBridge compares to alternatives
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* vs Going It Alone */}
            <Card className="bg-white border-gray-200 shadow-none rounded-2xl hover:border-sunrise-coral/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Icon
                      icon="solar:user-rounded-bold-duotone"
                      className="h-5 w-5 text-gray-500"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-black">
                    {t('pricing:comparisons.goingAlone.title')}
                  </h3>
                </div>
                <div className="space-y-2 mb-5">
                  {[
                    t('pricing:comparisons.goingAlone.cons.con1'),
                    t('pricing:comparisons.goingAlone.cons.con2'),
                  ].map((con, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Icon
                        icon="solar:close-circle-bold"
                        className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5"
                      />
                      <span className="text-gray-600 text-sm">{con}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-100 space-y-2">
                  {[
                    t('pricing:comparisons.goingAlone.pros.pro1'),
                    t('pricing:comparisons.goingAlone.pros.pro2'),
                  ].map((pro, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Icon
                        icon="solar:check-circle-bold"
                        className="h-4 w-4 text-sunrise-coral flex-shrink-0 mt-0.5"
                      />
                      <span className="text-gray-700 text-sm font-medium">
                        {pro}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* vs Traditional Agents */}
            <Card className="bg-white border-gray-200 shadow-none rounded-2xl hover:border-sunrise-coral/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Icon
                      icon="solar:buildings-2-bold-duotone"
                      className="h-5 w-5 text-gray-500"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-black">
                    {t('pricing:comparisons.traditionalAgents.title')}
                  </h3>
                </div>
                <div className="space-y-2 mb-5">
                  {[
                    t('pricing:comparisons.traditionalAgents.cons.con1'),
                    t('pricing:comparisons.traditionalAgents.cons.con2'),
                  ].map((con, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Icon
                        icon="solar:close-circle-bold"
                        className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5"
                      />
                      <span className="text-gray-600 text-sm">{con}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-100 space-y-2">
                  {[
                    t('pricing:comparisons.traditionalAgents.pros.pro1'),
                    t('pricing:comparisons.traditionalAgents.pros.pro2'),
                  ].map((pro, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Icon
                        icon="solar:check-circle-bold"
                        className="h-4 w-4 text-sunrise-coral flex-shrink-0 mt-0.5"
                      />
                      <span className="text-gray-700 text-sm font-medium">
                        {pro}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* vs Major Platforms */}
            <Card className="bg-white border-gray-200 shadow-none rounded-2xl hover:border-sunrise-coral/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Icon
                      icon="solar:server-bold-duotone"
                      className="h-5 w-5 text-gray-500"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-black">
                    {t('pricing:comparisons.majorPlatforms.title')}
                  </h3>
                </div>
                <div className="space-y-2 mb-5">
                  {[
                    t('pricing:comparisons.majorPlatforms.cons.con1'),
                    t('pricing:comparisons.majorPlatforms.cons.con2'),
                  ].map((con, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Icon
                        icon="solar:close-circle-bold"
                        className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5"
                      />
                      <span className="text-gray-600 text-sm">{con}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-100 space-y-2">
                  {[
                    t('pricing:comparisons.majorPlatforms.pros.pro1'),
                    t('pricing:comparisons.majorPlatforms.pros.pro2'),
                  ].map((pro, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Icon
                        icon="solar:check-circle-bold"
                        className="h-4 w-4 text-sunrise-coral flex-shrink-0 mt-0.5"
                      />
                      <span className="text-gray-700 text-sm font-medium">
                        {pro}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* vs Film Markets */}
            <Card className="bg-white border-gray-200 shadow-none rounded-2xl hover:border-sunrise-coral/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Icon
                      icon="solar:clapperboard-bold-duotone"
                      className="h-5 w-5 text-gray-500"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-black">
                    {t('pricing:comparisons.filmMarkets.title')}
                  </h3>
                </div>
                <div className="space-y-2 mb-5">
                  {[
                    t('pricing:comparisons.filmMarkets.cons.con1'),
                    t('pricing:comparisons.filmMarkets.cons.con2'),
                  ].map((con, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Icon
                        icon="solar:close-circle-bold"
                        className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5"
                      />
                      <span className="text-gray-600 text-sm">{con}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-100 space-y-2">
                  {[
                    t('pricing:comparisons.filmMarkets.pros.pro1'),
                    t('pricing:comparisons.filmMarkets.pros.pro2'),
                  ].map((pro, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Icon
                        icon="solar:check-circle-bold"
                        className="h-4 w-4 text-sunrise-coral flex-shrink-0 mt-0.5"
                      />
                      <span className="text-gray-700 text-sm font-medium">
                        {pro}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center py-12 sm:py-16 border-t border-gray-200">
          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-3">
            Ready to expand your reach?
          </h2>
          <p className="text-gray-500 mb-6 max-w-xl mx-auto">
            Join creators who are already connecting with global buyers through
            KStoryBridge.
          </p>
          <Button
            onClick={handleStartFree}
            className="bg-sunrise-coral hover:bg-sunrise-coral/90 text-white px-8 py-3 h-auto text-base font-medium shadow-lg shadow-sunrise-coral/25"
          >
            <Icon icon="solar:add-circle-bold" className="h-5 w-5 mr-2" />
            Start Free Listing
          </Button>
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
