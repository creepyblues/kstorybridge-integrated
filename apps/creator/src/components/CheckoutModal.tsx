import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { titlesService, type Title } from '@/services/titlesService'
import { supabase } from '@/lib/supabase'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { trackCheckoutStart } from '@/utils/analytics'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  planType: 'packaging' | 'premium'
  billingPeriod: 'monthly'
}

export function CheckoutModal({ isOpen, onClose, planType, billingPeriod }: CheckoutModalProps) {
  const { user } = useAuth()
  const [titles, setTitles] = useState<Title[]>([])
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && user?.id) {
      loadTitles()
    }
  }, [isOpen, user?.id])

  const loadTitles = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      const titlesData = await titlesService.getTitlesByCreator(user.id)
      setTitles(titlesData)

      // Auto-select if only one title
      if (titlesData.length === 1) {
        setSelectedTitleId(titlesData[0].title_id)
      }
    } catch (err) {
      console.error('Error loading titles:', err)
      setError('Failed to load titles. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = async () => {
    if (!selectedTitleId || !user) return

    try {
      setProcessing(true)
      setError(null)

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      // Call create-creator-checkout edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-creator-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan_type: planType,
            billing_period: billingPeriod,
            title_id: selectedTitleId,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      // Track checkout start
      trackCheckoutStart(planType, billingPeriod, selectedTitleId)

      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (err: any) {
      console.error('Checkout error:', err)
      setError(err.message || 'Failed to start checkout. Please try again.')
      setProcessing(false)
    }
  }

  if (!isOpen) return null

  const planDetails = {
    packaging: {
      monthly: { price: '$100', period: '/month', description: 'Launch Promo (Regular: $200)' },
    },
    premium: {
      monthly: { price: '$200', period: '/month', description: 'Launch Promo (Regular: $400)' },
    },
  }

  const plan = planDetails[planType][billingPeriod]
  const planName = planType === 'packaging' ? 'Packaging Plan' : 'Premium Plan'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-black mb-2">
                Subscribe to {planName}
              </h2>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-sunrise-coral">{plan.price}</span>
                <span className="text-gray-600">{plan.period}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
            </div>
            <button
              onClick={onClose}
              disabled={processing}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Loading your titles...</p>
            </div>
          )}

          {/* No Titles */}
          {!loading && titles.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-gray-600 mb-4">
                You need to create a title first before subscribing.
              </p>
              <Button
                onClick={() => window.location.href = '/titles/add-title'}
                className="bg-sunrise-coral text-white hover:bg-sunrise-coral/90"
              >
                Create Your First Title
              </Button>
            </div>
          )}

          {/* Title Selection */}
          {!loading && titles.length > 0 && (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-black mb-3">
                  Select a title to subscribe:
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Each title requires a separate subscription. This is a per-title pricing model.
                </p>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {titles.map((title) => (
                    <button
                      key={title.title_id}
                      onClick={() => setSelectedTitleId(title.title_id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedTitleId === title.title_id
                          ? 'border-sunrise-coral bg-sunrise-coral/10'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {title.title_image && (
                          <img
                            src={title.title_image}
                            alt={title.title_name_kr || title.title_name_en}
                            className="w-16 h-16 object-cover rounded flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-black truncate">
                            {title.title_name_kr || title.title_name_en}
                          </h4>
                          {title.title_name_en && title.title_name_kr && (
                            <p className="text-sm text-gray-600 truncate">{title.title_name_en}</p>
                          )}
                          {title.genre && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(Array.isArray(title.genre) ? title.genre : [title.genre])
                                .slice(0, 3)
                                .map((g, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                                  >
                                    {g}
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkout Button */}
              <div className="border-t pt-6">
                <Button
                  onClick={handleCheckout}
                  disabled={!selectedTitleId || processing}
                  className="w-full bg-sunrise-coral text-white hover:bg-sunrise-coral/90 py-6 text-lg font-semibold"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    `Proceed to Checkout`
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center mt-3">
                  You'll be redirected to Stripe to complete your payment securely.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
