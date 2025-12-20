import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'
import { trackPaymentSuccess } from '@/utils/analytics'

export default function PaymentSuccess() {
  const navigate = useNavigate()
  const { t } = useTranslation(['payment', 'common'])
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)

  const sessionId = searchParams.get('session_id')
  const planType = searchParams.get('plan_type') || 'unknown'
  const billingPeriod = searchParams.get('billing_period') || 'monthly'

  useEffect(() => {
    // Track successful payment
    trackPaymentSuccess(planType, billingPeriod)

    // Simulate loading delay to allow webhook processing
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [planType, billingPeriod])

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-20">
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
            <CardContent className="p-12 text-center">
              <Loader2 className="w-16 h-16 animate-spin text-sunrise-coral mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-black mb-3">{t('payment:processing.title')}</h1>
              <p className="text-gray-600">
                {t('payment:processing.message')}
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-20">
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
          <CardContent className="p-12 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            {/* Success Message */}
            <h1 className="text-3xl font-bold text-black mb-3">
              {t('payment:success.title')}
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              {t('payment:success.subtitle')}
            </p>

            {/* Session ID */}
            {sessionId && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">{t('payment:success.transactionIdLabel')}</p>
                <p className="text-sm font-mono text-gray-700">{sessionId}</p>
              </div>
            )}

            {/* What's Next */}
            <div className="mb-8 text-left bg-sunrise-coral/10 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-black mb-3">{t('payment:success.whatsNext.title')}</h2>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-sunrise-coral flex-shrink-0 mt-0.5" />
                  <span>{t('payment:success.whatsNext.step1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-sunrise-coral flex-shrink-0 mt-0.5" />
                  <span>{t('payment:success.whatsNext.step2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-sunrise-coral flex-shrink-0 mt-0.5" />
                  <span>{t('payment:success.whatsNext.step3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-sunrise-coral flex-shrink-0 mt-0.5" />
                  <span>{t('payment:success.whatsNext.step4')}</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate('/billing')}
                className="bg-sunrise-coral text-white hover:bg-sunrise-coral/90"
              >
                {t('payment:success.viewBillingButton')}
              </Button>
              <Button
                onClick={() => navigate('/titles')}
                variant="outline"
                className="border-gray-300 hover:bg-gray-100"
              >
                {t('payment:success.goToTitlesButton')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
